import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { useCartStore } from "../stores/useCartStore";
import CartItem from "../components/CartItem";
import OrderSummary from "../components/OrderSummary";
import GiftCouponCard from "../components/GiftCouponCard";
import CheckoutStepper from "../components/CheckoutStepper";

const EmptyState = () => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    className="rounded-[1.8rem] border border-black/10 bg-surface p-10 text-center shadow-md dark:border-white/10"
  >
    <div className="mx-auto mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-surface-soft dark:border-white/10">
      <ShoppingBag className="h-8 w-8 text-[color:var(--color-gold)]" />
    </div>
    <h2 className="hero-title text-4xl">Bộ sưu tập trống</h2>
    <p className="mx-auto mt-4 max-w-lg text-sm text-secondary sm:text-base">
      Khám phá những tuyệt tác thời gian để bổ sung vào bộ sưu tập của bạn.
    </p>
    <Link to="/catalog" className="btn-base btn-primary mt-7 h-11 px-6">
      Khám phá Bộ Sưu Tập
      <ArrowRight className="h-4 w-4" />
    </Link>

    <div className="mt-8 grid gap-3 text-xs text-muted sm:grid-cols-3">
      <div className="rounded-xl bg-surface-soft p-3">
        <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-[color:var(--color-gold)]" />
        Chính hãng
      </div>
      <div className="rounded-xl bg-surface-soft p-3">
        <CheckCircle2 className="mx-auto mb-1 h-4 w-4 text-[color:var(--color-gold)]" />
        Đổi trả linh hoạt
      </div>
      <div className="rounded-xl bg-surface-soft p-3">
        <Truck className="mx-auto mb-1 h-4 w-4 text-[color:var(--color-gold)]" />
        Giao hàng toàn quốc
      </div>
    </div>
  </motion.div>
);

const ShippingProgress = ({ subtotal }) => {
  const threshold = 2000000;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));
  const isReached = subtotal >= threshold;

  return (
    <div className="rounded-xl border border-black/10 bg-surface p-4 dark:border-white/10">
      <p className="text-sm text-secondary">
        {isReached
          ? "Bạn đã đạt ưu đãi miễn phí vận chuyển."
          : `Mua thêm ${(threshold - subtotal).toLocaleString("vi-VN")} đ để nhận miễn phí vận chuyển.`}
      </p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
        <div
          className="h-full bg-[color:var(--color-gold)] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

const CartPage = () => {
  const { cart, selectedItems, selectAllItems, subtotal } = useCartStore();
  const { getUniqueId } = useCartStore.getState();

  const isAllSelected = cart.length > 0 && selectedItems.length === cart.length;

  const handleSelectAll = (event) => {
    selectAllItems(event.target.checked, cart);
  };

  return (
    <div className="min-h-screen pb-20 sm:pb-10 pt-20 md:pt-24">
      <CheckoutStepper currentStep={1} />

      <div className="mx-auto max-w-screen-2xl space-y-6 px-4 sm:px-6 lg:px-8">
        {cart.length > 0 && (
          <div className="space-y-2">
            <p className="hero-kicker text-[color:var(--color-gold)]">
              Shopping bag
            </p>
            <h1 className="hero-title text-3xl">Giỏ hàng của bạn</h1>
          </div>
        )}

        {cart.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
            <section className="space-y-4">
              <ShippingProgress subtotal={subtotal} />

              <label className="flex items-center gap-3 rounded-xl border border-black/10 bg-surface px-4 py-3 text-sm text-secondary dark:border-white/10">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="h-4 w-4 rounded border-black/20 text-[color:var(--color-gold)] focus:ring-[color:var(--color-gold)]/30"
                />
                <span className="font-semibold uppercase tracking-[0.14em]">
                  Chọn tất cả ({cart.length})
                </span>
              </label>

              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={getUniqueId(item)}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-black/10 bg-surface p-3 dark:border-white/10 sm:p-4"
                  >
                    <CartItem item={item} />
                  </motion.div>
                ))}
              </div>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-24 xl:h-fit">
              <div className="rounded-xl border border-black/10 bg-surface p-4 shadow-sm dark:border-white/10">
                <OrderSummary />
              </div>
              <div className="rounded-xl border border-black/10 bg-surface p-4 shadow-sm dark:border-white/10">
                <GiftCouponCard />
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
