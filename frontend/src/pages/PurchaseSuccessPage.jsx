import { ArrowRight, CheckCircle, MapPin, Package, CreditCard, Wallet, QrCode, Copy } from "lucide-react";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import axios from "../lib/axios";
import Confetti from "react-confetti";
import { SkeletonPageShell } from "../components/SkeletonLoaders";

const PurchaseSuccessPage = () => {
	const [isProcessing, setIsProcessing] = useState(true);
	const { clearSelectedCart } = useCartStore();
	const [error, setError] = useState(null);
	const [order, setOrder] = useState(null);

	const orderStatusSteps = [
		{ key: "pending", label: "ÄĂ£ Ä‘áº·t hĂ ng" },
		{ key: "awaiting_verification", label: "Chá» xĂ¡c nháº­n" },
		{ key: "confirmed", label: "ÄĂ£ xĂ¡c nháº­n" },
		{ key: "processing", label: "Äang xá»­ lĂ½" },
		{ key: "shipped", label: "Äang giao" },
		{ key: "delivered", label: "ÄĂ£ giao" },
	];

	const getOrderStatusLabel = (status) => {
		switch (status) {
			case "pending":
				return "Äang chá» xĂ¡c nháº­n";
			case "awaiting_verification":
				return "Chá» xĂ¡c minh thanh toĂ¡n";
			case "confirmed":
				return "ÄĂ£ xĂ¡c nháº­n";
			case "processing":
				return "Äang xá»­ lĂ½";
			case "shipped":
				return "Äang giao hĂ ng";
			case "delivered":
				return "ÄĂ£ giao hĂ ng";
				case "return_requested":
					return "Äang chá» duyá»‡t tráº£ hĂ ng";
			case "cancelled":
				return "ÄĂ£ há»§y";
			case "returned":
				return "ÄĂ£ tráº£ hĂ ng";
			default:
				return "Äang cáº­p nháº­t";
		}
	};

	const getCurrentStepIndex = (status) => {
		const normalizedStatus = status === "confirmed" ? "confirmed" : status === "shipped" ? "shipped" : status === "delivered" ? "delivered" : status === "processing" ? "processing" : status === "awaiting_verification" ? "awaiting_verification" : "pending";
		const index = orderStatusSteps.findIndex((step) => step.key === normalizedStatus);
		return index === -1 ? 0 : index;
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
			// COD flow (or future flows): use safe public token-based tracking endpoint
			clearSelectedCart();
			fetchOrderDetailsByToken(trackingTokenParam, orderIdParam || trackingTokenParam);
		} else if (orderIdParam) {
			// Fallback for legacy URLs that only contain order_id
			clearSelectedCart();
			fetchOrderDetailsById(orderIdParam);
		} else {
			setIsProcessing(false);
			setError("KhĂ´ng tĂ¬m tháº¥y mĂ£ phiĂªn giao dá»‹ch hoáº·c mĂ£ Ä‘Æ¡n hĂ ng.");
		}
	}, [clearSelectedCart]);

	if (isProcessing) {
		return <SkeletonPageShell rows={4} />;
	}

	if (error) {
		return (
			<div className='min-h-screen flex flex-col items-center justify-center px-4'>
				<div className="bg-black/5 dark:bg-white/5 border border-black/15 dark:border-white/15 rounded-xl p-8 max-w-md text-center">
					<h2 className="text-2xl font-bold text-primary mb-4">Lá»—i giao dá»‹ch</h2>
					<p className="text-gray-300 mb-6">{error}</p>
					<Link to="/" className="inline-flex bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg text-white font-medium transition">
						Quay vá» trang chá»§
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
					<div className='inline-flex items-center justify-center w-24 h-24 bg-[color:var(--color-gold)]/20 rounded-full mb-6 relative'>
						<div className="absolute inset-0 bg-[color:var(--color-gold)]/20 animate-ping rounded-full"></div>
						<CheckCircle className='text-[color:var(--color-gold)] w-12 h-12 relative z-10' />
					</div>
					<h1 className='text-3xl sm:text-4xl font-extrabold text-white mb-2'>
						Cáº£m Æ¡n báº¡n Ä‘Ă£ Ä‘áº·t hĂ ng!
					</h1>
					<p className='text-gray-400 text-lg'>
						MĂ£ Ä‘Æ¡n hĂ ng: <span className='font-bold text-[color:var(--color-gold)] tracking-wider'>{order.orderCode}</span>
					</p>
					{order.trackingToken && (
						<div className='mt-4 bg-[color:var(--color-gold)]/10 border-2 border-[color:var(--color-gold)]/40 rounded-xl p-4 flex flex-col items-center gap-2'>
							<p className='text-xs text-[color:var(--color-gold)] font-bold uppercase tracking-widest'>â ï¸ HĂ£y lÆ°u láº¡i mĂ£ theo dĂµi Ä‘Æ¡n hĂ ng!</p>
							<div className='flex items-center gap-2'>
								<code className='text-[color:var(--color-gold)] font-mono text-sm bg-gray-900 px-3 py-1.5 rounded-lg border border-[color:var(--color-gold)]/30 break-all'>{order.trackingToken}</code>
								<button
									onClick={() => {
										navigator.clipboard.writeText(order.trackingToken);
										toast.success("ÄĂ£ sao chĂ©p mĂ£ theo dĂµi!");
									}}
									className='flex-shrink-0 bg-[color:var(--color-gold)] hover:brightness-110 text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1'
								>
									<Copy size={14} /> Sao chĂ©p
								</button>
							</div>
							<p className='text-xs text-gray-500'>DĂ¹ng mĂ£ nĂ y Ä‘á»ƒ theo dĂµi Ä‘Æ¡n hĂ ng cá»§a báº¡n</p>
						</div>
					)}
				</div>

				{/* Status Card */}
				<div className='bg-gray-700/50 rounded-xl p-5 mb-8 border border-gray-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
					<div className='flex items-center gap-4'>
						<div className="p-3 bg-gray-800 rounded-lg">
							{order.paymentMethod === 'stripe' ? <CreditCard className="text-[color:var(--color-gold)]" /> :
								order.paymentMethod === 'qr' ? <QrCode className="text-[color:var(--color-gold)]" /> :
									<Wallet className="text-[color:var(--color-gold)]" />}
						</div>
						<div className='flex flex-col'>
							<span className='text-sm text-gray-400 mb-1'>PhÆ°Æ¡ng thá»©c thanh toĂ¡n</span>
							<span className='font-medium text-white'>
								{order.paymentMethod === "stripe" ? "Tháº» tĂ­n dá»¥ng Quá»‘c táº¿" :
									order.paymentMethod === "qr" ? "Chuyá»ƒn khoáº£n VietQR" : "Thanh toĂ¡n khi nháº­n hĂ ng (COD)"}
							</span>
						</div>
					</div>
					<div className='flex flex-col sm:text-right'>
						<span className='text-sm text-gray-400 mb-1'>Tráº¡ng thĂ¡i thanh toĂ¡n</span>
						<span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
							${order.paymentStatus === 'paid' ? 'bg-[color:var(--color-gold)]/20 text-[color:var(--color-gold)]' :
								order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed' ? 'bg-black/10 text-gray-300' : 'bg-amber-500/20 text-amber-400'}`}>
							{order.paymentStatus === 'paid' ? 'ÄĂ£ Thanh ToĂ¡n' :
								order.paymentStatus === 'cancelled' ? 'ÄĂ£ Huá»·' : 'Chá» Xá»­ LĂ½'}
						</span>
					</div>
				</div>

				{/* Order Status */}
				<div className='bg-gray-700/50 rounded-xl p-6 mb-8 border border-gray-600'>
					<div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6'>
						<div>
							<p className='text-sm text-gray-400 mb-1'>Tráº¡ng thĂ¡i Ä‘Æ¡n hĂ ng</p>
							<h3 className='text-2xl font-bold text-white'>{getOrderStatusLabel(order.status)}</h3>
						</div>
						{order.trackingToken && (
							<Link
								to={`/order-tracking/${order.trackingToken}`}
								className='inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--color-gold)] px-5 py-3 text-sm font-bold text-black hover:brightness-110 transition-colors'
							>
								Xem hĂ nh trĂ¬nh Ä‘Æ¡n hĂ ng
								<ArrowRight className='w-4 h-4' />
							</Link>
						)}
					</div>

					<div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3'>
						{orderStatusSteps.map((step, index) => {
							const currentStepIndex = getCurrentStepIndex(order.status);
							const isActive = index <= currentStepIndex;
							const isCurrent = index === currentStepIndex;

							return (
								<div
									key={step.key}
									className={`rounded-xl border p-4 text-center transition-all ${isActive
										? 'border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10'
										: 'border-gray-600 bg-gray-800/40 opacity-60'}`}
								>
									<div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full text-xs font-black ${isActive ? 'bg-[color:var(--color-gold)] text-black' : 'bg-gray-700 text-gray-400'}`}>
										{index + 1}
									</div>
									<p className={`text-xs font-bold uppercase tracking-widest ${isActive ? 'text-[color:var(--color-gold)]' : 'text-gray-500'}`}>
										{step.label}
									</p>
									{isCurrent && (
										<p className='mt-2 text-[10px] font-bold uppercase tracking-wider text-[color:var(--color-gold)]'>
											ÄÆ¡n cá»§a báº¡n Ä‘ang á»Ÿ bÆ°á»›c nĂ y
										</p>
									)}
								</div>
							);
						})}
					</div>
				</div>

				{/* Shipping Info */}
				<div className='bg-gray-700/50 rounded-xl p-6 mb-8 border border-gray-600 relative overflow-hidden'>
					<div className="absolute top-0 left-0 w-1 h-full bg-[color:var(--color-gold)]"></div>
					<h3 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
						<MapPin size={20} className="text-[color:var(--color-gold)]" /> ThĂ´ng tin giao hĂ ng
					</h3>
					<div className='grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm'>
						<div className="space-y-2">
							<p className="flex justify-between"><span className='text-gray-400'>NgÆ°á»i nháº­n:</span> <span className="font-medium text-white">{order.shippingDetails?.fullName}</span></p>
							<p className="flex justify-between"><span className='text-gray-400'>Äiá»‡n thoáº¡i:</span> <span className="font-medium text-white">{order.shippingDetails?.phoneNumber}</span></p>
							<p className="flex justify-between"><span className='text-gray-400'>Email:</span> <span className="font-medium text-white">{order.shippingDetails?.email}</span></p>
						</div>
						<div className="space-y-2">
							<p className="flex justify-between"><span className='text-gray-400'>ThĂ nh phá»‘:</span> <span className="font-medium text-white">{order.shippingDetails?.city}</span></p>
							<p className="flex justify-between items-start gap-4"><span className='text-gray-400 flex-shrink-0'>Äá»‹a chá»‰:</span> <span className="font-medium text-white text-right line-clamp-2" title={order.shippingDetails?.address}>{order.shippingDetails?.address}</span></p>
							{order.shippingDetails?.orderNotes && (
								<p className="flex justify-between border-t border-gray-600 pt-2 mt-2"><span className='text-gray-400'>Ghi chĂº:</span> <span className="font-medium text-amber-300 text-right line-clamp-2" title={order.shippingDetails?.orderNotes}>{order.shippingDetails?.orderNotes}</span></p>
							)}
						</div>
					</div>
				</div>

				{/* Order items */}
				<div className='mb-8'>
					<h3 className='text-lg font-bold text-white mb-4 flex items-center gap-2'>
						<Package size={20} className="text-[color:var(--color-gold)]" /> Sáº£n pháº©m Ä‘Ă£ mua ({order.products?.length || 0})
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
									<div className='mt-1 flex flex-wrap gap-2 text-[11px] text-gray-400'>
										{item.selectedColor && <span className='rounded-full border border-gray-600 px-2 py-0.5'>MĂ u: {item.selectedColor}</span>}
										{item.selectedSize && <span className='rounded-full border border-gray-600 px-2 py-0.5'>Size: {item.selectedSize}</span>}
										{item.wristSize && <span className='rounded-full border border-gray-600 px-2 py-0.5'>Cáº¯t dĂ¢y: {item.wristSize} mm</span>}
									</div>
									<p className='text-sm text-gray-400 mt-1'>
										{item.price?.toLocaleString("vi-VN")} â‚« <span className="mx-1">x</span> <span className="font-bold text-white">{item.quantity}</span>
									</p>
								</div>
								<div className='text-right flex-shrink-0'>
									<p className='text-[color:var(--color-gold)] font-bold'>{(item.price * item.quantity).toLocaleString("vi-VN")} â‚«</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Total */}
				<div className='bg-[color:var(--color-gold)]/10 border border-[color:var(--color-gold)]/30 rounded-xl p-6 mb-8 flex items-center justify-between'>
					<span className='text-xl font-medium text-gray-300'>Tá»•ng thanh toĂ¡n:</span>
					<span className='text-3xl font-extrabold text-[color:var(--color-gold)] tracking-tight'>
						{order.totalAmount?.toLocaleString("vi-VN")} <span className="text-xl">VNÄ</span>
					</span>
				</div>

				{/* Actions */}
				<div className='flex flex-col sm:flex-row gap-4'>
					<Link to='/' className='flex-1 flex justify-center items-center px-6 py-4 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-all group'>
						<ArrowRight size={18} className="mr-2 rotate-180 text-gray-400 group-hover:-translate-x-1 transition-transform" />
						Tiáº¿p tá»¥c mua sáº¯m
					</Link>
					<Link
						to={order.trackingToken ? `/order-tracking/${order.trackingToken}` : "/profile"}
						className='flex-1 flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-[color:var(--color-gold)] hover:brightness-110 text-black font-bold transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] group'
					>
						Theo dĂµi Ä‘Æ¡n hĂ ng <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
					</Link>
				</div>
			</div>
		</div>
	);
};
export default PurchaseSuccessPage;

