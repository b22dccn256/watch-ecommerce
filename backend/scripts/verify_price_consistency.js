import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { connectDB } from "../lib/db.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const BRAND_BOUNDS = {
  rolex: [150000000, 500000000],
  omega: [80000000, 200000000],
  seiko: [3000000, 25000000],
  casio: [1000000, 15000000],
  tissot: [8000000, 40000000],
  longines: [30000000, 80000000],
  hamilton: [12000000, 25000000],
  orient: [3500000, 12000000],
  citizen: [4000000, 20000000],
  iwc: [100000000, 300000000],
  "tag-heuer": [60000000, 150000000],
  bulova: [5000000, 18000000],
  fossil: [3000000, 8000000],
  garmin: [5000000, 15000000],
  apple: [8000000, 20000000],
};

function numeric(v) {
  return typeof v === "number" ? v : v ? Number(v) : 0;
}

async function run() {
  await connectDB();
  // load brand map if available
  let brandMap = {};
  try {
    const Brand =
      mongoose.models.Brand ||
      (await import("../models/brand.model.js")).default;
    const brands = await Brand.find({}).lean().exec();
    brands.forEach((b) => {
      if (b.slug) brandMap[b.slug] = b._id.toString();
      if (b.name) brandMap[b.name.toLowerCase()] = b._id.toString();
    });
  } catch (e) {}

  const products = await Product.find({}).lean().exec();
  const issues = [];
  for (const p of products) {
    const price = numeric(p.price);
    const cost = numeric(p.costPrice);
    const minCost = Math.ceil(cost * 1.05);
    let brandKey = "";
    if (p.brand && typeof p.brand === "string")
      brandKey = p.brand.toLowerCase();
    else if (p.customAttributes) {
      const ob = (
        p.customAttributes.find((a) => a.name === "originalBrand") || {}
      ).value;
      if (ob) brandKey = String(ob).toLowerCase();
    }

    const bounds = BRAND_BOUNDS[brandKey];
    const minAllowed = bounds ? Math.max(bounds[0], minCost) : minCost;
    const maxAllowed = bounds ? bounds[1] : null;

    if (price < minAllowed || (maxAllowed !== null && price > maxAllowed)) {
      issues.push({
        _id: p._id,
        slug: p.slug || "",
        name: p.name || "",
        price,
        cost,
        minAllowed,
        maxAllowed,
      });
    }
  }

  const outDir = path.join(__dirname, "..", "exports");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `price_issues_${Date.now()}.csv`);
  const w = fs.createWriteStream(outFile, { flags: "w" });
  w.write("id,slug,name,price,cost,minAllowed,maxAllowed\n");
  for (const it of issues) {
    w.write(
      `"${it._id}","${it.slug.replace(/"/g, '""')}","${(it.name || "").replace(/"/g, '""')}",${it.price},${it.cost},${it.minAllowed},${it.maxAllowed === null ? "" : it.maxAllowed}\n`,
    );
  }
  w.end();

  console.log(
    `Checked ${products.length} products — issues found: ${issues.length}. Report: ${outFile}`,
  );
  if (issues.length > 0) console.log("First 10 issues:", issues.slice(0, 10));
  process.exit(0);
}

run().catch((err) => {
  console.error("Verify failed:", err);
  process.exit(1);
});
