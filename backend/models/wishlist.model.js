import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true,
		},
		items: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				addedAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
	},
	{ timestamps: true }
);

// Tránh duplicate product trong cùng một wishlist tại tầng DB/Schema nếu cần, 
// nhưng thường xử lý ở controller để có thông báo lỗi tốt hơn.

const Wishlist = mongoose.model("Wishlist", wishlistSchema);

export default Wishlist;
