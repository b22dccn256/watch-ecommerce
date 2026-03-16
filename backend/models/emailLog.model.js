import mongoose from "mongoose";

const emailLogSchema = new mongoose.Schema(
	{
		campaignId: { 
			type: mongoose.Schema.Types.ObjectId, 
			ref: "MailCampaign" 
		},
		email: { type: String, required: true },
		status: { 
			type: String, 
			enum: ["queued", "sent", "failed", "bounced", "complaint"], 
			default: "queued" 
		},
		error: { type: String },
		openedAt: [{ type: Date }], // Track multiple opens
		clickedLinks: [
			{
				url: String,
				clickedAt: Date
			}
		],
		metadata: {
			ip: String,
			userAgent: String
		}
	},
	{ timestamps: true }
);

// Index for fast tracking lookups
emailLogSchema.index({ campaignId: 1, email: 1 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);
export default EmailLog;
