import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
			index: true,
		},
		action: {
			type: String,
			enum: ["IN", "OUT", "ADJUST"], // IN: nhập kho, OUT: xuất kho/đặt hàng, ADJUST: điều chỉnh số lượng thủ công
			required: true,
		},
		quantity: {
			type: Number,
			required: true, // + value for IN/ADJUST, - value for OUT
		},
		referenceOrderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
			default: null,
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User", // user performed the action (admin) or customer for orders
			default: null,
		},
		note: {
			type: String,
			default: "",
		},
	},
	{ timestamps: true }
);

const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);

export default InventoryLog;
