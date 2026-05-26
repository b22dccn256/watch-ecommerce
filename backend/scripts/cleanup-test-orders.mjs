/**
 * Cleanup Test/Spam Orders
 * Removes duplicate & test orders created during E2E testing.
 * 
 * Criteria for test orders:
 *   - shippingDetails.fullName = "E2E Tester"
 *   - shippingDetails.address = "123 Test Street"
 *   - shippingDetails.phoneNumber = "0901234567"
 *   - OR orderCode duplicates (keep only the latest)
 * 
 * Usage:
 *   node scripts/cleanup-test-orders.mjs --dry-run   (preview only)
 *   node scripts/cleanup-test-orders.mjs --delete     (actually delete)
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI not found in .env');
  process.exit(1);
}

const isDryRun = !process.argv.includes('--delete');

async function main() {
  console.log(`\n🔧 Cleanup Test Orders — ${isDryRun ? '🔍 DRY RUN (preview)' : '🗑️  DELETE MODE'}\n`);

  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const ordersCol = db.collection('orders');

  // ═══════════════════════════════════════════════════
  // 1. Find E2E test orders (by known test markers)
  // ═══════════════════════════════════════════════════
  const testOrderFilter = {
    $or: [
      { 'shippingDetails.fullName': 'E2E Tester' },
      { 'shippingDetails.address': '123 Test Street' },
      { 'shippingDetails.fullName': { $regex: /^e2e/i } },
      { 'shippingDetails.fullName': { $regex: /^test/i } },
    ]
  };

  const testOrders = await ordersCol.find(testOrderFilter).sort({ createdAt: -1 }).toArray();
  console.log(`📋 Found ${testOrders.length} test/E2E orders:\n`);

  if (testOrders.length > 0) {
    const table = testOrders.map((o, i) => ({
      '#': i + 1,
      orderCode: o.orderCode || '(none)',
      fullName: o.shippingDetails?.fullName || '?',
      address: (o.shippingDetails?.address || '').substring(0, 30),
      status: o.status || '?',
      total: o.totalAmount?.toLocaleString('vi-VN') || '?',
      created: o.createdAt ? new Date(o.createdAt).toLocaleString('vi-VN') : '?',
    }));
    console.table(table);
  }

  // ═══════════════════════════════════════════════════
  // 2. Find duplicate orderCodes (keep latest only)
  // ═══════════════════════════════════════════════════
  const dupeAgg = await ordersCol.aggregate([
    { $group: { _id: '$orderCode', count: { $sum: 1 }, ids: { $push: '$_id' }, dates: { $push: '$createdAt' } } },
    { $match: { count: { $gt: 1 } } },
  ]).toArray();

  let dupeIdsToRemove = [];
  if (dupeAgg.length > 0) {
    console.log(`\n📋 Found ${dupeAgg.length} duplicate orderCode groups:\n`);
    for (const group of dupeAgg) {
      // Keep the newest, mark rest for removal
      const paired = group.ids.map((id, i) => ({ id, date: group.dates[i] }));
      paired.sort((a, b) => new Date(b.date) - new Date(a.date));
      const toRemove = paired.slice(1).map(p => p.id);
      dupeIdsToRemove.push(...toRemove);
      console.log(`  ${group._id}: ${group.count} copies → keeping newest, removing ${toRemove.length}`);
    }
  } else {
    console.log('\n✅ No duplicate orderCodes found.');
  }

  // ═══════════════════════════════════════════════════
  // 3. Summary & Execute
  // ═══════════════════════════════════════════════════
  const testIds = testOrders.map(o => o._id);
  const allIdsToDelete = [...new Set([...testIds, ...dupeIdsToRemove].map(String))];

  // Convert back to ObjectIds
  const objectIdsToDelete = allIdsToDelete.map(id => {
    try { return new mongoose.Types.ObjectId(id); }
    catch { return null; }
  }).filter(Boolean);

  console.log(`\n══════════════════════════════════════`);
  console.log(`📊 Total orders to delete: ${objectIdsToDelete.length}`);
  console.log(`   - Test orders: ${testIds.length}`);
  console.log(`   - Duplicate extras: ${dupeIdsToRemove.length}`);
  console.log(`══════════════════════════════════════\n`);

  if (objectIdsToDelete.length === 0) {
    console.log('✨ Nothing to clean up! Database is already clean.');
    await mongoose.disconnect();
    return;
  }

  if (isDryRun) {
    console.log('🔍 DRY RUN — no changes made. Run with --delete to execute.');
  } else {
    const result = await ordersCol.deleteMany({ _id: { $in: objectIdsToDelete } });
    console.log(`🗑️  Deleted ${result.deletedCount} orders from database.`);
  }

  // ═══════════════════════════════════════════════════
  // 4. Show remaining orders summary
  // ═══════════════════════════════════════════════════
  const remaining = await ordersCol.countDocuments();
  console.log(`\n📦 Remaining orders in database: ${remaining}`);

  await mongoose.disconnect();
  console.log('\n✅ Done.\n');
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
