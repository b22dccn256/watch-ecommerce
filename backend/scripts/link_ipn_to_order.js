import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import Order from "../models/order.model.js";
import ProcessedIPN from "../models/processedIPN.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  const txn = process.argv[2];
  const orderCode = process.argv[3];
  if (!txn || !orderCode) {
    console.error("Usage: node link_ipn_to_order.js <TXN_ID> <ORDER_CODE>");
    process.exit(1);
  }
  await connectDB();
  const order = await Order.findOne({ orderCode });
  if (!order) {
    console.error("Order not found:", orderCode);
    process.exit(1);
  }

  if (order.paymentStatus === "paid") {
    console.log("Order already paid:", order.orderCode);
  } else {
    order.paymentStatus = "paid";
    order.status = "confirmed";
    order.transactionId = txn;
    order.ipnVerified = true;
    order.paidAt = new Date();
    order.trackingEvents.push({
      status: "confirmed",
      message: `Linked IPN ${txn} via CLI`,
      timestamp: new Date(),
      updatedBy: "cli-reconcile",
    });
    await order.save();
    console.log("Order updated to paid:", order.orderCode);
  }

  await ProcessedIPN.create([
    {
      provider: "vnpay",
      transactionId: txn,
      orderCode,
      status: "processed",
      payload: { linkedBy: "cli", linkedAt: new Date() },
    },
  ]);
  console.log("ProcessedIPN record created for", txn);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
