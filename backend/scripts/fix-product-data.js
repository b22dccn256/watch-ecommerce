import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

const COLORS = ["Đen", "Bạc", "Vàng", "Xanh dương", "Trắng", "Nâu"];
const SIZES = ["38mm", "40mm", "41mm", "42mm", "44mm", "45mm"];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fixData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for data fix...");

        const products = await Product.find({ deletedAt: null });
        console.log(`Found ${products.length} products to update.`);

        let updatedCount = 0;
        for (const product of products) {
            // Only update if colors or sizes are empty
            if (!product.colors || product.colors.length === 0 || !product.sizes || product.sizes.length === 0) {
                product.colors = [getRandom(COLORS)];
                // Give some watches multiple colors
                if (Math.random() > 0.7) product.colors.push(getRandom(COLORS.filter(c => !product.colors.includes(c))));
                
                product.sizes = [getRandom(SIZES)];
                 // Give some watches multiple sizes
                if (Math.random() > 0.7) product.sizes.push(getRandom(SIZES.filter(s => !product.sizes.includes(s))));

                await product.save({ validateBeforeSave: false }); // Bypass validation for speed and legacy data
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} products with colors and sizes.`);
        process.exit(0);
    } catch (err) {
        console.error("Data fix failed:", err);
        process.exit(1);
    }
};

fixData();
