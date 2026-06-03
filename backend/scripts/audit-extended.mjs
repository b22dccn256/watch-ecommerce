#!/usr/bin/env node
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config({ path: path.join(process.cwd(), "backend", ".env") });

const MONGO = process.env.MONGO_URI || process.env.MONGOURL;
if (!MONGO) {
  console.error("MONGO_URI not set");
  process.exit(1);
}

await mongoose.connect(MONGO, { family: 4 });
console.log("Connected to MongoDB for extended audit");

const Order = (await import("../models/order.model.js")).default;
const Banner = (await import("../models/banner.model.js")).default;
const User = (await import("../models/user.model.js")).default;
const Coupon = (await import("../models/coupon.model.js")).default;

const report = {};

report.ordersMissingPayment = await Order.find({
  paymentStatus: "paid",
  paidAt: null,
})
  .limit(100)
  .select("orderCode paymentStatus paidAt user totalAmount")
  .lean();

// Orders with impossible transitions: e.g., status 'delivered' but paymentStatus != paid
report.ordersDeliveredUnpaid = await Order.find({
  status: "delivered",
  paymentStatus: { $ne: "paid" },
})
  .limit(100)
  .select("orderCode status paymentStatus totalAmount")
  .lean();

report.bannersMissingImage = await Banner.find({
  $or: [{ image: null }, { image: "" }],
})
  .limit(100)
  .select("title _id image")
  .lean();

report.duplicateUserEmails = await User.aggregate([
  {
    $group: {
      _id: { $toLower: "$email" },
      count: { $sum: 1 },
      ids: { $push: "$_id" },
    },
  },
  { $match: { count: { $gt: 1 } } },
  { $limit: 100 },
]);

report.couponsExpiredActive = await Coupon.find({
  expirationDate: { $lt: new Date() },
  isActive: true,
})
  .limit(100)
  .select("code expirationDate isActive")
  .lean();

const outPath = path.join(
  process.cwd(),
  "backend",
  "exports",
  "audit-extended.json",
);
fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
console.log("Wrote extended audit to", outPath);

await mongoose.disconnect();
console.log("Extended audit finished");
