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
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

const Banner = mongoose.model("Banner", bannerSchema);

export default Banner;
