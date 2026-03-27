import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

// Load env vars
dotenv.config({ path: "./backend/.env" });

const cleanDummyWatches = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB connected");

		// Find non-luxury products by checking keywords in name or description
		const keywords = ["Huawei", "Samsung", "iPhone", "Sony", "Tai nghe", "Smartphone", "Pro 27"];
		const regex = new RegExp(keywords.join("|"), "i");

		const dummyProducts = await Product.find({ name: regex });
		console.log(`Found ${dummyProducts.length} dummy products to clean up.`);

		if (dummyProducts.length === 0) {
			console.log("No dummy products found. Exiting.");
			return process.exit(0);
		}

		const dummyProductIds = dummyProducts.map(p => p._id);

		// Soft Delete the products
		const updateResult = await Product.updateMany(
			{ _id: { $in: dummyProductIds } },
			{ 
				$set: { isActive: false, deletedAt: new Date() } 
			}
		);
		console.log(`Soft deleted ${updateResult.modifiedCount} products.`);

		// Remove from users' carts and wishlists
		const userResult = await User.updateMany(
			{},
			{ 
				$pull: { 
					cartItems: { product: { $in: dummyProductIds } },
					wishlist: { $in: dummyProductIds }
				} 
			}
		);
		console.log(`Cleaned up dummy products from ${userResult.modifiedCount} users' carts and wishlists.`);

		console.log("Data cleanup completed successfully.");
		process.exit(0);
	} catch (error) {
		console.error("Error cleaning dummy watches:", error);
		process.exit(1);
	}
};

cleanDummyWatches();
