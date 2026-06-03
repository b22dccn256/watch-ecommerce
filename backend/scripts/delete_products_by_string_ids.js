import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import readline from "readline";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  const backup = path.join(
    __dirname,
    "..",
    "exports",
    "products_backup_1779182660416.jsonl",
  );
  if (!fs.existsSync(backup)) {
    console.error("Backup not found:", backup);
    process.exit(1);
  }
  const rl = readline.createInterface({
    input: fs.createReadStream(backup),
    crlfDelay: Infinity,
  });
  const ids = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    if (!obj._id) continue;
    const idVal =
      typeof obj._id === "string"
        ? obj._id
        : obj._id && obj._id.$oid
          ? obj._id.$oid
          : String(obj._id);
    ids.push(idVal);
  }
  console.log("Collected", ids.length, "ids");
  await connectDB();
  const matched = await Product.countDocuments({ _id: { $in: ids } }).exec();
  console.log("Matched documents:", matched);
  if (matched === 0) {
    console.log("No matching docs to delete.");
    process.exit(0);
  }
  const res = await Product.deleteMany({ _id: { $in: ids } }).exec();
  console.log("Deleted count:", res.deletedCount);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
