import { AnimatePresence } from "framer-motion";
import {
  Tag,
  PlusCircle,
  Trash,
  Power,
  Check,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { confirmToast } from "../../lib/confirmToast";
import useCouponsList from "../../hooks/useCouponsList";
import useCouponsModal from "../../hooks/useCouponsModal";
import CreateCouponModal from "./coupons/CreateCouponModal";

const CouponsTab = () => {
  const {
    coupons,
    loading,
    copiedId,
    statCards,
    handleCopy,
    deleteCoupon,
    toggleCoupon,
  } = useCouponsList();
  const { isCreateOpen, openCreate, closeCreate } = useCouponsModal();

  return (
    <div className="space-y-8 min-h-[600px]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold text-primary flex items-center gap-3">
            <Tag className="w-6 h-6 text-[color:var(--color-gold)]" />
            Quản lý Mã Giảm Giá
          </h2>
          <p className="text-sm text-secondary">
            Thiết lập mã khuyến mãi, voucher theo phần trăm hoặc số tiền cố
            định.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[color:var(--color-gold)] text-[color:var(--color-gold)] text-sm font-semibold transition hover:bg-[color:var(--color-gold)] hover:text-white shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> TẠO MÃ MỚI
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-black/8 dark:border-white/8 bg-surface p-5"
          >
            <p className="text-sm font-medium text-muted">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-black/8 dark:border-white/8">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
          <table className="min-w-full">
            <thead className="border-b border-black/8 dark:border-white/8 bg-[color:var(--color-surface-2)] sticky top-0 z-10">
              <tr>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Mã
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Loại Giảm
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                  Đơn tối thiểu
                </th>
                <th className="px-5 py-3.5 text-center text-xs font-semibold text-muted uppercase tracking-wider">
                  Đã Dùng
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Hết Hạn
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted uppercase tracking-wider">
                  Hành Động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded bg-black/8 dark:bg-white/8" />
                      </td>
                    ))}
                  </tr>
                ))}
              {coupons.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16">
                    <Tag className="w-10 h-10 mx-auto mb-3 text-muted opacity-30" />
                    <p className="text-sm text-muted">
                      Chưa có mã giảm giá nào
                    </p>
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpiringSoon =
                    new Date(coupon.expirationDate).getTime() - Date.now() <
                    7 * 24 * 60 * 60 * 1000;
                  const isExpired =
                    new Date(coupon.expirationDate) < new Date();
                  return (
                    <tr
                      key={coupon._id}
                      className="transition hover:bg-[color:var(--color-surface-2)]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-[color:var(--color-gold)]/12 text-[color:var(--color-gold)] border border-[color:var(--color-gold)]/20 font-mono font-bold text-xs px-3 py-1 rounded-lg">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(coupon.code, coupon._id)}
                            className="p-1 text-muted transition hover:text-[color:var(--color-gold)]"
                          >
                            {copiedId === coupon._id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-sm text-primary">
                        {coupon.type === "percent"
                          ? `${coupon.discountValue}%`
                          : `${Number(coupon.discountValue).toLocaleString("vi-VN")}₫`}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-secondary">
                        {coupon.minOrderAmount > 0
                          ? `${Number(coupon.minOrderAmount).toLocaleString("vi-VN")}₫`
                          : "—"}
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-secondary">
                        {coupon.usedCount || 0} /{" "}
                        {coupon.maxUses > 0 ? coupon.maxUses : "∞"}
                      </td>
                      <td className="px-5 py-4 text-sm text-secondary">
                        {new Date(coupon.expirationDate).toLocaleDateString(
                          "vi-VN",
                        )}
                        {isExpiringSoon && !isExpired && (
                          <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Sắp hết hạn
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isExpired ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-black/8 text-muted dark:bg-white/8">
                            Hết hạn
                          </span>
                        ) : coupon.isActive ? (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-green-500/12 text-green-600">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full bg-black/8 text-muted dark:bg-white/8">
                            Disabled
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => toggleCoupon(coupon._id)}
                            disabled={isExpired}
                            className="p-1.5 rounded-lg text-muted transition hover:text-[color:var(--color-gold)] hover:bg-[color:var(--color-gold)]/8 disabled:opacity-40"
                            title={coupon.isActive ? "Tắt mã" : "Bật mã"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              confirmToast(
                                "Bạn có chắc chắn muốn xóa mã này?",
                                () => deleteCoupon(coupon._id),
                              )
                            }
                            className="p-1.5 rounded-lg text-muted transition hover:text-red-500 hover:bg-red-500/8"
                            title="Xóa mã"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isCreateOpen && <CreateCouponModal onClose={closeCreate} />}
      </AnimatePresence>
    </div>
  );
};

export default CouponsTab;
