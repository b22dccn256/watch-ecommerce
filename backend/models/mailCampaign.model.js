import mongoose from "mongoose";

const mailCampaignSchema = new mongoose.Schema(
	{
		title: { type: String, required: true },
		subject: { type: String, required: true },
		template: { 
			type: mongoose.Schema.Types.ObjectId, 
			ref: "EmailTemplate" 
		},
		customHtml: { type: String }, // Optional override
		status: { 
			type: String, 
			enum: ["draft", "scheduled", "sending", "sent", "failed"], 
			default: "draft" 
		},
		scheduledAt: { type: Date },
		sentAt: { type: Date },
		stats: {
			totalSent: { type: Number, default: 0 },
			delivered: { type: Number, default: 0 },
			opened: { type: Number, default: 0 },
			clicked: { type: Number, default: 0 },
			failed: { type: Number, default: 0 }
		},
		attachments: [
			{
				filename: String,
				url: String,
				public_id: String
			}
		],
		targetAudience: {
			type: String,
			enum: ["all", "newsletter", "customers", "abandoned_cart"],
			default: "newsletter"
		}
	},
	{ timestamps: true }
);

const MailCampaign = mongoose.model("MailCampaign", mailCampaignSchema);
export default MailCampaign;
