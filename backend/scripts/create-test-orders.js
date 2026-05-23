#!/usr/bin/env node
/*
  create-test-orders.js
  Usage: node create-test-orders.js --productId=<id> --count=<n> [--userId=<userId>]

  This script creates `count` orders for productId. It uses OrderService.deductStock
  and writes Order documents in a transaction so inventory and logs are updated.
*/
import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import OrderService from '../services/order.service.js';

const argv = Object.fromEntries(process.argv.slice(2).map(s => s.split('=').map(x => x.replace(/^--/, ''))));
const productId = argv.productId;
const count = parseInt(argv.count || '1', 10);
const userId = argv.userId || null;

if (!productId) {
  console.error('Missing --productId');
  process.exit(1);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: process.env.MONGO_DB || undefined });
  console.log('Connected to MongoDB');

  const product = await Product.findById(productId).lean();
  if (!product) {
    console.error('Product not found', productId);
    process.exit(1);
  }

  for (let i = 0; i < count; i++) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const newOrderId = new mongoose.Types.ObjectId();
      const products = [{ _id: product._id, quantity: 1, price: product.price, wristSize: null, selectedColor: null, selectedSize: null }];

      // check & deduct stock
      await OrderService.deductStock(products, session, newOrderId, userId, 'Test bulk order');

      const totalAmount = await OrderService.calculateTotalAmount(products, null, session, '');
      const { subtotal, discount, shippingFee } = await OrderService.calculateTotals(products, null, '', session);

      const order = new Order({
        _id: newOrderId,
        ...(userId && { user: userId }),
        products: products.map(p => ({ product: p._id, quantity: p.quantity, price: p.price })),
        totalAmount,
        subtotal,
        discountAmount: discount,
        shippingFee,
        couponCode: '',
        orderCode: OrderService.generateOrderCode(),
        trackingToken: new mongoose.Types.ObjectId().toString(),
        shippingDetails: {
          fullName: userId ? `User ${userId}` : 'Guest Tester',
          phoneNumber: '0123456789',
          address: 'Test address',
          city: 'Hà Nội'
        },
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        status: 'pending',
        trackingEvents: [{ status: 'pending', message: 'Test order created', timestamp: new Date() }],
      });

      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      console.log(`Created order ${order.orderCode} (${order._id})`);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error('Failed creating order:', err.message || err);
    }
  }

  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => { console.error(err); process.exit(1); });
