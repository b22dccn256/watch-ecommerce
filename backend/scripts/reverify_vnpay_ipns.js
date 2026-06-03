import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import ProcessedIPN from "../models/processedIPN.model.js";
import { verifyVNPayIPN } from "../services/payment.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  await connectDB();
  const recs = await ProcessedIPN.find({ provider: "vnpay" })
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  if (!recs || recs.length === 0) {
    console.log("No vnpay ProcessedIPN records found.");
    process.exit(0);
  }
  for (const r of recs) {
    const payload = r.payload || r.raw || r.body || {};
    let recordedHash =
      payload.vnp_SecureHash ||
      payload.vnp_SecureHashType ||
      r.recordedSecureHash ||
      null;
    try {
      const ok = verifyVNPayIPN(payload);
      console.log("---");
      console.log(
        "orderCode:",
        r.orderCode || payload.vnp_TxnRef || payload.vnp_OrderInfo || "N/A",
      );
      console.log(
        "transactionId:",
        r.transactionId || payload.vnp_TransactionNo || "N/A",
      );
      console.log(
        "recorded vnp_SecureHash:",
        payload.vnp_SecureHash || r.recordedSecureHash || "N/A",
      );
      console.log(
        "verification result (with current secret):",
        ok ? "OK" : "FAILED",
      );
      if (!ok) {
        console.log("payload keys:", Object.keys(payload).sort().join(", "));
        console.log("payload sample:", JSON.stringify(payload, null, 2));
      }
    } catch (err) {
      console.log("Error verifying record", r._id, err.message || err);
    }
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
