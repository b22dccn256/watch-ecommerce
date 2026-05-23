import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { connectDB } from '../lib/db.js';
import ProcessedIPN from '../models/processedIPN.model.js';
import Order from '../models/order.model.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run(){
  const filePath = process.argv[2] || path.join(__dirname, '..', 'exports', 'failed_vnpay_ipns_backup_1779193587308.json');
  console.log('Using backup file:', filePath);
  await connectDB();
  const content = await fs.readFile(filePath, 'utf8');
  let entries = JSON.parse(content);
  for (const e of entries) {
    const provider = e.provider || 'vnpay';
    const txn = e.transactionId || e.payload?.vnp_TransactionNo || e.payload?.vnp_TransactionNo;
    const orderCode = e.orderCode || e.payload?.vnp_TxnRef;
    console.log('\n---');
    console.log('Entry:', { txn, orderCode, provider });

    const order = await Order.findOne({ orderCode });
    if (!order) {
      console.warn('No matching order in DB for orderCode:', orderCode);
      continue;
    }

    try {
      if (order.paymentStatus === 'paid') {
        console.log('Order already paid:', order.orderCode);
        await ProcessedIPN.create([{ provider, transactionId: txn, orderCode, status: 'processed', payload: e.payload }]);
        continue;
      }

      order.paymentStatus = 'paid';
      order.status = 'confirmed';
      order.transactionId = txn;
      order.ipnVerified = true;
      order.paymentResponse = e.payload;
      order.paidAt = new Date();
      order.trackingEvents.push({ status: 'confirmed', message: `Reprocessed IPN ${provider}`, timestamp: new Date(), updatedBy: 'reprocess-script' });
      await order.save();

      await ProcessedIPN.create([{ provider, transactionId: txn, orderCode, status: 'processed', payload: e.payload }]);
      console.log('Marked order paid and recorded ProcessedIPN for', orderCode);
    } catch (err) {
      console.error('Error reprocessing IPN', txn, err.message);
    }
  }
  process.exit(0);
}

run().catch(err=>{ console.error(err); process.exit(1); });
