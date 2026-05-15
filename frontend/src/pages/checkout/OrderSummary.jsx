import React from "react";
import { ShoppingBag, Truck } from "lucide-react";

const OrderSummary = ({ checkoutItems, subtotal, total, shippingFee, coupon, isCouponApplied }) => {
  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
      <div className="rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-primary">
          <ShoppingBag className="h-5 w-5 text-[color:var(--color-gold)]" />
          Tóm tắt đơn hàng
        </h2>

        <div className="custom-scrollbar max-h-72 space-y-3 overflow-y-auto pr-2">
          {checkoutItems.map((item) => (
            <div key={item._id + (item.selectedColor || "") + (item.selectedSize || "") + (item.wristSize || "")} className="flex gap-3 rounded-lg bg-surface-soft p-3">
              <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="truncate font-medium text-primary">{item.name}</p>
                <p className="text-xs text-muted">x{item.quantity}</p>
                {(item.selectedColor || item.selectedSize || item.wristSize) && (
                  <p className="mt-1 text-[11px] text-muted">
                    {[item.selectedColor && `Màu ${item.selectedColor}`, item.selectedSize && `Size ${item.selectedSize}`, item.wristSize && `Cổ tay ${item.wristSize}`].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
              <p className="text-sm font-semibold text-primary">{(item.price * item.quantity).toLocaleString("vi-VN")} đ</p>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-black/8 pt-4 text-sm dark:border-white/8">
          <div className="flex items-center justify-between text-secondary">
            <span>Tạm tính</span>
            <span>{subtotal.toLocaleString("vi-VN")} đ</span>
          </div>
          {coupon && isCouponApplied && (
            <div className="flex items-center justify-between text-[color:var(--color-gold)]">
              <span>Giảm giá ({coupon.code})</span>
              <span>-{coupon.discountPercentage}%</span>
            </div>
          )}
          <div className="flex items-center justify-between text-secondary">
            <span className="inline-flex items-center gap-1"><Truck className="h-4 w-4" />Vận chuyển</span>
            <span>{shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString("vi-VN")} đ`}</span>
          </div>
          <div className="flex items-center justify-between border-t border-black/8 pt-2 text-base font-semibold text-primary dark:border-white/8">
            <span>Tổng cộng</span>
            <span className="text-[color:var(--color-gold)]">{total.toLocaleString("vi-VN")} đ</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default OrderSummary;
