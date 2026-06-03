/**
 * Seed: Add variety to existing products - diverse strap/case/type values.
 * Run: node scripts/seed-variety.cjs
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {},
  { strict: false, collection: "products" },
);
const Product = mongoose.model("Product", ProductSchema);

const STRAPS = [
  "Da",
  "Thép không gỉ",
  "Cao su",
  "Vải NATO",
  "Ceramic",
  "Titanium",
];
const CASES = ["Thép không gỉ", "Titanium", "Vàng 18K", "Ceramic", "Nhựa"];
const TYPES = [
  "automatic",
  "mechanical",
  "quartz",
  "digital",
  "solar",
  "smartwatch",
];
const SIZES = ["36mm", "38mm", "40mm", "41mm", "42mm", "44mm", "45mm", "46mm+"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const products = await Product.find({ deletedAt: null });
  console.log(`Updating ${products.length} products...`);

  let count = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const updates = {};

    // Rotate through all strap types
    updates["specs.strap.material"] = STRAPS[i % STRAPS.length];
    // Rotate through case materials
    updates["specs.case.material"] = CASES[i % CASES.length];
    // Rotate through types
    updates.type = TYPES[i % TYPES.length];
    // Randomize sizes (2-4 per product)
    const nSizes = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...SIZES].sort(() => Math.random() - 0.5);
    updates.sizes = shuffled
      .slice(0, nSizes)
      .sort((a, b) => parseInt(a) - parseInt(b));

    await Product.updateOne({ _id: p._id }, { $set: updates });
    count++;
  }

  console.log(`Updated ${count} products`);

  // Verify
  const strapVals = await Product.distinct("specs.strap.material", {
    deletedAt: null,
  });
  const caseVals = await Product.distinct("specs.case.material", {
    deletedAt: null,
  });
  const typeVals = await Product.distinct("type", { deletedAt: null });
  const sizeVals = await Product.distinct("sizes", { deletedAt: null });

  console.log("\n=== After Seed ===");
  console.log("Types:", JSON.stringify(typeVals));
  console.log("Straps:", JSON.stringify(strapVals));
  console.log("Cases:", JSON.stringify(caseVals));
  console.log("Sizes:", JSON.stringify(sizeVals));

  await mongoose.disconnect();
  console.log("Done");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
