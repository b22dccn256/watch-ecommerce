import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/db.js';
import ProcessedIPN from '../models/processedIPN.model.js';
import Order from '../models/order.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run(){
  await connectDB();
  const recent = await ProcessedIPN.find({ provider: 'vnpay' }).sort({ createdAt: -1 }).limit(20).lean();
  if (!recent || recent.length === 0) {
    console.log('No VNPay IPN records found.');
    process.exit(0);
  }
  for (const r of recent) {
    const order = r.orderId ? await Order.findById(r.orderId).select('orderCode paymentStatus status') : null;
    console.log('---');
    console.log('orderCode:', r.orderCode, 'transactionId:', r.transactionId, 'status:', r.status || r.response || 'unknown');
    console.log('processedAt:', r.createdAt);
    if (order) console.log('order ->', order.orderCode, order.paymentStatus, order.status);
  }
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
