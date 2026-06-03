import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.model.js";
import Campaign from "../models/campaign.model.js";
import Brand from "../models/brand.model.js";

dotenv.config();

async function sync() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("🔗 Connected, syncing indexes...\n");

  // Sync all model indexes
  const models = [
    { name: "Product", model: Product },
    { name: "Campaign", model: Campaign },
    { name: "Brand", model: Brand },
  ];

  for (const { name, model } of models) {
    try {
      await model.createIndexes();
      console.log(`✅ ${name} indexes synced`);
    } catch (e) {
      console.error(`❌ ${name} failed:`, e.message);
    }
  }

  console.log("\n🎉 Done!");
  await mongoose.disconnect();
}

sync().catch((e) => {
  console.error(e);
  process.exit(1);
});
