
import { motion } from "framer-motion";
import { useCartStore } from "../stores/useCartStore";
import { Link, useNavigate } from "react-router-dom";
import { MoveRight } from "lucide-react";
import { useContext } from "react";
import { I18nContext } from "../contexts/I18nContext";
import { formatCurrency } from "../i18n/format";


const OrderSummary = () => {
	const { total, subtotal, shippingFee, coupon, isCouponApplied, selectedItems } = useCartStore();
  const { t, lang, currency } = useContext(I18nContext);
  const savings = subtotal - (total - shippingFee);
  const navigate = useNavigate();

	return (
		<motion.div
			className='space-y-4 rounded-[1.5rem] border border-black/5 dark:border-luxury-border bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,245,240,0.96))] dark:bg-[linear-gradient(180deg,rgba(22,22,22,0.96),rgba(12,12,12,0.98))] p-4 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.4)] sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='hero-kicker text-[10px] font-semibold text-luxury-gold'>Checkout summary</p>
			<p className='hero-title text-2xl font-semibold text-gray-900 dark:text-white'>{t('order_summary')}</p>

			<div className='space-y-4'>
				<div className='space-y-2'>
					   <dl className='flex items-center justify-between gap-4'>
						   <dt className='text-base font-normal text-gray-600 dark:text-gray-300'>{t('subtotal')}</dt>
						   <dd className='text-base font-medium text-gray-900 dark:text-white'>{formatCurrency(subtotal, currency, lang)}</dd>
					   </dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							   <dt className='text-base font-normal text-gray-600 dark:text-gray-300'>{t('savings')}</dt>
							   <dd className='text-base font-medium text-luxury-gold'>-{formatCurrency(savings, currency, lang)}</dd>
						</dl>
					)}

					{coupon && isCouponApplied && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-600 dark:text-gray-300'>Mã giảm giá ({coupon.code})</dt>
							<dd className='text-base font-medium text-luxury-gold'>-{coupon.discountPercentage}%</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4'>
						   <dt className='text-base font-normal text-gray-600 dark:text-gray-300'>Phí vận chuyển</dt>
						   <dd className={`text-base font-medium ${shippingFee === 0 ? 'text-luxury-gold' : 'text-gray-900 dark:text-white'}`}>
							   {shippingFee === 0 ? (lang === 'vi' ? 'Miễn phí' : 'Free') : formatCurrency(shippingFee, currency, lang)}
						   </dd>
					</dl>

					<dl className='flex items-center justify-between gap-4 border-t border-gray-200 dark:border-gray-600 pt-2'>
						   <dt className='text-base font-bold text-gray-900 dark:text-white'>{t('total')}</dt>
						   <dd className='text-base font-bold text-luxury-gold'>{formatCurrency(total, currency, lang)}</dd>
					</dl>
				</div>

				<motion.button
					className='btn-primary flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-luxury-gold/30 disabled:opacity-50 disabled:cursor-not-allowed'
					whileHover={selectedItems.length > 0 ? { scale: 1.05 } : {}}
					whileTap={selectedItems.length > 0 ? { scale: 0.95 } : {}}
					onClick={() => selectedItems.length > 0 && navigate('/checkout')}
					disabled={selectedItems.length === 0}
				>
					{selectedItems.length === 0 ? "Chọn sản phẩm để thanh toán" : "Tiến hành thanh toán"}
				</motion.button>

				<div className='flex items-center justify-center gap-2'>
					<span className='text-sm font-normal text-gray-400'>hoặc</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-luxury-gold underline hover:text-luxury-gold-light hover:no-underline'
					>
						Tiếp tục mua sắm
						<MoveRight size={16} />
					</Link>
				</div>
			</div>
		</motion.div>
	);
};
export default OrderSummary;
