import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function checkFields() {
  await connectDB();
  console.log("Connected.");

  const sampleProducts = await Product.find({}).limit(10).lean();
  console.log("=== Checking 10 sample products ===");
  sampleProducts.forEach((p) => {
    console.log(`Product: "${p.name}"`);
    console.log(`  - _id: ${p._id}`);
    console.log(`  - categoryId: ${p.categoryId}`);
    console.log(`  - category (legacy string): ${p.category}`);
    console.log(`  - keys: ${Object.keys(p).join(", ")}`);
    console.log("---");
  });

  // Count products with categoryId vs legacy category
  const countWithCategoryId = await Product.countDocuments({
    categoryId: { $exists: true, $ne: null },
  });
  const countWithLegacyCategory = await Product.collection.countDocuments({
    category: { $exists: true, $ne: null },
  });

  console.log(`\nStatistics:`);
  console.log(`- Products with categoryId: ${countWithCategoryId}`);
  console.log(`- Products with legacy category: ${countWithLegacyCategory}`);

  process.exit(0);
}

checkFields().catch((err) => {
  console.error(err);
  process.exit(1);
});
