import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  ChevronLeft,
  CreditCard,
  QrCode,
  ShoppingBag,
  Truck,
  X,
} from "lucide-react";

import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import CheckoutStepper from "../components/CheckoutStepper";
import Input from "../components/ui/Input";

const STRIPE_MAX_AMOUNT = 99999999;

const paymentOptions = [
  {
    id: "vnpay",
    name: "VNPay",
    desc: "ATM nội địa, Visa, MasterCard",
    icon: CreditCard,
  },
  {
    id: "momo",
    name: "MoMo",
    desc: "Ví điện tử MoMo",
    icon: QrCode,
  },
  {
    id: "zalopay",
    name: "ZaloPay",
    desc: "Thanh toán qua ZaloPay",
    icon: QrCode,
  },
  {
    id: "stripe",
    name: "Stripe",
    desc: "Thẻ quốc tế",
    icon: CreditCard,
  },
  {
    id: "qr",
    name: "VietQR",
    desc: "Chuyển khoản ngân hàng",
    icon: QrCode,
  },
  {
    id: "cod",
    name: "COD",
    desc: "Thanh toán khi nhận hàng",
    icon: Banknote,
  },
];

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

  const [step, setStep] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [qrData, setQrData] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    address: "",
    city: "",
    orderNotes: "",
  });
  const [errors, setErrors] = useState({});

  const isStripeBlocked = total > STRIPE_MAX_AMOUNT;

  const checkoutItems = useMemo(
    () => cart.filter((item) => selectedItems.includes(useCartStore.getState().getUniqueId(item))),
    [cart, selectedItems]
  );

  useEffect(() => {
    const savedData = localStorage.getItem("checkoutFormData");

    if (savedData) {
      setFormData(JSON.parse(savedData));
      return;
    }

    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || "",
        email: user.email || "",
        phoneNumber: user.phone || "",
      }));
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("checkoutFormData", JSON.stringify(formData));
  }, [formData]);

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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) nextErrors.fullName = "Họ và tên là bắt buộc";

    const phoneRegex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;
    if (!formData.phoneNumber.trim()) nextErrors.phoneNumber = "Số điện thoại là bắt buộc";
    else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
      nextErrors.phoneNumber = "Số điện thoại không hợp lệ";
    }

    if (!formData.email.trim()) nextErrors.email = "Email là bắt buộc";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Email không hợp lệ";
    }

    if (!formData.address.trim()) nextErrors.address = "Địa chỉ là bắt buộc";
    if (!formData.city.trim()) nextErrors.city = "Tỉnh/Thành phố là bắt buộc";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const proceedToReview = () => {
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setStep(2);
  };

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

      window.location.href = res.data.url;
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xử lý thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

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
            <div className="rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10 sm:p-6">
              <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-secondary">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 text-[color:var(--color-gold)]">1</span>
                Thông tin giao hàng
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Họ và tên"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  placeholder="Nguyễn Văn A"
                />
                <Input
                  label="Số điện thoại"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  error={errors.phoneNumber}
                  placeholder="0912345678"
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="nva@example.com"
                  containerClassName="sm:col-span-2"
                />
                <Input
                  label="Địa chỉ"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  placeholder="Số nhà, đường, phường/xã"
                  containerClassName="sm:col-span-2"
                />
                <Input
                  label="Tỉnh/Thành phố"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  error={errors.city}
                  placeholder="Hà Nội"
                />
                <Input
                  as="textarea"
                  label="Ghi chú"
                  name="orderNotes"
                  value={formData.orderNotes}
                  onChange={handleChange}
                  placeholder="Lưu ý khi giao hàng"
                  rows={4}
                />
              </div>
            </div>

            {step === 1 ? (
              <button type="button" onClick={proceedToReview} className="btn-base btn-primary h-12 px-6">
                Tiếp tục đến thanh toán
              </button>
            ) : (
              <div className="space-y-4 rounded-[1.4rem] border border-black/10 bg-surface p-5 shadow-sm dark:border-white/10 sm:p-6">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-secondary">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--color-gold)]/40 text-[color:var(--color-gold)]">2</span>
                  Chọn phương thức thanh toán
                </div>

                {isStripeBlocked && (
                  <div className="rounded-xl border border-amber-300/40 bg-amber-100/50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                    Stripe không khả dụng cho đơn hàng vượt 99.999.999 VNĐ.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {paymentOptions.map((option) => {
                    const Icon = option.icon;
                    const disabled = option.id === "stripe" && isStripeBlocked;
                    const active = selectedPayment === option.id;

                    return (
                      <label
                        key={option.id}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${active ? "border-[color:var(--color-gold)] bg-[color:var(--color-gold)]/8" : "border-black/10 hover:border-[color:var(--color-gold)]/55 dark:border-white/10"} ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        <input
                          type="radio"
                          className="mt-1"
                          checked={active}
                          onChange={() => !disabled && setSelectedPayment(option.id)}
                          disabled={disabled}
                        />
                        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-soft">
                          <Icon className="h-4 w-4 text-[color:var(--color-gold)]" />
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-primary">{option.name}</span>
                          <span className="mt-1 block text-xs text-muted">{option.desc}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="btn-base btn-outline h-11 px-5">
                    <ChevronLeft className="h-4 w-4" />
                    Chỉnh sửa thông tin
                  </button>
                  <button
                    type="button"
                    onClick={handlePaymentSubmit}
                    disabled={isProcessing || checkoutItems.length === 0}
                    className="btn-base btn-primary h-11 px-6"
                  >
                    {isProcessing ? "Đang xử lý" : "Xác nhận và thanh toán"}
                  </button>
                </div>
              </div>
            )}

            <button type="button" onClick={() => navigate("/cart")} className="btn-base btn-ghost h-10 px-1 text-sm text-secondary">
              <ChevronLeft className="h-4 w-4" />
              Quay lại giỏ hàng
            </button>
          </section>

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
        </div>
      </div>

      <AnimatePresence>
        {qrData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="relative w-full max-w-sm rounded-2xl border border-black/10 bg-surface p-6"
            >
              <button type="button" onClick={() => setQrData(null)} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-muted">
                <X className="h-4 w-4" />
              </button>

              <div className="space-y-4 text-center">
                <div className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-gold)]/20">
                  <CheckCircle className="h-6 w-6 text-[color:var(--color-gold)]" />
                </div>
                <h3 className="hero-title text-2xl">Chuyển khoản VietQR</h3>
                <p className="text-sm text-secondary">Quét mã để thanh toán, sau đó nhấn xác nhận.</p>

                <div className="inline-block rounded-xl border border-black/10 bg-white p-3">
                  <img
                    src={`https://img.vietqr.io/image/970422-0393043834-compact.png?amount=${qrData.totalAmount}&addInfo=THANHTOAN%20${qrData.orderCode}&accountName=NGUYEN%20VAN%20A`}
                    alt="VietQR"
                    className="mx-auto w-full max-w-[240px] rounded-lg"
                  />
                </div>

                <div className="rounded-xl border border-black/10 bg-surface-soft p-3 text-left text-sm">
                  <p className="flex justify-between"><span className="text-muted">Số tiền</span><span className="font-semibold text-primary">{qrData.totalAmount.toLocaleString("vi-VN")} đ</span></p>
                  <p className="mt-2 flex justify-between"><span className="text-muted">Nội dung</span><span className="font-semibold">THANHTOAN {qrData.orderCode}</span></p>
                </div>

                <button
                  type="button"
                  onClick={confirmQrPayment}
                  disabled={isConfirming}
                  className="btn-base btn-primary h-11 w-full"
                >
                  {isConfirming ? "Đang xác nhận" : "Tôi đã chuyển khoản"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
