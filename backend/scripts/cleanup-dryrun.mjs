#!/usr/bin/env node
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const MONGO = process.env.MONGO_URI || process.env.MONGOURL;
if (!MONGO) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

await mongoose.connect(MONGO, { family: 4 });
console.log("Connected to MongoDB (dry-run cleanup)");

const Product = (await import("../models/product.model.js")).default;

function completenessScore(doc) {
  let score = 0;
  if (doc.image) score += 2;
  if (doc.images && doc.images.length > 0) score += 2;
  if (doc.price) score += 2;
  if (doc.sku) score += 1;
  if (doc.brand) score += 1;
  if (doc.categoryId) score += 1;
  return score;
}

const duplicateNames = await Product.aggregate([
  {
    $group: {
      _id: { $toLower: "$name" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $limit: 100 },
]);

const suggestions = {
  timestamp: new Date().toISOString(),
  duplicateNameGroups: [],
};

for (const g of duplicateNames) {
  const docs = await Product.find({ _id: { $in: g.ids } }).lean();
  docs.forEach((d) => (d._score = completenessScore(d)));
  docs.sort((a, b) => b._score - a._score);
  const keep = docs[0];
  const remove = docs.slice(1).map((d) => ({ id: d._id, score: d._score }));
  suggestions.duplicateNameGroups.push({
    nameKey: g._id,
    keep: { id: keep._id, score: keep._score },
    remove,
  });
}

// Duplicate SKUs
const duplicateSKUs = await Product.aggregate([
  { $match: { sku: { $ne: null, $ne: "" } } },
  {
    $group: {
      _id: { $toLower: "$sku" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $limit: 100 },
]);
suggestions.duplicateSKUGroups = [];
for (const g of duplicateSKUs) {
  const docs = await Product.find({ _id: { $in: g.ids } }).lean();
  docs.forEach((d) => (d._score = completenessScore(d)));
  docs.sort((a, b) => b._score - a._score);
  const keep = docs[0];
  const remove = docs.slice(1).map((d) => ({ id: d._id, score: d._score }));
  suggestions.duplicateSKUGroups.push({
    skuKey: g._id,
    keep: { id: keep._id, score: keep._score },
    remove,
  });
}

// Missing category: suggest categories by tag match (very rough)
const Category = (await import("../models/category.model.js")).default;
const categories = await Category.find().select("name _id").lean();
const missingCat = await Product.find({
  $or: [{ categoryId: { $exists: false } }, { categoryId: null }],
})
  .limit(200)
  .select("name _id tags")
  .lean();
suggestions.assignCategorySuggestions = [];
for (const p of missingCat) {
  const name = (p.name || "").toLowerCase();
  let matched = null;
  for (const c of categories) {
    if (name.includes((c.name || "").toLowerCase())) {
      matched = c;
      break;
    }
  }
  suggestions.assignCategorySuggestions.push({
    id: p._id,
    name: p.name,
    suggestedCategory: matched ? { id: matched._id, name: matched.name } : null,
  });
}

const outPath = path.join(
  process.cwd(),
  "backend",
  "exports",
  "cleanup-suggestions.json",
);
fs.writeFileSync(outPath, JSON.stringify(suggestions, null, 2));
console.log("Wrote dry-run suggestions to", outPath);

await mongoose.disconnect();
console.log("Dry-run complete. No changes were made.");
