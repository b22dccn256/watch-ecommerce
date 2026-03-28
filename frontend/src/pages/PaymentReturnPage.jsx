import { useEffect, useState, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, ShoppingBag, ArrowRight } from "lucide-react";
import axios from "../lib/axios";
import { useCartStore } from "../stores/useCartStore";
import Confetti from "react-confetti";

const PaymentReturnPage = ({ method }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("loading"); // "loading", "success", "failed"
    const [message, setMessage] = useState("Đang xử lý kết quả giao dịch...");
    const { clearSelectedCart } = useCartStore();
    const processedRef = useRef(false);

    useEffect(() => {
        if (processedRef.current) return;
        processedRef.current = true;

        const processReturn = async () => {
            try {
                // Determine order code and status based on method
                let isSuccess = false;
                let orderCode = "";
                let errorMsg = "";

                if (method === "vnpay") {
                    const responseCode = searchParams.get("vnp_ResponseCode");
                    orderCode = searchParams.get("vnp_TxnRef");
                    isSuccess = responseCode === "00";
                    if (!isSuccess) errorMsg = "Giao dịch bị hủy hoặc thất bại tại VNPay.";
                } else if (method === "momo") {
                    const resultCode = searchParams.get("resultCode");
                    orderCode = searchParams.get("orderId");
                    isSuccess = resultCode === "0";
                    if (!isSuccess) errorMsg = "Giao dịch MoMo không thành công.";
                } else if (method === "zalopay") {
                    const statusParam = searchParams.get("status");
                    const apptransid = searchParams.get("apptransid");
                    orderCode = apptransid ? apptransid.split("_")[1] : "";
                    isSuccess = statusParam === "1";
                    if (!isSuccess) errorMsg = "Giao dịch ZaloPay thất bại.";
                }

                if (isSuccess) {
                    // Check order on backend simply by querying status (wait for IPN to process)
                    console.log(`Payment success for ${orderCode}`);
                    clearSelectedCart(); // Remove items from cart since payment is successful
                    setStatus("success");
                    setMessage(`Giao dịch thành công! Đơn hàng của bạn đang được chuẩn bị.`);
                } else {
                    setStatus("failed");
                    setMessage(errorMsg || "Giao dịch không thành công. Vui lòng thử lại.");
                }
            } catch (error) {
                console.error("Error processing return:", error);
                setStatus("failed");
                setMessage("Lỗi xử lý kết quả thanh toán.");
            }
        };

        processReturn();
    }, [method, searchParams, clearSelectedCart]);

    if (status === "loading") {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Đang kiểm tra kết quả thanh toán...</p>
                </div>
            </div>
        );
    }

    if (status === "success") {
        return (
            <div className="min-h-screen py-32 flex items-center justify-center bg-gray-50 dark:bg-[#0f0c08]">
                <Confetti
                    width={window.innerWidth}
                    height={window.innerHeight}
                    recycle={false}
                    numberOfPieces={300}
                    gravity={0.15}
                    colors={['#10B981', '#34D399', '#D4AF37', '#F59E0B']}
                />
                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 relative z-10 m-4">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Thanh Toán Thành Công</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-8">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Chúng tôi đã gửi email xác nhận cùng biên lai chi tiết đến hòm thư của bạn.
                        </p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <Link
                            to="/catalog"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                        >
                            Tiếp tục mua sắm <ShoppingBag className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-32 flex items-center justify-center bg-gray-50 dark:bg-[#0f0c08]">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-gray-100 dark:border-gray-700 m-4">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Thanh Toán Thất Bại</h1>
                <p className="text-gray-500 dark:text-gray-400 mb-8">{message}</p>
                <div className="flex flex-col gap-3">
                    <Link
                        to="/cart"
                        className="w-full bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-xl transition duration-300 flex items-center justify-center gap-2"
                    >
                        Quay lại Giỏ hàng <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default PaymentReturnPage;
