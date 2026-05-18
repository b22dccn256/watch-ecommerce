import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

/**
 * QUICK UNDO: Multiply all prices by 25000 to undo the double division
 * This restores us to the state after the first fix
 */

const undoubleDivision = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        // Show before
        const statsBefore = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                    avgPrice: { $avg: "$price" },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log("📊 BEFORE (after double division):");
        if (statsBefore.length > 0) {
            const { minPrice, maxPrice, avgPrice, count } = statsBefore[0];
            console.log(`   Count: ${count}`);
            console.log(`   Min: ${Math.round(minPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Max: ${Math.round(maxPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Avg: ${Math.round(avgPrice).toLocaleString("vi-VN")} ₫`);
        }

        // Multiply all by 25000
        console.log(`\n🔄 Multiplying all prices by 25,000...`);
        const result = await Product.updateMany(
            {},
            { $mul: { price: 25000 } }
        );

        console.log(`✅ Updated ${result.modifiedCount} products\n`);

        // Show after
        const statsAfter = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    minPrice: { $min: "$price" },
                    maxPrice: { $max: "$price" },
                    avgPrice: { $avg: "$price" },
                    count: { $sum: 1 }
                }
            }
        ]);

        console.log("📊 AFTER (restored to post-first-fix state):");
        if (statsAfter.length > 0) {
            const { minPrice, maxPrice, avgPrice, count } = statsAfter[0];
            console.log(`   Count: ${count}`);
            console.log(`   Min: ${Math.round(minPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Max: ${Math.round(maxPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Avg: ${Math.round(avgPrice).toLocaleString("vi-VN")} ₫`);

            if (maxPrice < 200000000) {
                console.log("   ✅ Max is reasonable!");
            } else {
                console.log("   ⚠️  Max is still high");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Failed:", err.message);
        process.exit(1);
    }
};

undoubleDivision();
