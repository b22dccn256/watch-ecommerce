import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from '../lib/db.js';
import Order from '../models/order.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run(){
  const orderCode = process.argv[2];
  if (!orderCode) { console.error('Usage: node admin_confirm_order.js <ORDER_CODE>'); process.exit(1); }
  await connectDB();
  const order = await Order.findOne({ orderCode });
  if (!order) { console.error('Order not found', orderCode); process.exit(1); }
  console.log('Before:', { orderCode: order.orderCode, status: order.status, paymentStatus: order.paymentStatus });
  order.status = 'confirmed';
  order.paymentStatus = 'paid';
  order.trackingEvents.push({ status: 'confirmed', message: 'Admin confirmed COD and marked paid', timestamp: new Date(), updatedBy: 'admin-script' });
  await order.save();
  console.log('After:', { orderCode: order.orderCode, status: order.status, paymentStatus: order.paymentStatus });
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
