import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import ProcessedIPN from "../models/processedIPN.model.js";
import fs from "fs";
import { verifyVNPayIPN } from "../services/payment.service.js";
import { processIPN } from "../services/ipn.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  await connectDB();
  const recs = await ProcessedIPN.find({ provider: "vnpay", status: "failed" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  if (!recs || recs.length === 0) {
    console.log("No failed vnpay records found.");
    process.exit(0);
  }

  const backupPath = path.join(
    __dirname,
    "..",
    "exports",
    `failed_vnpay_ipns_backup_${Date.now()}.json`,
  );
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.writeFileSync(backupPath, JSON.stringify(recs, null, 2));
  console.log("Backed up", recs.length, "records to", backupPath);

  for (const r of recs) {
    const payload = r.payload || {};
    const ok = verifyVNPayIPN(payload);
    console.log("---");
    console.log(
      "orderCode:",
      r.orderCode,
      "transactionId:",
      r.transactionId,
      "signatureOK:",
      ok,
    );
    if (!ok) {
      console.log("Skipping reprocess due to signature still failing");
      continue;
    }
    // Remove the failed marker so processIPN can run idempotently
    try {
      await ProcessedIPN.deleteOne({ _id: r._id });
      console.log("Deleted failed marker for", r._id);
    } catch (err) {
      console.error("Failed to delete marker", r._id, err.message);
      continue;
    }
    try {
      const res = await processIPN({
        provider: "vnpay",
        transactionId: r.transactionId,
        orderCode: r.orderCode,
        isSuccess: payload.vnp_ResponseCode === "00",
        payload,
      });
      console.log("Reprocess result for", r.orderCode, res);
    } catch (err) {
      console.error("Reprocess error for", r.orderCode, err.message || err);
    }
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
