import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";
import XLSX from "xlsx";
import fs from "fs";

export const getAllProducts = async (req, res) => {
	try {
		const { q, page, limit, sort, brands, minPrice, maxPrice, machineType, category } = req.query;

		let query = {};

		if (q) {
			query.name = { $regex: q, $options: "i" };
		}
		if (category) {
			query.category = category;
		}
		if (brands) {
			query.brand = { $in: brands.split(",") };
		}
		if (machineType) {
			query.type = { $in: machineType.split(",") };
		}
		if (minPrice || maxPrice) {
			query.price = {};
			if (minPrice) query.price.$gte = Number(minPrice);
			if (maxPrice) query.price.$lte = Number(maxPrice);
		}

		let productsQuery = Product.find(query);

		if (sort === "popular") {
			productsQuery = productsQuery.sort({ createdAt: -1 });
		} else if (sort === "price_asc") {
			productsQuery = productsQuery.sort({ price: 1 });
		} else if (sort === "price_desc") {
			productsQuery = productsQuery.sort({ price: -1 });
		} else {
			productsQuery = productsQuery.sort({ createdAt: -1 });
		}

		if (page && limit) {
			const pageNum = parseInt(page, 10);
			const limitNum = parseInt(limit, 10);
			productsQuery = productsQuery.skip((pageNum - 1) * limitNum).limit(limitNum);

			const products = await productsQuery;
			const total = await Product.countDocuments(query);
			return res.json({
				products,
				totalPages: Math.ceil(total / limitNum),
				currentPage: pageNum
			});
		} else {
			const products = await productsQuery;
			return res.json({ products });
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
		const suggestions = await Product.find({ name: { $regex: q, $options: "i" } }).select("name image price").limit(5);
		res.json(suggestions);
	} catch (error) {
		console.log("Error in getSuggestions controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductById = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (!product) return res.status(404).json({ message: "Product not found" });
		res.json(product);
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
		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts || featuredProducts.length === 0) {
			featuredProducts = await Product.find({}).limit(8).lean();
		}

		// store in redis for future quick access
		try {
			await redis.set("featured_products", JSON.stringify(featuredProducts));
		} catch (redisError) {
			console.log("Failed to save to Redis in getFeaturedProducts:", redisError.message);
		}

		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	try {
		const { name, description, price, image, category, stock, brand, type } = req.body;

		let cloudinaryResponse = null;

		if (image) {
			cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : "",
			category,
			stock,
			brand,
			type,
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

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
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

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
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

		for (const row of data) {
			await Product.create({
				name: row.name,
				description: row.description,
				price: row.price,
				image: row.image, // URL hoặc upload sau
				category: row.category,
				brand: row.brand,
				type: row.type,
				stock: row.stock,
			});
		}

		fs.unlinkSync(req.file.path); // Xóa file tạm
		res.json({ message: "Products imported successfully" });
	} catch (error) {
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
