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
			enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "returned"],
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
		// Thời điểm thanh toán thành công (đối soát, thống kê)
		paidAt: {
			type: Date,
			default: null,
		},
		trackingToken: {
			type: String,
			unique: true,
		},
		estimatedDelivery: {
			type: Date,
		},
		carrier: {
			type: String,
			default: "DHL Express",
			enum: ["DHL Express", "GHTK", "Viettel Post", "J&T Express", "VNPost", "Other"],
		},
		internalNotes: {
			type: String,
			default: "",
		},
		returnReason: {
			type: String,
			default: "",
		},
		refundAmount: {
			type: Number,
			default: 0,
			min: 0,
		},
		carrierTrackingNumber: {
			type: String,
		},
		trackingEvents: [
			{
				status: { type: String, required: true },
				message: { type: String },
				location: { type: String },
				timestamp: { type: Date, default: Date.now },
			},
		],
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
