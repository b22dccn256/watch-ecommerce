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
  const doc = {
    name: 'TEST INSERT ' + Date.now(),
    description: 'Test',
    price: 1000,
    costPrice: 600,
    image: 'https://picsum.photos/200/200',
    stock: 10,
    type: 'quartz'
  };
  try {
    const r = await Product.create(doc);
    console.log('Inserted id', r._id.toString());
  } catch (err) {
    console.error('Insert error:', err.message);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
