import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		logo: {
			type: String,
			default: "",
		},
		description: {
			type: String,
			default: "",
		},
		isAuthorizedDealer: {
			type: Boolean,
			default: true,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
	},
	{ timestamps: true }
);

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
