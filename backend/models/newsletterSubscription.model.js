import mongoose from "mongoose";
import crypto from "crypto";

const newsletterSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    isSubscribed: { type: Boolean, default: true },
    source: {
      type: String,
      enum: ["footer", "checkout", "popup", "contact_page"],
      default: "footer",
    },
    unsubscribedAt: { type: Date },
    unsubscribedReason: { type: String },
    // Token-based unsubscribe to avoid exposing email in URLs
    unsubscribeToken: {
      type: String,
      default: () => crypto.randomBytes(32).toString("hex"),
      unique: true,
      sparse: true,
    },
  },
  { timestamps: true },
);

const NewsletterSubscription = mongoose.model(
  "NewsletterSubscription",
  newsletterSubscriptionSchema,
);
export default NewsletterSubscription;
