/**
 * Seed product attributes - generate colors, sizes, wristSizeOptions
 * Run: node scripts/seed-product-attrs.mjs
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

await mongoose.connect(process.env.MONGO_URI);

const Product = (await import('../models/product.model.js')).default;

// Update ALL products with missing attributes
const result = await Product.updateMany(
  { 
    deletedAt: null,
    $or: [
      { colors: { $size: 0 } },
      { sizes: { $size: 0 } },
      { wristSizeOptions: { $size: 0 } },
    ]
  },
  {
    $set: {
      colors: ['Đen', 'Bạc', 'Xanh dương', 'Trắng', 'Vàng hồng'],
      sizes: ['Small (36mm)', 'Medium (40mm)', 'Large (44mm)'],
      wristSizeOptions: [
        { size: 'S (14-16cm)', stock: 5 },
        { size: 'M (16-18cm)', stock: 8 },
        { size: 'L (18-20cm)', stock: 3 },
      ],
      customAttributes: [
        { name: 'Chất liệu mặt', value: 'Sapphire chống xước' },
        { name: 'Chống nước', value: '10 ATM (100m)' },
        { name: 'Bảo hành', value: '5 năm chính hãng' },
      ],
    }
  }
);

console.log(`✅ Updated ${result.modifiedCount} products with colors, sizes, wrist options`);
await mongoose.disconnect();
