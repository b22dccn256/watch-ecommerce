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
		costPrice: {
			type: Number,
			min: 0,
			default: 0,
		},
		image: {
			type: String, // Thumbnail / Main image
			required: [true, "Image is required"],
		},
		images: {
			type: [String],
			default: [],
		},
		videoUrl: {
			type: String,
			default: null,
		},
		video360Url: {
			type: String,
			default: null,
		},
		categoryId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Category",
			required: false, // Required false initially to support legacy products before migration
			index: true,
		},
		// Removed old string category field to prepare for migration
		// Legacy products will temporarily lack categoryId until script runs.
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
		colors: {
			type: [String],
			default: [],
		},
		sizes: {
			type: [String],
			default: [],
		},
		customAttributes: [
			{
				name: String, // e.g., "Dial Size", "Strap Type"
				value: String,
			}
		],
		lowStockThreshold: {
			type: Number,
			default: 5,
		},
		deletedAt: {
			type: Date,
			default: null,
			index: true,
		},
		isActive: {
			type: Boolean,
			default: true,
			index: true,
		},
		metaTitle: String,
		metaDescription: String,
		averageRating: {
			type: Number,
			default: 0,
			min: 0,
			max: 5,
		},
		reviewsCount: {
			type: Number,
			default: 0,
		},
		salesCount: {
			type: Number,
			default: 0,
		},
		brand: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Brand",
			required: false, // tạm thời đổi thành false cho an toàn lúc chạy script migration
			index: true,
		},
		collectionName: {
			type: String,
			default: "",
		},
		type: {
			type: String,
			enum: ["mechanical", "quartz", "automatic", "digital", "smartwatch"],
			lowercase: true,
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
			movement: {
				type: { type: String, default: "Automatic" },
				caliber: { type: String, default: "" },
				powerReserve: { type: String, default: "" }
			},
			case: {
				diameter: { type: String, default: "40 mm" },
				thickness: { type: String, default: "" },
				lugToLug: { type: String, default: "" },
				material: { type: String, default: "Stainless steel" }
			},
			strap: {
				material: { type: String, default: "Steel" },
				claspType: { type: String, default: "Folding clasp" }
			},
			waterResistance: { type: String, default: "100 m" },
			weight: { type: String, default: "" },
			glass: { type: String, default: "Sapphire" }
		}
	},
	{ timestamps: true }
);

// --- AUDIT MIDDLEWARE ---
productSchema.pre("save", async function () {
	// Skip if nothing changed
	if (!this.isModified()) return;

	const action = this.isNew ? "Created" : (this.isModified("deletedAt") && this.deletedAt !== null ? "Deleted" : "Updated");
	const userId = this.$locals && this.$locals.userId ? this.$locals.userId : null;
	const changes = {};

	// Capture modified fields (excluding timestamps)
	this.modifiedPaths().forEach(path => {
		if (path !== "updatedAt" && path !== "createdAt") {
			changes[path] = this.get(path);
		}
	});

	try {
		// Import dynamically to avoid circular dependencies if any
		const ProductAudit = mongoose.model("ProductAudit");
		await ProductAudit.create({
			productId: this._id,
			userId: userId,
			action: action,
			changes: changes
		});
	} catch (err) {
		console.error("Failed to write Product Audit Log:", err.message);
	}
});

const Product = mongoose.model("Product", productSchema);

export default Product;
