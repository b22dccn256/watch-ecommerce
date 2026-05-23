import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const OUTPUT_DIR = path.join(__dirname, "..", "exports");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "products_dump.txt");

async function run() {
  try {
    await connectDB();

    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Fetch all products (lean for plain objects)
    const products = await Product.find({}).lean().exec();
    if (!products || products.length === 0) {
      console.log("No products found in DB.");
      await fs.writeFile(OUTPUT_FILE, "[]\n", "utf8");
      console.log(`Wrote empty array to ${OUTPUT_FILE}`);
      process.exit(0);
    }

    // Write JSON Lines for easy inspection and diffing
    const lines = products.map((p) => JSON.stringify(p));
    await fs.writeFile(OUTPUT_FILE, lines.join("\n") + "\n", "utf8");

    console.log(`Exported ${products.length} products to ${OUTPUT_FILE}`);
    process.exit(0);
  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  }
}

run();
