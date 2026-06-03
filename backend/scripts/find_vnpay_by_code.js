import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "../lib/db.js";
import ProcessedIPN from "../models/processedIPN.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

async function run() {
  const code = process.argv[2];
  if (!code) {
    console.error("Usage: node find_vnpay_by_code.js <orderCode>");
    process.exit(1);
  }
  await connectDB();
  const recs = await ProcessedIPN.find({ provider: "vnpay", orderCode: code })
    .sort({ createdAt: -1 })
    .lean();
  if (!recs || recs.length === 0) {
    console.log("No records found for", code);
    process.exit(0);
  }
  for (const r of recs) {
    console.log("---");
    console.log("orderCode:", r.orderCode);
    console.log("transactionId:", r.transactionId);
    console.log("status:", r.status || r.response || "unknown");
    console.log(
      "payload:",
      JSON.stringify(r.payload || r.raw || r.body || {}, null, 2),
    );
    console.log("processedAt:", r.createdAt);
  }
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
