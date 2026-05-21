import mongoose from 'mongoose';
import Order from '../models/order.model.js';
import ProcessedIPN from '../models/processedIPN.model.js';
import User from '../models/user.model.js';
import { emailQueue } from '../controllers/mail.controller.js';
import OrderService from './order.service.js';

/**
 * Shared IPN handler for all payment providers (VNPay, MoMo, ZaloPay).
 * Implements atomic idempotency, order status updates, stock restore, and email queuing.
 *
 * @param {object} options
 * @param {string}  options.provider      - 'vnpay' | 'momo' | 'zalopay'
 * @param {string}  options.transactionId - Unique gateway transaction ID
 * @param {string}  options.orderCode     - Our internal order code
 * @param {boolean} options.isSuccess     - true = payment succeeded
 * @param {object}  options.payload       - Full raw IPN body for audit logging
 * @returns {Promise<{ alreadyProcessed: boolean, success: boolean, order: object|null }>}
 */
export async function processIPN({ provider, transactionId, orderCode, isSuccess, payload }) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomic idempotency check — prevent double-processing
    const existing = await ProcessedIPN.findOne({ provider, transactionId }, null, { session });
    if (existing) {
      await session.commitTransaction();
      return { alreadyProcessed: true, success: false, order: null };
    }

    if (!orderCode) {
      await session.abortTransaction();
      return { alreadyProcessed: false, success: false, order: null };
    }

    const order = await Order.findOne({ orderCode }).session(session);
    if (!order) {
      await ProcessedIPN.create(
        [{ provider, transactionId, orderCode, status: 'failed', payload, processedAt: new Date() }],
        { session }
      );
      await session.commitTransaction();
      return { alreadyProcessed: false, success: false, order: null };
    }

    // Already paid from a prior IPN (idempotent path)
    if (order.paymentStatus === 'paid') {
      await ProcessedIPN.create(
        [{ provider, transactionId, orderCode, status: 'processed', payload }],
        { session }
      );
      await session.commitTransaction();
      return { alreadyProcessed: true, success: true, order };
    }

    if (isSuccess) {
      // Mark order as paid
      order.paymentStatus = 'paid';
      order.status        = 'confirmed';
      order.transactionId = transactionId;
      order.ipnVerified   = true;
      order.paymentResponse = payload;
      order.paidAt        = new Date();
      await order.save({ session });

      await ProcessedIPN.create(
        [{ provider, transactionId, orderCode, status: 'processed', payload }],
        { session }
      );
      await session.commitTransaction();

      // Queue confirmation email (after commit — non-critical)
      await sendPaymentConfirmationEmail(order, provider).catch(err =>
        console.error(`[IPNService] Email queue failed for order ${orderCode}:`, err.message)
      );

      return { alreadyProcessed: false, success: true, order };
    }

    // Payment failed — mark order and restore stock
    order.paymentStatus = 'failed';
    await order.save({ session });
    await ProcessedIPN.create(
      [{ provider, transactionId, orderCode, status: 'failed', payload }],
      { session }
    );
    await session.commitTransaction();

    // Restore stock outside transaction (best-effort with full error context)
    await OrderService.restoreStock(order.products, null, order._id, `${provider} IPN Failed`).catch(err =>
      console.error(`[IPNService] Stock restore failed for order ${orderCode} (${provider}):`, err.message, err.stack)
    );

    return { alreadyProcessed: false, success: false, order };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Queue a payment confirmation email for the customer.
 * @param {object} order    - Mongoose order document
 * @param {string} provider - 'vnpay' | 'momo' | 'zalopay' | 'cod' | 'stripe'
 */
export async function sendPaymentConfirmationEmail(order, provider) {
  const providerDisplayMap = {
    vnpay:   'VNPay (Đã thanh toán)',
    momo:    'MoMo (Đã thanh toán)',
    zalopay: 'ZaloPay (Đã thanh toán)',
    stripe:  'Stripe (Đã thanh toán)',
    cod:     'Thanh toán khi nhận hàng (COD)',
    qr:      'VietQR (Chờ xác nhận)',
  };

  const emailTarget = order.user
    ? (await User.findById(order.user).select('email').lean())?.email
    : order.shippingDetails?.email;

  if (!emailTarget) return;

  const providerName = providerDisplayMap[provider] || provider;

  await emailQueue.add('order-confirmation', {
    email:   emailTarget,
    subject: `Xác nhận thanh toán ${providerName.split(' ')[0]} đơn hàng #${order.orderCode} - Luxury Watch`,
    order: {
      orderCode:       order.orderCode,
      totalAmount:     order.totalAmount,
      shippingDetails: order.shippingDetails,
      paymentMethod:   providerName,
    },
  });
}

export default { processIPN, sendPaymentConfirmationEmail };
