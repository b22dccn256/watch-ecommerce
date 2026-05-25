import { Search, Download, Eye, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import useOrdersList from '../hooks/useOrdersList';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'awaiting_verification', label: 'Chờ xác minh TT' },
  { value: 'confirmed', label: 'Đã xác nhận' },
  { value: 'processing', label: 'Đang xử lý' },
  { value: 'shipped', label: 'Đang giao' },
  { value: 'delivered', label: 'Đã giao' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'return_requested', label: 'Yêu cầu trả' },
  { value: 'returned', label: 'Đã trả' },
];

const STATUS_STYLES = {
  pending: 'bg-yellow-500/12 text-yellow-600 dark:text-yellow-400',
  awaiting_verification: 'bg-blue-500/12 text-blue-600 dark:text-blue-400',
  confirmed: 'bg-sky-500/12 text-sky-600 dark:text-sky-400',
  processing: 'bg-indigo-500/12 text-indigo-600 dark:text-indigo-400',
  shipped: 'bg-violet-500/12 text-violet-600 dark:text-violet-400',
  delivered: 'bg-green-500/12 text-green-600 dark:text-green-400',
  cancelled: 'bg-red-500/12 text-red-600 dark:text-red-400',
  return_requested: 'bg-orange-500/12 text-orange-600 dark:text-orange-400',
  returned: 'bg-gray-500/12 text-secondary',
};

const STATUS_LABELS = {
  pending: 'Chờ xử lý',
  awaiting_verification: 'Chờ xác minh',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
  return_requested: 'Yêu cầu trả',
  returned: 'Đã trả',
};

const PAYMENT_LABELS = {
  cod: 'COD',
  stripe: 'Thẻ / Stripe',
  vnpay: 'VNPay',
  paypal: 'PayPal',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[status] || 'bg-surface text-secondary'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export default function OrderList({ onOpenOrder }) {
  const {
    orders,
    loading,
    search,
    onSearchChange,
    statusFilter,
    onStatusChange,
    page,
    setPage,
    pagination,
    stats,
    exportCsv,
  } = useOrdersList();

  const { totalPages, totalOrders } = pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-3">
            Quản lý đơn hàng
          </h2>
          <p className="mt-1 text-sm text-secondary">
            Tổng <span className="font-semibold text-primary">{totalOrders.toLocaleString()}</span> đơn
            {stats.pendingCount > 0 && (
              <> · <span className="font-semibold text-yellow-600">{stats.pendingCount} chờ xử lý</span></>
            )}
            {stats.returnedCount > 0 && (
              <> · <span className="font-semibold text-orange-600">{stats.returnedCount} yêu cầu trả</span></>
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 rounded-xl border border-black/10 bg-surface px-3 py-2 text-sm text-secondary transition hover:text-primary dark:border-white/10 shrink-0"
        >
          <Download className="h-4 w-4" />
          Xuất CSV
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm mã đơn, tên, SĐT, email…"
            className="w-full rounded-xl border border-black/10 bg-surface py-2.5 pl-9 pr-3 text-sm text-primary outline-none transition placeholder:text-muted focus:border-[color:var(--color-gold)] dark:border-white/10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-xl border border-black/10 bg-surface px-3 py-2.5 text-sm text-primary outline-none transition focus:border-[color:var(--color-gold)] dark:border-white/10 sm:w-48"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/8 dark:border-white/8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-black/8 bg-[color:var(--color-surface-2)] dark:border-white/8">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Mã đơn</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Khách hàng</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Thanh toán</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Trạng thái</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Ngày đặt</th>
                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted w-14"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-3 py-3">
                        <div className="h-4 rounded bg-black/8 dark:bg-white/8" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Package className="mx-auto mb-3 h-10 w-10 text-muted opacity-40" />
                    <p className="text-sm text-muted">Không tìm thấy đơn hàng</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o._id}
                    className="group transition-colors hover:bg-[color:var(--color-surface-2)]"
                  >
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-bold text-primary">
                        {o.orderCode || (o._id || '').slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm font-semibold text-primary">
                        {o.shippingDetails?.fullName || o.user?.name || 'Khách vãng lai'}
                      </p>
                      <p className="text-xs text-muted mt-0.5">{o.shippingDetails?.phoneNumber || o.user?.email || ''}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="text-sm font-bold text-primary">
                        {o.totalAmount?.toLocaleString('vi-VN')} ₫
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-secondary font-medium">
                        {PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-muted">
                        {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onOpenOrder?.(o)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-secondary transition hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] dark:border-white/10 hover:bg-[color:var(--color-gold)]/5"
                      >
                        <Eye className="h-4 w-4" />
                        Xem
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Trang {page} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-secondary transition hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] disabled:opacity-40 dark:border-white/10"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = totalPages <= 7 ? i + 1 : Math.max(1, page - 3) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border text-xs font-medium transition ${p === page
                    ? 'border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)]'
                    : 'border-black/10 text-secondary hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] dark:border-white/10'
                    }`}
                >
                  {p}
                </button>
              );
            })}
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 text-secondary transition hover:border-[color:var(--color-gold)] hover:text-[color:var(--color-gold)] disabled:opacity-40 dark:border-white/10"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
