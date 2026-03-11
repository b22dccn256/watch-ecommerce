import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";

// Relative paths depends on where script is run. Assume it's run from backend root or project root.
// We'll load env directly.
dotenv.config({ path: "./backend/.env" });

import Category from "../backend/models/category.model.js";
import Product from "../backend/models/product.model.js";

const migrateCategories = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected Successfully.");

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Use native MongoDB driver to bypass Mongoose Schema strictness
            // because we removed 'category' string from the schema
            const products = await Product.collection.find({ category: { $exists: true } }).toArray();
            console.log(`Found ${products.length} legacy products with string categories.`);

            if (products.length === 0) {
                console.log("No products to migrate.");
                await session.abortTransaction();
                mongoose.disconnect();
                return;
            }

            // Extract unique categories
            const uniqueCategories = [...new Set(products.map(p => p.category))];
            console.log("Unique Categories found: ", uniqueCategories);

            const categoryMap = {};

            // Ensure categories exist in the new Category collection
            for (const catName of uniqueCategories) {
                if (!catName) continue;

                let category = await Category.findOne({ name: catName }).session(session);
                if (!category) {
                    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Math.random().toString(36).substring(2, 7);

                    category = new Category({
                        name: catName,
                        slug: slug,
                        isActive: true,
                        level: 0,
                    });
                    await category.save({ session });
                    console.log(`Created new Category: ${catName}`);
                }
                categoryMap[catName] = category._id;
            }

            // Update products: set categoryId and unset category string
            let updatedCount = 0;
            for (const product of products) {
                if (!product.category || !categoryMap[product.category]) continue;

                await Product.collection.updateOne(
                    { _id: product._id },
                    {
                        $set: { categoryId: categoryMap[product.category] },
                        $unset: { category: "" }
                    },
                    { session }
                );
                updatedCount++;
            }

            console.log(`Successfully migrated ${updatedCount} products.`);

            await session.commitTransaction();
            console.log("Transaction committed!");
        } catch (error) {
            console.error("Error during migration. Aborting transaction...");
            await session.abortTransaction();
            console.error(error);
        } finally {
            session.endSession();
            mongoose.disconnect();
            console.log("Disconnected from MongoDB.");
        }
    } catch (error) {
        console.error("Failed to connect to MongoDB", error);
    }
};

migrateCategories();
