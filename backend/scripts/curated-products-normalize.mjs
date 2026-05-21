import fs from 'fs';
import path from 'path';
import url from 'url';
import mongoose from 'mongoose';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function readFrontendHotBrands() {
  const file = path.resolve(__dirname, '../../frontend/src/pages/BrandsPage.jsx');
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/const\s+HOT_BRANDS\s*=\s*\[([\s\S]*?)\];/);
  if (!m) throw new Error('HOT_BRANDS not found');
  const body = m[1];
  const nameRe = /name\s*:\s*['"]([^'"]+)['"]/g;
  const names = [];
  let r;
  while ((r = nameRe.exec(body)) && names.length < 13) names.push(r[1].trim());
  return names;
}

function slugify(s){
  return s.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9\-]/g,'');
}

function getMongoUri(){
  const envFile = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envFile)) {
    const text = fs.readFileSync(envFile,'utf8');
    const m = text.match(/MONGO_URI\s*=\s*(.+)/);
    if (m) return m[1].trim();
  }
  if (process.env.MONGO_URI) return process.env.MONGO_URI;
  throw new Error('MONGO_URI not found');
}

async function run(){
  const curated = readFrontendHotBrands();
  console.log('Normalizing products for curated brands:', curated);

  const MONGO_URI = getMongoUri();
  await mongoose.connect(MONGO_URI, { autoIndex: false });

  const Product = mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
  const Brand = mongoose.model('Brand', new mongoose.Schema({}, { strict: false }), 'brands');

  // resolve brand ids for curated
  const dbBrands = await Brand.find({ name: { $in: curated } }).lean();
  const brandIdSet = new Set(dbBrands.map(b=>b._id.toString()));

  const products = await Product.find({ 'brand': { $in: dbBrands.map(b=>b._id) } }).lean();

  const exportsDir = path.resolve(__dirname, '../exports');
  if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir,{ recursive: true });
  fs.writeFileSync(path.join(exportsDir,'curated-products-backup-before.json'), JSON.stringify(products, null, 2));

  const updates = [];
  for (const p of products) {
    const upd = {};
    // slug
    if (!p.slug || typeof p.slug !== 'string' || p.slug.trim() === '') upd.slug = slugify(p.name || (p._id?.toString?.()||''));
    // sku
    if (!p.sku || String(p.sku).trim() === '') upd.sku = `SKU-${(p._id||'').toString().slice(-6)}`;
    // images
    if (!Array.isArray(p.images)) upd.images = (p.images ? [p.images] : []);
    if (Array.isArray(p.images) && p.images.length === 0) upd.images = p.images;
    // variants
    if (!Array.isArray(p.variants) || p.variants.length === 0) {
      const price = p.price || (p.priceVariants && p.priceVariants[0]) || 0;
      const variantSku = upd.sku || p.sku || `SKU-${(p._id||'').toString().slice(-6)}`;
      upd.variants = [{ sku: variantSku, price: price || 0, title: p.name || 'Standard', isDefault: true }];
    }
    // ensure isActive true for curated products
    if (p.isActive === false) upd.isActive = true;

    if (Object.keys(upd).length) {
      updates.push({ id: p._id, update: upd });
    }
  }

  // Apply updates with backups per product
  const applied = [];
  for (const u of updates) {
    const before = await Product.findById(u.id).lean();
    await Product.updateOne({ _id: u.id }, { $set: u.update });
    const after = await Product.findById(u.id).lean();
    applied.push({ id: u.id.toString(), before: { slug: before.slug, sku: before.sku, images: before.images, variants: before.variants, isActive: before.isActive }, after: { slug: after.slug, sku: after.sku, images: after.images, variants: after.variants, isActive: after.isActive } });
  }

  fs.writeFileSync(path.join(exportsDir,'curated-products-normalize-report.json'), JSON.stringify({ totalProducts: products.length, updatedCount: applied.length, applied }, null, 2));

  console.log('Normalization complete. Report:', path.join(exportsDir,'curated-products-normalize-report.json'));
  await mongoose.disconnect();
}

run().catch(e=>{ console.error(e); process.exit(1); });
