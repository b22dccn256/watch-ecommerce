import mongoose from "mongoose";
import dotenv from "dotenv";
import Brand from "../models/brand.model.js";

dotenv.config({ path: "backend/.env" });

const migrateSpecsAndBrand = async () => {
	try {
		await mongoose.connect(process.env.MONGO_URI);
		console.log("MongoDB connected.");

        // Lấy kết nối collection thô từ Mongoose để bypass schema validation
		const productCollection = mongoose.connection.collection('products');
		const products = await productCollection.find({}).toArray();

		console.log(`Found ${products.length} products to migrate.`);
		
        let migratedCount = 0;

		for (const p of products) {
			let updateQuery = { $set: {} };
			let needsUpdate = false;

			// 1. MIGRATION VỀ BRAND
			if (typeof p.brand === 'string') {
				let brandDoc = await Brand.findOne({ name: p.brand });
				if (!brandDoc) {
					console.log(`Creating new Brand schema for: ${p.brand}`);
					brandDoc = await Brand.create({ 
                        name: p.brand, 
                        description: `Sản phẩm chính hãng từ ${p.brand}` 
                    });
				}
				
				updateQuery.$set.brand = brandDoc._id; // Gắn Object ID
				needsUpdate = true;
			}

			// 2. MIGRATION VỀ SPECS CŨ (Array -> Nested Object)
			if (Array.isArray(p.specs)) {
				let newSpecs = {
					movement: { type: "Automatic", caliber: "", powerReserve: "" },
					case: { diameter: "40 mm", thickness: "", lugToLug: "", material: "Stainless steel" },
					strap: { material: "Bọc da cứng", claspType: "" },
					waterResistance: "3ATM",
					glass: "Sapphire Crystal",
					weight: ""
				};

				// Map các string cũ vào
				if (p.specs[0]) newSpecs.case.diameter = p.specs[0];
				if (p.specs[1]) newSpecs.movement.type = p.specs[1];
				if (p.specs[2]) newSpecs.strap.material = p.specs[2];

				updateQuery.$set.specs = newSpecs;
				needsUpdate = true;
			}

            // Mặc định costPrice (nếu chưa có) = price * 0.7 để giả lập giá nhập
            if (p.costPrice === undefined && p.price) {
                updateQuery.$set.costPrice = Math.round(p.price * 0.7);
                needsUpdate = true;
            }

			if (needsUpdate) {
				await productCollection.updateOne(
					{ _id: p._id },
					updateQuery
				);
				migratedCount++;
				console.log(`Migrated product: ${p.name}`);
			}
		}

		console.log(`\n✅ Migration Complete. ${migratedCount} products updated successfully.`);
		process.exit(0);
	} catch (error) {
		console.error("Migration Failed:", error);
		process.exit(1);
	}
};

migrateSpecsAndBrand();
