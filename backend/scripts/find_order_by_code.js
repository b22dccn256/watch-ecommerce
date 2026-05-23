import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/db.js';
import Order from '../models/order.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run(){
  const code = process.argv[2];
  if (!code) { console.error('Usage: node find_order_by_code.js <orderCode>'); process.exit(1); }
  await connectDB();
  const order = await Order.findOne({ orderCode: code }).lean();
  if (!order) { console.log('Order not found for', code); process.exit(0); }
  console.log('Order', order.orderCode, 'paymentStatus:', order.paymentStatus, 'status:', order.status, 'totalAmount:', order.totalAmount, 'createdAt:', order.createdAt);
  console.log('Full record:', JSON.stringify(order, null, 2));
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
