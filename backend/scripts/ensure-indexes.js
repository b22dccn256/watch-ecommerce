/**
 * Ensure MongoDB indexes for all core collections.
 * Safe to run multiple times (createIndex is idempotent).
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import Coupon from "../models/coupon.model.js";
import Brand from "../models/brand.model.js";
import Category from "../models/category.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const ensureIndexes = async () => {
  if (!process.env.MONGO_URI) {
    console.error("[ensure-indexes] MONGO_URI is required");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("[ensure-indexes] Connected");

  const results = await Promise.all([
    User.syncIndexes(),
    Product.syncIndexes(),
    Order.syncIndexes(),
    Coupon.syncIndexes(),
    Brand.syncIndexes(),
    Category.syncIndexes(),
  ]);

  console.log("[ensure-indexes] syncIndexes complete:", {
    user: results[0],
    product: results[1],
    order: results[2],
    coupon: results[3],
    brand: results[4],
    category: results[5],
  });

  await mongoose.disconnect();
  console.log("[ensure-indexes] Done");
};

ensureIndexes().catch((err) => {
  console.error("[ensure-indexes] Failed:", err.message);
  process.exit(1);
});
