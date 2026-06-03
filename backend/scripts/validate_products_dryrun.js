import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import readline from "readline";
// Use simple CSV writer to avoid extra dependency

import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";
import Brand from "../models/brand.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function findLatestGenerated() {
  const dir = path.join(__dirname, "..", "exports");
  const files = fs
    .readdirSync(dir)
    .filter(
      (f) => f.startsWith("products_real_market_") && f.endsWith(".jsonl"),
    )
    .map((f) => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

async function run() {
  const input = process.argv[2] || (await findLatestGenerated());
  if (!input || !fs.existsSync(input)) {
    console.error("Input file not found:", input);
    process.exit(1);
  }
  await connectDB();
  const rl = readline.createInterface({
    input: fs.createReadStream(input),
    crlfDelay: Infinity,
  });
  const rows = [];
  let idx = 0;
  for await (const line of rl) {
    if (!line.trim()) continue;
    idx++;
    const obj = JSON.parse(line);
    const name = obj.name || obj.title || "";
    const brandName = obj.brand || "";
    const price = Number(obj.price || 0);
    const stock = Number(obj.stock || 0);
    const type = obj.type || "automatic";

    // Map brand to existing Brand _id (case-insensitive)
    let brandId = null;
    if (brandName) {
      const found = await Brand.findOne({
        name: { $regex: `^${brandName}$`, $options: "i" },
      }).lean();
      if (found) brandId = found._id;
    }

    // Ensure required image exists for validation (use placeholder)
    const image =
      obj.image ||
      (Array.isArray(obj.images) && obj.images[0]) ||
      "https://via.placeholder.com/600x600?text=No+Image";

    const doc = new Product({
      name,
      description: obj.description || name,
      price,
      image,
      images:
        obj.images && Array.isArray(obj.images)
          ? obj.images
          : obj.image
            ? [obj.image]
            : [],
      stock,
      brand: brandId,
      type,
      slug: obj.slug || undefined,
    });

    try {
      await doc.validate();
      rows.push({
        row: idx,
        name,
        brand: brandName,
        price,
        stock,
        type,
        validation: "OK",
        notes: brandId
          ? "Brand mapped"
          : "Brand not found (will create on import)",
      });
    } catch (err) {
      rows.push({
        row: idx,
        name,
        brand: brandName,
        price,
        stock,
        type,
        validation: "ERROR",
        notes: err.message,
      });
    }
  }

  const outDir = path.join(__dirname, "..", "exports");
  const outFile = path.join(
    outDir,
    `products_real_market_preview_${Date.now()}.csv`,
  );
  // Simple CSV serialization
  const headers = [
    "row",
    "name",
    "brand",
    "price",
    "stock",
    "type",
    "validation",
    "notes",
  ];
  const escape = (v) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (s.includes('"') || s.includes(",") || s.includes("\n"))
      return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [r.row, r.name, r.brand, r.price, r.stock, r.type, r.validation, r.notes]
        .map(escape)
        .join(","),
    );
  }
  fs.writeFileSync(outFile, lines.join("\n"));
  console.log("Preview written to", outFile);
  const errors = rows.filter((r) => r.validation === "ERROR").length;
  console.log("Total rows:", rows.length, "Errors:", errors);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
