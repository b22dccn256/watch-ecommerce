import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

/**
 * COMPREHENSIVE FIX: Reverse the 25000x currency scaling bug on ALL products
 *
 * Previous migration incorrectly multiplied ALL prices by 25,000
 * This caused all seeded products (1.5M-500M range) to become 37.5B-12.5T range
 *
 * Fix strategy:
 * 1. Identify ALL products that appear to be scaled (price > 125M likely scaled)
 * 2. Divide them all by 25,000
 * 3. Verify results are in realistic luxury watch range (50K - 2B VND)
 */

const REVERSE_RATE = 25000;
const REASONABLE_MAX = 2000000000; // 2 billion - max realistic luxury watch price
const OBVIOUS_SCALE_THRESHOLD = 125000000; // 125 million - if price > this, it's likely scaled

const fixCurrencyScalingComprehensive = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Get statistics BEFORE
    const statsBefore = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
          count: { $sum: 1 },
          scaledCount: {
            $sum: {
              $cond: [{ $gt: ["$price", OBVIOUS_SCALE_THRESHOLD] }, 1, 0],
            },
          },
        },
      },
    ]);

    console.log("📊 BEFORE fix:");
    if (statsBefore.length > 0) {
      const { minPrice, maxPrice, avgPrice, count, scaledCount } =
        statsBefore[0];
      console.log(`   Total products: ${count}`);
      console.log(`   Products that appear scaled (>125M): ${scaledCount}`);
      console.log(
        `   Min price: ${Math.round(minPrice).toLocaleString("vi-VN")} ₫`,
      );
      console.log(
        `   Max price: ${Math.round(maxPrice).toLocaleString("vi-VN")} ₫`,
      );
      console.log(
        `   Avg price: ${Math.round(avgPrice).toLocaleString("vi-VN")} ₫`,
      );

      if (maxPrice > REASONABLE_MAX) {
        console.log(
          `   ⚠️  Max price ${Math.round(maxPrice).toLocaleString("vi-VN")} exceeds realistic max`,
        );
      }
    }

    // Sample products before fix
    const samples = await Product.find({
      price: { $gt: OBVIOUS_SCALE_THRESHOLD },
    })
      .limit(3)
      .lean();
    if (samples.length > 0) {
      console.log("\n📋 Sample products BEFORE fix:");
      samples.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(
          `      Price: ${Math.round(p.price).toLocaleString("vi-VN")} ₫`,
        );
      });
    }

    // Fix: divide ALL products (migration affected all prices)
    console.log(
      `\n🔄 Fixing prices - dividing ALL products by ${REVERSE_RATE.toLocaleString()}...`,
    );
    const result = await Product.updateMany(
      {}, // ALL products - migration affected everything
      [
        {
          $set: {
            price: { $divide: ["$price", REVERSE_RATE] },
          },
        },
      ],
      { updatePipeline: true },
    );

    console.log(`✅ Fixed ${result.modifiedCount} products\n`);

    // Get statistics AFTER
    const statsAfter = await Product.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
          avgPrice: { $avg: "$price" },
          count: { $sum: 1 },
        },
      },
    ]);

    console.log("📊 AFTER fix:");
    if (statsAfter.length > 0) {
      const { minPrice, maxPrice, avgPrice, count } = statsAfter[0];
      console.log(`   Total products: ${count}`);
      console.log(
        `   Min price: ${Math.round(minPrice).toLocaleString("vi-VN")} ₫`,
      );
      console.log(
        `   Max price: ${Math.round(maxPrice).toLocaleString("vi-VN")} ₫`,
      );
      console.log(
        `   Avg price: ${Math.round(avgPrice).toLocaleString("vi-VN")} ₫`,
      );

      if (maxPrice <= REASONABLE_MAX && minPrice >= 100000) {
        console.log("   ✅ All prices now in realistic luxury watch range!");
      } else if (maxPrice > REASONABLE_MAX) {
        console.log(
          `   ⚠️  Warning: Max still high at ${Math.round(maxPrice).toLocaleString("vi-VN")}`,
        );
      }
    }

    // Sample products after fix
    const samplesAfter = await Product.find({ brand: samples[0]?.brand })
      .limit(3)
      .lean();
    if (samplesAfter.length > 0) {
      console.log("\n📋 Sample products AFTER fix:");
      samplesAfter.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.name}`);
        console.log(
          `      Price: ${Math.round(p.price).toLocaleString("vi-VN")} ₫`,
        );
      });
    }

    console.log("\n✅ Currency scaling fix complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Fix failed:", err.message);
    process.exit(1);
  }
};

fixCurrencyScalingComprehensive();
