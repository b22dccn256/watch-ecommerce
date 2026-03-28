import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import { motion } from "framer-motion";
import { ShoppingBag, ArrowRight, ShieldCheck, Truck, CheckCircle2 } from "lucide-react";
import CartItem from "../components/CartItem";
import PeopleAlsoBought from "../components/PeopleAlsoBought";
import OrderSummary from "../components/OrderSummary";

import GiftCouponCard from "../components/GiftCouponCard";
import CheckoutStepper from "../components/CheckoutStepper";

const FreeShippingBar = ({ subtotal }) => {
	const threshold = 2000000;
	const progress = Math.min(Math.round((subtotal / threshold) * 100), 100);
	const remaining = threshold - subtotal;
	const isSuccess = subtotal >= threshold;


	return (
		<div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-5 mb-8 shadow-sm">
			<div className="flex items-center gap-3 mb-3">
				<div className={`w-8 h-8 rounded-full flex items-center justify-center ${isSuccess ? 'bg-emerald-500 text-white' : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
					{isSuccess ? <CheckCircle2 className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
				</div>
				<div className="flex-1">
					{isSuccess ? (
						<h4 className="font-bold text-emerald-600 dark:text-emerald-400">Chúc mừng! Bạn đã nhận được ưu đãi Miễn phí vận chuyển.</h4>
					) : (
						<h4 className="font-bold text-gray-800 dark:text-gray-200">
							Mua thêm <span className="text-emerald-600 dark:text-yellow-400">{remaining.toLocaleString('vi-VN')} ₫</span> để được miễn phí vận chuyển
						</h4>
					)}
				</div>
			</div>

			<div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
				<div
					className={`h-full transition-all duration-700 ease-out bg-gradient-to-r ${isSuccess ? 'from-emerald-400 to-emerald-500' : 'from-yellow-400 to-[#D4AF37]'}`}
					style={{ width: `${progress}%` }}
				></div>
			</div>

			<p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 justify-end">
				Miễn phí vận chuyển toàn quốc cho đơn từ 2.000.000 ₫
			</p>
		</div>
	);
};

const EmptyCartUI = () => (
	<motion.div
		className='flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-gray-800'
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className="w-24 h-24 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center mb-6 border border-gray-100 dark:border-gray-800">
			<ShoppingBag className='h-10 w-10 text-emerald-500 dark:text-yellow-400' />
		</div>
		<h3 className='text-3xl font-bold font-serif mb-3 text-gray-900 dark:text-white text-center'>
			Giỏ hàng trống
		</h3>
		<p className='text-gray-500 text-center max-w-sm mb-8'>
			Vẫn chưa có chiếc đồng hồ nào được chọn. Hãy khám phá các bộ sưu tập đẳng cấp của chúng tôi.
		</p>
		<Link
			className='rounded-xl bg-gray-900 dark:bg-yellow-400 px-8 py-3.5 text-white dark:text-black font-bold uppercase tracking-widest transition-transform hover:scale-105 flex items-center gap-2'
			to='/catalog'
		>
			Khám phá bộ sưu tập <ArrowRight className="w-4 h-4" />
		</Link>

		<div className="grid grid-cols-3 gap-6 mt-16 max-w-lg w-full px-4 border-t border-gray-200 dark:border-gray-800 pt-8 opacity-70 hover:opacity-100 transition">
			<div className="flex flex-col items-center gap-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
				<ShieldCheck className="w-6 h-6 mb-1 text-emerald-600 dark:text-yellow-400" /> Vận chuyển an toàn
			</div>
			<div className="flex flex-col items-center gap-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
				<CheckCircle2 className="w-6 h-6 mb-1 text-emerald-600 dark:text-yellow-400" /> Hoàn tiền 30 ngày
			</div>
			<div className="flex flex-col items-center gap-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
				<Truck className="w-6 h-6 mb-1 text-emerald-600 dark:text-yellow-400" /> Miễn phí giao hàng
			</div>
		</div>
	</motion.div>
);

const CartPage = () => {
	const { cart, selectedItems, selectAllItems, subtotal } = useCartStore();

	const isAllSelected = cart.length > 0 && selectedItems.length === cart.length;
	const handleSelectAll = (e) => {
		selectAllItems(e.target.checked, cart);
	};

	return (
		<div className='bg-white dark:bg-[#0f0c08] min-h-screen text-gray-900 dark:text-white transition-colors duration-300 pb-16'>
			<CheckoutStepper currentStep={1} />

			<div className='mx-auto max-w-screen-xl px-4 xl:px-8'>
				{cart.length > 0 && (
					<motion.h1
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-3xl font-serif mb-8 text-center md:text-left"
					>
						Giỏ Hàng Của Bạn
					</motion.h1>
				)}

				<div className={`mt-2 ${cart.length > 0 ? 'lg:flex lg:items-start lg:gap-8 xl:gap-12' : ''}`}>
					<motion.div
						className={`mx-auto w-full flex-none ${cart.length > 0 ? 'lg:max-w-[800px]' : ''}`}
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						{cart.length === 0 ? (
							<EmptyCartUI />
						) : (
							<div className='space-y-6'>
								<FreeShippingBar subtotal={subtotal} />

								<div className="flex items-center gap-3 bg-gray-50 dark:bg-black/50 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition">
									<input
										type="checkbox"
										checked={isAllSelected}
										onChange={handleSelectAll}
										className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
										id="selectAll"
									/>
									<label htmlFor="selectAll" className="font-semibold text-gray-700 dark:text-gray-300 cursor-pointer select-none">
										CHỌN TẤT CẢ ({cart.length} SẢN PHẨM)
									</label>
								</div>

								<div className="space-y-4">
									{cart.map((item) => (
										<CartItem key={useCartStore.getState().getUniqueId(item)} item={item} />
									))}
								</div>
							</div>
						)}

						{cart.length > 0 && (
							<div className="mt-12 hidden md:block">
								<PeopleAlsoBought />
							</div>
						)}
					</motion.div>

					{cart.length > 0 && (
						<motion.div
							className='mx-auto mt-8 max-w-4xl flex-1 space-y-6 lg:mt-0 lg:w-full sticky top-28'
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
						>
							<OrderSummary />
							<GiftCouponCard />
						</motion.div>
					)}
				</div>

				{/* Mobile PeopleAlsoBought rendering */}
				{cart.length > 0 && (
					<div className="mt-12 block md:hidden">
						<PeopleAlsoBought />
					</div>
				)}
			</div>
		</div>
	);
};

export default CartPage;
