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

    const count = await Product.countDocuments({});
    console.log(`Total Products in DB: ${count}`);

    // Fetch a sample of 5 products
    const samples = await Product.find({}).limit(5).populate("brand");
    console.log("\n--- SAMPLE WATCH SELECTION OPTIONS CHECK ---");

    for (const p of samples) {
      console.log(`\nWatch: ${p.name}`);
      console.log(`Brand: ${p.brand?.name || "N/A"}`);
      console.log(
        `Price: ${p.price.toLocaleString("vi-VN")} đ | Cost Price: ${p.costPrice.toLocaleString("vi-VN")} đ`,
      );
      console.log(`Colors (${p.colors?.length || 0}):`, p.colors?.join(", "));
      console.log(`Sizes (${p.sizes?.length || 0}):`, p.sizes?.join(", "));
      console.log(`Wrist Size Options (${p.wristSizeOptions?.length || 0}):`);
      p.wristSizeOptions?.forEach((opt) => {
        console.log(`  - Size: ${opt.size} | Stock: ${opt.stock}`);
      });
      const calculatedTotalStock =
        p.wristSizeOptions?.reduce((sum, opt) => sum + opt.stock, 0) || 0;
      console.log(
        `Summed Stock: ${calculatedTotalStock} | Declared Product Stock: ${p.stock}`,
      );
      if (calculatedTotalStock !== p.stock) {
        console.log("⚠️ WARNING: Stock mismatch!");
      } else {
        console.log("✅ Stock is perfectly aligned.");
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Validation failed:", err);
    process.exit(1);
  }
};

run();
