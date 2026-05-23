import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/db.js';
import Category from '../models/category.model.js';
import Product from '../models/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const categoriesToSeed = [
  // Level 0: Main Categories
  {
    name: "Đồng hồ Nam",
    slug: "dong-ho-nam",
    level: 0,
    parentKey: null,
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Đồng hồ Nữ",
    slug: "dong-ho-nu",
    level: 0,
    parentKey: null,
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Đồng hồ Unisex",
    slug: "dong-ho-unisex",
    level: 0,
    parentKey: null,
    image: "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600&auto=format&fit=crop"
  },

  // Level 1: Subcategories - Nam
  {
    name: "Cơ Tự Động (Automatic)",
    slug: "dong-ho-nam-automatic",
    level: 1,
    parentKey: "dong-ho-nam",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Bộ Máy Pin (Quartz)",
    slug: "dong-ho-nam-quartz",
    level: 1,
    parentKey: "dong-ho-nam",
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600&auto=format&fit=crop"
  },

  // Level 1: Subcategories - Nữ
  {
    name: "Cơ Tự Động (Automatic)",
    slug: "dong-ho-nu-automatic",
    level: 1,
    parentKey: "dong-ho-nu",
    image: "https://images.unsplash.com/photo-1539874754764-5a96559165b0?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Bộ Máy Pin (Quartz)",
    slug: "dong-ho-nu-quartz",
    level: 1,
    parentKey: "dong-ho-nu",
    image: "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=600&auto=format&fit=crop"
  },

  // Level 1: Subcategories - Unisex
  {
    name: "Cơ Tự Động (Automatic)",
    slug: "dong-ho-unisex-automatic",
    level: 1,
    parentKey: "dong-ho-unisex",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop"
  },
  {
    name: "Bộ Máy Pin (Quartz)",
    slug: "dong-ho-unisex-quartz",
    level: 1,
    parentKey: "dong-ho-unisex",
    image: "https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?q=80&w=600&auto=format&fit=crop"
  }
];

async function seedCategories() {
  await connectDB();
  console.log("Connected to MongoDB successfully.\n");

  console.log("=== Seeding Categories ===");
  const categoryIdMap = {};

  // First, upsert Level 0 Categories
  for (const cat of categoriesToSeed.filter(c => c.level === 0)) {
    let existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      existing = new Category({
        name: cat.name,
        slug: cat.slug,
        level: 0,
        parentCategory: null,
        ancestors: [],
        image: cat.image,
        isActive: true
      });
      await existing.save();
      console.log(`Created parent category: "${cat.name}"`);
    } else {
      console.log(`Parent category "${cat.name}" already exists.`);
    }
    categoryIdMap[cat.slug] = existing._id;
  }

  // Next, upsert Level 1 Categories
  for (const cat of categoriesToSeed.filter(c => c.level === 1)) {
    const parentId = categoryIdMap[cat.parentKey];
    if (!parentId) {
      console.error(`Parent ID not found for parent key "${cat.parentKey}"`);
      continue;
    }

    let existing = await Category.findOne({ slug: cat.slug });
    if (!existing) {
      existing = new Category({
        name: cat.name,
        slug: cat.slug,
        level: 1,
        parentCategory: parentId,
        ancestors: [parentId],
        image: cat.image,
        isActive: true
      });
      await existing.save();
      console.log(`Created child category: "${cat.name}" under parent "${cat.parentKey}"`);
    } else {
      // Ensure relations are up to date
      existing.parentCategory = parentId;
      existing.ancestors = [parentId];
      await existing.save();
      console.log(`Child category "${cat.name}" already exists, updated relations.`);
    }
    categoryIdMap[cat.slug] = existing._id;
  }

  console.log("\n=== Mapping Products to Categories ===");
  const products = await Product.find({});
  console.log(`Found ${products.length} total products to process.`);

  let updatedCount = 0;
  for (const p of products) {
    const gender = (p.gender || "unisex").toLowerCase();
    const type = (p.type || "quartz").toLowerCase();

    let targetSlug = "";
    if (gender === "male") {
      if (type === "automatic" || type === "mechanical") {
        targetSlug = "dong-ho-nam-automatic";
      } else {
        targetSlug = "dong-ho-nam-quartz";
      }
    } else if (gender === "female") {
      if (type === "automatic" || type === "mechanical") {
        targetSlug = "dong-ho-nu-automatic";
      } else {
        targetSlug = "dong-ho-nu-quartz";
      }
    } else {
      // unisex
      if (type === "automatic" || type === "mechanical") {
        targetSlug = "dong-ho-unisex-automatic";
      } else {
        targetSlug = "dong-ho-unisex-quartz";
      }
    }

    const categoryId = categoryIdMap[targetSlug];
    if (categoryId) {
      p.categoryId = categoryId;
      await p.save();
      updatedCount++;
    } else {
      console.warn(`Could not find target category ID for slug "${targetSlug}" for product "${p.name}"`);
    }
  }

  console.log(`\nSuccessfully mapped ${updatedCount} products to their new Category IDs.`);
  console.log("Seeding and mapping completed successfully!");
  process.exit(0);
}

seedCategories().catch(err => {
  console.error("Seeding categories failed with error:", err);
  process.exit(1);
});
