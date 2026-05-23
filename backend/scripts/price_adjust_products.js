import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from '../lib/db.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Default brand price bounds (min,max)
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
  'tag-heuer': [60000000, 150000000],
  bulova: [5000000, 18000000],
  fossil: [3000000, 8000000],
  garmin: [5000000, 15000000],
  apple: [8000000, 20000000]
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: true, roundTo: 1000, percent: 0, minApply: 0, preview: 20 };
  for (let i=0;i<args.length;i++){
    if (args[i]==='--no-dry-run') opts.dryRun=false;
    if (args[i]==='--dry-run') opts.dryRun=true;
    if (args[i]==='--round' && args[i+1]) opts.roundTo = parseInt(args[++i],10);
    if (args[i]==='--percent' && args[i+1]) opts.percent = parseFloat(args[++i]);
    if (args[i]==='--preview' && args[i+1]) opts.preview = parseInt(args[++i],10);
  }
  return opts;
}

function roundTo(n, base) { return Math.round(n / base) * base; }

async function run() {
  const opts = parseArgs();
  await connectDB();
  const products = await Product.find({}).lean().exec();
  const changes = [];

  for (const p of products) {
    const brandKey = p.brand ? String(p.brand).toLowerCase() : '';
    let minMax = BRAND_BOUNDS[brandKey];
    if (!minMax && p.customAttributes) {
      const ob = (p.customAttributes.find(a=>a.name==='originalBrand')||{}).value;
      if (ob) minMax = BRAND_BOUNDS[String(ob).toLowerCase()];
    }

    let newPrice = p.price;
    // apply percent adjustment if requested
    if (opts.percent !== 0) newPrice = Math.round(newPrice * (1 + opts.percent/100));

    // enforce bounds if available
    if (minMax) {
      if (newPrice < minMax[0]) newPrice = minMax[0];
      if (newPrice > minMax[1]) newPrice = minMax[1];
    }

    // ensure price >= costPrice * 1.05
    if (p.costPrice && newPrice < Math.ceil(p.costPrice * 1.05)) {
      newPrice = Math.ceil(p.costPrice * 1.05);
    }

    // rounding
    newPrice = roundTo(newPrice, opts.roundTo);

    if (newPrice !== p.price) {
      changes.push({ _id: p._id, slug: p.slug, name: p.name, oldPrice: p.price, newPrice });
    }
  }

  console.log(`Found ${changes.length} products with price changes.`);
  const outDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const previewFile = path.join(outDir, `price_changes_preview_${Date.now()}.csv`);
  const w = fs.createWriteStream(previewFile, { flags: 'w' });
  w.write('id,slug,name,oldPrice,newPrice,delta\n');
  for (let i=0;i<Math.min(opts.preview, changes.length); i++) {
    const c = changes[i];
    w.write(`"${c._id}","${(c.slug||'').replace(/"/g,'""')}","${(c.name||'').replace(/"/g,'""')}",${c.oldPrice},${c.newPrice},${c.newPrice-c.oldPrice}\n`);
  }
  w.end();
  console.log(`Wrote preview CSV to ${previewFile}`);

  if (opts.dryRun) {
    console.log('Dry-run mode; no DB changes applied. Re-run with --no-dry-run to apply.');
    process.exit(0);
  }

  // apply updates in batches
  const BATCH = 100;
  for (let i=0;i<changes.length;i+=BATCH) {
    const batch = changes.slice(i,i+BATCH);
    const bulk = batch.map(c => ({ updateOne: { filter: { _id: c._id }, update: { $set: { price: c.newPrice } } } }));
    try {
      const res = await Product.bulkWrite(bulk, { ordered: false });
      console.log(`Applied batch ${i/BATCH+1}:`, res.result ? JSON.stringify(res.result) : res);
    } catch (err) {
      console.error('Bulk update error:', err.message);
    }
  }

  console.log('Price updates applied.');
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
