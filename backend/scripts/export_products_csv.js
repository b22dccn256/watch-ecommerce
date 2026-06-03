import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import Product from "../models/product.model.js";
import { connectDB } from "../lib/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  await connectDB();
  const products = await Product.find({}).lean().exec();
  const outDir = path.join(__dirname, "..", "exports");
  await fs.mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, `products_export_${Date.now()}.csv`);
  const headers = [
    "_id",
    "slug",
    "name",
    "price",
    "costPrice",
    "stock",
    "brand",
    "collectionName",
  ];
  const rows = [headers.join(",")];
  for (const p of products) {
    const row = [
      p._id,
      p.slug || "",
      p.name || "",
      p.price || "",
      p.costPrice || "",
      p.stock || "",
      p.brand || "",
      p.collectionName || "",
    ]
      .map((v) => '"' + String(v).replace(/"/g, '""') + '"')
      .join(",");
    rows.push(row);
  }
  await fs.writeFile(outFile, rows.join("\n"), "utf8");
  console.log(`Exported ${products.length} products to ${outFile}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
