import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const total = await Product.countDocuments({ deletedAt: null });
    const featured = await Product.countDocuments({
      deletedAt: null,
      isFeatured: true,
    });
    console.log(`Products count: ${total}`);
    console.log(`Featured products: ${featured}`);
    process.exit(0);
  } catch (err) {
    console.error("Count failed:", err.message);
    process.exit(1);
  }
};

run();
