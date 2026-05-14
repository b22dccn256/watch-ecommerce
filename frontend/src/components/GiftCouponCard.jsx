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
						Báº¡n cĂ³ mĂ£ giáº£m giĂ¡?
					</label>
					<input
						type='text'
						id='voucher'
						className='input-base'
						placeholder='Nháº­p mĂ£...'
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
					Ăp dá»¥ng
				</motion.button>
			</div>
			{isCouponApplied && coupon && (
				<div className='mt-4'>
					<h3 className='text-lg font-medium text-primary'>MĂ£ Ä‘Ă£ Ă¡p dá»¥ng</h3>

					<p className='mt-2 text-sm text-muted'>
						{coupon.code} - Giáº£m {coupon.discountPercentage}%
					</p>

					<motion.button
						type='button'
						className='mt-2 btn-base btn-outline h-10 w-full text-red-500'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleRemoveCoupon}
					>
						Gá»¡ mĂ£ giáº£m giĂ¡
					</motion.button>
				</div>
			)}

			{coupon && (
				<div className='mt-4'>
					<h3 className='text-lg font-medium text-primary'>MĂ£ giáº£m giĂ¡ dĂ nh cho báº¡n:</h3>
					<p className='mt-2 text-sm text-muted'>
						{coupon.code} - Giáº£m {coupon.discountPercentage}%
					</p>
				</div>
			)}
		</motion.div>
	);
};
export default GiftCouponCard;

