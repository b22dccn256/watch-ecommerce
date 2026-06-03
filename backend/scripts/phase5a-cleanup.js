/**
 * PHASE 5A: Data Cleanup
 * Fix duplicate null values and invalid data before creating indexes
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import Order from "../models/order.model.js";

const cleanup = async () => {
  try {
    console.log("\n=== PHASE 5A: DATA CLEANUP ===\n");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB");

    // Remove problematic index
    console.log("\n[1/3] Removing problematic indexes...");
    try {
      await mongoose.connection.collection("orders").dropIndex("orderCode_1");
      console.log("✓ Dropped orderCode_1 index");
    } catch (e) {
      console.log("  (orderCode_1 index not found, that's ok)");
    }

    // Generate orderCodes for missing ones
    console.log("\n[2/3] Generating missing orderCodes...");
    const ordersWithoutCode = await Order.find({
      $or: [{ orderCode: null }, { orderCode: { $exists: false } }],
    });
    console.log(`Found ${ordersWithoutCode.length} orders without orderCode`);

    let updated = 0;
    for (const order of ordersWithoutCode) {
      // Generate unique order code: ORD-TIMESTAMP-RANDOM
      order.orderCode = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      await order.save({ validateBeforeSave: false });
      updated++;

      if (updated % 10 === 0) {
        console.log(
          `  Updated ${updated}/${ordersWithoutCode.length} orders...`,
        );
      }
    }
    console.log(`✓ Updated ${updated} orders with orderCode`);

    // Verify no more nulls
    console.log("\n[3/3] Verification...");
    const remaining = await Order.countDocuments({
      $or: [{ orderCode: null }, { orderCode: { $exists: false } }],
    });
    console.log(`✓ Orders without orderCode: ${remaining}`);

    if (remaining === 0) {
      console.log("\n✅ CLEANUP COMPLETE - Ready for index creation\n");
    } else {
      throw new Error(`${remaining} orders still missing orderCode`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("\n❌ CLEANUP FAILED:", error.message);
    console.error(error);
    process.exit(1);
  }
};

cleanup();
