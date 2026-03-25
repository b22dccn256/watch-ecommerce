import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Resolve path for dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
	dotenv.config({ path: envPath });
} else {
	dotenv.config();
}

import Product from "../models/product.model.js";

const migrateProducts = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("Connected to MongoDB for migration");

		// Fetch all products, bypass strict Mongoose restrictions by leaning if necessary, or just load them normally
		const products = await Product.find({});
		let updatedCount = 0;

		for (const product of products) {
			
			// Initialize new specs structure if missing
			if (!product.specs) {
				product.specs = {};
			}

			// Ensure nested objects
			if (!product.specs.movement) {
				product.specs.movement = { type: product.type === "automatic" ? "Automatic" : product.type === "quartz" ? "Quartz" : "Mechanical", caliber: "", powerReserve: "" };
			}
			
			if (!product.specs.case) {
				const oldCaseMaterial = product.specs.caseMaterial || "Stainless steel";
				product.specs.case = { diameter: "40 mm", thickness: "", lugToLug: "", material: oldCaseMaterial };
			} else if (product.specs.caseMaterial) {
				// Migrate existing caseMaterial
				product.specs.case.material = product.specs.caseMaterial;
			}
			
			if (!product.specs.strap) {
				product.specs.strap = { material: "Steel", claspType: "Folding clasp" };
			}
			
			if (!product.specs.glass) {
				product.specs.glass = "Sapphire crystal";
			}

			// Fix Casio Nautilus
			if (product.name && product.name.toLowerCase().includes("casio nautilus")) {
				console.log(`Found outlier product: ${product.name}`);
				product.name = "Patek Philippe Nautilus 5711/1A";
				product.brand = "Patek Philippe";
				product.description = "The Nautilus 5711/1A in stainless steel features a blue horizontally embossed dial. It is one of the most sought-after watches in the world, combining sporty elegance with high horology. The rounded octagonal shape of its bezel, the ingenious porthole construction of its case, and its horizontally embossed dial make it the epitome of the elegant sports watch.";
				product.specs.case.diameter = "40 mm";
				product.specs.case.thickness = "8.3 mm";
				product.specs.case.lugToLug = "47 mm";
				product.specs.movement.caliber = "Caliber 26-330 S C";
				product.specs.movement.powerReserve = "45 hours";
				product.specs.strap.material = "Stainless steel";
				product.specs.strap.claspType = "Nautilus fold-over clasp";
				product.specs.waterResistance = "120 m";
				product.specs.weight = "128 g";
				product.type = "automatic";
			}

			// Also make sure images array has at least the main image
			if (!product.images || product.images.length === 0) {
				if (product.image) {
					product.images = [product.image];
				}
			}

			// Remove old flat fields explicitly if they exist
			product.specs.caseMaterial = undefined;

			// Save
			product.markModified('specs');
			product.markModified('images');
			await product.save({ validateBeforeSave: false });
			updatedCount++;
		}

		console.log(`Migration completed! Updated ${updatedCount} products.`);
		process.exit(0);
	} catch (error) {
		console.error("Migration failed:", error);
		process.exit(1);
	}
};

migrateProducts();
