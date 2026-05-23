import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';
import { connectDB } from '../lib/db.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { file: 'exports/products_fixed_500.txt', dryRun: true, preview: 10, batch: 100 };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--file' && args[i+1]) opts.file = args[++i];
    if (a === '--no-dry-run') opts.dryRun = false;
    if (a === '--dry-run') opts.dryRun = true;
    if (a === '--preview' && args[i+1]) opts.preview = parseInt(args[++i], 10);
    if (a === '--batch' && args[i+1]) opts.batch = parseInt(args[++i], 10);
  }
  return opts;
}

async function run() {
  const opts = parseArgs();
  const filePath = path.isAbsolute(opts.file) ? opts.file : path.join(__dirname, '..', opts.file.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) { console.error('File not found:', filePath); process.exit(1); }
  await connectDB();

  // build brand slug -> id map from brands collection if exists
  let brandMap = {};
  try {
    const Brand = mongoose.models.Brand || (await import('../models/brand.model.js')).default;
    const brands = await Brand.find({}).lean().exec();
    brands.forEach(b => { if (b.slug) brandMap[b.slug] = b._id.toString(); if (b.name) brandMap[b.name.toLowerCase()] = b._id.toString(); });
    console.log('Loaded', Object.keys(brandMap).length, 'brands for mapping');
  } catch (err) {
    console.log('No brands collection found or failed to load brands; brand slugs will be preserved as-is.');
  }

  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
  const ops = [];
  let lines = 0;
  const slugs = [];

  for await (const line of rl) {
    if (!line.trim()) continue;
    lines++;
    let doc;
    try { doc = JSON.parse(line); } catch (err) { console.error('Skipping invalid JSON at line', lines); continue; }

    // map brand slug to ObjectId if possible
    if (doc.brand && typeof doc.brand === 'string') {
      const bkey = doc.brand.toString();
      if (brandMap[bkey]) {
        doc.brand = brandMap[bkey];
      } else if (brandMap[bkey.toLowerCase()]) {
        doc.brand = brandMap[bkey.toLowerCase()];
      } else {
        // keep slug in customAttributes
        doc.customAttributes = doc.customAttributes || [];
        doc.customAttributes.push({ name: 'originalBrand', value: String(doc.brand) });
        delete doc.brand;
      }
    }

    // remove any non-ObjectId _id
    if (doc._id && !/^[a-fA-F0-9]{24}$/.test(String(doc._id))) delete doc._id;

    // normalize type
    if (doc.type) doc.type = String(doc.type).toLowerCase();

    // prepare update
    const slug = doc.slug || (`prod-${Math.random().toString(36).slice(2,9)}`);
    slugs.push(slug);
    const update = { $set: { ...doc, slug } };
    // do not set createdAt/updatedAt from import to avoid tampering
    delete update.$set.createdAt;
    delete update.$set.updatedAt;

    ops.push({ updateOne: { filter: { slug }, update, upsert: true } });
  }

  console.log(`Prepared ${ops.length} upsert operations (from ${lines} lines).`);

  // preview
  if (opts.preview > 0) {
    console.log(`Preview first ${Math.min(opts.preview, ops.length)} operations:`);
    for (let i = 0; i < Math.min(opts.preview, ops.length); i++) {
      const u = ops[i].updateOne;
      const s = u.filter.slug;
      const name = u.update.$set.name;
      const price = u.update.$set.price;
      console.log(`#${i+1} slug=${s} name="${String(name).slice(0,60)}" price=${price}`);
    }
  }

  if (opts.dryRun) {
    // determine how many would be updates vs inserts
    const existing = await Product.find({ slug: { $in: slugs } }).select('slug').lean().exec();
    const existingSet = new Set(existing.map(e => e.slug));
    let wouldUpdate = 0, wouldInsert = 0;
    for (const op of ops) {
      const s = op.updateOne.filter.slug;
      if (existingSet.has(s)) wouldUpdate++; else wouldInsert++;
    }
    console.log(`Dry-run: would update ${wouldUpdate} products, insert ${wouldInsert} new products.`);
    process.exit(0);
  }

  // execute in batches
  const B = opts.batch || 100;
  for (let i = 0; i < ops.length; i += B) {
    const batch = ops.slice(i, i+B);
    try {
      const res = await Product.bulkWrite(batch, { ordered: false });
      console.log(`Batch ${i/B + 1}: result`, res.result ? JSON.stringify(res.result) : res);
    } catch (err) {
      console.error('Bulk write error:', err.message);
    }
  }

  console.log('Import finished.');
  process.exit(0);
}

run().catch(err => { console.error('Unexpected error:', err); process.exit(1); });
