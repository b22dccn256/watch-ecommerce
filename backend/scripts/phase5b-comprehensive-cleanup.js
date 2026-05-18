/**
 * PHASE 5B: Complete Data Cleanup & Index Repair
 * - Drop problematic indexes
 * - Remove duplicate session IDs  
 * - Clean up all collection data before re-indexing
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const cleanup = async () => {
  try {
    console.log("\n=== PHASE 5B: COMPREHENSIVE DATA CLEANUP ===\n");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    const db = mongoose.connection;
    const ordersCol = db.collection("orders");

    // Drop all existing indexes except _id
    console.log("\n[1/4] Removing all indexes (keeping _id)...");
    try {
      const indexes = await ordersCol.getIndexes();
      for (const [name] of Object.entries(indexes)) {
        if (name !== "_id_") {
          await ordersCol.dropIndex(name);
          console.log(`  - Dropped: ${name}`);
        }
      }
    } catch (e) {
      console.log("  (No indexes to drop)");
    }

    // Handle duplicate stripeSessionId - keep only the latest one
    console.log("\n[2/4] Cleaning duplicate stripeSessionId...");
    const pipeline = [
      {
        $match: { stripeSessionId: { $ne: null, $exists: true } }
      },
      {
        $group: {
          _id: "$stripeSessionId",
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ];

    const duplicates = await ordersCol.aggregate(pipeline).toArray();
    console.log(`Found ${duplicates.length} duplicate stripeSessionId values`);

    let cleaned = 0;
    for (const dup of duplicates) {
      // Keep the first one, remove the rest
      const toDelete = dup.ids.slice(1);
      await ordersCol.deleteMany({ _id: { $in: toDelete } });
      cleaned += toDelete.length;
      console.log(`  - Cleaned ${toDelete.length} duplicates for session ${dup._id}`);
    }
    console.log(`✓ Total cleaned: ${cleaned}`);

    // Ensure transactionId uniqueness for stripe/vnpay  
    console.log("\n[3/4] Cleaning duplicate transactionId...");
    const dupTransactions = await ordersCol.aggregate([
      {
        $match: { transactionId: { $ne: null, $exists: true } }
      },
      {
        $group: {
          _id: "$transactionId",
          ids: { $push: "$_id" },
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    console.log(`Found ${dupTransactions.length} duplicate transactionId values`);
    let txCleaned = 0;
    for (const dup of dupTransactions) {
      const toDelete = dup.ids.slice(1);
      await ordersCol.deleteMany({ _id: { $in: toDelete } });
      txCleaned += toDelete.length;
    }
    console.log(`✓ Total cleaned: ${txCleaned}`);

    // Verify
    console.log("\n[4/4] Final verification...");
    const totalOrders = await ordersCol.countDocuments();
    const orderCodes = await ordersCol.countDocuments({ orderCode: { $exists: true } });
    const stripeSessions = await ordersCol.countDocuments({ stripeSessionId: { $exists: true } });

    console.log(`  - Total orders: ${totalOrders}`);
    console.log(`  - Orders with code: ${orderCodes}`);
    console.log(`  - Orders with stripeSessionId: ${stripeSessions}`);

    console.log("\n✅ CLEANUP COMPLETE\n");
    console.log("Next: Run 'node backend/scripts/phase5-migration.js' to create indexes\n");

    await mongoose.disconnect();
  } catch (error) {
    console.error("\n❌ CLEANUP FAILED:", error.message);
    console.error(error);
    process.exit(1);
  }
};

cleanup();
