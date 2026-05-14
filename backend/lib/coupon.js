export const getCouponDiscountAmount = (coupon, subtotal) => {
	if (!coupon || !coupon.isActive) return 0;

	const baseAmount = Number(subtotal) || 0;
	if (baseAmount <= 0) return 0;

	const rawValue = Number(coupon.discountValue ?? coupon.discountPercentage ?? 0);
	if (rawValue <= 0) return 0;

	if (coupon.type === "fixed") {
		return Math.min(baseAmount, rawValue);
	}

	return Math.round((baseAmount * Math.min(rawValue, 100)) / 100);
};
