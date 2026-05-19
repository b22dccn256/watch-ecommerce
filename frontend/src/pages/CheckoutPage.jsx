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
import QrModal from "./checkout/QrModal";

const STRIPE_MAX_AMOUNT = 99999999;

const CheckoutPage = () => {
  const navigate = useNavigate();
  const paymentDoneRef = useRef(false);

  const {
    cart,
    subtotal,
    total,
    shippingFee,
    coupon,
    isCouponApplied,
    clearSelectedCart,
    selectedItems,
  } = useCartStore();
  const user = useUserStore((state) => state.user);

  // Use custom hook for form state and validation
  const {
    step,
    setStep,
    formData,
    errors,
    handleChange,
    proceedToReview,
    validateForm,
  } = useCheckoutForm(user);

  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [pendingTrackingToken, setPendingTrackingToken] = useState(null);
  const pollRef = useRef(null);

  const isStripeBlocked = total > STRIPE_MAX_AMOUNT;

  const checkoutItems = useMemo(
    () => cart.filter((item) => selectedItems.includes(useCartStore.getState().getUniqueId(item))),
    [cart, selectedItems]
  );

  useEffect(() => {
    useCartStore.getState().calculateTotals(formData.city);
  }, [formData.city]);

  useEffect(() => {
    if (isStripeBlocked && selectedPayment === "stripe") {
      setSelectedPayment("qr");
    }
  }, [isStripeBlocked, selectedPayment]);

  useEffect(() => {
    if (checkoutItems.length === 0 && !qrData && !paymentDoneRef.current) {
      navigate("/cart");
    }
  }, [checkoutItems.length, navigate, qrData]);

  const handlePaymentSubmit = async () => {
    if (!validateForm()) return;

    if (selectedPayment === "stripe" && isStripeBlocked) {
      toast.error("Đơn hàng vượt giới hạn Stripe. Vui lòng chọn VietQR hoặc COD.");
      setSelectedPayment("qr");
      return;
    }

    setIsProcessing(true);

    try {
      if (selectedPayment === "qr") {
        const res = await axios.post("/orders/qr", {
          products: checkoutItems,
          couponCode: coupon ? coupon.code : null,
          shippingDetails: formData,
        });

        paymentDoneRef.current = true;
        setQrData(res.data);
        localStorage.removeItem("checkoutFormData");
        clearSelectedCart();
        toast.success("Đã tạo đơn hàng VietQR");
        return;
      }

      const res = await axios.post("/payments/create-checkout-session", {
        products: checkoutItems,
        couponCode: coupon ? coupon.code : null,
        shippingDetails: formData,
        paymentMethod: selectedPayment,
      });

      localStorage.removeItem("checkoutFormData");

      if (!res.data.url) {
        toast.error("Không nhận được đường dẫn thanh toán từ máy chủ.");
        return;
      }

      if (res.data.isCod) {
        paymentDoneRef.current = true;
        clearSelectedCart();
        toast.success("Đặt hàng COD thành công");
      }

      // For VNPay sandbox flow, open the payment URL in a new tab instead of replacing current page
      if (selectedPayment === 'vnpay') {
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
        toast.success('Đã mở trang thanh toán VNPay trong tab mới. Vui lòng hoàn tất thanh toán và quay lại.');
        if (res.data.trackingToken) {
          setPendingTrackingToken(res.data.trackingToken);
        }
      } else {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xử lý thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

  // Poll order tracking endpoint while pendingTrackingToken is set
  useEffect(() => {
    if (!pendingTrackingToken) return;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes if interval 5s
    const intervalMs = 5000;

    const check = async () => {
      try {
        const resp = await axios.get(`/orders/track/${pendingTrackingToken}`);
        if (resp.data && resp.data.paymentStatus === 'paid') {
          toast.success('Thanh toán đã được xác nhận. Cảm ơn bạn!');
          setPendingTrackingToken(null);
          clearSelectedCart();
          paymentDoneRef.current = true;
          navigate(`/purchase-success?order_id=${resp.data.orderId}`);
        }
      } catch (err) {
        // ignore 404 until order appears
      }
      attempts++;
      if (attempts >= maxAttempts) {
        toast('Không nhận được xác nhận thanh toán sau một thời gian. Vui lòng kiểm tra lại sau.');
        setPendingTrackingToken(null);
      }
    };

    // run immediately then set interval
    check();
    pollRef.current = setInterval(check, intervalMs);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pendingTrackingToken]);

  const confirmQrPayment = async () => {
    if (isConfirming) return;

    setIsConfirming(true);
    try {
      await axios.post(`/orders/${qrData.orderId}/confirm-qr-payment`);
      toast.success("Đã gửi xác nhận thanh toán");
      paymentDoneRef.current = true;
      navigate(`/purchase-success?order_id=${qrData.orderId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi xác nhận thanh toán");
    } finally {
      setIsConfirming(false);
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

            <button type="button" onClick={() => navigate("/cart")} className="btn-base btn-ghost h-10 px-1 text-sm text-secondary">
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

      {/* QR Modal Component */}
      <QrModal
        qrData={qrData}
        setQrData={setQrData}
        confirmQrPayment={confirmQrPayment}
        isConfirming={isConfirming}
      />

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
