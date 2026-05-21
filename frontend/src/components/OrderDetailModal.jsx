import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { X, Printer, CheckCircle, Clock, Truck, Package, XCircle, RotateCcw, AlertCircle } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import useOrderForm from "../hooks/useOrderForm";
import useOrderStatus from "../hooks/useOrderStatus";
import toast from "react-hot-toast";

const STATUS_SEQUENCE = [
  { key: 'pending',               label: 'Chờ xử lý',      icon: Clock },
  { key: 'confirmed',             label: 'Đã xác nhận',    icon: CheckCircle },
  { key: 'processing',            label: 'Đang xử lý',     icon: Package },
  { key: 'shipped',               label: 'Đang giao',      icon: Truck },
  { key: 'delivered',             label: 'Đã giao',        icon: CheckCircle },
];

const PAYMENT_LABELS = {
  cod:    'COD (Thanh toán khi nhận)',
  qr:     'Chuyển khoản QR',
  stripe: 'Thẻ tín dụng / Stripe',
};

const PAYMENT_STATUS_STYLES = {
  pending:  'bg-yellow-500/12 text-yellow-600',
  paid:     'bg-green-500/12 text-green-600',
  failed:   'bg-red-500/12 text-red-600',
  refunded: 'bg-orange-500/12 text-orange-600',
  cancelled:'bg-surface text-muted',
};

export default function OrderDetailModal({ order: initialOrder, onClose, onSaved }) {
  const { order, setOrder, nextOptions, statusChanging, confirmConfig, setConfirmConfig, handleChangeStatus, STATUS_LABELS } = useOrderStatus(initialOrder);
  const { form, handleChange, saveDetails: performSave, saving } = useOrderForm(initialOrder);

  const currentStepIndex = useMemo(() => {
    return STATUS_SEQUENCE.findIndex(s => s.key === order?.status);
  }, [order?.status]);

  const handleSave = async () => {
    const success = await performSave(order._id);
    if (success && onSaved) {
      onSaved();
    }
  };

  const handlePrint = () => {
    try {
      const win = window.open('', '_blank');
      if (!win) return toast.error('Không thể mở cửa sổ in');
      const html = `<!doctype html><html><head><meta charset="utf-8"><title>Đơn hàng #${order?.orderCode}</title>
        <style>body{font-family:sans-serif;padding:24px;max-width:600px;margin:auto}h2{margin-bottom:4px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #eee;padding:8px 12px;text-align:left}th{background:#f5f5f5}</style>
        </head><body>
        <h2>Đơn hàng #${order?.orderCode || order?._id}</h2>
        <p>Ngày: ${new Date(order?.createdAt).toLocaleString('vi-VN')}</p>
        <p>Khách: ${order?.shippingDetails?.fullName || order?.user?.name || ''} · ${order?.shippingDetails?.phoneNumber || ''}</p>
        <p>Địa chỉ: ${order?.shippingDetails?.address || ''}, ${order?.shippingDetails?.city || ''}</p>
        <p>PT thanh toán: ${PAYMENT_LABELS[order?.paymentMethod] || order?.paymentMethod}</p>
        <table><thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th></tr></thead><tbody>
        ${(order?.products || []).map(p => `<tr><td>${p.product?.name || p.name}</td><td>${p.quantity}</td><td>${(p.price || 0).toLocaleString('vi-VN')} ₫</td></tr>`).join('')}
        </tbody></table>
        <p style="margin-top:16px;font-size:18px;font-weight:bold">Tổng: ${order?.totalAmount?.toLocaleString('vi-VN')} ₫</p>
        </body></html>`;
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } catch {
      toast.error('Lỗi khi in hóa đơn');
    }
  };

  if (!order) return null;

  return createPortal(
    <>
      <ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div
          className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-black/10 bg-surface p-6 shadow-2xl dark:border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-serif text-lg font-semibold text-primary">
                Đơn #{order.orderCode || order._id?.slice(0, 8).toUpperCase()}
              </h2>
              <p className="mt-0.5 text-xs text-muted">
                {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs text-secondary transition hover:text-primary dark:border-white/10"
              >
                <Printer className="h-3.5 w-3.5" /> In
              </button>
              <button onClick={onClose} className="rounded-lg p-1.5 text-muted transition hover:text-primary">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Status Progress (normal flow only) */}
          {currentStepIndex >= 0 && !['cancelled', 'return_requested', 'returned'].includes(order.status) && (
            <div className="mb-5 flex items-center gap-1 overflow-x-auto pb-1">
              {STATUS_SEQUENCE.map((step, idx) => {
                const Icon = step.icon;
                const done = idx < currentStepIndex;
                const current = idx === currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-1 shrink-0">
                    <div className={`flex flex-col items-center gap-1 ${current ? 'text-[color:var(--color-gold)]' : done ? 'text-green-600' : 'text-muted'}`}>
                      <Icon className={`h-4 w-4 ${current ? 'text-[color:var(--color-gold)]' : done ? 'text-green-600' : 'text-muted opacity-40'}`} />
                      <span className="text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap">{step.label}</span>
                    </div>
                    {idx < STATUS_SEQUENCE.length - 1 && (
                      <div className={`mx-1 h-px w-6 shrink-0 ${idx < currentStepIndex ? 'bg-green-500' : 'bg-black/10 dark:bg-white/10'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Special status badge */}
          {['cancelled', 'return_requested', 'returned', 'awaiting_verification'].includes(order.status) && (
            <div className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
              order.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
              order.status === 'returned' ? 'bg-orange-500/10 text-orange-600' :
              'bg-blue-500/10 text-blue-600'
            }`}>
              {order.status === 'cancelled' ? <XCircle className="h-4 w-4" /> :
               order.status === 'returned' ? <RotateCcw className="h-4 w-4" /> :
               <AlertCircle className="h-4 w-4" />}
              {STATUS_LABELS[order.status]}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Left: Customer + Products */}
            <div className="space-y-4">
              <div className="rounded-xl border border-black/8 p-4 dark:border-white/8">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Khách hàng</p>
                <p className="font-semibold text-primary">{order.shippingDetails?.fullName || order.user?.name || 'Khách vãng lai'}</p>
                <p className="mt-0.5 text-xs text-secondary">{order.shippingDetails?.phoneNumber || ''}</p>
                <p className="mt-0.5 text-xs text-secondary">{order.shippingDetails?.email || order.user?.email || ''}</p>
                <p className="mt-1 text-xs text-secondary">
                  {[order.shippingDetails?.address, order.shippingDetails?.city].filter(Boolean).join(', ')}
                </p>
              </div>

              <div className="rounded-xl border border-black/8 p-4 dark:border-white/8">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Sản phẩm</p>
                <ul className="space-y-2">
                  {(order.products || []).map((p, i) => (
                    <li key={i} className="flex items-start justify-between gap-2 text-xs">
                      <div className="flex items-start gap-2 min-w-0">
                        {p.product?.image && (
                          <img src={p.product.image} alt="" className="h-8 w-8 rounded-lg object-cover shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-primary truncate">{p.product?.name || p.name}</p>
                          <p className="text-muted">x{p.quantity}</p>
                        </div>
                      </div>
                      <p className="shrink-0 font-semibold text-primary whitespace-nowrap">
                        {(p.price || 0).toLocaleString('vi-VN')} ₫
                      </p>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex justify-between border-t border-black/8 pt-3 dark:border-white/8">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wide">Tổng cộng</span>
                  <span className="font-bold text-primary">{order.totalAmount?.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </div>

            {/* Right: Payment + Actions + Logistics */}
            <div className="space-y-4">
              <div className="rounded-xl border border-black/8 p-4 dark:border-white/8">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Thanh toán</p>
                <p className="text-sm text-primary">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
                <span className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${PAYMENT_STATUS_STYLES[order.paymentStatus] || 'bg-surface text-muted'}`}>
                  {order.paymentStatus}
                </span>
                {order.coupon && (
                  <p className="mt-2 text-xs text-secondary">
                    Mã giảm giá: <span className="font-mono font-semibold">{order.coupon.code}</span> {order.coupon.type === "fixed" ? `(−${order.coupon.discountValue.toLocaleString("vi-VN")} ₫)` : `(−${order.coupon.discountValue || order.coupon.discountPercentage}%)`}
                  </p>
                )}
              </div>

              {/* Status change */}
              {nextOptions.length > 0 && (
                <div className="rounded-xl border border-black/8 p-4 dark:border-white/8">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Cập nhật trạng thái</p>
                  <div className="flex flex-wrap gap-2">
                    {nextOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={statusChanging}
                        onClick={() => handleChangeStatus(s)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          s === 'cancelled'
                            ? 'border-red-500/30 text-red-600 hover:bg-red-500/10'
                            : 'border-[color:var(--color-gold)]/30 text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)]/10'
                        } disabled:opacity-50`}
                      >
                        {statusChanging ? '…' : STATUS_LABELS[s] || s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Logistics */}
              <div className="rounded-xl border border-black/8 p-4 dark:border-white/8 space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Vận chuyển</p>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">Đơn vị vận chuyển</label>
                  <select
                    value={form.carrier}
                    onChange={(e) => handleChange('carrier', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-black/10 bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] dark:border-white/10"
                  >
                    <option value="DHL Express">DHL Express</option>
                    <option value="GHTK">GHTK (Giao Hàng Tiết Kiệm)</option>
                    <option value="Viettel Post">Viettel Post</option>
                    <option value="J&T Express">J&T Express</option>
                    <option value="VNPost">VNPost</option>
                    <option value="Other">Khác (Other)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">Mã vận đơn</label>
                  <input
                    value={form.carrierTrackingNumber}
                    onChange={(e) => handleChange('carrierTrackingNumber', e.target.value)}
                    placeholder="VD: GHNXXXXXXX"
                    className="mt-1 w-full rounded-lg border border-black/10 bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] dark:border-white/10"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted uppercase tracking-wide">Ghi chú nội bộ</label>
                  <textarea
                    rows={2}
                    value={form.internalNotes}
                    onChange={(e) => handleChange('internalNotes', e.target.value)}
                    placeholder="Ghi chú cho nhân viên..."
                    className="mt-1 w-full rounded-lg border border-black/10 bg-surface px-3 py-2 text-sm text-primary outline-none focus:border-[color:var(--color-gold)] dark:border-white/10 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tracking events */}
          {order.trackingEvents?.length > 0 && (
            <div className="mt-5 rounded-xl border border-black/8 p-4 dark:border-white/8">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Lịch sử trạng thái</p>
              <ol className="relative space-y-3 border-l border-black/10 pl-4 dark:border-white/10">
                {[...order.trackingEvents].reverse().map((ev, i) => (
                  <li key={i} className="relative">
                    <div className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-[color:var(--color-gold)] ring-2 ring-surface" />
                    <p className="text-xs font-medium text-primary">{STATUS_LABELS[ev.status] || ev.status}</p>
                    <p className="text-[11px] text-muted">{ev.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted">{new Date(ev.timestamp).toLocaleString('vi-VN')}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Footer actions */}
          <div className="mt-5 flex gap-3 border-t border-black/8 pt-4 dark:border-white/8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-full border border-[color:var(--color-gold)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[color:var(--color-gold)] transition hover:bg-[color:var(--color-gold)] hover:text-white disabled:opacity-60"
            >
              {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
            <button
              onClick={onClose}
              className="rounded-full border border-black/10 px-4 py-2.5 text-sm text-secondary transition hover:border-black/20 hover:text-primary dark:border-white/10"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
