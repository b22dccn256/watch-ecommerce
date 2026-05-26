import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;
const APPLY = process.argv.includes('--apply');
const DRY_RUN = !APPLY;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in environment variables.");
  process.exit(1);
}

// Ensure local uploads directory exists
const uploadsDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Inline model structures
const Category = mongoose.models.Category || mongoose.model('Category', new mongoose.Schema({}, { strict: false }), 'categories');
const Brand = mongoose.models.Brand || mongoose.model('Brand', new mongoose.Schema({}, { strict: false }), 'brands');
const Product = mongoose.models.Product || mongoose.model('Product', new mongoose.Schema({}, { strict: false }), 'products');
const Order = mongoose.models.Order || mongoose.model('Order', new mongoose.Schema({}, { strict: false }), 'orders');
const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', new mongoose.Schema({}, { strict: false }), 'coupons');
const Review = mongoose.models.Review || mongoose.model('Review', new mongoose.Schema({}, { strict: false }), 'reviews');
const Question = mongoose.models.Question || mongoose.model('Question', new mongoose.Schema({}, { strict: false }), 'questions');
const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }), 'campaigns');
const Banner = mongoose.models.Banner || mongoose.model('Banner', new mongoose.Schema({}, { strict: false }), 'banners');

// Helper to check URL reachability with a 2-second timeout
async function isUrlReachable(url) {
  if (!url || typeof url !== 'string') return false;
  if (url.startsWith('/') || url.startsWith('http://localhost') || url.startsWith('https://localhost')) {
    // Treat local resources as reachable for audit purposes
    return true;
  }
  if (url.startsWith('data:image/')) {
    // Treat inline base64 as reachable (we'll decode it separately)
    return true;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (err) {
    // Failover to GET request in case HEAD is not allowed
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Helper to decode Base64 image to local file
function decodeBase64Image(base64Str, prefix = 'product') {
  try {
    const matches = base64Str.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return null;
    }
    
    const ext = matches[1].split('/')[1] || 'png';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}-audit-${Date.now()}-${Math.floor(Math.random() * 1000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error("  ❌ Failed to decode base64 image:", err.message);
    return null;
  }
}

async function runAudit() {
  console.log("==================================================================");
  console.log(`🔍 SYSTEM DATA AUDIT & AUTO-REPAIR | MODE: ${APPLY ? '🔧 APPLY (REPAIR)' : '🔬 DRY-RUN (SCAN ONLY)'}`);
  console.log("==================================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB Atlas.\n");

  const report = {
    productsChecked: 0,
    productsRepaired: 0,
    categoriesChecked: 0,
    categoriesRepaired: 0,
    brandsChecked: 0,
    brandsRepaired: 0,
    ordersChecked: 0,
    ordersRepaired: 0,
    couponsChecked: 0,
    couponsRepaired: 0,
    reviewsChecked: 0,
    reviewsRepaired: 0,
    bannersChecked: 0,
    bannersRepaired: 0,
    invalidImageUrls: [],
    base64ImagesConverted: 0
  };

  // ==========================================
  // 1. PRODUCTS AUDIT
  // ==========================================
  console.log("🛍️ [1/7] Auditing Product Collection...");
  const products = await Product.find({}).lean();
  report.productsChecked = products.length;

  for (const p of products) {
    let needsRepair = false;
    const updates = {};

    // Check pricing rules
    if (p.originalPrice !== null && p.originalPrice !== undefined && p.price > p.originalPrice) {
      console.log(`  * ⚠️ Product "${p.name}" (${p._id}): Price (${p.price} ₫) > Original Price (${p.originalPrice} ₫).`);
      updates.originalPrice = null; // unset or make invalid null
      needsRepair = true;
    }
    if (p.costPrice !== null && p.costPrice !== undefined && p.price < p.costPrice) {
      console.log(`  * ⚠️ Product "${p.name}" (${p._id}): Price (${p.price} ₫) < Cost Price (${p.costPrice} ₫).`);
      updates.costPrice = Math.round(p.price * 0.6); // fallback cost to 60%
      needsRepair = true;
    }

    // Check stock rules
    if (p.stock === undefined || p.stock === null || p.stock < 0) {
      console.log(`  * ⚠️ Product "${p.name}" (${p._id}): Invalid stock value (${p.stock}).`);
      updates.stock = 0;
      needsRepair = true;
    }

    // Check image link and Base64
    if (p.image) {
      if (p.image.startsWith('data:image/')) {
        console.log(`  * ⚡ Product "${p.name}" (${p._id}) contains Base64 image. Converting...`);
        const localPath = decodeBase64Image(p.image, 'product');
        if (localPath) {
          updates.image = localPath;
          needsRepair = true;
          report.base64ImagesConverted++;
        }
      } else {
        const isReachable = await isUrlReachable(p.image);
        if (!isReachable) {
          console.log(`  * ⚠️ Product "${p.name}" (${p._id}) has broken image URL: "${p.image}"`);
          report.invalidImageUrls.push({ type: 'product', id: p._id, url: p.image });
          updates.image = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"; // fallback default
          needsRepair = true;
        }
      }
    }

    if (needsRepair) {
      report.productsRepaired++;
      if (APPLY) {
        await Product.updateOne({ _id: p._id }, { $set: updates });
        console.log(`    ✓ Repaired product: ${p.name}`);
      }
    }
  }
  console.log(`  * Products checked: ${report.productsChecked}, Repaired: ${report.productsRepaired}\n`);

  // ==========================================
  // 2. CATEGORIES AUDIT
  // ==========================================
  console.log("📂 [2/7] Auditing Category Collection...");
  const categories = await Category.find({}).lean();
  report.categoriesChecked = categories.length;

  for (const c of categories) {
    let needsRepair = false;
    const updates = {};

    // Check circular references
    if (c.parentCategory && String(c.parentCategory) === String(c._id)) {
      console.log(`  * ⚠️ Category "${c.name}" (${c._id}) has self circular parent reference.`);
      updates.parentCategory = null;
      needsRepair = true;
    }

    // Check image URLs
    if (c.image) {
      if (c.image.startsWith('data:image/')) {
        console.log(`  * ⚡ Category "${c.name}" (${c._id}) has Base64 image. Converting...`);
        const localPath = decodeBase64Image(c.image, 'category');
        if (localPath) {
          updates.image = localPath;
          needsRepair = true;
          report.base64ImagesConverted++;
        }
      } else {
        const isReachable = await isUrlReachable(c.image);
        if (!isReachable) {
          console.log(`  * ⚠️ Category "${c.name}" (${c._id}) has broken image URL: "${c.image}"`);
          report.invalidImageUrls.push({ type: 'category', id: c._id, url: c.image });
          updates.image = ""; // clear broken image
          needsRepair = true;
        }
      }
    }

    if (needsRepair) {
      report.categoriesRepaired++;
      if (APPLY) {
        await Category.updateOne({ _id: c._id }, { $set: updates });
        console.log(`    ✓ Repaired category: ${c.name}`);
      }
    }
  }
  console.log(`  * Categories checked: ${report.categoriesChecked}, Repaired: ${report.categoriesRepaired}\n`);

  // ==========================================
  // 3. BRANDS AUDIT
  // ==========================================
  console.log("🏢 [3/7] Auditing Brand Collection...");
  const brands = await Brand.find({}).lean();
  report.brandsChecked = brands.length;

  for (const b of brands) {
    let needsRepair = false;
    const updates = {};

    // Check if brand is inactive but has active products linked
    if (!b.isActive) {
      const activeProductsCount = await Product.countDocuments({ brand: b._id, deletedAt: null });
      if (activeProductsCount > 0) {
        console.log(`  * ⚠️ Inactive Brand "${b.name}" (${b._id}) has ${activeProductsCount} active products linked.`);
        updates.isActive = true; // Activate brand
        needsRepair = true;
      }
    }

    // Check image link
    if (b.logo) {
      if (b.logo.startsWith('data:image/')) {
        console.log(`  * ⚡ Brand "${b.name}" (${b._id}) has Base64 image. Converting...`);
        const localPath = decodeBase64Image(b.logo, 'brand');
        if (localPath) {
          updates.logo = localPath;
          needsRepair = true;
          report.base64ImagesConverted++;
        }
      } else {
        const isReachable = await isUrlReachable(b.logo);
        if (!isReachable) {
          console.log(`  * ⚠️ Brand "${b.name}" (${b._id}) has broken logo URL: "${b.logo}"`);
          report.invalidImageUrls.push({ type: 'brand', id: b._id, url: b.logo });
          updates.logo = "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=100"; // placeholder
          needsRepair = true;
        }
      }
    }

    if (needsRepair) {
      report.brandsRepaired++;
      if (APPLY) {
        await Brand.updateOne({ _id: b._id }, { $set: updates });
        console.log(`    ✓ Repaired brand: ${b.name}`);
      }
    }
  }
  console.log(`  * Brands checked: ${report.brandsChecked}, Repaired: ${report.brandsRepaired}\n`);

  // ==========================================
  // 4. ORDERS AUDIT
  // ==========================================
  console.log("📦 [4/7] Auditing Order Collection...");
  const orders = await Order.find({}).lean();
  report.ordersChecked = orders.length;

  // Track and clean duplicates
  const stripeSessions = new Set();
  const transactionIds = new Set();

  for (const o of orders) {
    let needsRepair = false;
    let shouldDelete = false;

    // Check duplicate stripeSessionId
    if (o.stripeSessionId) {
      if (stripeSessions.has(o.stripeSessionId)) {
        console.log(`  * ⚠️ Duplicate Stripe Session ID: ${o.stripeSessionId} in order #${o.orderCode || o._id}.`);
        shouldDelete = true;
      } else {
        stripeSessions.add(o.stripeSessionId);
      }
    }

    // Check duplicate transactionId
    if (o.transactionId) {
      if (transactionIds.has(o.transactionId)) {
        console.log(`  * ⚠️ Duplicate Transaction ID: ${o.transactionId} in order #${o.orderCode || o._id}.`);
        shouldDelete = true;
      } else {
        transactionIds.add(o.transactionId);
      }
    }

    // Check logical anomalies
    if (o.paymentMethod === 'cod' && o.paymentStatus === 'paid' && o.status === 'pending') {
      console.log(`  * ⚠️ COD Order #${o.orderCode || o._id} is marked 'paid' but status is still 'pending'.`);
      needsRepair = true;
    }

    if (shouldDelete) {
      report.ordersRepaired++;
      if (APPLY) {
        await Order.deleteOne({ _id: o._id });
        console.log(`    ✓ Deleted duplicate order #${o.orderCode || o._id}`);
      }
    } else if (needsRepair) {
      report.ordersRepaired++;
      if (APPLY) {
        // Adjust paymentStatus for pending COD to pending
        await Order.updateOne({ _id: o._id }, { $set: { paymentStatus: 'pending' } });
        console.log(`    ✓ Corrected paymentStatus of pending COD order #${o.orderCode || o._id} to 'pending'`);
      }
    }
  }
  console.log(`  * Orders checked: ${report.ordersChecked}, Cleaned/Repaired: ${report.ordersRepaired}\n`);

  // ==========================================
  // 5. REVIEWS & PRODUCT STATS RE-CALCULATION
  // ==========================================
  console.log("💬 [5/7] Auditing Reviews & Product Average Ratings...");
  const reviews = await Review.find({}).lean();
  report.reviewsChecked = reviews.length;

  for (const r of reviews) {
    // Check if product exists
    const pExists = await Product.exists({ _id: r.productId || r.product });
    if (!pExists) {
      console.log(`  * ⚠️ Review ${r._id} is orphaned (Product does not exist).`);
      report.reviewsRepaired++;
      if (APPLY) {
        await Review.deleteOne({ _id: r._id });
        console.log(`    ✓ Deleted orphaned review ${r._id}`);
      }
    }
  }

  // Re-calculate averageRating and reviewsCount for all products
  const activeProducts = await Product.find({ deletedAt: null }).lean();
  for (const p of activeProducts) {
    const pReviews = await Review.find({ productId: p._id, status: 'approved' }).lean();
    const correctReviewsCount = pReviews.length;
    const correctAverageRating = correctReviewsCount > 0
      ? Math.round((pReviews.reduce((sum, r) => sum + r.rating, 0) / correctReviewsCount) * 10) / 10
      : 0;

    if (p.reviewsCount !== correctReviewsCount || p.averageRating !== correctAverageRating) {
      console.log(`  * ⚠️ Product "${p.name}" (${p._id}) stats out of sync: reviewsCount (${p.reviewsCount} vs actual ${correctReviewsCount}), averageRating (${p.averageRating} vs actual ${correctAverageRating})`);
      if (APPLY) {
        await Product.updateOne({ _id: p._id }, {
          $set: {
            reviewsCount: correctReviewsCount,
            averageRating: correctAverageRating
          }
        });
        console.log(`    ✓ Synchronized product rating stats for "${p.name}"`);
      }
    }
  }
  console.log(`  * Reviews checked: ${report.reviewsChecked}, Repaired: ${report.reviewsRepaired}\n`);

  // ==========================================
  // 6. BANNERS AUDIT
  // ==========================================
  console.log("🎨 [6/7] Auditing Banners...");
  const banners = await Banner.find({}).lean();
  report.bannersChecked = banners.length;

  for (const bn of banners) {
    let needsRepair = false;
    const updates = {};

    if (bn.image) {
      if (bn.image.startsWith('data:image/')) {
        console.log(`  * ⚡ Banner "${bn.title}" (${bn._id}) has Base64 image. Converting...`);
        const localPath = decodeBase64Image(bn.image, 'banner');
        if (localPath) {
          updates.image = localPath;
          updates.imageUrl = localPath;
          needsRepair = true;
          report.base64ImagesConverted++;
        }
      } else {
        const isReachable = await isUrlReachable(bn.image);
        if (!isReachable) {
          console.log(`  * ⚠️ Banner "${bn.title}" (${bn._id}) has broken image URL: "${bn.image}"`);
          report.invalidImageUrls.push({ type: 'banner', id: bn._id, url: bn.image });
          updates.image = "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200"; // fallback
          updates.imageUrl = "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=1200";
          needsRepair = true;
        }
      }
    }

    if (needsRepair) {
      report.bannersRepaired++;
      if (APPLY) {
        await Banner.updateOne({ _id: bn._id }, { $set: updates });
        console.log(`    ✓ Repaired banner: ${bn.title}`);
      }
    }
  }
  console.log(`  * Banners checked: ${report.bannersChecked}, Repaired: ${report.bannersRepaired}\n`);

  // ==========================================
  // 7. SUMMARY REPORT
  // ==========================================
  console.log("==================================================================");
  console.log("📊 AUDIT SUMMARY REPORT");
  console.log("==================================================================");
  console.log(`- Products checked:           ${report.productsChecked}  (Repaired: ${report.productsRepaired})`);
  console.log(`- Categories checked:         ${report.categoriesChecked}  (Repaired: ${report.categoriesRepaired})`);
  console.log(`- Brands checked:             ${report.brandsChecked}  (Repaired: ${report.brandsRepaired})`);
  console.log(`- Orders checked:             ${report.ordersChecked}  (Repaired: ${report.ordersRepaired})`);
  console.log(`- Reviews checked:            ${report.reviewsChecked}  (Repaired: ${report.reviewsRepaired})`);
  console.log(`- Banners checked:            ${report.bannersChecked}  (Repaired: ${report.bannersRepaired})`);
  console.log(`- Base64 Images Decoded:      ${report.base64ImagesConverted}`);
  console.log(`- Broken Image URLs Found:    ${report.invalidImageUrls.length}`);
  
  if (report.invalidImageUrls.length > 0) {
    console.log("\n❌ Detailing Broken Image URLs:");
    report.invalidImageUrls.forEach(img => {
      console.log(`  * Type: ${img.type.padEnd(8)} | ID: ${img.id} | URL: "${img.url}"`);
    });
  }
  
  console.log("\n==================================================================");
  console.log("✅ AUDIT SYSTEM COMPLETE");
  console.log("==================================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runAudit().catch(async err => {
  console.error("❌ Audit execution failed:", err);
  try { await mongoose.disconnect(); } catch (_) {}
  process.exit(1);
});
