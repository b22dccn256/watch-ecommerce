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

async function run() {
  const filePath = path.join(__dirname, '..', 'exports', 'products_fixed_500.txt');
  if (!fs.existsSync(filePath)) { console.error('File not found:', filePath); process.exit(1); }
  await connectDB();

  // build brand map
  let brandMap = {};
  try {
    const Brand = mongoose.models.Brand || (await import('../models/brand.model.js')).default;
    const brands = await Brand.find({}).lean().exec();
    brands.forEach(b => { if (b.slug) brandMap[b.slug] = b._id.toString(); if (b.name) brandMap[b.name.toLowerCase()] = b._id.toString(); });
    console.log('Loaded', Object.keys(brandMap).length, 'brands');
  } catch (err) {
    console.log('No brands available; proceeding with slugs');
  }

  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
  const docs = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    let doc = JSON.parse(line);
    if (doc.brand && typeof doc.brand === 'string') {
      const bkey = doc.brand.toString();
      if (brandMap[bkey]) doc.brand = brandMap[bkey]; else if (brandMap[bkey.toLowerCase()]) doc.brand = brandMap[bkey.toLowerCase()]; else { doc.customAttributes = doc.customAttributes || []; doc.customAttributes.push({ name: 'originalBrand', value: String(doc.brand) }); delete doc.brand; }
    }
    if (doc._id && !/^[a-fA-F0-9]{24}$/.test(String(doc._id))) delete doc._id;
    if (doc.type) doc.type = String(doc.type).toLowerCase();
    docs.push(doc);
  }

  console.log('Prepared', docs.length, 'documents. Inserting...');
  try {
    const res = await Product.insertMany(docs, { ordered: false });
    console.log('Inserted', res.length, 'documents');
  } catch (err) {
    console.error('insertMany error:', err.message);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
