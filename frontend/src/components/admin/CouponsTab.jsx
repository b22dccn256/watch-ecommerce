import { AnimatePresence } from 'framer-motion';
import { Tag, PlusCircle, Trash, Power, Check, Copy, Percent, DollarSign, AlertTriangle } from 'lucide-react';
import { confirmToast } from '../../lib/confirmToast';
import useCouponsList from '../../hooks/useCouponsList';
import useCouponsModal from '../../hooks/useCouponsModal';
import CreateCouponModal from './coupons/CreateCouponModal';

const CouponsTab = () => {
  const { coupons, loading, copiedId, statCards, handleCopy, deleteCoupon, toggleCoupon } = useCouponsList();
  const { isCreateOpen, openCreate, closeCreate } = useCouponsModal();

  return (
    <div className="space-y-8 min-h-[600px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Tag className="text-luxury-gold w-8 h-8" />
            Quản lý Mã Giảm Giá
          </h1>
          <p className="text-gray-500 dark:text-luxury-text-muted text-sm">
            Thiết lập mã khuyến mãi, voucher theo phần trăm hoặc số tiền cố định.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-white hover:scale-105 transition-all shadow-lg"
        >
          <PlusCircle className="w-4 h-4" /> TẠO MÃ MỚI
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
        {statCards.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-6 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{stat.label}</p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl overflow-hidden border border-gray-100 dark:border-transparent">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
            <thead className="bg-gray-50/95 dark:bg-gray-700/95 sticky top-0 z-10">
              <tr>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase">Mã</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase">Loại Giảm</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-gray-500 uppercase">Đơn tối thiểu</th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-gray-500 uppercase">Đã Dùng</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase">Hết Hạn</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-gray-500 uppercase">Trạng Thái</th>
                <th className="px-5 py-4 text-right text-[10px] font-bold text-gray-500 uppercase">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {coupons.length === 0 && !loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-16 text-gray-400">
                    <Tag className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    Chưa có mã giảm giá nào
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpiringSoon = new Date(coupon.expirationDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;
                  const isExpired = new Date(coupon.expirationDate) < new Date();
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="bg-luxury-gold text-luxury-dark font-mono font-bold text-xs px-3 py-1 rounded-md">{coupon.code}</span>
                          <button type="button" onClick={() => handleCopy(coupon.code, coupon._id)} className="p-1 text-gray-400 hover:text-luxury-gold">
                            {copiedId === coupon._id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-bold text-sm">
                        {coupon.type === 'percent' ? `${coupon.discountValue}%` : `${Number(coupon.discountValue).toLocaleString('vi-VN')}₫`}
                      </td>
                      <td className="px-5 py-4 text-right text-sm text-gray-500">
                        {coupon.minOrderAmount > 0 ? `${Number(coupon.minOrderAmount).toLocaleString('vi-VN')}₫` : '—'}
                      </td>
                      <td className="px-5 py-4 text-center text-sm">
                        {coupon.usedCount || 0} / {coupon.maxUses > 0 ? coupon.maxUses : '∞'}
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {new Date(coupon.expirationDate).toLocaleDateString('vi-VN')}
                        {isExpiringSoon && !isExpired && (
                          <div className="text-[10px] text-red-500 flex items-center gap-1 mt-0.5">
                            <AlertTriangle className="w-3 h-3" /> Sắp hết hạn
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isExpired ? 'Hết hạn' : coupon.isActive ? 'Active' : 'Disabled'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button type="button" onClick={() => toggleCoupon(coupon._id)} disabled={isExpired} className="p-1.5 mr-2">
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmToast('Bạn có chắc chắn muốn xóa mã này?', () => deleteCoupon(coupon._id))}
                          className="p-1.5 text-red-400"
                        >
                          <Trash className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>{isCreateOpen && <CreateCouponModal onClose={closeCreate} />}</AnimatePresence>
    </div>
  );
};

export default CouponsTab;
