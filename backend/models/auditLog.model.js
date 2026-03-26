import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		action: {
			type: String,
			required: true,
			// Examples: LOGIN, ACCESS_DENIED, UPDATE_PRODUCT, DELETE_ORDER, etc.
		},
		targetId: {
			type: mongoose.Schema.Types.ObjectId,
			default: null,
		},
		targetModel: {
			type: String,
			default: null,
			// Examples: Product, Order, User, etc.
		},
		changes: [
			{
				field: String,
				old: mongoose.Schema.Types.Mixed,
				new: mongoose.Schema.Types.Mixed,
			},
		],
		ip: {
			type: String,
			default: "Unknown",
		},
		userAgent: {
			type: String,
			default: "Unknown",
		},
		details: {
			type: String,
			default: "",
		},
	},
	{
		timestamps: true,
	}
);

// TTL index to automatically delete logs after 12 months (365 days)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
