import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle } from "lucide-react";

const QrModal = ({ qrData, setQrData, confirmQrPayment, isConfirming }) => {
  return (
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
  );
};

export default QrModal;
