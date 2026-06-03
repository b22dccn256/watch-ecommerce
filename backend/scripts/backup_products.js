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
  try {
    await connectDB();
    const products = await Product.find({}).lean().exec();
    const outDir = path.join(__dirname, "..", "exports");
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, `products_backup_${Date.now()}.jsonl`);
    const lines = products.map((p) => JSON.stringify(p));
    await fs.writeFile(outFile, lines.join("\n") + "\n", "utf8");
    console.log(`Backed up ${products.length} products to ${outFile}`);
    process.exit(0);
  } catch (err) {
    console.error("Backup failed:", err);
    process.exit(1);
  }
}

run();
