import fs from 'fs';
import path from 'path';
import url from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function readFrontendHotBrands() {
  const file = path.resolve(__dirname, '../../frontend/src/pages/BrandsPage.jsx');
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/const\s+HOT_BRANDS\s*=\s*\[([\s\S]*?)\];/);
  if (!m) throw new Error('HOT_BRANDS not found in BrandsPage.jsx');
  const body = m[1];
  const nameRe = /name\s*:\s*['"]([^'"]+)['"]/g;
  const names = [];
  let r;
  while ((r = nameRe.exec(body)) && names.length < 13) {
    names.push(r[1].trim());
  }
  return names;
}

function getMongoUri() {
  // fallback to backend/.env parse
  const envFile = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) {
    const text = fs.readFileSync(envFile, 'utf8');
    const m = text.match(/MONGO_URI\s*=\s*(.+)/);
    if (m) return m[1].trim();
  }
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  throw new Error('MONGO_URI not found in env or process.env');
}

async function run() {
  const curated = readFrontendHotBrands();
  console.log('Curated brands (first 13):', curated);

  const MONGO_URI = getMongoUri();
  await mongoose.connect(MONGO_URI, { autoIndex: false });

  const Brand = mongoose.model('Brand', new mongoose.Schema({}, { strict: false }), 'brands');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

  const dbBrands = await Brand.find({}, { name: 1, _id: 1, isActive: 1 }).lean();
  const brandNames = dbBrands.map(b => ({ id: b._id.toString(), name: b.name, isActive: b.isActive }));

  const curatedLower = curated.map(s => s.toLowerCase());

  const toKeep = [];
  const toCreate = [];
  const toDeactivate = [];

  for (const cb of curated) {
    const found = dbBrands.find(b => b.name && b.name.toLowerCase() === cb.toLowerCase());
    if (found) toKeep.push({ id: found._id.toString(), name: found.name, isActive: !!found.isActive });
    else toCreate.push({ name: cb });
  }

  for (const b of dbBrands) {
    if (!curatedLower.includes((b.name||'').toLowerCase())) {
      toDeactivate.push({ id: b._id.toString(), name: b.name, isActive: !!b.isActive });
    }
  }

  // Products impact
  const allProducts = await Product.find({}, { _id: 1, name: 1, brand: 1, isActive: 1 }).lean();
  const productImpact = { outsideCurated: [], curatedButInactive: [] };

  const brandIdNameMap = {};
  for (const b of dbBrands) brandIdNameMap[b._id.toString()] = b.name || '';

  for (const p of allProducts) {
    const brandId = p.brand ? (p.brand._id ? p.brand._id.toString() : (p.brand.toString ? p.brand.toString() : '')) : '';
    const brandName = brandIdNameMap[brandId] || (p.brand && p.brand.name) || '';
    if (!brandName) {
      // brand-less product
      productImpact.outsideCurated.push({ id: p._id.toString(), name: p.name, brand: null, isActive: !!p.isActive });
      continue;
    }
    if (!curatedLower.includes(brandName.toLowerCase())) {
      productImpact.outsideCurated.push({ id: p._id.toString(), name: p.name, brand: brandName, isActive: !!p.isActive });
    } else if (!p.isActive) {
      productImpact.curatedButInactive.push({ id: p._id.toString(), name: p.name, brand: brandName, isActive: !!p.isActive });
    }
  }

  const report = {
    curated,
    existingBrandsCount: dbBrands.length,
    toKeepCount: toKeep.length,
    toCreateCount: toCreate.length,
    toDeactivateCount: toDeactivate.length,
    toKeep,
    toCreate,
    toDeactivateSample: toDeactivate.slice(0, 200),
    productImpactSummary: {
      totalProducts: allProducts.length,
      outsideCuratedCount: productImpact.outsideCurated.length,
      curatedButInactiveCount: productImpact.curatedButInactive.length,
    },
  };

  const exportsDir = path.resolve(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });
  const outPath = path.join(exportsDir, 'curated-sync-dryrun.json');
  fs.writeFileSync(outPath, JSON.stringify({ report, productImpact: productImpact }, null, 2), 'utf8');
  console.log('Dry-run report written to', outPath);

  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
