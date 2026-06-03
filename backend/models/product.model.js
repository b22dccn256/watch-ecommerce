import mongoose from "mongoose";
import { generateSlugToken, slugifyProductName } from "../lib/product-slug.js";
import ProductAudit from "./productAudit.model.js";

const ensureUniqueSlug = async (model, baseSlug, currentId) => {
  let candidate = baseSlug || "product";
  let suffix = 2;

  while (await model.exists({ slug: candidate, _id: { $ne: currentId } })) {
    candidate = `${baseSlug || "product"}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const ensureUniqueToken = async (model, currentId) => {
  let token = generateSlugToken(6);
  while (await model.exists({ slugToken: token, _id: { $ne: currentId } })) {
    token = generateSlugToken(6);
  }
  return token;
};

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
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
    originalPrice: {
      type: Number,
      min: 0,
      default: null,
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
      },
    ],
    wristSizeOptions: {
      type: [
        {
          size: { type: String, required: true },
          stock: { type: Number, default: 0, min: 0 },
        },
      ],
      default: [],
    },
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
    gender: {
      type: String,
      enum: ["male", "female", "unisex"],
      default: "unisex",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
      default: "",
      sparse: true,
    },
    type: {
      type: String,
      enum: [
        "mechanical",
        "quartz",
        "automatic",
        "solar",
        "digital",
        "smartwatch",
      ],
      lowercase: true,
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    slugToken: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      immutable: true,
    },
    oldSlugs: {
      type: [String],
      default: [],
    },
    specs: {
      movement: {
        type: { type: String, default: "Cơ tự động" },
        caliber: { type: String, default: "" },
        powerReserve: { type: String, default: "" },
        jewels: { type: String, default: "" },
        frequency: { type: String, default: "" },
      },
      case: {
        diameter: { type: String, default: "40 mm" },
        thickness: { type: String, default: "" },
        lugToLug: { type: String, default: "" },
        material: { type: String, default: "Thép không gỉ" },
        caseBack: { type: String, default: "" },
        crown: { type: String, default: "" },
      },
      strap: {
        material: { type: String, default: "Thép không gỉ" },
        claspType: { type: String, default: "Folding clasp" },
        color: { type: String, default: "" },
      },
      waterResistance: { type: String, default: "100 m" },
      weight: { type: String, default: "" },
      glass: { type: String, default: "Kính sapphire" },
      dial: {
        color: { type: String, default: "" },
        indices: { type: String, default: "" },
      },
      functions: { type: [String], default: [] },
      year: { type: Number, default: null },
      warranty: { type: String, default: "5 năm" },
    },
  },
  { timestamps: true },
);

// ── Compound indexes for common admin query patterns ──
productSchema.index({ oldSlugs: 1 });
productSchema.index({ deletedAt: 1, createdAt: -1 }); // default admin sort
productSchema.index({ deletedAt: 1, brand: 1 }); // brand filter
productSchema.index({ deletedAt: 1, categoryId: 1 }); // category filter
productSchema.index({ deletedAt: 1, type: 1 }); // machine type filter
productSchema.index({ deletedAt: 1, isFeatured: 1 }); // featured filter
productSchema.index({ deletedAt: 1, price: 1 }); // price sort/filter

// ── AUDIT MIDDLEWARE ──
productSchema.pre("validate", async function () {
  if (!Array.isArray(this.oldSlugs)) {
    this.oldSlugs = [];
  }
  this.oldSlugs = [...new Set(this.oldSlugs.filter(Boolean))];

  const nameChanged = this.isNew || this.isModified("name") || !this.slug;
  if (nameChanged) {
    const baseSlug = slugifyProductName(this.name) || "product";
    const resolvedSlug = await ensureUniqueSlug(
      this.constructor,
      baseSlug,
      this._id,
    );
    if (
      this.slug &&
      this.slug !== resolvedSlug &&
      !this.oldSlugs.includes(this.slug)
    ) {
      this.oldSlugs.push(this.slug);
    }
    while (this.oldSlugs.length > 5) {
      this.oldSlugs.shift();
    }
    this.slug = resolvedSlug;
  }

  if (!this.slugToken) {
    this.slugToken = await ensureUniqueToken(this.constructor, this._id);
  }
});

productSchema.pre("save", async function () {
  // ── PRICE BUSINESS VALIDATIONS ──
  if (
    this.originalPrice !== null &&
    this.originalPrice !== undefined &&
    this.price > this.originalPrice
  ) {
    throw new Error(
      "Giá bán lẻ khuyến mãi không được lớn hơn giá gốc niêm yết",
    );
  }
  if (
    this.costPrice !== null &&
    this.costPrice !== undefined &&
    this.price < this.costPrice
  ) {
    throw new Error("Giá bán lẻ không được nhỏ hơn giá nhập (giá vốn)");
  }

  // Skip if nothing changed
  if (!this.isModified()) return;

  const action = this.isNew
    ? "Created"
    : this.isModified("deletedAt") && this.deletedAt !== null
      ? "Deleted"
      : "Updated";
  const userId =
    this.$locals && this.$locals.userId ? this.$locals.userId : null;
  const changes = {};

  // Capture modified fields (excluding timestamps)
  this.modifiedPaths().forEach((path) => {
    if (path !== "updatedAt" && path !== "createdAt") {
      changes[path] = this.get(path);
    }
  });

  try {
    await ProductAudit.create({
      productId: this._id,
      userId: userId,
      action: action,
      changes: changes,
    });
  } catch (err) {
    console.error("Failed to write Product Audit Log:", err.message);
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
