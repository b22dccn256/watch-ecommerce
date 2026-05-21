#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

let MONGO = process.env.MONGO_URI || process.env.MONGOURL || process.env.MONGODB_URI;
if (!MONGO) {
  // Try to read backend/.env directly as a fallback
  try {
    const fs = await import('fs');
    let envPath = new URL('../.env', import.meta.url).pathname;
    if (!fs.existsSync(envPath)) {
      envPath = path.join(process.cwd(), 'backend', '.env');
    }
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.split(/\r?\n/).find(l => l.startsWith('MONGO_URI='));
      if (match) {
        const idx = match.indexOf('=');
        MONGO = match.slice(idx + 1).trim();
      }
    }
  } catch (e) {
    // ignore
  }
  if (!MONGO) {
    console.error('MONGO_URI not set. Set env or ensure backend/.env contains MONGO_URI');
    process.exit(1);
  }
}

await mongoose.connect(MONGO, { family: 4 });
console.log('Connected to MongoDB for audit');

const Product = (await import('../models/product.model.js')).default;
const Brand = (await import('../models/brand.model.js')).default;
const Coupon = (await import('../models/coupon.model.js')).default;

async function run() {
  const report = {};

  report.productCount = await Product.countDocuments();

  report.duplicateSKUs = await Product.aggregate([
    { $match: { sku: { $ne: null, $ne: "" } } },
    { $group: { _id: { $toLower: "$sku" }, count: { $sum: 1 }, ids: { $push: "$_id" } } },
    { $match: { count: { $gt: 1 } } },
    { $project: { sku: '$_id', count: 1, ids: 1, _id: 0 } },
    { $limit: 50 }
  ]).catch(e => { console.error('dup sku aggregate failed', e.message); return []; });

  report.duplicateNames = await Product.aggregate([
    { $group: { _id: { $toLower: '$name' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $project: { name: '$_id', count: 1, ids: 1, _id: 0 } },
    { $limit: 50 }
  ]).catch(() => []);

  report.missingImage = await Product.find({ $or: [{ image: { $exists: false } }, { image: '' }, { images: { $exists: true, $size: 0 } }] }).limit(50).select('name _id image images').lean();

  report.softDeletedCount = await Product.countDocuments({ deletedAt: { $ne: null } });
  report.activeWithDeletedAt = await Product.find({ isActive: true, deletedAt: { $ne: null } }).limit(50).select('name _id deletedAt isActive').lean();
  report.inactiveNotDeleted = await Product.find({ isActive: false, deletedAt: null }).limit(50).select('name _id isActive deletedAt').lean();

  report.zeroStockActive = await Product.find({ stock: { $lte: 0 }, isActive: true }).limit(50).select('name _id stock isActive').lean();

  report.missingBrand = await Product.find({ $or: [{ brand: { $exists: false } }, { brand: null }] }).limit(50).select('name _id brand').lean();
  report.missingCategory = await Product.find({ $or: [{ categoryId: { $exists: false } }, { categoryId: null }] }).limit(50).select('name _id categoryId').lean();

  report.duplicateSlugs = await Product.aggregate([
    { $match: { slug: { $ne: null, $ne: '' } } },
    { $group: { _id: '$slug', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $project: { slug: '$_id', count: 1, ids: 1, _id: 0 } },
    { $limit: 50 }
  ]).catch(() => []);

  report.negativePrice = await Product.find({ $or: [{ price: { $lt: 0 } }, { price: { $exists: false } }] }).limit(50).select('name _id price').lean();

  // Brands
  report.brandCount = await Brand.countDocuments();
  const brandsWithoutProducts = await Brand.aggregate([
    { $lookup: { from: 'products', localField: '_id', foreignField: 'brand', as: 'products' } },
    { $addFields: { productsCount: { $size: '$products' } } },
    { $match: { productsCount: 0 } },
    { $project: { name: 1, productsCount: 1 } },
    { $limit: 50 }
  ]).catch(() => []);
  report.brandsWithoutProducts = brandsWithoutProducts;

  // Coupons
  report.couponCount = await Coupon.countDocuments();
  report.expiredActiveCoupons = await Coupon.find({ expirationDate: { $lt: new Date() }, isActive: true }).limit(50).select('code expirationDate isActive').lean();
  report.couponsOverused = await Coupon.find({ $expr: { $gt: ['$usedCount', '$maxUses'] } }).limit(50).select('code usedCount maxUses').lean();

  console.log('\n=== AUDIT REPORT SUMMARY ===');
  console.log('Total products:', report.productCount);
  console.log('Soft-deleted products:', report.softDeletedCount);
  console.log('Products with missing image (sample):', report.missingImage.length);
  console.log('Duplicate SKUs (sample):', report.duplicateSKUs.length);
  console.log('Duplicate names (sample):', report.duplicateNames.length);
  console.log('Products with zero stock but active (sample):', report.zeroStockActive.length);
  console.log('Products missing brand (sample):', report.missingBrand.length);
  console.log('Products missing category (sample):', report.missingCategory.length);
  console.log('Duplicate slugs (sample):', report.duplicateSlugs.length);
  console.log('Negative or missing prices (sample):', report.negativePrice.length);
  console.log('Brands count:', report.brandCount);
  console.log('Brands without products (sample):', report.brandsWithoutProducts.length);
  console.log('Coupons total:', report.couponCount);
  console.log('Expired but active coupons (sample):', report.expiredActiveCoupons.length);
  console.log('Coupons with usedCount > maxUses (sample):', report.couponsOverused.length);

  // Write sample outputs to files for review
  const fs = await import('fs');
  const outDir = path.join(process.cwd(), 'backend', 'exports');
  try {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outDir + '/audit-report.json', JSON.stringify(report, null, 2));
    console.log('Wrote detailed report to backend/exports/audit-report.json');
  } catch (e) {
    console.error('Failed to write report file', e.message);
  }

}

await run();
await mongoose.disconnect();
console.log('Audit finished.');
