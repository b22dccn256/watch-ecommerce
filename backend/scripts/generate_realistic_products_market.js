import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { connectDB } from '../lib/db.js';
import Product from '../models/product.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BRAND_MODELS = {
  rolex: ['Submariner', 'Datejust', 'Daytona', 'GMT-Master II', 'Oyster Perpetual', 'Explorer', 'Sea-Dweller'],
  omega: ['Speedmaster Professional', 'Seamaster Diver 300M', 'Constellation', 'De Ville', 'Seamaster Planet Ocean'],
  tudor: ['Black Bay Fifty-Eight', 'Pelagos', 'Black Bay GMT', 'Glamour'],
  'tag-heuer': ['Carrera', 'Monaco', 'Aquaracer', 'Formula 1'],
  seiko: ['Prospex Diver', 'Presage Cocktail Time', 'Prospex Alpinist', 'Presage'],
  casio: ['G-Shock GW-9400', 'Edifice', 'Pro Trek'],
  breitling: ['Navitimer', 'Superocean', 'Chronomat'],
  longines: ['HydroConquest', 'Master Collection', 'Conquest'],
  'patek-philippe': ['Nautilus', 'Aquanaut', 'Calatrava'],
  'audemars-piguet': ['Royal Oak', 'Royal Oak Offshore'],
  hublot: ['Big Bang', 'Classic Fusion'],
  iwc: ['Portugieser', "Pilot's Watch", 'Ingenieur'],
  panerai: ['Luminor', 'Radiomir']
};

const BRAND_FULL = {
  rolex: 'Rolex', omega: 'Omega', tudor: 'Tudor', 'tag-heuer': 'TAG Heuer', seiko: 'Seiko', casio: 'Casio', breitling: 'Breitling', longines: 'Longines', 'patek-philippe': 'Patek Philippe', 'audemars-piguet': 'Audemars Piguet', hublot: 'Hublot', iwc: 'IWC', panerai: 'Panerai'
};

function slugify(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function priceForBrand(slug){
  const map = { rolex: 40000000, omega: 15000000, tudor: 8000000, 'tag-heuer': 7000000, seiko: 3000000, casio: 500000, breitling:12000000, longines:4000000, 'patek-philippe':70000000, 'audemars-piguet':80000000, hublot:25000000, iwc:12000000, panerai:10000000 };
  return map[slug] || 2000000;
}

async function run(){
  await connectDB();
  const outDir = path.join(__dirname, '..', 'exports');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `products_real_market_${Date.now()}.jsonl`);
  const ws = fs.createWriteStream(outFile, { flags: 'w' });

  const target = 500;
  const items = new Set();
  const brands = Object.keys(BRAND_MODELS);
  while (items.size < target) {
    const b = brands[Math.floor(Math.random()*brands.length)];
    const model = BRAND_MODELS[b][Math.floor(Math.random()*BRAND_MODELS[b].length)];
    const ref = Math.floor(100 + Math.random()*900);
    const title = `${BRAND_FULL[b]} ${model} ${ref}`;
    if (items.has(title)) continue;
    items.add(title);
    const priceBase = priceForBrand(b);
    const price = Math.round(priceBase * (0.6 + Math.random()*1.4));
    const slug = slugify(title) + '-' + Math.random().toString(36).substring(2,6);
    const doc = {
      name: title,
      title,
      slug,
      brand: BRAND_FULL[b],
      price,
      currency: 'VND',
      description: `${title} — chính hãng, bộ máy chất lượng, chống nước tiêu chuẩn.`,
      images: [],
      image: '',
      categories: [],
      stock: Math.floor(Math.random()*30)+1,
      type: 'automatic',
      isActive: true
    };
    ws.write(JSON.stringify(doc) + '\n');
  }
  ws.end();
  console.log('Wrote', outFile);
}

run().catch(err=>{ console.error(err); process.exit(1); });
