import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		orderCode: {
			type: String,
			unique: true,
		},
		shippingDetails: {
			fullName: { type: String, required: true },
			phoneNumber: { type: String, required: true },
			email: { type: String },
			address: { type: String, required: true },
			city: { type: String, required: true },
			orderNotes: { type: String },
		},
		// Trạng thái đơn hàng tổng quát
		status: {
			type: String,
			enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
			default: "pending"
		},
		paymentStatus: {
			type: String,
			enum: ["pending", "paid", "failed", "refunded", "cancelled"],
			default: "pending"
		},
		paymentMethod: {
			type: String,
			enum: ["stripe", "cod", "paypal", "qr"],
			default: "stripe"
		},
		stripeSessionId: {
			type: String,
			unique: true,
		},
		currency: {
			type: String,
			default: "VND",
			enum: ["USD", "VND"],
		},
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
