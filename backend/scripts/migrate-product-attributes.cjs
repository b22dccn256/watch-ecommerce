/**
 * Migration v2: Normalize product attributes to match Vietnamese filter labels.
 * Run: node scripts/migrate-product-attributes.cjs
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({}, { strict: false, collection: 'products' });
const Product = mongoose.model('Product', ProductSchema);

// Translation maps for specs → Vietnamese
const STRAP_TRANSLATE = {
  'steel': 'Thép không gỉ', 'stainless steel': 'Thép không gỉ',
  'leather': 'Da', 'rubber': 'Cao su', 'silicone': 'Cao su',
  'nato': 'Vải NATO', 'fabric': 'Vải NATO', 'canvas': 'Vải NATO',
  'ceramic': 'Ceramic', 'titanium': 'Titanium',
  'metal': 'Thép không gỉ', 'resin': 'Nhựa',
};

const CASE_TRANSLATE = {
  'stainless steel': 'Thép không gỉ', 'steel': 'Thép không gỉ',
  'titanium': 'Titanium', 'gold': 'Vàng 18K', '18k gold': 'Vàng 18K',
  'ceramic': 'Ceramic', 'plastic': 'Nhựa', 'resin': 'Nhựa',
  'carbon': 'Carbon', 'bronze': 'Đồng',
};

function translateStrap(val) {
  if (!val) return null;
  const key = val.toLowerCase().trim();
  return STRAP_TRANSLATE[key] || val;
}

function translateCase(val) {
  if (!val) return null;
  const key = val.toLowerCase().trim();
  return CASE_TRANSLATE[key] || val;
}

function normalizeSizes(sizes) {
  if (!Array.isArray(sizes)) return [];
  return sizes.map(s => {
    const str = String(s);
    const mmMatch = str.match(/(\d{2})\s*mm/i);
    if (mmMatch) return mmMatch[0].toLowerCase();
    return str;
  });
}

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const allProducts = await Product.find({ deletedAt: null }).lean();
  console.log(`Total products: ${allProducts.length}`);

  let strapFixed = 0, caseFixed = 0, sizesFixed = 0;

  for (const p of allProducts) {
    const updates = {};

    // Normalize sizes
    if (Array.isArray(p.sizes) && p.sizes.length > 0) {
      const normalized = normalizeSizes(p.sizes);
      if (JSON.stringify(normalized) !== JSON.stringify(p.sizes)) {
        updates.sizes = normalized;
        sizesFixed++;
      }
    }

    // Translate specs.strap.material
    if (p.specs?.strap?.material) {
      const translated = translateStrap(p.specs.strap.material);
      if (translated && translated !== p.specs.strap.material) {
        updates['specs.strap.material'] = translated;
        strapFixed++;
      }
    }

    // Translate specs.case.material
    if (p.specs?.case?.material) {
      const translated = translateCase(p.specs.case.material);
      if (translated && translated !== p.specs.case.material) {
        updates['specs.case.material'] = translated;
        caseFixed++;
      }
    }

    if (Object.keys(updates).length > 0) {
      await Product.updateOne({ _id: p._id }, { $set: updates });
    }
  }

  console.log(`\n=== Migration v2 Complete ===`);
  console.log(`Sizes normalized: ${sizesFixed}`);
  console.log(`Strap translated: ${strapFixed}`);
  console.log(`Case translated: ${caseFixed}`);

  // Verify
  const strapVals = await Product.distinct('specs.strap.material', { deletedAt: null });
  const caseVals = await Product.distinct('specs.case.material', { deletedAt: null });
  const sizeVals = await Product.distinct('sizes', { deletedAt: null });
  const typeVals = await Product.distinct('type', { deletedAt: null });

  console.log('\n=== After Migration ===');
  console.log('Types:', JSON.stringify(typeVals));
  console.log('Strap materials:', JSON.stringify(strapVals));
  console.log('Case materials:', JSON.stringify(caseVals));
  console.log('Sizes sample:', JSON.stringify(sizeVals.slice(0, 10)));

  await mongoose.disconnect();
}

migrate().catch(e => { console.error(e); process.exit(1); });
