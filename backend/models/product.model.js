import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
		price: {
			type: Number,
			min: 0,
			required: true,
			index: true,
		},
		image: {
			type: String,
			required: [true, "Image is required"],
		},
		category: {
			type: String,
			required: true,
			index: true,
		},
		isFeatured: {
			type: Boolean,
			default: false,
		},
		// New fields for watch products
		stock: {
			type: Number,
			required: true,
			min: 0,
			default: 0,
		},
		brand: {
			type: String,
			required: true, // e.g., "Rolex", "Seiko"
			index: true,
		},
		type: {
			type: String,
			enum: ["mechanical", "quartz", "automatic", "digital", "smartwatch"],
			required: true,
			index: true,
		},
		slug: {
			type: String,
			required: false,
			unique: true,
			default: function () {
				if (this.name) {
					const baseSlug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
					const randomHash = Math.random().toString(36).substring(2, 7);
					return `${baseSlug}-${randomHash}`;
				}
				return "";
			}
		},
		specs: {
			waterResistance: String,
			glass: String,
			caseMaterial: String,
		}
	},
	{ timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
