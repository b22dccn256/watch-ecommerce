import mongoose from "mongoose";

// Model để đảm bảo idempotency xử lý callback IPN và theo dõi trạng thái
const processedIPNSchema = new mongoose.Schema(
	{
		provider: {
			type: String,
			required: true,
			enum: ["vnpay", "momo", "zalopay"],
		},
		transactionId: {
			type: String,
			required: true,
		},
		orderCode: {
			type: String,
			default: null,
		},
		status: {
			type: String,
			enum: ["processed", "failed"],
			required: true,
		},
		payload: {
			type: mongoose.Schema.Types.Mixed,
			default: {},
		},
		processedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Unique index để đảm bảo mỗi transactionId chỉ xử lý 1 lần, không mất tính idempotent
processedIPNSchema.index({ provider: 1, transactionId: 1 }, { unique: true });
// orderCode lưu để thuận tiện theo dõi thêm; không bắt duy nhất để phòng đa callback cùng đơn khác transaction
processedIPNSchema.index({ provider: 1, orderCode: 1 }, { sparse: true });

const ProcessedIPN = mongoose.model("ProcessedIPN", processedIPNSchema);

export default ProcessedIPN;
