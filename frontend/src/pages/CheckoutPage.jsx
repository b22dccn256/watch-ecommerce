import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { useUserStore } from "../stores/useUserStore";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { loadStripe } from "@stripe/stripe-js";
import { CheckCircle, AlertCircle, ShoppingBag, X, ChevronRight, ChevronLeft, Truck } from "lucide-react";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutPage = () => {
    const { cart, total, subtotal, coupon, isCouponApplied, clearCart } = useCartStore();
    const { user } = useUserStore();
    const navigate = useNavigate();

    const [reviewStep, setReviewStep] = useState(false); // false = form, true = review

    const [formData, setFormData] = useState({
        fullName: "",
        phoneNumber: "",
        email: "",
        address: "",
        city: "",
        orderNotes: ""
    });

    const [errors, setErrors] = useState({});
    const [isProcessing, setIsProcessing] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false); // Loading khi xác nhận QR
    const [qrData, setQrData] = useState(null); // For QR modal
    const paymentDoneRef = useRef(false);

    // Load saved form data + auto-fill từ user nếu chưa có dữ liệu
    useEffect(() => {
        const savedData = localStorage.getItem("checkoutFormData");
        if (savedData) {
            setFormData(JSON.parse(savedData));
        } else if (user) {
            // Auto-fill từ thông tin tài khoản
            setFormData(prev => ({
                ...prev,
                fullName: user.name || "",
                email: user.email || "",
                phoneNumber: user.phone || "",
            }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save form data on change
    useEffect(() => {
        localStorage.setItem("checkoutFormData", JSON.stringify(formData));
    }, [formData]);

    useEffect(() => {
        if (cart.length === 0 && !qrData && !paymentDoneRef.current) {
            navigate("/cart");
        }
    }, [cart, navigate, qrData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName.trim()) newErrors.fullName = "Họ và tên là bắt buộc";

        // Regex chuẩn Việt Nam: hỗ trợ đầy đủ đầu số Viettel/Mobifone/Vinaphone/Gmobile/Reddi
        const phoneRegex = /^(0|\+84)(3[2-9]|5[25689]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;
        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = "Số điện thoại là bắt buộc";
        } else if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ""))) {
            newErrors.phoneNumber = "Số điện thoại không hợp lệ";
        }

        // Email bắt buộc (cần để gửi email xác nhận đơn hàng)
        if (!formData.email.trim()) {
            newErrors.email = "Email là bắt buộc (để nhận xác nhận đơn hàng)";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (!formData.address.trim()) newErrors.address = "Địa chỉ là bắt buộc";
        if (!formData.city.trim()) newErrors.city = "Thành phố là bắt buộc";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Bước 1: Validate form → chuyển sang review
    const handleProceedToReview = () => {
        if (validateForm()) setReviewStep(true);
        else window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePaymentStripe = async () => {
        if (!validateForm()) return;
        setIsProcessing(true);

        try {
            const stripe = await stripePromise;
            const res = await axios.post("/payments/create-checkout-session", {
                products: cart,
                couponCode: coupon ? coupon.code : null,
                shippingDetails: formData
            });

            const session = res.data;

            // Clear storage before redirecting
            localStorage.removeItem("checkoutFormData");

            const result = await stripe.redirectToCheckout({
                sessionId: session.id,
            });

            if (result.error) {
                toast.error(result.error.message || "Lỗi giao dịch Stripe");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi thanh toán Stripe");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentCOD = async () => {
        if (!validateForm()) return;
        setIsProcessing(true);

        try {
            const res = await axios.post("/orders/cod", {
                products: cart,
                couponCode: coupon ? coupon.code : null,
                shippingDetails: formData
            });

            localStorage.removeItem("checkoutFormData");
            paymentDoneRef.current = true; // đánh dấu đồng bộ TRƯỚC khi clearCart
            clearCart();
            toast.success("Đặt hàng COD thành công!");
            navigate(`/purchase-success?order_id=${res.data.orderId}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi đặt hàng COD");
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePaymentQR = async () => {
        if (!validateForm()) return;
        setIsProcessing(true);

        try {
            const res = await axios.post("/orders/qr", {
                products: cart,
                couponCode: coupon ? coupon.code : null,
                shippingDetails: formData
            });

            paymentDoneRef.current = true; // đánh dấu đồng bộ TRƯỚC khi clearCart
            setQrData(res.data);
            localStorage.removeItem("checkoutFormData");
            clearCart();
            toast.success("Đơn hàng QR đã tạo thành công!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi tạo đơn hàng QR");
        } finally {
            setIsProcessing(false);
        }
    };

    // Xác nhận đã chuyển khoản QR — đơn chuyển sang awaiting_verification, chờ admin kiểm tra
    const handleConfirmQRPayment = async () => {
        if (isConfirming) return; // Chống spam click
        setIsConfirming(true);
        try {
            await axios.post(`/orders/${qrData.orderId}/confirm-qr-payment`);
            toast.success("Đã nhận thông tin! Chúng tôi đang kiểm tra thanh toán của bạn.");
            paymentDoneRef.current = true;
            navigate(`/purchase-success?order_id=${qrData.orderId}`);
        } catch (error) {
            const msg = error.response?.data?.message || "Lỗi xác nhận, vui lòng thử lại hoặc liên hệ hỗ trợ.";
            toast.error(msg);
            // Không navigate — user ở lại modal để thử lại
        } finally {
            setIsConfirming(false);
        }
    };

    const formatPrice = (price) => price.toLocaleString("vi-VN");

    return (
        <div className="py-8 md:py-16">
            <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Left Col: Form */}
                    <motion.div
                        className="flex-1 space-y-6"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-6 h-6" /> Thông tin giao hàng
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        disabled={isProcessing}
                                        className={`w-full bg-gray-50 dark:bg-gray-700 border ${errors.fullName ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-lg px-4 py-2.5 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="Nguyễn Văn A"
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.fullName}</p>}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        disabled={isProcessing}
                                        className={`w-full bg-gray-50 dark:bg-gray-700 border ${errors.phoneNumber ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-lg px-4 py-2.5 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="0912345678"
                                    />
                                    {errors.phoneNumber && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.phoneNumber}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        disabled={isProcessing}
                                        className={`w-full bg-gray-50 dark:bg-gray-700 border ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-lg px-4 py-2.5 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="nva@example.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.email}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ cụ thể <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        disabled={isProcessing}
                                        className={`w-full bg-gray-50 dark:bg-gray-700 border ${errors.address ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-lg px-4 py-2.5 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="Số nhà, Tên đường, Phường/Xã..."
                                    />
                                    {errors.address && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.address}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tỉnh / Thành phố <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        disabled={isProcessing}
                                        className={`w-full bg-gray-50 dark:bg-gray-700 border ${errors.city ? 'border-red-500' : 'border-gray-200 dark:border-gray-600'} rounded-lg px-4 py-2.5 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition placeholder-gray-400 dark:placeholder-gray-500`}
                                        placeholder="Hà Nội"
                                    />
                                    {errors.city && <p className="text-red-500 text-xs mt-1 flex items-center"><AlertCircle className="w-3 h-3 mr-1" />{errors.city}</p>}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú đơn hàng (Không bắt buộc)</label>
                                    <textarea
                                        name="orderNotes"
                                        value={formData.orderNotes}
                                        onChange={handleChange}
                                        disabled={isProcessing}
                                        rows="3"
                                        className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-2.5 text-black dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition resize-none placeholder-gray-400 dark:placeholder-gray-500"
                                        placeholder="Lưu ý khi giao hàng..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Col: Order Summary & Payment */}
                    <motion.div
                        className="w-full lg:w-96 flex-none space-y-6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <div className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm'>
                            <h3 className='text-lg font-semibold text-emerald-600 dark:text-emerald-400 mb-4'>Đơn hàng của bạn</h3>
                            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {cart.map(item => (
                                    <div key={item._id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded bg-gray-100 dark:bg-gray-700" />
                                            <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]" title={item.name}>{item.name} <span className="text-gray-400 dark:text-gray-500">x{item.quantity}</span></span>
                                        </div>
                                        <span className="font-medium text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)} ₫</span>
                                    </div>
                                ))}
                            </div>

                            <div className='space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4'>
                                <div className='flex justify-between text-gray-500 dark:text-gray-400'>
                                    <span>Tạm tính</span>
                                    <span>{formatPrice(subtotal)} ₫</span>
                                </div>
                                {coupon && isCouponApplied && (
                                    <div className='flex justify-between text-emerald-600 dark:text-emerald-400'>
                                        <span>Giảm giá ({coupon.code})</span>
                                        <span>-{coupon.discountPercentage}%</span>
                                    </div>
                                )}
                                <div className='flex justify-between text-gray-500 dark:text-gray-400 items-center'>
                                    <span className='flex items-center gap-1.5'><Truck className='w-4 h-4 text-emerald-500' /> Phí vận chuyển</span>
                                    <span className='text-emerald-600 dark:text-emerald-400 font-medium'>Miễn phí</span>
                                </div>
                                <div className='flex justify-between font-bold text-lg pt-2 border-t border-gray-100 dark:border-gray-700'>
                                    <span className="text-gray-900 dark:text-white">Tổng cộng</span>
                                    <span className="text-emerald-600 dark:text-emerald-400">{formatPrice(total)} ₫</span>
                                </div>
                            </div>
                        </div>

                        {!reviewStep ? (
                            /* Bước 1: Nút chuyển sang review */
                            <button
                                onClick={handleProceedToReview}
                                disabled={cart.length === 0}
                                className='flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-5 py-4 text-base font-bold text-white transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50'
                            >
                                Tiếp tục → Xem lại đơn hàng <ChevronRight className='w-5 h-5' />
                            </button>
                        ) : (
                            /* Bước 2: Xác nhận + Chọn thanh toán */
                            <div className='space-y-4'>
                                {/* Tóm tắt thông tin giao hàng */}
                                <div className='bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm space-y-1.5 border border-gray-200 dark:border-gray-600'>
                                    <p className='font-semibold text-gray-900 dark:text-white mb-2'>✅ Thông tin giao hàng</p>
                                    <p className='text-gray-600 dark:text-gray-300'><span className='text-gray-400'>Người nhận:</span> {formData.fullName}</p>
                                    <p className='text-gray-600 dark:text-gray-300'><span className='text-gray-400'>SĐT:</span> {formData.phoneNumber}</p>
                                    <p className='text-gray-600 dark:text-gray-300'><span className='text-gray-400'>Email:</span> {formData.email}</p>
                                    <p className='text-gray-600 dark:text-gray-300'><span className='text-gray-400'>Địa chỉ:</span> {formData.address}, {formData.city}</p>
                                    {formData.orderNotes && <p className='text-amber-600 dark:text-amber-400'><span className='text-gray-400'>Ghi chú:</span> {formData.orderNotes}</p>}
                                </div>
                                <button
                                    onClick={() => setReviewStep(false)}
                                    className='flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                                >
                                    <ChevronLeft className='w-4 h-4' /> Sửa thông tin giao hàng
                                </button>
                                <p className='text-xs text-gray-400 text-center'>Chọn phương thức thanh toán</p>
                                <button
                                    className='flex w-full items-center justify-center rounded-lg bg-[#635BFF] px-5 py-3 text-sm font-medium text-white hover:bg-[#524ac9] transition-colors shadow-lg shadow-[#635BFF]/20 disabled:opacity-50 disabled:cursor-not-allowed'
                                    onClick={handlePaymentStripe}
                                    disabled={isProcessing || cart.length === 0}
                                >
                                    {isProcessing ? "Đang xử lý..." : "Thanh toán qua Stripe"}
                                </button>
                                <button
                                    className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed'
                                    onClick={handlePaymentQR}
                                    disabled={isProcessing || cart.length === 0}
                                >
                                    {isProcessing ? "Đang xử lý..." : "Chuyển khoản VietQR"}
                                </button>
                                <button
                                    className='flex w-full items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 px-5 py-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                    onClick={handlePaymentCOD}
                                    disabled={isProcessing || cart.length === 0}
                                >
                                    {isProcessing ? "Đang xử lý..." : "Thanh toán khi nhận hàng (COD)"}
                                </button>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>

            {/* QR Modal */}
            < AnimatePresence >
                {qrData && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl"
                        >
                            {/* Nút đóng — CHỈ đóng modal, không xác nhận thanh toán */}
                            <button
                                onClick={() => setQrData(null)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                                title="Đóng (đơn hàng vẫn được giữ lại)"
                            >
                                <X size={24} />
                            </button>

                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                    <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Chuyển khoản VietQR</h2>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">
                                    Quét mã QR dưới đây để thanh toán. Sau khi chuyển khoản xong,
                                    nhấn nút “Tôi đã chuyển khoản” để xác nhận đơn hàng.
                                </p>

                                <div className="bg-white p-3 rounded-xl inline-block shadow-lg border border-gray-100">
                                    <img
                                        src={`https://img.vietqr.io/image/970422-0393043834-compact.png?amount=${qrData.totalAmount}&addInfo=THANHTOAN%20${qrData.orderCode}&accountName=NGUYEN%20VAN%20A`}
                                        alt="VietQR"
                                        className="w-full max-w-[250px] mx-auto rounded-lg"
                                    />
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-left space-y-2 mt-4 text-sm border border-gray-100 dark:border-transparent">
                                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                        <span className="text-gray-500 dark:text-gray-400">Số tiền:</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(qrData.totalAmount)} ₫</span>
                                    </div>
                                    <div className="flex justify-between items-center text-gray-700 dark:text-gray-300">
                                        <span className="text-gray-500 dark:text-gray-400">Nội dung CK:</span>
                                        <span className="font-bold font-mono bg-white dark:bg-gray-900 border border-gray-100 dark:border-transparent px-2 py-1 rounded">THANHTOAN {qrData.orderCode}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleConfirmQRPayment}
                                    disabled={isConfirming}
                                    className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                                >
                                    {isConfirming ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Đang gởi xác nhận...
                                        </>
                                    ) : "Đã chuyển khoản — Thông báo chúng tôi"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence >

            <style jsx="true">{`
				.custom-scrollbar::-webkit-scrollbar {
					width: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: rgba(0, 0, 0, 0.05); 
					border-radius: 4px;
				}
				.dark .custom-scrollbar::-webkit-scrollbar-track {
					background: rgba(31, 41, 55, 0.5); 
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background: rgba(16, 185, 129, 0.5); 
					border-radius: 4px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background: rgba(16, 185, 129, 0.8); 
				}
			`}</style>
        </div >
    );
};

export default CheckoutPage;
