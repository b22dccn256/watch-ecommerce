import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";

const MiniCart = ({ isOpen, onClose }) => {
	const navigate = useNavigate();
	const { cart, removeFromCart } = useCartStore();

	const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
	const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

	const handleCheckout = () => {
		onClose();
		navigate("/cart");
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<>
					{/* Overlay */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.3 }}
						onClick={onClose}
						className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
					/>

					{/* Slide-over */}
					<motion.div
						initial={{ x: "100%" }}
						animate={{ x: 0 }}
						exit={{ x: "100%" }}
						transition={{ type: "spring", damping: 25, stiffness: 200 }}
						className="fixed inset-y-0 right-0 z-[101] w-full max-w-sm flex flex-col bg-white dark:bg-[#121212] shadow-2xl border-l border-black/5 dark:border-white/5"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10">
							<div className="flex items-center gap-2">
								<ShoppingBag className="w-5 h-5 text-gray-900 dark:text-white" />
								<h2 className="text-lg font-serif font-semibold text-gray-900 dark:text-white">Giỏ hàng ({cartCount})</h2>
							</div>
							<button
								onClick={onClose}
								className="p-2 -mr-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/10"
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* Cart Items */}
						<div className="flex-1 overflow-y-auto custom-scrollbar p-5">
							{cart.length === 0 ? (
								<div className="h-full flex flex-col items-center justify-center text-center space-y-4">
									<div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center">
										<ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-600" />
									</div>
									<div>
										<p className="text-gray-900 dark:text-white font-medium mb-1">Giỏ hàng trống</p>
										<p className="text-sm text-gray-500">Bạn chưa thêm sản phẩm nào vào giỏ.</p>
									</div>
									<button
										onClick={onClose}
										className="text-sm font-semibold text-luxury-gold hover:underline"
									>
										Tiếp tục mua sắm
									</button>
								</div>
							) : (
								<div className="space-y-6">
									{cart.map((item) => (
										<div key={item._id + item.selectedColor + item.selectedSize + item.wristSize} className="flex gap-4 group">
											<Link to={`/product/${item._id}`} onClick={onClose} className="shrink-0 relative overflow-hidden rounded-lg bg-gray-100 dark:bg-zinc-800 w-20 h-24">
												<img
													src={item.image}
													alt={item.name}
													className="w-full h-full object-cover transition-transform group-hover:scale-105"
												/>
											</Link>
											<div className="flex flex-col flex-1 min-w-0">
												<Link to={`/product/${item._id}`} onClick={onClose} className="text-sm font-semibold text-gray-900 dark:text-white truncate hover:text-luxury-gold transition-colors">
													{item.name}
												</Link>
												<div className="text-[10px] text-gray-500 mt-1 space-y-0.5">
													{item.selectedColor && <p>Màu: {item.selectedColor}</p>}
													{item.selectedSize && <p>Size: {item.selectedSize}</p>}
													{item.wristSize && <p>Cắt dây: {item.wristSize}mm</p>}
												</div>
												<div className="mt-auto flex items-end justify-between">
													<p className="text-sm font-semibold text-luxury-gold">
														{item.price?.toLocaleString("vi-VN")} ₫
													</p>
													<div className="flex items-center gap-3">
														<span className="text-xs text-gray-500">SL: {item.quantity}</span>
														<button
															onClick={() => removeFromCart(item._id, item.wristSize, item.selectedColor, item.selectedSize)}
															className="text-[10px] font-medium text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
														>
															Xóa
														</button>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							)}
						</div>

						{/* Footer */}
						{cart.length > 0 && (
							<div className="p-5 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10">
								<div className="flex items-center justify-between mb-4">
									<span className="text-sm text-gray-500">Tạm tính</span>
									<span className="text-lg font-semibold text-gray-900 dark:text-white">
										{subtotal.toLocaleString("vi-VN")} ₫
									</span>
								</div>
								<button
									onClick={handleCheckout}
									className="w-full flex items-center justify-center gap-2 bg-luxury-gold hover:bg-[#a68249] text-black font-semibold py-3.5 px-4 rounded-xl transition-all hover:shadow-[0_0_20px_rgba(183,146,90,0.3)] hover:-translate-y-0.5"
								>
									Thanh Toán <ArrowRight className="w-4 h-4" />
								</button>
								<div className="mt-3 text-center">
									<button onClick={() => { onClose(); navigate("/cart"); }} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors underline-offset-4 hover:underline">
										Xem chi tiết giỏ hàng
									</button>
								</div>
							</div>
						)}
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
};

export default MiniCart;
