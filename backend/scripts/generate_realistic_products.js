import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from '../lib/db.js';
import Product from '../models/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BRANDS = [
  { name: 'Rolex', slug: 'rolex' },
  { name: 'Omega', slug: 'omega' },
  { name: 'Tudor', slug: 'tudor' },
  { name: 'Tag Heuer', slug: 'tag-heuer' },
  { name: 'Seiko', slug: 'seiko' },
  { name: 'Casio', slug: 'casio' },
  { name: 'Breitling', slug: 'breitling' },
  { name: 'Longines', slug: 'longines' },
  { name: 'Patek Philippe', slug: 'patek-philippe' },
  { name: 'Audemars Piguet', slug: 'audemars-piguet' },
  { name: 'Hublot', slug: 'hublot' },
  { name: 'IWC', slug: 'iwc' },
  { name: 'Panerai', slug: 'panerai' }
];

const MODEL_KEYWORDS = ['Automatic','Chronograph','Explorer','Submariner','Perpetual','Daytona','Oyster','GMT-Master','Seamaster','Speedmaster','Aqua','Diver','Classic','Limited','Heritage'];

function rnd(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function genSlug(title){ return title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function formatPrice(v){ return Math.round(v); }

async function run(){
  await connectDB();
  const total = await Product.countDocuments();
  const outDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `products_realistic_${Date.now()}.jsonl`);
  const ws = fs.createWriteStream(outFile, { flags: 'w' });
  console.log('DB products count:', total);
  for (let i=0;i<total;i++){
    const brand = rnd(BRANDS);
    const model = `Model ${Math.floor(100 + Math.random()*900)}`;
    const keyword = rnd(MODEL_KEYWORDS);
    const title = `${brand.name} ${keyword} ${model}`;
    const priceBase = {
      'rolex': 30000000,
      'omega': 15000000,
      'tudor': 8000000,
      'tag-heuer': 7000000,
      'seiko': 2000000,
      'casio': 500000,
      'breitling': 12000000,
      'longines': 4000000,
      'patek-philippe': 60000000,
      'audemars-piguet': 70000000,
      'hublot': 25000000,
      'iwc': 13000000,
      'panerai': 10000000
    }[brand.slug] || 2000000;
    const variance = 0.5 + Math.random()*1.5; // 0.5x - 2.0x
    const price = formatPrice(priceBase * variance);
    const slug = genSlug(title + '-' + i);
    const doc = {
      title,
      slug,
      brand: brand.name,
      price,
      currency: 'VND',
      description: `${title} - high quality wristwatch. Materials: stainless steel. Movement: automatic.`,
      images: [],
      categories: [],
      stock: Math.floor(Math.random()*50)+1,
      isActive: true
    };
    ws.write(JSON.stringify(doc) + '\n');
  }
  ws.end();
  console.log('Wrote', outFile);
}

run().catch(err=>{ console.error(err); process.exit(1); });
