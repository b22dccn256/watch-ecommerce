import mongoose from "mongoose";

const emailTemplateSchema = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		subject: { type: String, required: true },
		htmlContent: { type: String, required: true }, // Store raw HTML with {{variables}}
		description: { type: String },
		category: { 
			type: String, 
			enum: ["marketing", "transactional", "automation"], 
			default: "marketing" 
		},
		isActive: { type: Boolean, default: true }
	},
	{ timestamps: true }
);

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);
export default EmailTemplate;
