import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Product from "../models/product.model.js";
import Order from "../models/order.model.js";

const RATE = 25000;

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for migration...");

        // Migrate Products
        console.log("Migrating product prices...");
        const productResult = await Product.updateMany({}, { $mul: { price: RATE } });
        console.log(`Updated ${productResult.modifiedCount} products.`);

        // Migrate Orders
        console.log("Migrating Historical Orders...");
        const orderResult = await Order.updateMany(
            { currency: { $exists: false } },
            { $set: { currency: "USD" } }
        );
        console.log(`Updated ${orderResult.modifiedCount} historical orders to be explicitly USD.`);

        console.log("Migration complete!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
