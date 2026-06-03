import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { AlertCircle, ChevronLeft } from "lucide-react";

import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import CheckoutStepper from "../components/CheckoutStepper";

// Subcomponents and hooks
import { useCheckoutForm } from "./checkout/useCheckoutForm";
import ShippingForm from "./checkout/ShippingForm";
import PaymentMethods from "./checkout/PaymentMethods";
import OrderSummary from "./checkout/OrderSummary";

const STRIPE_MAX_AMOUNT = 99999999;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const paymentDoneRef = useRef(false);
  const isSubmittingOrder = useRef(false);

  const {
    cart,
    subtotal,
    total,
    shippingFee,
    coupon,
    isCouponApplied,
    clearSelectedCart,
    selectedItems,
    isCartLoaded,
  } = useCartStore();
  const user = useUserStore((state) => state.user);

  // Use custom hook for form state and validation
  const {
    step,
    setStep,
    formData,
    errors,
    handleChange,
    savedAddresses,
    selectedAddressId,
    setSelectedAddressId,
    applyAddress,
    proceedToReview,
    validateForm,
  } = useCheckoutForm(user);

  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const isStripeBlocked = total > STRIPE_MAX_AMOUNT;

  const checkoutItems = useMemo(
    () =>
      cart.filter((item) =>
        selectedItems.includes(useCartStore.getState().getUniqueId(item)),
      ),
    [cart, selectedItems],
  );

  useEffect(() => {
    useCartStore.getState().calculateTotals(formData.city);
  }, [formData.city]);

  useEffect(() => {
    if (isStripeBlocked && selectedPayment === "stripe") {
      setSelectedPayment("vnpay");
    }
  }, [isStripeBlocked, selectedPayment]);

  useEffect(() => {
    if (
      isCartLoaded &&
      checkoutItems.length === 0 &&
      !paymentDoneRef.current &&
      !isSubmittingOrder.current
    ) {
      navigate("/cart");
    }
  }, [checkoutItems.length, isCartLoaded, navigate]);

  const handlePaymentSubmit = async () => {
    if (!validateForm()) return;

    if (selectedPayment === "stripe" && isStripeBlocked) {
      toast.error(
        "Đơn hàng vượt giới hạn Stripe. Vui lòng chọn VNPay hoặc COD.",
      );
      setSelectedPayment("vnpay");
      return;
    }

    // Đánh dấu đang trong quá trình submit — ngăn useEffect redirect về /cart
    // khi giỏ hàng bị xóa giữa lúc API thành công và window.location.href navigate
    isSubmittingOrder.current = true;
    setIsProcessing(true);

    try {
      const res = await axios.post("/payments/create-checkout-session", {
        products: checkoutItems,
        couponCode: coupon ? coupon.code : null,
        shippingDetails: formData,
        paymentMethod: selectedPayment,
      });

      localStorage.removeItem("checkoutFormData");

      if (!res.data.url) {
        toast.error("Không nhận được đường dẫn thanh toán từ máy chủ.");
        isSubmittingOrder.current = false;
        return;
      }

      if (res.data.isCod) {
        paymentDoneRef.current = true;
        clearSelectedCart();
        toast.success("Đặt hàng COD thành công");
      }

      // Navigate sau khi flag đã chắc chắn được đặt
      window.location.href = res.data.url;
    } catch (error) {
      // Thất bại — mở lại cờ để useEffect guard hoạt động bình thường
      isSubmittingOrder.current = false;
      toast.error(
        error.response?.data?.message || "Không thể xử lý thanh toán",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen pb-16">
      <CheckoutStepper currentStep={2} />

      <div className="mx-auto max-w-screen-2xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-2">
          <p className="hero-kicker text-[color:var(--color-gold)]">Checkout</p>
          <h1 className="hero-title text-4xl">Hoàn tất đơn hàng</h1>
        </div>

        <div className="grid gap-8 xl:grid-cols-[1fr_380px]">
          <section className="space-y-5">
            {/* Shipping Form Component */}
            <ShippingForm
              formData={formData}
              handleChange={handleChange}
              errors={errors}
              savedAddresses={savedAddresses}
              selectedAddressId={selectedAddressId}
              setSelectedAddressId={setSelectedAddressId}
              onSelectAddress={applyAddress}
              userEmail={user?.email || ""}
            />

            {/* Payment Methods Component */}
            <PaymentMethods
              step={step}
              proceedToReview={proceedToReview}
              selectedPayment={selectedPayment}
              setSelectedPayment={setSelectedPayment}
              isStripeBlocked={isStripeBlocked}
              setStep={setStep}
              handlePaymentSubmit={handlePaymentSubmit}
              isProcessing={isProcessing}
              checkoutItems={checkoutItems}
            />

            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="btn-base btn-ghost h-10 px-1 text-sm text-secondary"
            >
              <ChevronLeft className="h-4 w-4" />
              Quay lại giỏ hàng
            </button>
          </section>

          {/* Order Summary Component */}
          <OrderSummary
            checkoutItems={checkoutItems}
            subtotal={subtotal}
            total={total}
            shippingFee={shippingFee}
            coupon={coupon}
            isCouponApplied={isCouponApplied}
          />
        </div>
      </div>

      {Object.keys(errors).length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl border border-black/15 bg-white/95 px-4 py-3 text-sm text-secondary shadow-lg dark:border-white/15 dark:bg-black/75 dark:text-gray-200">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[color:var(--color-gold)]" />
            Vui lòng kiểm tra lại thông tin giao hàng.
          </span>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;
