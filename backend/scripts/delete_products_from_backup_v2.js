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

async function run(){
  const backup = path.join(__dirname, '..', 'exports', 'products_backup_1779182660416.jsonl');
  if (!fs.existsSync(backup)) { console.error('Backup not found:', backup); process.exit(1); }
  const rl = readline.createInterface({ input: fs.createReadStream(backup), crlfDelay: Infinity });
  const ids = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    if (!obj._id) continue;
    let idVal = null;
    if (typeof obj._id === 'string') idVal = obj._id;
    else if (obj._id && obj._id.$oid) idVal = obj._id.$oid;
    else idVal = String(obj._id);
    if (idVal) ids.push(idVal);
  }

  console.log('Collected ids:', ids.length);
  await connectDB();

  const objectIds = [];
  for (let i=0;i<ids.length;i++){
    try { objectIds.push(mongoose.Types.ObjectId(ids[i])); }
    catch(e){ console.warn('Invalid id skipped:', ids[i]); }
    if (i<5) console.log('sample id', i+1, ids[i]);
  }

  const matchedCount = await Product.countDocuments({ _id: { $in: objectIds } }).exec();
  console.log('Matched in DB:', matchedCount);

  if (matchedCount === 0) {
    console.error('No matches found, aborting deletion.');
    process.exit(1);
  }

  const res = await Product.deleteMany({ _id: { $in: objectIds } }).exec();
  console.log('Deleted count:', res.deletedCount);
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
