import Review from "../models/review.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

export const getProductReviews = async (req, res) => {
	try {
		const { productId } = req.params;
		const reviews = await Review.find({ product: productId })
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
