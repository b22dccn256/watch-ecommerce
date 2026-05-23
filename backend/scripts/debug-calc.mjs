import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });
import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import Category from '../models/category.model.js';
import Brand from '../models/brand.model.js';
import OrderService from '../services/order.service.js';

(async ()=>{
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/watch-ecommerce-test');
  const cat = await Category.create({ name: 'DbgCat', slug: 'dbg-cat' });
  const brand = await Brand.create({ name: 'DbgBrand' });
  const prod = await Product.create({ name: 'DbgProd', price: 5000000, costPrice:3000000, stock:10, categoryId: cat._id, brand: brand._id, type:'quartz', image: 'https://example.com/img.jpg', description: 'Debug product' });

  console.log('Product created:', prod._id.toString());
  const res = await OrderService.calculateTotals([{ _id: prod._id, quantity: 1 }], null, 'hà nội');
  console.log('calculateTotals result:', res);

  await Product.findByIdAndDelete(prod._id);
  await Category.findByIdAndDelete(cat._id);
  await Brand.findByIdAndDelete(brand._id);
  process.exit(0);
})();
