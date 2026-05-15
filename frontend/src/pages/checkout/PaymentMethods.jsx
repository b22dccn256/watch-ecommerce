import React from "react";
import { ChevronLeft, CreditCard, QrCode, Banknote } from "lucide-react";

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

const PaymentMethods = ({
  step,
  proceedToReview,
  selectedPayment,
  setSelectedPayment,
  isStripeBlocked,
  setStep,
  handlePaymentSubmit,
  isProcessing,
  checkoutItems,
}) => {
  return (
    <>
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
    </>
  );
};

export default PaymentMethods;
