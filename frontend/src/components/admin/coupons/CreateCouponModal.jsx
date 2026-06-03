import { useState } from "react";
import { motion } from "framer-motion";
import {
  Tag,
  PlusCircle,
  Percent,
  DollarSign,
  Calendar,
  X,
} from "lucide-react";
import { useCouponStore } from "../../../stores/useCouponStore";

const CreateCouponModal = ({ onClose }) => {
  const { createCoupon, loading } = useCouponStore();
  const [formData, setFormData] = useState({
    code: "",
    type: "percent",
    discountValue: "",
    minOrderAmount: "",
    maxUses: "",
    expirationDate: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createCoupon({
      ...formData,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxUses: Number(formData.maxUses) || 0,
    });
    if (success) onClose();
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++)
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData({ ...formData, code });
  };

  let previewText = "Chưa có nội dung giảm giá hợp lệ.";
  if (formData.discountValue) {
    const val =
      formData.type === "percent"
        ? `${formData.discountValue}%`
        : `${Number(formData.discountValue).toLocaleString("vi-VN")}đ`;
    const min = formData.minOrderAmount
      ? `cho đơn từ ${Number(formData.minOrderAmount).toLocaleString("vi-VN")}đ`
      : "cho mọi đơn hàng";
    const uses = formData.maxUses
      ? `tối đa ${formData.maxUses} lần`
      : "không giới hạn số lần";
    previewText = `Giảm ${val} ${min}, ${uses}.`;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-2xl bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-2xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-luxury-border">
          <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-luxury-gold">
            <PlusCircle className="w-5 h-5 text-luxury-gold" />
            Tạo Mã Giảm Giá Mới
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Mã Coupon *
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    code: e.target.value.toUpperCase(),
                  })
                }
                placeholder="VD: SUMMER2024"
                className="flex-1 bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm font-mono uppercase"
              />
              <button
                type="button"
                onClick={generateCode}
                className="px-4 py-2 border border-luxury-gold text-luxury-gold rounded-xl font-bold text-sm"
              >
                Tạo ngẫu nhiên
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Loại giảm giá
              </label>
              <div className="flex bg-gray-100 dark:bg-luxury-dark p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "percent",
                      discountValue: "",
                    })
                  }
                  className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 ${formData.type === "percent" ? "bg-white dark:bg-luxury-darker text-luxury-gold shadow" : ""}`}
                >
                  <Percent className="w-4 h-4" /> Phần trăm
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      type: "fixed",
                      discountValue: "",
                    })
                  }
                  className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 ${formData.type === "fixed" ? "bg-white dark:bg-luxury-darker text-luxury-gold shadow" : ""}`}
                >
                  <DollarSign className="w-4 h-4" /> Số tiền
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Giá trị giảm *
              </label>
              <input
                type="number"
                required
                min="1"
                max={formData.type === "percent" ? 100 : undefined}
                value={formData.discountValue}
                onChange={(e) =>
                  setFormData({ ...formData, discountValue: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-luxury-dark border rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Đơn tối thiểu
              </label>
              <input
                type="number"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minOrderAmount: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-luxury-dark border rounded-xl px-4 py-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                Số lần dùng tối đa
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={(e) =>
                  setFormData({ ...formData, maxUses: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-luxury-dark border rounded-xl px-4 py-3 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
              Ngày hết hạn *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="datetime-local"
                required
                value={formData.expirationDate}
                onChange={(e) =>
                  setFormData({ ...formData, expirationDate: e.target.value })
                }
                className="w-full bg-gray-50 dark:bg-luxury-dark border rounded-xl pl-10 pr-4 py-3 text-sm"
              />
            </div>
          </div>

          <div className="bg-luxury-gold/10 border border-luxury-gold/20 p-4 rounded-xl flex items-start gap-3">
            <Tag className="w-5 h-5 text-luxury-gold shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-luxury-gold">
                Xem trước quy tắc
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                {previewText}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-luxury-border">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border text-sm font-bold"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || !formData.code}
              className="px-8 py-2.5 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold disabled:opacity-50"
            >
              Tạo Mã
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default CreateCouponModal;
