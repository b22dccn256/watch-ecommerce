import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import CampaignService from "../services/campaign.service.js";
import mongoose from "mongoose";
import XLSX from "xlsx";
import fs from "fs";
import { logAction } from "../middleware/permission.middleware.js";

export const getAllProducts = async (req, res) => {
	try {
		const { q, page, limit, sort, brands, minPrice, maxPrice, machineType, category, colors, sizes, minRating } = req.query;
		let query = { deletedAt: null };

		if (q) {
			query.name = { $regex: q, $options: "i" };
		}
		if (category) {
			const catObj = await Category.findOne({ slug: category });
			if (catObj) {
				const descendantIds = await Category.distinct("_id", { ancestors: catObj._id });
				query.categoryId = { $in: [catObj._id, ...descendantIds] };
			} else if (mongoose.Types.ObjectId.isValid(category)) {
				const descendantIds = await Category.distinct("_id", { ancestors: category });
				query.categoryId = { $in: [category, ...descendantIds] };
			}
		}
		if (brands) {
			const brandArray = brands.split(",");
			const validObjectIds = brandArray.filter(id => mongoose.Types.ObjectId.isValid(id));
			const brandNames = brandArray.filter(id => !mongoose.Types.ObjectId.isValid(id));

			if (brandNames.length > 0) {
				const matchingBrands = await Brand.find({ name: { $in: brandNames } }).select("_id");
				const matchingIds = matchingBrands.map(b => b._id.toString());
				query.brand = { $in: [...validObjectIds, ...matchingIds] };
			} else {
				query.brand = { $in: validObjectIds };
			}
		}
		if (machineType) {
			query.type = { $in: machineType.split(",") };
		}
		if (minPrice || maxPrice) {
			query.price = {};
			if (minPrice) query.price.$gte = Number(minPrice);
			if (maxPrice) query.price.$lte = Number(maxPrice);
		}
		if (colors) {
			query.colors = { $in: colors.split(",") };
		}
		if (sizes) {
			query.sizes = { $in: sizes.split(",") };
		}
		if (minRating) {
			query.averageRating = { $gte: Number(minRating) };
		}

		let productsQuery = Product.find(query).populate("brand", "name");

		if (sort === "popular") {
			productsQuery = productsQuery.sort({ createdAt: -1 });
		} else if (sort === "price_asc") {
			productsQuery = productsQuery.sort({ price: 1 });
		} else if (sort === "price_desc") {
			productsQuery = productsQuery.sort({ price: -1 });
		} else if (sort === "newest") {
			productsQuery = productsQuery.sort({ createdAt: -1 });
		} else if (sort === "best_selling") {
			productsQuery = productsQuery.sort({ salesCount: -1, createdAt: -1 });
		} else if (sort === "name_asc") {
			productsQuery = productsQuery.sort({ name: 1 });
		} else if (sort === "name_desc") {
			productsQuery = productsQuery.sort({ name: -1 });
		} else {
			productsQuery = productsQuery.sort({ createdAt: -1 });
		}

		if (page && limit) {
			const pageNum = parseInt(page, 10);
			const limitNum = parseInt(limit, 10);
			productsQuery = productsQuery.skip((pageNum - 1) * limitNum).limit(limitNum);

			const products = await productsQuery;
			const total = await Product.countDocuments(query);

			const processedProducts = await CampaignService.applyCampaignToProducts(products);

			return res.json({
				products: processedProducts,
				totalPages: Math.ceil(total / limitNum),
				currentPage: pageNum
			});
		} else {
			const products = await productsQuery;
			const processedProducts = await CampaignService.applyCampaignToProducts(products);
			return res.json({ products: processedProducts });
		}

	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getSuggestions = async (req, res) => {
	try {
		const { q } = req.query;
		if (!q) return res.json([]);
		// Find brands matching the query first
		const matchingBrands = await Brand.find({ name: { $regex: q, $options: "i" } }).select("_id");
		const matchingBrandIds = matchingBrands.map(b => b._id);

		const suggestions = await Product.find({
			deletedAt: null,
			$or: [
				{ name: { $regex: q, $options: "i" } },
				{ brand: { $in: matchingBrandIds } },
				{ type: { $regex: q, $options: "i" } },
			]
		}).select("name image price brand").populate("brand", "name").limit(5);
		res.json(suggestions);
	} catch (error) {
		console.log("Error in getSuggestions controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
	try {
		const product = await Product.findOne({ _id: req.params.id, deletedAt: null }).populate("brand", "name");
		if (!product) return res.status(404).json({ message: "Product not found" });

		const processedProduct = await CampaignService.applyCampaignToProducts(product);
		res.json(processedProduct);
	} catch (error) {
		console.log("Error in getProductById controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = null;
		/* Tạm thời tắt Redis Cache để người dùng thấy ảnh Homepage update tức thì
		try {
			const cache = await redis.get("featured_products");
			if (cache) {
				featuredProducts = JSON.parse(cache);
			}
		} catch (redisError) {
			console.log("Redis cache miss or error:", redisError.message);
		}

		if (featuredProducts && featuredProducts.length > 0) {
			return res.json(featuredProducts);
		}
		*/

		// if not in redis or redis failed, fetch from mongodb
		featuredProducts = await Product.find({ isFeatured: true, deletedAt: null }).lean();

		if (!featuredProducts || featuredProducts.length === 0) {
			featuredProducts = await Product.find({ deletedAt: null }).limit(8).lean();
		}

		// store in redis for future quick access
		try {
			await redis.set("featured_products", JSON.stringify(featuredProducts));
		} catch (redisError) {
			console.log("Failed to save to Redis in getFeaturedProducts:", redisError.message);
		}

		const processedFeatured = await CampaignService.applyCampaignToProducts(featuredProducts);
		res.json(processedFeatured);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, categoryId, stock, brand, type, customAttributes, lowStockThreshold, isActive, metaTitle, metaDescription } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = new Product({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			categoryId,
			stock,
			brand,
			type,
			customAttributes: customAttributes || [],
			lowStockThreshold,
			isActive,
			metaTitle,
			metaDescription
		});

		product.$locals = { userId: req.user._id };
		await product.save();

		// Log CREATE_PRODUCT
		await logAction({
			req,
			action: "CREATE_PRODUCT",
			targetId: product._id,
			targetModel: "Product",
			details: `Created product: ${product.name}`,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

// Cập nhật sản phẩm khi có đơn hàng thành công (gọi từ payment.controller.js)
export const updateStock = async (products) => {
	for (const { product: productId, quantity } of products) {
		const product = await Product.findById(productId);
		if (product) {
			product.stock -= quantity;
			if (product.stock < 0) product.stock = 0; // Tránh âm
			await product.save();
		}
	}
};

export const updateProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		const changes = [];
		if (name && name !== product.name) changes.push({ field: "name", old: product.name, new: name });
		if (price !== undefined && price !== product.price) changes.push({ field: "price", old: product.price, new: price });
		if (stock !== undefined && stock !== product.stock) changes.push({ field: "stock", old: product.stock, new: stock });
		if (isActive !== undefined && isActive !== product.isActive) changes.push({ field: "isActive", old: product.isActive, new: isActive });

		if (name) product.name = name;
		if (description) product.description = description;
		if (price !== undefined) product.price = price;
		if (categoryId !== undefined) product.categoryId = categoryId;
		if (stock !== undefined) product.stock = stock;
		if (brand) product.brand = brand;
		if (type) product.type = type;
		if (customAttributes) product.customAttributes = customAttributes;
		if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
		if (isActive !== undefined) product.isActive = isActive;
		if (metaTitle !== undefined) product.metaTitle = metaTitle;
		if (metaDescription !== undefined) product.metaDescription = metaDescription;

		// Smart image handling: Delete old on Cloudinary if replaced
		if (image && image !== product.image) {
			if (product.image) {
				const publicId = product.image.split("/").pop().split(".")[0];
				try {
					await cloudinary.uploader.destroy(`products/${publicId}`);
				} catch (err) {
					console.error("Failed to delete old image from Cloudinary (swallowed)", err.message);
				}
			}
			const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
			product.image = cloudinaryResponse.secure_url;
			changes.push({ field: "image", old: "old_image", new: "new_image" });
		}

		product.$locals = { userId: req.user._id };
		const updatedProduct = await product.save();

		// Log UPDATE_PRODUCT
		if (changes.length > 0) {
			await logAction({
				req,
				action: "UPDATE_PRODUCT",
				targetId: product._id,
				targetModel: "Product",
				changes,
				details: `Updated product: ${product.name}`,
			});
		}

		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in updateProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findOne({ _id: req.params.id, deletedAt: null });
		if (!product) {
			return res.status(404).json({ message: "Product not found or already deleted" });
		}

		// Soft delete — bypass full validation (legacy docs may lack required fields)
		await Product.findByIdAndUpdate(
			req.params.id,
			{ $set: { deletedAt: new Date(), isActive: false } },
			{ runValidators: false }
		);

		// Log DELETE_PRODUCT
		await logAction({
			req,
			action: "DELETE_PRODUCT",
			targetId: product._id,
			targetModel: "Product",
			details: `Deleted product: ${product.name}`,
		});

		res.json({ message: "Product deleted successfully (Soft Delete)" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		const processedProducts = await CampaignService.applyCampaignToProducts(products);
		res.json(processedProducts);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		let query = { deletedAt: null };
		const catObj = await Category.findOne({ slug: category });
		if (catObj) {
			const descendantIds = await Category.distinct("_id", { ancestors: catObj._id });
			query.categoryId = { $in: [catObj._id, ...descendantIds] };
		} else if (mongoose.Types.ObjectId.isValid(category)) {
			const descendantIds = await Category.distinct("_id", { ancestors: category });
			query.categoryId = { $in: [category, ...descendantIds] };
		} else {
			return res.json({ products: [] });
		}

		const products = await Product.find(query);
		const processedProducts = await CampaignService.applyCampaignToProducts(products);
		res.json({ products: processedProducts });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		// Bypass full validation — legacy docs may lack required fields like type/description
		const updatedProduct = await Product.findByIdAndUpdate(
			req.params.id,
			{ $set: { isFeatured: !product.isFeatured } },
			{ new: true, runValidators: false }
		);

		await updateFeaturedProductsCache();
		res.json(updatedProduct);
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const importProducts = async (req, res) => {
	try {
		const workbook = XLSX.readFile(req.file.path);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const data = XLSX.utils.sheet_to_json(sheet);

		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (const [index, row] of data.entries()) {
			try {
				let categoryId = null;
				if (row.category) {
					let cat = await Category.findOne({ name: row.category });
					if (!cat) {
						cat = await Category.create({
							name: row.category,
							slug: row.category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
						});
					}
					categoryId = cat._id;
				}

                let brandId = null;
                if (row.brand) {
                    let brandObj = await Brand.findOne({ name: row.brand });
                    if (!brandObj) {
                        brandObj = await Brand.create({ name: row.brand });
                    }
                    brandId = brandObj._id;
                }

				const product = new Product({
					name: row.name,
					description: row.description || "",
					price: row.price || 0,
                    costPrice: row.costPrice || Math.round((row.price || 0) * 0.7),
					image: row.image || "",
					categoryId: categoryId,
					brand: brandId,
					type: (row.type || "quartz").toLowerCase(),
					stock: row.stock || 0,
					isActive: true,
				});
				product.$locals = { userId: req.user._id };
				await product.save();
				successCount++;
			} catch (err) {
				errorCount++;
				errors.push(`Row ${index + 2}: ${err.message}`);
			}
		}

		try { fs.unlinkSync(req.file.path); } catch (e) { }

		res.json({
			message: "Import finished",
			success: successCount,
			failed: errorCount,
			errors: errors
		});
	} catch (error) {
		res.status(500).json({ message: "Server error during import", error: error.message });
	}
};

export const exportProducts = async (req, res) => {
    try {
        const products = await Product.find({ deletedAt: null })
            .populate("categoryId", "name")
            .populate("brand", "name");
        
        const data = products.map(p => ({
            "Tên sản phẩm": p.name,
            "Thương hiệu": p.brand ? p.brand.name : "Khác",
            "Danh mục": p.categoryId ? p.categoryId.name : "",
            "Loại máy": p.type,
            "Giá bán": p.price,
            "Giá nhập": p.costPrice || 0,
            "Tồn kho": p.stock,
            "Lượt bán": p.salesCount || 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        res.setHeader("Content-Disposition", "attachment; filename=products.xlsx");
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.send(buf);
    } catch (error) {
        console.error("Error exporting products", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getInventoryAlerts = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = parseInt(req.query.limit) || 10;
		const customThreshold = req.query.threshold ? parseInt(req.query.threshold) : null;

		const matchQuery = { deletedAt: null };
		if (customThreshold !== null) {
			matchQuery.stock = { $lte: customThreshold };
		} else {
			matchQuery.$expr = { $lte: ["$stock", "$lowStockThreshold"] };
		}

		const total = await Product.countDocuments(matchQuery);
		const products = await Product.find(matchQuery)
			.select("name image stock lowStockThreshold price categoryId")
			.populate("categoryId", "name")
			.sort({ stock: 1 })
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({
			products,
			totalPages: Math.ceil(total / limit),
			currentPage: page,
			totalAlerts: total
		});
	} catch (error) {
		console.error("Error in getInventoryAlerts:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};


async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}
