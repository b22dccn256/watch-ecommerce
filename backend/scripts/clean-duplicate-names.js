import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { connectDB } from '../lib/db.js';
import Product from '../models/product.model.js';
import User from '../models/user.model.js';
import Wishlist from '../models/wishlist.model.js';
import Review from '../models/review.model.js';
import Order from '../models/order.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function cleanDuplicates() {
  await connectDB();
  console.log("Connected to MongoDB successfully.\n");

  console.log("=== Finding duplicate product names ===");
  const duplicateGroups = await Product.aggregate([
    { $group: { _id: "$name", count: { $sum: 1 }, items: { $push: { _id: "$_id", stock: "$stock", salesCount: "$salesCount", createdAt: "$createdAt" } } } },
    { $match: { count: { $gt: 1 } } }
  ]);

  console.log(`Found ${duplicateGroups.length} sets of duplicate product names.\n`);

  let totalCartsUpdated = 0;
  let totalWishlistsUpdated = 0;
  let totalReviewsUpdated = 0;
  let totalOrdersUpdated = 0;
  let totalProductsSoftDeleted = 0;

  for (const group of duplicateGroups) {
    const name = group._id;
    // Sort items so the best product is first: highest stock, then highest sales, then oldest
    const sortedItems = group.items.sort((a, b) => {
      if ((b.stock || 0) !== (a.stock || 0)) {
        return (b.stock || 0) - (a.stock || 0);
      }
      if ((b.salesCount || 0) !== (a.salesCount || 0)) {
        return (b.salesCount || 0) - (a.salesCount || 0);
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });

    const primary = sortedItems[0];
    const duplicates = sortedItems.slice(1);
    const duplicateIds = duplicates.map(d => d._id);

    console.log(`Consolidating duplicate group "${name}":`);
    console.log(`- Keep primary ID: ${primary._id} (Stock: ${primary.stock || 0}, Sales: ${primary.salesCount || 0})`);
    console.log(`- Soft-deleting ${duplicateIds.length} duplicate IDs: ${JSON.stringify(duplicateIds)}`);

    // 1. Remap Carts in User collection
    const usersWithBadCart = await User.find({ "cartItems.product": { $in: duplicateIds } });
    for (const user of usersWithBadCart) {
      let modified = false;
      const newCartItems = [];
      const cartMap = new Map(); // key: unique attributes ID -> cartItem

      for (const item of user.cartItems) {
        if (!item.product) continue;
        let pId = item.product.toString();
        if (duplicateIds.some(dupId => dupId.toString() === pId)) {
          pId = primary._id.toString();
          modified = true;
        }

        const uniqueKey = `${pId}_${item.wristSize || 'default'}_${item.selectedColor || 'default'}_${item.selectedSize || 'default'}`;
        if (cartMap.has(uniqueKey)) {
          cartMap.get(uniqueKey).quantity += (item.quantity || 1);
        } else {
          const itemCopy = item.toObject ? item.toObject() : { ...item };
          itemCopy.product = new mongoose.Types.ObjectId(pId);
          cartMap.set(uniqueKey, itemCopy);
        }
      }

      if (modified) {
        user.cartItems = Array.from(cartMap.values());
        user.cartUpdatedAt = new Date();
        await user.save();
        totalCartsUpdated++;
      }
    }

    // 2. Remap Wishlist collection
    const wishlistsWithBadItem = await Wishlist.find({ "items.product": { $in: duplicateIds } });
    for (const wl of wishlistsWithBadItem) {
      let modified = false;
      const seenIds = new Set();
      const newItems = [];

      for (const item of wl.items) {
        if (!item.product) continue;
        let pId = item.product.toString();
        if (duplicateIds.some(dupId => dupId.toString() === pId)) {
          pId = primary._id.toString();
          modified = true;
        }

        if (!seenIds.has(pId)) {
          seenIds.add(pId);
          const itemCopy = wl.toObject ? item.toObject() : { ...item };
          itemCopy.product = new mongoose.Types.ObjectId(pId);
          newItems.push(itemCopy);
        } else {
          modified = true; // removed duplicate entry
        }
      }

      if (modified) {
        wl.items = newItems;
        await wl.save();
        totalWishlistsUpdated++;
      }
    }

    // 3. Remap Reviews
    const reviewsToRemap = await Review.find({ product: { $in: duplicateIds } });
    for (const rev of reviewsToRemap) {
      // Check if primary already has a review by this user
      const existingPrimaryReview = await Review.findOne({ product: primary._id, user: rev.user });
      if (existingPrimaryReview) {
        // Delete to prevent unique composite key index violation
        await Review.deleteOne({ _id: rev._id });
      } else {
        rev.product = primary._id;
        await rev.save();
      }
      totalReviewsUpdated++;
    }

    // 4. Remap Orders
    const ordersToRemap = await Order.find({ "products.product": { $in: duplicateIds } });
    for (const order of ordersToRemap) {
      let modified = false;
      for (const item of order.products) {
        if (item.product && duplicateIds.some(dupId => dupId.toString() === item.product.toString())) {
          item.product = primary._id;
          modified = true;
        }
      }
      if (modified) {
        await order.save();
        totalOrdersUpdated++;
      }
    }

    // 5. Soft-delete duplicate products
    const result = await Product.updateMany(
      { _id: { $in: duplicateIds } },
      { $set: { isActive: false, deletedAt: new Date() } }
    );
    totalProductsSoftDeleted += result.modifiedCount;

    console.log(`- Finished processing this group.\n`);
  }

  console.log("=== DEDUPLICATION REPORT ===");
  console.log(`- Total user carts consolidated: ${totalCartsUpdated}`);
  console.log(`- Total user wishlists consolidated: ${totalWishlistsUpdated}`);
  console.log(`- Total reviews remapped: ${totalReviewsUpdated}`);
  console.log(`- Total order item lines updated: ${totalOrdersUpdated}`);
  console.log(`- Total duplicate products soft-deleted: ${totalProductsSoftDeleted}`);
  console.log("============================");

  console.log("\nDeduplication completed successfully!");
  process.exit(0);
}

cleanDuplicates().catch(err => {
  console.error("Deduplication failed with error:", err);
  process.exit(1);
});
