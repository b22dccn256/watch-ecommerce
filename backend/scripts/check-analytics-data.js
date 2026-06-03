import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const top = await Product.find({ deletedAt: null })
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(8)
      .select("name brand salesCount stock")
      .populate("brand", "name")
      .lean();

    const bottom = await Product.find({ deletedAt: null })
      .where("$expr")
      .lte(["$stock", "$lowStockThreshold"])
      .sort({ stock: 1 })
      .limit(8)
      .select("name brand stock lowStockThreshold salesCount")
      .populate("brand", "name")
      .lean();

    console.log("\nTop 8 Best Selling:");
    top.forEach((p, i) =>
      console.log(
        `${i + 1}. ${p.name} | brand:${p.brand?.name || p.brand} | sales:${p.salesCount} | stock:${p.stock}`,
      ),
    );

    console.log("\nBottom (Low Stock) Alerts:");
    bottom.forEach((p, i) =>
      console.log(
        `${i + 1}. ${p.name} | brand:${p.brand?.name || p.brand} | stock:${p.stock} | thresh:${p.lowStockThreshold} | sales:${p.salesCount}`,
      ),
    );

    process.exit(0);
  } catch (err) {
    console.error("Check failed:", err.message);
    process.exit(1);
  }
};

run();
