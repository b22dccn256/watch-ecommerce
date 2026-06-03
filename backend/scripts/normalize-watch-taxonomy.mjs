import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";
import "../models/productAudit.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const DRY_RUN = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");

const TARGET_CATEGORIES = [
  { name: "Đồng hồ nam", slug: "dong-ho-nam" },
  { name: "Đồng hồ nữ", slug: "dong-ho-nu" },
  { name: "Đồng hồ unisex", slug: "dong-ho-unisex" },
  { name: "Smartwatch", slug: "smartwatch" },
];

const TEST_BRAND_PATTERNS = [
  /DbgBrand/i,
  /^E2E Brand$/i,
  /^Rolex 123$/i,
  /^Test Watch for Totals Brand/i,
];

const log = (...args) => console.log(...args);

const ensureCategory = async (category) => {
  let doc = await Category.findOne({ slug: category.slug });
  if (!doc) {
    if (DRY_RUN) {
      log(
        `[dry-run] Would create category: ${category.name} (${category.slug})`,
      );
      return null;
    }
    doc = await Category.create({
      ...category,
      parentCategory: null,
      ancestors: [],
      level: 0,
      isActive: true,
    });
    log(`Created category: ${category.name}`);
    return doc;
  }

  const updates = {};
  if (doc.name !== category.name) updates.name = category.name;
  if (doc.parentCategory !== null) updates.parentCategory = null;
  if (doc.level !== 0) updates.level = 0;
  if (doc.isActive !== true) updates.isActive = true;
  if ((doc.ancestors || []).length > 0) updates.ancestors = [];

  if (Object.keys(updates).length > 0) {
    if (DRY_RUN)
      log(`[dry-run] Would normalize category ${doc.slug}:`, updates);
    else {
      Object.assign(doc, updates);
      await doc.save();
      log(`Normalized category: ${doc.name}`);
    }
  }

  return doc;
};

const targetSlugForProduct = (product) => {
  if (String(product.type || "").toLowerCase() === "smartwatch")
    return "smartwatch";
  const gender = String(product.gender || "unisex").toLowerCase();
  if (gender === "male") return "dong-ho-nam";
  if (gender === "female") return "dong-ho-nu";
  return "dong-ho-unisex";
};

const run = async () => {
  if (!DRY_RUN && !APPLY) {
    throw new Error("Use --dry-run to preview or --apply to modify data.");
  }

  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/watch-ecommerce",
  );
  log(`Connected. Mode: ${DRY_RUN ? "DRY RUN" : "APPLY"}`);

  const categoryMap = new Map();
  for (const category of TARGET_CATEGORIES) {
    const doc = await ensureCategory(category);
    if (doc) categoryMap.set(category.slug, doc._id);
  }

  if (DRY_RUN) {
    for (const category of TARGET_CATEGORIES) {
      const doc = await Category.findOne({ slug: category.slug });
      if (doc) categoryMap.set(category.slug, doc._id);
    }
  }

  const movementCategories = await Category.find({
    $or: [
      { name: /Automatic/i },
      { name: /Quartz/i },
      { slug: /automatic/i },
      { slug: /quartz/i },
    ],
  });

  log(`Movement categories to remove: ${movementCategories.length}`);

  const products = await Product.find({ deletedAt: null });
  let remapped = 0;
  for (const product of products) {
    const targetSlug = targetSlugForProduct(product);
    const targetId = categoryMap.get(targetSlug);
    if (!targetId) {
      log(`Missing target category for ${product.name}: ${targetSlug}`);
      continue;
    }
    if (String(product.categoryId) !== String(targetId)) {
      remapped += 1;
      if (DRY_RUN) {
        log(`[dry-run] Would map product "${product.name}" -> ${targetSlug}`);
      } else {
        product.categoryId = targetId;
        await product.save();
      }
    }
  }
  log(`${DRY_RUN ? "Would remap" : "Remapped"} products: ${remapped}`);

  if (movementCategories.length > 0) {
    const ids = movementCategories.map((category) => category._id);
    if (DRY_RUN)
      log(`[dry-run] Would delete movement category ids: ${ids.join(", ")}`);
    else {
      const result = await Category.deleteMany({ _id: { $in: ids } });
      log(`Deleted movement categories: ${result.deletedCount}`);
    }
  }

  const brands = await Brand.find({ isActive: true });
  let deactivatedBrands = 0;
  for (const brand of brands) {
    const shouldDeactivate = TEST_BRAND_PATTERNS.some((pattern) =>
      pattern.test(brand.name || ""),
    );
    if (!shouldDeactivate) continue;
    const productCount = await Product.countDocuments({
      brand: brand._id,
      deletedAt: null,
    });
    if (productCount > 0) {
      log(`Skipped brand with products: ${brand.name} (${productCount})`);
      continue;
    }
    deactivatedBrands += 1;
    if (DRY_RUN) log(`[dry-run] Would deactivate brand: ${brand.name}`);
    else {
      brand.isActive = false;
      await brand.save();
      log(`Deactivated brand: ${brand.name}`);
    }
  }
  log(
    `${DRY_RUN ? "Would deactivate" : "Deactivated"} brands: ${deactivatedBrands}`,
  );

  const finalCategories = await Category.find({})
    .sort({ level: 1, name: 1 })
    .select("name slug level parentCategory")
    .lean();
  log("Final category snapshot:");
  finalCategories.forEach((category) =>
    log(`- ${category.name} (${category.slug}) level=${category.level}`),
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
