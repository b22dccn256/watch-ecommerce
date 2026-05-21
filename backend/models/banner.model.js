import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: true,
		},
		link: {
			type: String,
			default: "",
		},
		status: {
			type: String,
			enum: ["ACTIVE", "INACTIVE"],
			default: "ACTIVE",
		},
		order: {
			type: Number,
			default: 0,
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Index for efficient sorting by order
bannerSchema.index({ order: 1 });

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
