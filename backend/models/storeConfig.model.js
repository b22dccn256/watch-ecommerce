import mongoose from "mongoose";

const storeConfigSchema = new mongoose.Schema(
	{
		homeLayout: {
			type: [String],
			// A.7 Fix: homeLayout may contain "chatbot" section, but showChatBot is the MASTER switch.
			// If showChatBot=false, the chatbot section in homeLayout is ignored by the frontend.
			// If showChatBot=true but "chatbot" is not in homeLayout, chatbot is still hidden.
			// BOTH conditions must be true for chatbot to show: showChatBot=true AND "chatbot" in homeLayout.
			default: ["hero", "flashSale", "bestSeller", "chatbot"],
		},
		gridColumns: {
			type: Number,
			enum: [3, 4, 5, 6],
			default: 4,
		},
		featuredCount: {
			type: Number,
			enum: [4, 6, 8, 12],
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
		// A.7: showChatBot is the MASTER toggle for chatbot visibility.
		// chatbot section in homeLayout controls POSITION/ORDER only.
		showChatBot: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

const StoreConfig = mongoose.model("StoreConfig", storeConfigSchema);
export default StoreConfig;
