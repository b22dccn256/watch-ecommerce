import { ArrowRight, CheckCircle, MapPin, Package, CreditCard, Wallet, Copy, FileText, Clock, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";
import { SkeletonPageShell } from "../components/SkeletonLoaders";
import ReviewForm from "../components/ReviewForm";

const PurchaseSuccessPage = () => {
	const [isProcessing, setIsProcessing] = useState(true);
	const { clearSelectedCart } = useCartStore();
	const [error, setError] = useState(null);
	const [order, setOrder] = useState(null);

	const getOrderStatusLabel = (status) => {
		switch (status) {
			case "pending":
				return "Đang chờ xác nhận";
			case "awaiting_verification":
				return "Chờ xác minh thanh toán";
			case "confirmed":
				return "Đã xác nhận";
			case "processing":
				return "Đang xử lý";
			case "shipped":
				return "Đang giao hàng";
			case "delivered":
				return "Đã giao hàng";
			case "return_requested":
				return "Đang chờ duyệt trả hàng";
			case "cancelled":
				return "Đã hủy";
			case "returned":
				return "Đã trả hàng";
			default:
				return "Đang cập nhật";
		}
	};

	const handleContinueVNPay = async () => {
		try {
			const toastId = toast.loading("Đang tạo liên kết thanh toán...");
			const res = await axios.post("/payments/recreate-vnpay-url", { orderId: order._id });
			if (res.data?.paymentUrl) {
				toast.success("Đang chuyển hướng...", { id: toastId });
				window.location.href = res.data.paymentUrl;
			} else {
				toast.error("Không tạo được link thanh toán", { id: toastId });
			}
		} catch (err) {
			toast.error(err.response?.data?.message || "Đã xảy ra lỗi");
		}
	};

	const handleChangeToCOD = async () => {
		try {
			const toastId = toast.loading("Đang chuyển đổi sang COD...");
			const res = await axios.post("/payments/change-payment-method", { orderId: order._id, method: "cod" });
			toast.success("Đã đổi sang thanh toán COD thành công!", { id: toastId });
			// Refresh order details
			setOrder(res.data);
		} catch (err) {
			toast.error(err.response?.data?.message || "Đã xảy ra lỗi");
		}
	};

	useEffect(() => {
		const fallbackOrder = (id) => ({
			_id: id,
			orderCode: id,
			totalAmount: 0,
			shippingDetails: {},
			products: [],
			paymentMethod: "stripe",
			paymentStatus: "paid",
			status: "pending",
		});

		const fetchOrderDetailsByToken = async (trackingToken, fallbackId = "") => {
			try {
				const res = await axios.get(`/orders/track/${trackingToken}`);
				setOrder(res.data);
			} catch (error) {
				console.error("Error fetching order:", error);
				setOrder(fallbackOrder(fallbackId || trackingToken));
			} finally {
				setIsProcessing(false);
			}
		};

		const fetchOrderDetailsById = async (id) => {
			try {
				const res = await axios.get(`/orders/${id}`);
				setOrder(res.data);
			} catch (error) {
				console.error("Error fetching order by id:", error);
				setOrder(fallbackOrder(id));
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
				if (res.data.trackingToken) {
					fetchOrderDetailsByToken(res.data.trackingToken, res.data.orderId);
				} else if (res.data.orderId) {
					fetchOrderDetailsById(res.data.orderId);
				} else {
					setIsProcessing(false);
					setError("Order ID not found from payment session.");
				}
			} catch (error) {
				void error;
				setIsProcessing(false);
				setError("Payment verification failed. Please contact support.");
			}
		};

		const sessionId = new URLSearchParams(window.location.search).get("session_id");
		const orderIdParam = new URLSearchParams(window.location.search).get("order_id");
		const trackingTokenParam = new URLSearchParams(window.location.search).get("tracking_token");

		if (sessionId) {
			handleCheckoutSuccess(sessionId);
		} else if (trackingTokenParam) {
			clearSelectedCart();
			fetchOrderDetailsByToken(trackingTokenParam, orderIdParam || trackingTokenParam);
		} else if (orderIdParam) {
			clearSelectedCart();
			fetchOrderDetailsById(orderIdParam);
		} else {
			setIsProcessing(false);
			setError("Không tìm thấy mã phiên giao dịch hoặc mã đơn hàng.");
		}
	}, [clearSelectedCart]);

	if (isProcessing) {
		return <SkeletonPageShell rows={4} />;
	}

	if (error) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center px-4'>
				<div className="bg-surface border border-default rounded-2xl p-8 max-w-md text-center shadow-lg">
					<h2 className="text-2xl font-bold text-primary mb-4">Lỗi giao dịch</h2>
					<p className="text-secondary mb-6">{error}</p>
					<Link to="/" className="inline-flex bg-primary hover:brightness-110 px-6 py-2.5 rounded-xl text-white font-semibold transition">
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

			<div className='max-w-3xl w-full card-premium bg-surface border border-default shadow-xl rounded-2xl overflow-hidden relative z-10 p-6 sm:p-10'>
				{/* Header */}
				<div className='text-center mb-8'>
					<div className='inline-flex items-center justify-center w-20 h-20 bg-[color:var(--color-gold)]/10 rounded-full mb-6 relative'>
						<div className="absolute inset-0 bg-[color:var(--color-gold)]/10 animate-ping rounded-full"></div>
						<CheckCircle className='text-[color:var(--color-gold)] w-10 h-10 relative z-10' />
					</div>
					<h1 className='text-3xl sm:text-4xl font-bold text-primary mb-2 tracking-tight'>
						Đặt hàng thành công!
					</h1>
					<p className='text-secondary text-base mb-4'>
						Mã đơn hàng: <span className='font-bold text-[color:var(--color-gold)] tracking-wider'>{order.orderCode}</span>
					</p>

					{order.trackingToken && (
						<div className='mt-4 bg-surface-soft border border-default rounded-xl p-4 flex flex-col items-center gap-2 max-w-lg mx-auto shadow-sm'>
							<p className='text-xs text-[color:var(--color-gold)] font-bold uppercase tracking-widest flex items-center gap-1.5'>
								⚠️ Lưu lại mã theo dõi đơn hàng
							</p>
							<div className='flex items-center gap-2 w-full justify-center'>
								<code className='text-[color:var(--color-gold)] font-mono text-xs bg-black/5 dark:bg-black/35 px-3 py-2 rounded-lg border border-default break-all select-all'>{order.trackingToken}</code>
								<button
									onClick={() => {
										navigator.clipboard.writeText(order.trackingToken);
										toast.success("Đã sao chép mã theo dõi!");
									}}
									className='flex-shrink-0 bg-[color:var(--color-gold)] hover:brightness-110 text-white dark:text-black px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm'
								>
									<Copy size={12} /> Sao chép
								</button>
							</div>
							<p className='text-[10px] text-muted'>Dùng mã này để theo dõi tiến trình giao hàng</p>
						</div>
					)}
				</div>

				{/* Trạng thái thanh toán VNPay Chưa hoàn tất */}
				{order.paymentMethod === 'vnpay' && order.paymentStatus !== 'paid' && (
					<div className='bg-amber-500/10 border border-amber-500/25 rounded-xl p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 animate-enter'>
						<div className="text-left">
							<h4 className="font-bold text-amber-500 text-sm uppercase tracking-wider mb-1 flex items-center gap-1.5">
								<Clock size={16} /> Thanh toán chưa hoàn tất
							</h4>
							<p className="text-xs text-secondary leading-relaxed">
								Giao dịch VNPay của bạn chưa được thanh toán thành công. Vui lòng hoàn tất thanh toán hoặc chuyển sang thanh toán khi nhận hàng (COD) để đơn hàng được xử lý ngay.
							</p>
						</div>
						<div className="flex gap-2 w-full md:w-auto shrink-0 justify-end">
							<button
								onClick={handleChangeToCOD}
								className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-amber-500/30 text-amber-500 text-xs font-bold hover:bg-amber-500 hover:text-white transition"
							>
								Đổi sang COD
							</button>
							<button
								onClick={handleContinueVNPay}
								className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition"
							>
								Tiếp tục thanh toán
							</button>
						</div>
					</div>
				)}

				{/* ═══ BLOCK 1: THÔNG TIN CHUNG ĐƠN HÀNG ═══ */}
				<div className='bg-surface-soft border border-default rounded-xl p-6 mb-6 shadow-sm'>
					<h3 className='text-sm font-bold text-primary mb-4 pb-2 border-b border-default flex items-center gap-2 uppercase tracking-wider'>
						<FileText size={16} className="text-[color:var(--color-gold)]" /> Thông tin đơn hàng
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-8 text-sm'>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className='text-secondary'>Mã đơn hàng:</span>
								<span className="font-semibold text-primary">{order.orderCode}</span>
							</div>
							<div className="flex justify-between">
								<span className='text-secondary'>Phương thức thanh toán:</span>
								<span className="font-semibold text-primary">
									{order.paymentMethod === "stripe" ? "Thẻ tín dụng Quốc tế" :
										order.paymentMethod === "vnpay" ? "VNPay" : "Thanh toán khi nhận hàng (COD)"}
								</span>
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<span className='text-secondary'>Trạng thái thanh toán:</span>
								<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
									${order.paymentStatus === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
										order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
										'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
									{order.paymentStatus === 'paid' ? 'Đã Thanh Toán' :
										order.paymentStatus === 'cancelled' ? 'Đã Huỷ' : 'Chờ Thanh Toán'}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className='text-secondary'>Trạng thái đơn hàng:</span>
								<span className="font-bold text-[color:var(--color-gold)]">{getOrderStatusLabel(order.status)}</span>
							</div>
						</div>
					</div>
				</div>

				{/* ═══ BLOCK 2: CHI TIẾT GIAO HÀNG ═══ */}
				<div className='bg-surface-soft border border-default rounded-xl p-6 mb-6 shadow-sm'>
					<h3 className='text-sm font-bold text-primary mb-4 pb-2 border-b border-default flex items-center gap-2 uppercase tracking-wider'>
						<MapPin size={16} className="text-[color:var(--color-gold)]" /> Chi tiết giao nhận
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-8 text-sm'>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className='text-secondary'>Người nhận:</span>
								<span className="font-medium text-primary">{order.shippingDetails?.fullName}</span>
							</div>
							<div className="flex justify-between">
								<span className='text-secondary'>Số điện thoại:</span>
								<span className="font-medium text-primary">{order.shippingDetails?.phoneNumber}</span>
							</div>
							<div className="flex justify-between">
								<span className='text-secondary'>Email liên hệ:</span>
								<span className="font-medium text-primary break-all">{order.shippingDetails?.email}</span>
							</div>
						</div>
						<div className="space-y-2">
							<div className="flex justify-between">
								<span className='text-secondary'>Tỉnh/Thành phố:</span>
								<span className="font-medium text-primary">{order.shippingDetails?.city}</span>
							</div>
							<div className="flex justify-between items-start gap-4">
								<span className='text-secondary flex-shrink-0'>Địa chỉ:</span>
								<span className="font-medium text-primary text-right line-clamp-2" title={order.shippingDetails?.address}>
									{order.shippingDetails?.address}
								</span>
							</div>
							{order.shippingDetails?.orderNotes && (
								<div className="border-t border-default pt-2 mt-2 flex justify-between items-start gap-4">
									<span className='text-secondary flex-shrink-0'>Ghi chú:</span>
									<span className="font-medium text-amber-500 dark:text-amber-400 text-right line-clamp-2 text-xs" title={order.shippingDetails?.orderNotes}>
										{order.shippingDetails?.orderNotes}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* ═══ BLOCK 3: DANH SÁCH SẢN PHẨM ĐÃ MUA ═══ */}
				<div className='mb-8'>
					<h3 className='text-sm font-bold text-primary mb-4 flex items-center gap-2 uppercase tracking-wider'>
						<Package size={16} className="text-[color:var(--color-gold)]" /> Sản phẩm đã đặt mua ({order.products?.length || 0})
					</h3>
					<div className='space-y-3.5'>
						{order.products?.map((item) => (
							<Fragment key={item._id}>
								<div className='flex items-center gap-4 bg-surface-soft p-4 rounded-xl border border-default shadow-sm'>
									<div className="w-16 h-16 bg-black/5 dark:bg-black/20 rounded-lg overflow-hidden flex-shrink-0 border border-default">
										<img
											src={item.product?.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"}
											alt={item.product?.name}
											className='w-full h-full object-cover'
										/>
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-primary font-semibold text-sm truncate' title={item.product?.name}>
											{item.product?.name}
										</p>
										<div className='mt-1 flex flex-wrap gap-1.5 text-[10px] text-secondary'>
											{item.selectedColor && <span className='rounded-md bg-black/5 dark:bg-white/5 border border-default px-2 py-0.5'>Màu: {item.selectedColor}</span>}
											{item.selectedSize && <span className='rounded-md bg-black/5 dark:bg-white/5 border border-default px-2 py-0.5'>Size: {item.selectedSize}</span>}
											{item.wristSize && <span className='rounded-md bg-black/5 dark:bg-white/5 border border-default px-2 py-0.5'>Cắt dây: {item.wristSize} mm</span>}
										</div>
										<p className='text-xs text-secondary mt-1.5'>
											{item.price?.toLocaleString("vi-VN")} ₫ <span className="mx-1 opacity-60">x</span> <span className="font-bold text-primary">{item.quantity}</span>
										</p>
									</div>
									<div className='text-right flex-shrink-0'>
										<p className='text-[color:var(--color-gold)] font-bold text-sm'>
											{(item.price * item.quantity).toLocaleString("vi-VN")} ₫
										</p>
									</div>
								</div>

								{/* Form đánh giá khi đơn hàng hoàn tất */}
								{order.status === 'delivered' && (
									<div className="mt-2 w-full border border-default rounded-xl bg-surface p-3 shadow-inner">
										<ReviewForm productId={item.product?._id || item.product} />
									</div>
								)}
							</Fragment>
						))}
					</div>
				</div>

				{/* Tổng cộng */}
				<div className='bg-[color:var(--color-gold)]/5 border border-[color:var(--color-gold)]/20 rounded-xl p-5 mb-8 flex items-center justify-between shadow-sm'>
					<span className='text-base font-semibold text-secondary'>Tổng giá trị đơn hàng:</span>
					<span className='text-2xl font-bold text-[color:var(--color-gold)] tracking-tight'>
						{order.totalAmount?.toLocaleString("vi-VN")} <span className="text-base font-medium">VNĐ</span>
					</span>
				</div>

				{/* Các nút Hành động */}
				<div className='flex flex-col sm:flex-row gap-4 border-t border-default pt-6'>
					<Link to='/' className='flex-1 flex justify-center items-center px-6 py-3.5 rounded-xl border border-default bg-surface hover:bg-surface-soft text-primary font-semibold text-sm transition group'>
						<ArrowRight size={16} className="mr-2 rotate-180 text-secondary group-hover:-translate-x-0.5 transition-transform" />
						Tiếp tục mua sắm
					</Link>
					<Link
						to={order.trackingToken ? `/order-tracking/${order.trackingToken}` : "/profile"}
						className='flex-1 flex justify-center items-center gap-1.5 px-6 py-3.5 rounded-xl bg-[color:var(--color-gold)] text-white dark:text-black hover:brightness-110 font-bold text-sm transition shadow-md group'
					>
						Xem hành trình vận chuyển <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
					</Link>
				</div>
			</div>
		</div>
);
};

export default PurchaseSuccessPage;
