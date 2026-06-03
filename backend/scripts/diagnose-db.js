import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function diagnose() {
  await connectDB();
  console.log("Connected to database successfully.\n");

  // 1. Check for product with ID "6" or similar invalid string ID
  console.log("=== Checking for invalid product IDs ===");
  try {
    const invalidDoc = await Product.findOne({ _id: "6" });
    console.log("Found product with ID '6':", invalidDoc);
  } catch (err) {
    console.log(
      "Querying for ID '6' threw error (as expected if Mongoose casts it to ObjectId):",
      err.message,
    );
  }

  // Use raw collection to avoid Mongoose casting to check if there are string IDs
  const rawProducts = Product.collection;
  const docsWithId6 = await rawProducts.find({ _id: "6" }).toArray();
  console.log(
    "Raw query for _id = '6' (without Mongoose casting):",
    docsWithId6,
  );

  const allRawDocs = await rawProducts
    .find({}, { projection: { _id: 1, name: 1 } })
    .toArray();
  console.log(`Total raw products: ${allRawDocs.length}`);
  const nonObjectIdDocs = allRawDocs.filter(
    (doc) =>
      typeof doc._id === "string" ||
      !(doc._id instanceof Object && doc._id.constructor.name === "ObjectId"),
  );
  console.log("Products with non-ObjectId IDs:", nonObjectIdDocs);

  // 2. Find duplicate products by name
  console.log("\n=== Checking for duplicate product names ===");
  const duplicates = await Product.aggregate([
    { $group: { _id: "$name", count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
  ]);
  console.log(`Found ${duplicates.length} duplicate names:`);
  duplicates.forEach((dup) => {
    console.log(
      `- "${dup._id}": count=${dup.count}, ids=${JSON.stringify(dup.ids)}`,
    );
  });

  // 3. Check categories for "Cấu Trúc Danh Mục"
  console.log("\n=== Checking categories ===");
  const categories = await Category.find({});
  console.log(`Total categories: ${categories.length}`);
  categories.forEach((cat) => {
    console.log(
      `- [${cat._id}] ${cat.name} (slug: ${cat.slug}, order: ${cat.order})`,
    );
  });

  // 4. Check user carts for item product ID "6" or string ID
  console.log("\n=== Checking user carts for invalid items ===");
  const users = await User.find({});
  let badCartsFound = 0;
  users.forEach((user) => {
    if (user.cartItems && user.cartItems.length > 0) {
      user.cartItems.forEach((item) => {
        if (item.product) {
          const prodIdStr = String(item.product);
          if (prodIdStr === "6" || prodIdStr.length < 12) {
            console.log(
              `User ${user.email} has bad cart item product ID: "${prodIdStr}"`,
            );
            badCartsFound++;
          }
        }
      });
    }
  });
  console.log(`Found ${badCartsFound} bad cart items in database.`);

  process.exit(0);
}

diagnose().catch((err) => {
  console.error("Diagnosis error:", err);
  process.exit(1);
});
