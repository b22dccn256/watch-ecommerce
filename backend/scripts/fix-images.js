import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";

const watchImages = [
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=1999&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=2080&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587836374828-cb433c1142bc?q=80&w=2070&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1509048191080-d2984bad6ae5?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=1988&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=1974&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549972574-8e3e1ed6a20d?q=80&w=2000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1594532986427-0c75a4dc3726?q=80&w=2070&auto=format&fit=crop"
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const fixImages = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Image Fixing...");

        const allProducts = await Product.find({});
        console.log(`Found ${allProducts.length} products to update.`);

        let updateCount = 0;
        for (const product of allProducts) {
            // Unconditionally overwrite the image URL with a known working one
            // Use updateOne to bypass full document validation for old products
            await Product.updateOne(
                { _id: product._id },
                { $set: { image: getRandom(watchImages) } }
            );
            updateCount++;
        }

        console.log(`Successfully updated ${updateCount} products with new working images.`);
        process.exit(0);
    } catch (err) {
        console.error("Image fixing failed:", err);
        process.exit(1);
    }
};

fixImages();
