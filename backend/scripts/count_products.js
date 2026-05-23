import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/db.js';
import Product from '../models/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  await connectDB();
  const c = await Product.countDocuments({}).exec();
  console.log('Products count:', c);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
