import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import "../models/productAudit.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const categoriesToSeed = [
  {
    name: "Đồng hồ nam",
    slug: "dong-ho-nam",
    image:
      "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Đồng hồ nữ",
    slug: "dong-ho-nu",
    image:
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Đồng hồ unisex",
    slug: "dong-ho-unisex",
    image:
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop",
  },
  {
    name: "Smartwatch",
    slug: "smartwatch",
    image:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=600&auto=format&fit=crop",
  },
];

const targetSlugForProduct = (product) => {
  if (String(product.type || "").toLowerCase() === "smartwatch")
    return "smartwatch";
  const gender = String(product.gender || "unisex").toLowerCase();
  if (gender === "male") return "dong-ho-nam";
  if (gender === "female") return "dong-ho-nu";
  return "dong-ho-unisex";
};

async function seedCategories() {
  await connectDB();
  console.log("Connected to MongoDB successfully.\n");

  console.log("=== Seeding Watch Categories ===");
  const categoryIdMap = {};

  for (const cat of categoriesToSeed) {
    let existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      existing = new Category({
        name: cat.name,
        slug: cat.slug,
        level: 0,
        parentCategory: null,
        ancestors: [],
        image: cat.image,
        isActive: true,
      });
      await existing.save();
      console.log(`Created category: "${cat.name}"`);
    } else {
      existing.name = cat.name;
      existing.level = 0;
      existing.parentCategory = null;
      existing.ancestors = [];
      existing.isActive = true;
      if (!existing.image) existing.image = cat.image;
      await existing.save();
      console.log(
        `Category "${cat.name}" already exists, normalized relations.`,
      );
    }
    categoryIdMap[cat.slug] = existing._id;
  }

  console.log("\n=== Mapping Products to Categories ===");
  const products = await Product.find({});
  console.log(`Found ${products.length} total products to process.`);

  let updatedCount = 0;
  for (const product of products) {
    const targetSlug = targetSlugForProduct(product);
    const categoryId = categoryIdMap[targetSlug];
    if (!categoryId) {
      console.warn(
        `Could not find target category for product "${product.name}"`,
      );
      continue;
    }
    if (String(product.categoryId) !== String(categoryId)) {
      product.categoryId = categoryId;
      await product.save();
      updatedCount++;
    }
  }

  console.log(
    `\nSuccessfully mapped ${updatedCount} products to canonical categories.`,
  );
  console.log("Seeding and mapping completed successfully!");
  process.exit(0);
}

seedCategories().catch((err) => {
  console.error("Seeding categories failed with error:", err);
  process.exit(1);
});
