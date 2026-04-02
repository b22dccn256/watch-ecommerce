import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import Brand from "../models/brand.model.js";
import CampaignService from "../services/campaign.service.js";
import mongoose from "mongoose";
import XLSX from "xlsx";
import fs from "fs";

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
			const brandArr = brands.split(",");
			const validIds = brandArr.filter(b => mongoose.Types.ObjectId.isValid(b));
			const names = brandArr.filter(b => !mongoose.Types.ObjectId.isValid(b));

			if (names.length > 0) {
				const brandDocs = await Brand.find({ name: { $in: names.map(n => new RegExp(`^${n}$`, 'i')) } });
				const brandIds = brandDocs.map(doc => doc._id);
				query.brand = { $in: [...validIds, ...brandIds] };
			} else {
				query.brand = { $in: validIds };
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

		let productsQuery = Product.find(query).populate('brand', 'name').populate('categoryId', 'name');

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

		const brandDocs = await Brand.find({ name: { $regex: q, $options: "i" } });
		const brandIds = brandDocs.map(b => b._id);

		const suggestions = await Product.find({
			deletedAt: null,
			$or: [
				{ name: { $regex: q, $options: "i" } },
				{ brand: { $in: brandIds } },
				{ type: { $regex: q, $options: "i" } },
			]
		}).populate('brand', 'name').select("name image price brand").limit(5);

		res.json(suggestions);
	} catch (error) {
		console.log("Error in getSuggestions controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
	try {
		const product = await Product.findOne({ _id: req.params.id, deletedAt: null })
			.populate('brand', 'name')
			.populate('categoryId', 'name');
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
		featuredProducts = await Product.find({ isFeatured: true, deletedAt: null })
			.populate('brand', 'name')
			.populate('categoryId', 'name')
			.lean();

		if (!featuredProducts || featuredProducts.length === 0) {
			featuredProducts = await Product.find({ deletedAt: null })
				.populate('brand', 'name')
				.populate('categoryId', 'name')
				.limit(8)
				.lean();
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

		const { name, description, price, image, categoryId, stock, brand, type, customAttributes, lowStockThreshold, isActive, metaTitle, metaDescription } = req.body;

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
		}

		product.$locals = { userId: req.user._id };
		const updatedProduct = await product.save();

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

		res.json({ message: "Product deleted successfully (Soft Delete)" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.find({ deletedAt: null, isActive: true })
			.populate("brand", "name logo")
			.populate("categoryId", "name")
			.sort({ salesCount: -1, createdAt: -1 })
			.limit(4)
			.lean();

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

		const products = await Product.find(query)
			.populate('brand', 'name')
			.populate('categoryId', 'name');
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

// ============================================================
// PREVIEW: Đọc file Excel, trả về dữ liệu chưu lưu để admin kiểm tra trước khi import
// ============================================================
export const previewImportProducts = async (req, res) => {
	try {
		if (!req.file) return res.status(400).json({ message: "Không có file được gửi lên" });
		const workbook = XLSX.readFile(req.file.path);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const data = XLSX.utils.sheet_to_json(sheet);
		try { fs.unlinkSync(req.file.path); } catch (e) {}

		const preview = data.slice(0, 50).map((row, idx) => ({
			row: idx + 2,
			name: row.name || row["Tên sản phẩm"] || "",
			brand: row.brand || row["Thương hiệu"] || "",
			category: row.category || row["Danh mục"] || "",
			price: row.price || row["Giá bán"] || 0,
			stock: row.stock || row["Tồn kho"] || 0,
			type: row.type || row["Loại máy"] || "",
			validation: !row.name && !row["Tên sản phẩm"] ? "⚠ Thiếu tên" : "OK"
		}));

		res.json({
			total: data.length,
			preview,
			message: `Đọc thành công ${data.length} sản phẩm. Kiểm tra và xác nhận để import.`
		});
	} catch (error) {
		res.status(500).json({ message: "Server error during preview", error: error.message });
	}
};

// ============================================================
// IMPORT with MongoDB Session (All-or-Nothing Rollback)
// ============================================================
export const importProducts = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		if (!req.file) {
			await session.abortTransaction();
			session.endSession();
			return res.status(400).json({ message: "Không có file được gửi lên" });
		}
		const workbook = XLSX.readFile(req.file.path);
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const data = XLSX.utils.sheet_to_json(sheet);

		let successCount = 0;
		let errorCount = 0;
		const errors = [];
		
		// Validate all rows first (fail-fast)
		const invalidRows = data.filter(row => !row.name && !row["Tên sản phẩm"]);
		if (invalidRows.length > 0) {
			await session.abortTransaction();
			session.endSession();
			try { fs.unlinkSync(req.file.path); } catch (e) {}
			return res.status(400).json({
				message: `${invalidRows.length} dòng thiếu tên sản phẩm. Không có dữ liệu nào được lưu.`,
				errors: invalidRows.map((_, idx) => `Row ${idx + 2}: Thiếu tên sản phẩm`)
			});
		}

		for (const [index, row] of data.entries()) {
			try {
				const productName = row.name || row["Tên sản phẩm"];
				const categoryName = row.category || row["Danh mục"];
				const brandName = row.brand || row["Thương hiệu"];
				const priceVal = row.price ?? row["Giá bán"] ?? 0;
				const stockVal = row.stock ?? row["Tồn kho"] ?? 0;

				let categoryId = null;
				if (categoryName) {
					let cat = await Category.findOne({ name: categoryName }).session(session);
					if (!cat) {
						[cat] = await Category.create([{
							name: categoryName,
							slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
						}], { session });
					}
					categoryId = cat._id;
				}

				let brandId = null;
				if (brandName) {
					let brandObj = await Brand.findOne({ name: brandName }).session(session);
					if (!brandObj) {
						[brandObj] = await Brand.create([{ name: brandName }], { session });
					}
					brandId = brandObj._id;
				}

				let product = await Product.findOne({ name: productName, deletedAt: null }).session(session);

				if (product) {
					if (row.description) product.description = row.description;
					if (priceVal !== undefined) product.price = priceVal;
					if (row.costPrice !== undefined) product.costPrice = row.costPrice;
					if (row.image) product.image = row.image;
					if (categoryId) product.categoryId = categoryId;
					if (brandId) product.brand = brandId;
					if (row.type) product.type = String(row.type).toLowerCase();
					if (stockVal !== undefined) product.stock = stockVal;
					product.$locals = { userId: req.user._id };
					await product.save({ session });
				} else {
					[product] = await Product.create([{
						name: productName,
						description: row.description || "",
						price: priceVal,
						costPrice: row.costPrice || Math.round(priceVal * 0.7),
						image: row.image || "",
						categoryId,
						brand: brandId,
						type: row.type ? String(row.type).toLowerCase() : "quartz",
						stock: stockVal,
						isActive: true,
					}], { session });
				}
				successCount++;
			} catch (err) {
				errorCount++;
				errors.push(`Row ${index + 2}: ${err.message}`);
				// Abort on first error (strict mode) — rollback toàn bộ
				await session.abortTransaction();
				session.endSession();
				try { fs.unlinkSync(req.file.path); } catch (e) {}
				return res.status(422).json({
					message: `Lỗi tại dòng ${index + 2}. Đã rollback toàn bộ, không có sản phẩm nào được lưu.`,
					errors
				});
			}
		}

		await session.commitTransaction();
		session.endSession();
		try { fs.unlinkSync(req.file.path); } catch (e) {}

		res.json({
			message: "Import thành công!",
			success: successCount,
			failed: errorCount,
			errors
		});
	} catch (error) {
		await session.abortTransaction();
		session.endSession();
		try { fs.unlinkSync(req.file?.path); } catch (e) {}
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
