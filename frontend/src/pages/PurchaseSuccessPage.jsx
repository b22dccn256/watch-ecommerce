import { ArrowRight, CheckCircle, HandHeart, MapPin, Package, CreditCard, Wallet, QrCode, Copy } from "lucide-react";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";

const PurchaseSuccessPage = () => {
	const [isProcessing, setIsProcessing] = useState(true);
	const { clearSelectedCart } = useCartStore();
	const [error, setError] = useState(null);
	const [order, setOrder] = useState(null);

	useEffect(() => {
		const fetchOrderDetails = async (id) => {
			try {
				const res = await axios.get(`/orders/${id}`);
				setOrder(res.data);
			} catch (error) {
				console.error("Error fetching order:", error);
				setError("Could not load order details.");
			} finally {
				setIsProcessing(false);
			}
		};

		const handleCheckoutSuccess = async (sessionId) => {
			try {
				const res = await axios.post("/payments/checkout-success", {
					sessionId,
				});
				clearSelectedCart();
				if (res.data.orderId) {
					fetchOrderDetails(res.data.orderId);
				} else {
					setIsProcessing(false);
					setError("Order ID not found from payment session.");
				}
			} catch (error) {
				console.log(error);
				setIsProcessing(false);
				setError("Payment verification failed. Please contact support.");
			}
		};

		const sessionId = new URLSearchParams(window.location.search).get("session_id");
		const orderIdParam = new URLSearchParams(window.location.search).get("order_id");

		if (sessionId) {
			handleCheckoutSuccess(sessionId);
		} else if (orderIdParam) {
			// COD hoặc QR — clear selected cart nếu chưa clear và fetch chi tiết đơn hàng
			clearSelectedCart();
			fetchOrderDetails(orderIdParam);
		} else {
			setIsProcessing(false);
			setError("Không tìm thấy mã phiên giao dịch hoặc mã đơn hàng.");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clearSelectedCart]);

	if (isProcessing) {
		return (
			<div className='min-h-screen flex items-center justify-center'>
				<div className="flex flex-col items-center">
					<div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4"></div>
					<h2 className="text-xl text-emerald-400 font-medium animate-pulse">Đang xử lý đơn hàng...</h2>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center px-4'>
				<div className="bg-red-500/10 border border-red-500 rounded-xl p-8 max-w-md text-center">
					<h2 className="text-2xl font-bold text-red-500 mb-4">Lỗi giao dịch</h2>
					<p className="text-gray-300 mb-6">{error}</p>
					<Link to="/" className="inline-flex bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-white font-medium transition">
						Quay về trang chủ
					</Link>
				</div>
			</div>
		);
	}

	if (!order) return null;

	return (
		<div className='min-h-screen flex items-center justify-center p-4 py-24'>
			<Confetti
				width={window.innerWidth}
				height={window.innerHeight}
				gravity={0.1}
				style={{ zIndex: 99, position: 'fixed' }}
				numberOfPieces={400}
				recycle={false}
			/>

			<div className='max-w-3xl w-full bg-gray-800 rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 sm:p-10 border border-gray-700'>
				{/* Header */}
				<div className='text-center mb-8'>
					<div className='inline-flex items-center justify-center w-24 h-24 bg-emerald-500/20 rounded-full mb-6 relative'>
						<div className="absolute inset-0 bg-emerald-400/20 animate-ping rounded-full"></div>
						<CheckCircle className='text-emerald-400 w-12 h-12 relative z-10' />
					</div>
					<h1 className='text-3xl sm:text-4xl font-extrabold text-white mb-2'>
						Cảm ơn bạn đã đặt hàng!
					</h1>
					<p className='text-gray-400 text-lg'>
						Mã đơn hàng: <span className='font-bold text-emerald-400 tracking-wider'>{order.orderCode}</span>
					</p>
					{order.trackingToken && (
						<div className='mt-4 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-xl p-4 flex flex-col items-center gap-2'>
							<p className='text-xs text-emerald-400 font-bold uppercase tracking-widest'>⚠️ Hãy lưu lại mã theo dõi đơn hàng!</p>
							<div className='flex items-center gap-2'>
								<code className='text-emerald-300 font-mono text-sm bg-gray-900 px-3 py-1.5 rounded-lg border border-emerald-500/30 break-all'>{order.trackingToken}</code>
								<button
									onClick={() => {
										navigator.clipboard.writeText(order.trackingToken);
										toast.success("Đã sao chép mã theo dõi!");
									}}
									className='flex-shrink-0 bg-emerald-500 hover:bg-emerald-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1'
								>
									<Copy size={14} /> Sao chép
								</button>
							</div>
							<p className='text-xs text-gray-500'>Dùng mã này để theo dõi đơn hàng của bạn</p>
						</div>
					)}
				</div>

				{/* Status Card */}
				<div className='bg-gray-700/50 rounded-xl p-5 mb-8 border border-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
					<div className='flex items-center gap-4'>
						<div className="p-3 bg-gray-800 rounded-lg">
							{order.paymentMethod === 'stripe' ? <CreditCard className="text-blue-400" /> :
								order.paymentMethod === 'qr' ? <QrCode className="text-purple-400" /> :
									<Wallet className="text-amber-400" />}
						</div>
						<div className='flex flex-col'>
							<span className='text-sm text-gray-400 mb-1'>Phương thức thanh toán</span>
							<span className='font-medium text-white'>
								{order.paymentMethod === "stripe" ? "Thẻ tín dụng Quốc tế" :
									order.paymentMethod === "qr" ? "Chuyển khoản VietQR" : "Thanh toán khi nhận hàng (COD)"}
							</span>
						</div>
					</div>
					<div className='flex flex-col sm:text-right'>
						<span className='text-sm text-gray-400 mb-1'>Trạng thái thanh toán</span>
						<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
							${order.paymentStatus === 'paid' ? 'bg-emerald-500/20 text-emerald-400' :
								order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
							{order.paymentStatus === 'paid' ? 'Đã Thanh Toán' :
								order.paymentStatus === 'cancelled' ? 'Đã Huỷ' : 'Chờ Xử Lý'}
						</span>
					</div>
				</div>

				{/* Shipping Info */}
				<div className='bg-gray-700/50 rounded-xl p-6 mb-8 border border-gray-600 relative overflow-hidden'>
					<div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
					<h3 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
						<MapPin size={20} className="text-emerald-400" /> Thông tin giao hàng
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm'>
						<div className="space-y-2">
							<p className="flex justify-between"><span className='text-gray-400'>Người nhận:</span> <span className="font-medium text-white">{order.shippingDetails?.fullName}</span></p>
							<p className="flex justify-between"><span className='text-gray-400'>Điện thoại:</span> <span className="font-medium text-white">{order.shippingDetails?.phoneNumber}</span></p>
							<p className="flex justify-between"><span className='text-gray-400'>Email:</span> <span className="font-medium text-white">{order.shippingDetails?.email}</span></p>
						</div>
						<div className="space-y-2">
							<p className="flex justify-between"><span className='text-gray-400'>Thành phố:</span> <span className="font-medium text-white">{order.shippingDetails?.city}</span></p>
							<p className="flex justify-between items-start gap-4"><span className='text-gray-400 flex-shrink-0'>Địa chỉ:</span> <span className="font-medium text-white text-right line-clamp-2" title={order.shippingDetails?.address}>{order.shippingDetails?.address}</span></p>
							{order.shippingDetails?.orderNotes && (
								<p className="flex justify-between border-t border-gray-600 pt-2 mt-2"><span className='text-gray-400'>Ghi chú:</span> <span className="font-medium text-amber-300 text-right line-clamp-2" title={order.shippingDetails?.orderNotes}>{order.shippingDetails?.orderNotes}</span></p>
							)}
						</div>
					</div>
				</div>

				{/* Order items */}
				<div className='mb-8'>
					<h3 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
						<Package size={20} className="text-emerald-400" /> Sản phẩm đã mua ({order.products?.length || 0})
					</h3>
					<div className='space-y-3'>
						{order.products?.map((item) => (
							<div key={item._id} className='flex items-center gap-4 bg-gray-800/50 p-3 rounded-lg border border-gray-700'>
								<div className="w-16 h-16 bg-gray-700 rounded-md overflow-hidden flex-shrink-0">
									<img
										src={item.product?.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"}
										alt={item.product?.name}
										className='w-full h-full object-cover'
									/>
								</div>
								<div className='flex-1 min-w-0'>
									<p className='text-white font-medium truncate' title={item.product?.name}>{item.product?.name}</p>
									<p className='text-sm text-gray-400 mt-1'>
										{item.price?.toLocaleString("vi-VN")} ₫ <span className="mx-1">x</span> <span className="font-bold text-white">{item.quantity}</span>
									</p>
								</div>
								<div className='text-right flex-shrink-0'>
									<p className='text-emerald-400 font-bold'>{(item.price * item.quantity).toLocaleString("vi-VN")} ₫</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Total */}
				<div className='bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6 mb-8 flex items-center justify-between'>
					<span className='text-xl font-medium text-gray-300'>Tổng thanh toán:</span>
					<span className='text-3xl font-extrabold text-emerald-400 tracking-tight'>
						{order.totalAmount?.toLocaleString("vi-VN")} <span className="text-xl">VNĐ</span>
					</span>
				</div>

				{/* Actions */}
				<div className='flex flex-col sm:flex-row gap-4'>
					<Link to='/' className='flex-1 flex justify-center items-center px-6 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all group'>
						<ArrowRight size={18} className="mr-2 rotate-180 text-gray-400 group-hover:-translate-x-1 transition-transform" />
						Tiếp tục mua sắm
					</Link>
					<Link
						to={order.trackingToken ? `/order-tracking/${order.trackingToken}` : "/profile"}
						className='flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] group'
					>
						Theo dõi đơn hàng <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
					</Link>
				</div>
			</div>
		</div>
	);
};
export default PurchaseSuccessPage;
