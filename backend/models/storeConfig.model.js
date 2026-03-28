import mongoose from "mongoose";

const storeConfigSchema = new mongoose.Schema(
	{
		homeLayout: {
			type: [String],
			default: ["hero", "flashSale", "bestSeller", "chatbot"],
		},
		gridColumns: {
			type: Number,
			default: 4,
		},
		heroSlogan: {
			type: String,
			default: "Khám phá đồng hồ cao cấp làm nên đẳng cấp của bạn.",
		},
		bestSellerTitle: {
			type: String,
			default: "Sản phẩm Bán chạy",
		},
		flashSaleTitle: {
			type: String,
			default: "Ưu Đãi Đặc Biệt",
		},
		showChatBot: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);
export default StoreConfig;
