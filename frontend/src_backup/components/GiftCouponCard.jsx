import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "../stores/useCartStore";

const GiftCouponCard = () => {
	const [userInputCode, setUserInputCode] = useState("");
	const { coupon, isCouponApplied, applyCoupon, getMyCoupon, removeCoupon } = useCartStore();

	useEffect(() => {
		getMyCoupon();
	}, [getMyCoupon]);

	useEffect(() => {
		if (coupon) setUserInputCode(coupon.code);
	}, [coupon]);

	const handleApplyCoupon = () => {
		if (!userInputCode) return;
		applyCoupon(userInputCode);
	};

	const handleRemoveCoupon = async () => {
		await removeCoupon();
		setUserInputCode("");
	};

	return (
		<motion.div
			className='space-y-4 rounded-xl border border-black/10 dark:border-white/10 bg-surface p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<div className='space-y-4'>
				<div>
					<label htmlFor='voucher' className='mb-2 block text-sm font-medium text-secondary'>
						Bạn có mã giảm giá?
					</label>
					<input
						type='text'
						id='voucher'
						className='input-base'
						placeholder='Nhập mã...'
						value={userInputCode}
						onChange={(e) => setUserInputCode(e.target.value)}
						required
					/>
				</div>

				<motion.button
					type='button'
					className='btn-base btn-primary h-10 w-full'
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handleApplyCoupon}
				>
					Áp dụng
				</motion.button>
			</div>
			{isCouponApplied && coupon && (
				<div className='mt-4'>
					<h3 className='text-lg font-medium text-primary'>Mã đã áp dụng</h3>

					<p className='mt-2 text-sm text-muted'>
						{coupon.code} - Giảm {coupon.discountPercentage}%
					</p>

					<motion.button
						type='button'
						className='mt-2 btn-base btn-outline h-10 w-full text-red-500'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleRemoveCoupon}
					>
						Gỡ mã giảm giá
					</motion.button>
				</div>
			)}

			{coupon && (
				<div className='mt-4'>
					<h3 className='text-lg font-medium text-primary'>Mã giảm giá dành cho bạn:</h3>
					<p className='mt-2 text-sm text-muted'>
						{coupon.code} - Giảm {coupon.discountPercentage}%
					</p>
				</div>
			)}
		</motion.div>
	);
};
export default GiftCouponCard;
