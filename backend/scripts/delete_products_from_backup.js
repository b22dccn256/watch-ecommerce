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

function parseArgs(){
  const args = process.argv.slice(2);
  const opts = { dryRun: false, file: null };
  for (let i=0;i<args.length;i++){
    if (args[i]==='--dry-run') opts.dryRun=true;
    if (args[i]==='--file' && args[i+1]) opts.file = args[++i];
  }
  return opts;
}

async function findLatestBackup(dir){
  const files = await fs.promises.readdir(dir);
  const backups = files.filter(f=>/^products_backup_\d+\.jsonl$/.test(f));
  if (backups.length===0) return null;
  backups.sort();
  return path.join(dir, backups[backups.length-1]);
}

async function run(){
  const opts = parseArgs();
  const exportsDir = path.join(__dirname, '..', 'exports');
  let filePath = opts.file ? (path.isAbsolute(opts.file)?opts.file:path.join(__dirname,'..',opts.file)) : await findLatestBackup(exportsDir);
  if (!filePath || !fs.existsSync(filePath)) {
    console.error('Backup file not found. Looked for:', filePath);
    process.exit(1);
  }

  console.log('Using backup file:', filePath);
  const rl = readline.createInterface({ input: fs.createReadStream(filePath), crlfDelay: Infinity });
  const ids = [];
  for await (const line of rl) {
    if (!line.trim()) continue;
    let obj;
    try { obj = JSON.parse(line); } catch (e) { continue; }
    if (!obj._id) continue;
    let idVal = null;
    if (typeof obj._id === 'string') idVal = obj._id;
    else if (obj._id && typeof obj._id === 'object') {
      if (obj._id.$oid) idVal = obj._id.$oid;
      else if (obj._id.toString) idVal = String(obj._id);
    }
    if (idVal) ids.push(idVal);
  }

  console.log('Collected', ids.length, 'ids from backup.');
  if (ids.length === 0) { console.error('No IDs found, aborting.'); process.exit(1); }

  await connectDB();
  // ensure casting to ObjectId where possible
  const objectIds = ids.map(i => { try { return mongoose.Types.ObjectId(String(i)); } catch(e){ return null; } }).filter(Boolean);
  const matched = await Product.countDocuments({ _id: { $in: objectIds } }).exec();
  console.log('Matching products currently in DB:', matched);
  if (matched === 0) {
    console.log('No matching products found to delete. Aborting.');
    process.exit(0);
  }

  if (opts.dryRun) { console.log('Dry-run enabled — no deletion performed.'); process.exit(0); }

  const res = await Product.deleteMany({ _id: { $in: objectIds } }).exec();
  console.log('Deleted count:', res.deletedCount);
  process.exit(0);
}

run().catch(err=>{ console.error('Delete failed:', err); process.exit(1); });
