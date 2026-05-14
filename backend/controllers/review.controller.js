import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

export const getProductReviews = async (req, res) => {
	try {
		const { productId } = req.params;
		const reviews = await Review.find({ product: productId, status: { $ne: "hidden" } })
			.populate("user", "name")
			.sort({ createdAt: -1 });
		res.json(reviews);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createReview = async (req, res) => {
	try {
		const { productId } = req.params;
		const { rating, comment, images } = req.body;
		const userId = req.user._id;

		if (!rating || !comment) {
			return res.status(400).json({ message: "Vui lòng nhập số sao và bình luận." });
		}

		// Check if user has bought this product and status is 'delivered'
		const hasBought = await Order.findOne({
			user: userId,
			"products.product": productId,
			status: "delivered"
		});

		if (!hasBought) {
			return res.status(403).json({ message: "Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng (Trạng thái: Đã giao)." });
		}

		// Check for existing review
		const existingReview = await Review.findOne({ product: productId, user: userId });
		if (existingReview) {
			return res.status(400).json({ message: "Bạn đã đánh giá sản phẩm này rồi." });
		}

		const review = new Review({
			product: productId,
			user: userId,
			rating: Number(rating),
			comment,
			images: images || [],
			status: "pending",
			verifiedPurchase: true
		});

		await review.save();
		
		// Populate user for the response
		await review.populate("user", "name");

		// Update product average rating and count
		const product = await Product.findById(productId);
		if (product) {
			product.reviewsCount += 1;
			product.averageRating = ((product.averageRating * (product.reviewsCount - 1)) + review.rating) / product.reviewsCount;
			await product.save();
		}

		res.status(201).json(review);
	} catch (error) {
		console.error("Error creating review:", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const listAllReviews = async (req, res) => {
	try {
		const page = Math.max(parseInt(req.query.page) || 1, 1);
		const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
		const status = req.query.status;
		const search = (req.query.search || "").trim();
		const filter = {};
		if (status && status !== "all") filter.status = status;
		if (search) {
			filter.$or = [
				{ comment: { $regex: search, $options: "i" } },
				{ "product.name": { $regex: search, $options: "i" } },
			];
		}

		const totalReviews = await Review.countDocuments(filter);
		const reviews = await Review.find(filter)
			.populate("user", "name email")
			.populate("product", "name image")
			.sort({ createdAt: -1 })
			.skip((page - 1) * limit)
			.limit(limit);

		res.json({ reviews, pagination: { currentPage: page, totalPages: Math.max(Math.ceil(totalReviews / limit), 1), totalReviews, limit } });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const updateReviewStatus = async (req, res) => {
	try {
		const { status } = req.body;
		if (!["pending", "approved", "hidden"].includes(status)) {
			return res.status(400).json({ message: "Trạng thái review không hợp lệ" });
		}
		const review = await Review.findByIdAndUpdate(req.params.id, { status }, { new: true })
			.populate("user", "name email")
			.populate("product", "name image");
		if (!review) return res.status(404).json({ message: "Review not found" });
		res.json(review);
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteReview = async (req, res) => {
	try {
		const review = await Review.findByIdAndDelete(req.params.id);
		if (!review) return res.status(404).json({ message: "Review not found" });
		const remainingReviews = await Review.find({ product: review.product, status: { $ne: "hidden" } });
		const product = await Product.findById(review.product);
		if (product) {
			product.reviewsCount = remainingReviews.length;
			product.averageRating = remainingReviews.length > 0
				? remainingReviews.reduce((sum, item) => sum + item.rating, 0) / remainingReviews.length
				: 0;
			await product.save();
		}
		res.json({ message: "Review deleted" });
	} catch (error) {
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
