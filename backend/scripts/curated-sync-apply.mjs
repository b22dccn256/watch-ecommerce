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

function slugify(s){
  return s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
}

function getMongoUri() {
  const envFile = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) {
    const text = fs.readFileSync(envFile, 'utf8');
    const m = text.match(/MONGO_URI\s*=\s*(.+)/);
    if (m) return m[1].trim();
  }
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  throw new Error('MONGO_URI not found');
}

async function run() {
  const curated = readFrontendHotBrands();
  console.log('Applying curated sync for:', curated);

  const MONGO_URI = getMongoUri();
  await mongoose.connect(MONGO_URI, { autoIndex: false });

  const Brand = mongoose.model('Brand', new mongoose.Schema({}, { strict: false }), 'brands');
  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');

  const dbBrands = await Brand.find({}, { name:1 }).lean();
  const curatedLower = curated.map(s=>s.toLowerCase());

  const toCreate = curated.filter(cb => !dbBrands.some(b => (b.name||'').toLowerCase() === cb.toLowerCase()));
  const toDeactivate = dbBrands.filter(b => !curatedLower.includes((b.name||'').toLowerCase()));

  const exportsDir = path.resolve(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir, { recursive: true });

  const backup = {};
  backup.timestamp = new Date().toISOString();
  backup.curated = curated;
  backup.dbBrandsBefore = dbBrands;
  fs.writeFileSync(path.join(exportsDir,'curated-sync-backup-brands-before.json'), JSON.stringify(backup, null, 2));

  // Products affected: outside curated or brandless
  const allProducts = await Product.find({}, { _id:1, name:1, brand:1, isActive:1 }).lean();
  const brandIdNameMap = {};
  for (const b of dbBrands) brandIdNameMap[b._id?.toString?.()||''] = b.name||'';

  const productsOutside = [];
  for (const p of allProducts) {
    const brandId = p.brand ? (p.brand._id ? p.brand._id.toString() : (p.brand.toString ? p.brand.toString() : '')) : '';
    const brandName = brandIdNameMap[brandId] || (p.brand && p.brand.name) || '';
    if (!brandName || !curatedLower.includes(brandName.toLowerCase())) productsOutside.push(p);
  }

  fs.writeFileSync(path.join(exportsDir,'curated-sync-backup-products-affected-before.json'), JSON.stringify({count: productsOutside.length, products: productsOutside.slice(0,500)}, null, 2));

  // Create missing brands
  const createdBrands = [];
  if (toCreate.length) {
    const docs = toCreate.map(name=>({ name, slug: slugify(name), isActive: true, createdAt: new Date() }));
    const res = await Brand.insertMany(docs);
    for (const r of res) createdBrands.push({ id: r._id.toString(), name: r.name });
  }

  // Deactivate non-curated brands
  const deactivateNames = toDeactivate.map(b=>b.name).filter(Boolean);
  const deactivateResult = await Brand.updateMany({ name: { $in: deactivateNames } }, { $set: { isActive: false, updatedAt: new Date() } });

  // Soft-archive products outside curated
  const outsideIds = productsOutside.map(p=>p._id);
  const productUpdateResult = await Product.updateMany({ _id: { $in: outsideIds } }, { $set: { isActive: false, updatedAt: new Date(), archivedBy: 'curated-sync' } });

  const result = {
    createdBrands,
    deactivatedBrandsCount: deactivateResult.modifiedCount || deactivateResult.nModified || deactivateResult.modified || 0,
    productsArchivedCount: productUpdateResult.modifiedCount || productUpdateResult.nModified || 0,
  };

  fs.writeFileSync(path.join(exportsDir,'curated-sync-apply-result.json'), JSON.stringify({ result, timestamp: new Date().toISOString() }, null, 2));

  console.log('Apply complete. Report:', path.join(exportsDir,'curated-sync-apply-result.json'));

  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
