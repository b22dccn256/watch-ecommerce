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

export const toggleCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findById(req.params.id);
		if (!coupon) return res.status(404).json({ message: "Coupon không tồn tại" });
		coupon.isActive = !coupon.isActive;
		await coupon.save();
		res.json({ message: coupon.isActive ? "Đã kích hoạt coupon" : "Đã tắt coupon", isActive: coupon.isActive });
	} catch (error) {
		console.error("Error in toggleCoupon:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const createCoupon = async (req, res) => {
	try {
		const { code, type, discountValue, minOrderAmount, maxUses, expirationDate } = req.body;
		if (!code || !discountValue || !expirationDate) {
			return res.status(400).json({ message: "Thiếu thông tin bắt buộc: code, discountValue, expirationDate" });
		}
		const existing = await Coupon.findOne({ code: code.toUpperCase() });
		if (existing) return res.status(409).json({ message: "Mã coupon đã tồn tại" });
		const coupon = await Coupon.create({
			code: code.toUpperCase(), type: type || "percent",
			discountValue, minOrderAmount: minOrderAmount || 0,
			maxUses: maxUses || 0, expirationDate,
		});
		res.status(201).json(coupon);
	} catch (error) {
		console.error("Error in createCoupon:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};

export const deleteCoupon = async (req, res) => {
	try {
		const coupon = await Coupon.findByIdAndDelete(req.params.id);
		if (!coupon) return res.status(404).json({ message: "Coupon không tồn tại" });
		res.json({ message: "Đã xóa coupon" });
	} catch (error) {
		console.error("Error in deleteCoupon:", error.message);
		res.status(500).json({ message: "Server error" });
	}
};
