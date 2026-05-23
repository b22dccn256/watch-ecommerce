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
  const samples = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    const obj = JSON.parse(line);
    samples.push({ _id: obj._id, slug: obj.slug });
    if (samples.length >= 5) break;
  }

  await connectDB();
  for (const s of samples) {
    const id = (typeof s._id === 'string') ? s._id : (s._id && s._id.$oid ? s._id.$oid : String(s._id));
    const foundById = await Product.findById(id).lean().exec();
    const foundBySlug = s.slug ? await Product.findOne({ slug: s.slug }).lean().exec() : null;
    console.log('Sample id=', id, 'foundById=', !!foundById, 'foundBySlug=', !!foundBySlug, 'slug=', s.slug);
  }
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
