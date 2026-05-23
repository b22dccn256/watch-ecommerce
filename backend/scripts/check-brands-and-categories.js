import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import Product from '../models/product.model.js';
import Brand from '../models/brand.model.js';
import Category from '../models/category.model.js';

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const brands = await Brand.find({}).lean();
    console.log(`=== BRANDS IN DATABASE: ${brands.length} ===`);
    for (const b of brands) {
      const pCount = await Product.countDocuments({ brand: b._id, deletedAt: null });
      console.log(`- [${b._id}] ${b.name}: ${pCount} products`);
    }

    const categories = await Category.find({}).lean();
    console.log(`\n=== CATEGORIES IN DATABASE: ${categories.length} ===`);
    for (const c of categories) {
      const pCount = await Product.countDocuments({ categoryId: c._id, deletedAt: null });
      console.log(`- [${c._id}] ${c.name} (level: ${c.level}): ${pCount} products`);
    }

    // Check if there are products with missing/invalid brand
    const missingBrandCount = await Product.countDocuments({ brand: null, deletedAt: null });
    console.log(`\nProducts with null brand: ${missingBrandCount}`);

    // Check if there are products with missing/invalid categoryId
    const missingCategoryCount = await Product.countDocuments({ categoryId: null, deletedAt: null });
    console.log(`Products with null categoryId: ${missingCategoryCount}`);

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
};

run();
