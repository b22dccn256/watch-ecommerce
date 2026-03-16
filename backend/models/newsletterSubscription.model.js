import mongoose from "mongoose";

const newsletterSubscriptionSchema = new mongoose.Schema(
	{
		email: { 
			type: String, 
			required: true, 
			unique: true, 
			lowercase: true, 
			trim: true 
		},
		isSubscribed: { type: Boolean, default: true },
		source: { 
			type: String, 
			enum: ["footer", "checkout", "popup", "contact_page"], 
			default: "footer" 
		},
		unsubscribedAt: { type: Date },
		unsubscribedReason: { type: String }
	},
	{ timestamps: true }
);

const NewsletterSubscription = mongoose.model("NewsletterSubscription", newsletterSubscriptionSchema);
export default NewsletterSubscription;
