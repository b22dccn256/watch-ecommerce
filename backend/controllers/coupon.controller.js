import Coupon from "../models/coupon.model.js";

export const getCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findOne({ userId: req.user._id, isActive: true });
		res.json(coupon || null);
	} catch (error) {
		console.log("Error in getCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const validateCoupon = async (req, res) => {
	try {
		const { code } = req.body;
		const coupon = await Coupon.findOne({ code: code, userId: req.user._id, isActive: true });

		if (!coupon) {
			return res.status(404).json({ message: "Coupon not found" });
		}

		if (coupon.expirationDate < new Date()) {
			coupon.isActive = false;
			await coupon.save();
			return res.status(404).json({ message: "Coupon expired" });
		}

		res.json({
			message: "Coupon is valid",
			code: coupon.code,
			discountPercentage: coupon.discountPercentage,
		});
	} catch (error) {
		console.log("Error in validateCoupon controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getAllCoupons = async (req, res) => {
	try {
		const startOfToday = new Date();
		startOfToday.setHours(0, 0, 0, 0);

		const coupons = await Coupon.find().sort({ createdAt: -1 });

		const couponsWithStats = coupons.map(coupon => {
			const usedToday = coupon.usageHistory ? coupon.usageHistory.filter(
				h => new Date(h.usedAt) >= startOfToday
			).length : 0;

			return {
				...coupon.toObject(),
				usedToday
			};
		});

		res.json(couponsWithStats);
	} catch (error) {
		console.error("Error in getAllCoupons:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};
