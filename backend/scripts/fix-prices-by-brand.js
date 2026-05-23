import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

/**
 * MANUAL PRICE RESTORATION
 * 
 * Set realistic prices based on luxury watch market data
 * Expected ranges:
 * - Casio/Timex/Citizen: 2M - 20M ₫
 * - Apple Watch/Smartwatch: 10M - 35M ₫
 * - Seiko/Bulova: 8M - 30M ₫
 * - Tissot/Cartier: 30M - 150M ₫
 * - Omega: 50M - 300M ₫
 * - Tag Heuer/IWC: 80M - 400M ₫
 * - Rolex/Patek Philippe: 200M - 2B ₫
 * - Hublot: 200M - 3B ₫
 */

const BRAND_RANGES = {
    "Casio": { min: 2000000, max: 15000000 },
    "Timex": { min: 2500000, max: 12000000 },
    "Citizen": { min: 5000000, max: 25000000 },
    "G-Shock": { min: 3000000, max: 15000000 },
    "Seiko": { min: 8000000, max: 30000000 },
    "Bulova": { min: 6000000, max: 25000000 },
    "Apple": { min: 10000000, max: 40000000 },
    "Garmin": { min: 8000000, max: 35000000 },
    "Samsung": { min: 8000000, max: 30000000 },
    "Fitbit": { min: 5000000, max: 20000000 },
    "Huawei": { min: 6000000, max: 25000000 },
    "Tissot": { min: 30000000, max: 150000000 },
    "Cartier": { min: 40000000, max: 200000000 },
    "Blancpain": { min: 50000000, max: 300000000 },
    "Suunto": { min: 10000000, max: 50000000 },
    "Audemars Piguet": { min: 150000000, max: 1000000000 },
    "Omega": { min: 50000000, max: 300000000 },
    "Tag Heuer": { min: 80000000, max: 400000000 },
    "IWC": { min: 80000000, max: 500000000 },
    "Rolex": { min: 200000000, max: 2000000000 },
    "Patek Philippe": { min: 300000000, max: 1500000000 },
    "Hublot": { min: 250000000, max: 1200000000 },
    "Breitling": { min: 100000000, max: 500000000 },
    "Chopard": { min: 80000000, max: 800000000 },
    "Longines": { min: 40000000, max: 200000000 },
};

const getRandomPrice = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const fixPricesBrand = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB\n");

        let totalFixed = 0;

        for (const [brandName, { min, max }] of Object.entries(BRAND_RANGES)) {
            const count = await Product.countDocuments({ brand: brandName });
            if (count === 0) continue;

            // Get sample before
            const sampleBefore = await Product.findOne({ brand: brandName }).lean();
            const priceBefore = sampleBefore?.price || 0;

            // Generate new random prices in realistic range
            const result = await Product.updateMany(
                { brand: brandName },
                [
                    {
                        $set: {
                            price: {
                                $toInt: {
                                    $add: [
                                        min,
                                        {
                                            $multiply: [
                                                { $random: {} },
                                                max - min
                                            ]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                ]
            );

            if (result.modifiedCount > 0) {
                // Get sample after
                const sampleAfter = await Product.findOne({ brand: brandName }).lean();
                const priceAfter = sampleAfter?.price || 0;

                console.log(`✅ ${brandName}`);
                console.log(`   Products: ${count}`);
                console.log(`   Range: ${min.toLocaleString("vi-VN")} - ${max.toLocaleString("vi-VN")} ₫`);
                console.log(`   Sample before: ${Math.round(priceBefore).toLocaleString("vi-VN")} ₫`);
                console.log(`   Sample after: ${Math.round(priceAfter).toLocaleString("vi-VN")} ₫\n`);

                totalFixed += result.modifiedCount;
            }
        }

        // Get overall statistics
        const stats = await Product.aggregate([
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

        if (stats.length > 0) {
            const { minPrice, maxPrice, avgPrice, count } = stats[0];
            console.log("📊 Overall Statistics:");
            console.log(`   Total products: ${count}`);
            console.log(`   Min price: ${Math.round(minPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Max price: ${Math.round(maxPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`   Avg price: ${Math.round(avgPrice).toLocaleString("vi-VN")} ₫`);
            console.log(`\n✅ Restored prices for ${totalFixed} products!`);
        }

        process.exit(0);
    } catch (err) {
        console.error("❌ Fix failed:", err.message);
        process.exit(1);
    }
};

fixPricesBrand();
