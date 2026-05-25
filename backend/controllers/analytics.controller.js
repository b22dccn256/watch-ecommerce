import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../lib/email.js";

const buildRangeMatch = (startDate, endDate) => {
	if (!startDate || !endDate) return {};
	return {
		createdAt: {
			$gte: startDate,
			$lte: endDate,
		},
	};
};

export const getAnalyticsData = async ({ startDate, endDate } = {}) => {
	const rangeMatch = buildRangeMatch(startDate, endDate);
	const paidRangeMatch = { ...rangeMatch, paymentStatus: "paid" };
	const cashFlowMatch = { ...rangeMatch, paymentStatus: "pending", status: { $in: ["confirmed", "processing", "shipped"] } };
	const closeoutMatch = { ...rangeMatch, status: { $in: ["cancelled", "returned"] } };

	const totalUsers = await User.countDocuments();
	const totalProducts = await Product.countDocuments();

	const salesData = await Order.aggregate([
		{
			$match: paidRangeMatch,
		},
		{
			$group: {
				_id: null,
				totalSales: { $sum: 1 },
				totalRevenue: { $sum: "$totalAmount" },
			},
		},
	]);

	const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

	const paymentStats = await Order.aggregate([
		{ $match: paidRangeMatch },
		{
			$group: {
				_id: "$paymentMethod",
				count: { $sum: 1 },
				revenue: { $sum: "$totalAmount" },
			},
		},
	]);

	const wristSizeStats = await Order.aggregate([
		{ $match: paidRangeMatch },
		{ $unwind: "$products" },
		{ $match: { "products.wristSize": { $nin: [null, "Mặc định", ""] } } },
		{
			$group: {
				_id: "$products.wristSize",
				count: { $sum: "$products.quantity" },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: 10 }
	]);

	// Watch-specific movement analytics.
	const watchTypeStats = await Order.aggregate([
		{ $match: paidRangeMatch },
		{ $unwind: "$products" },
		{
			$lookup: {
				from: "products",
				localField: "products.product",
				foreignField: "_id",
				as: "productInfo",
			},
		},
		{ $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
		{ $match: { "productInfo.type": { $ne: null } } },
		{
			$group: {
				_id: "$productInfo.type",
				count: { $sum: "$products.quantity" },
				revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
			},
		},
		{ $sort: { count: -1 } },
	]);

	// ── Watch-specific: Xu hướng Màu Mặt Số (Dial Color) ───────────────────────
	const dialColorStats = await Order.aggregate([
		{ $match: paidRangeMatch },
		{ $unwind: "$products" },
		{
			$lookup: {
				from: "products",
				localField: "products.product",
				foreignField: "_id",
				as: "productInfo",
			},
		},
		{ $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
		{
			$match: {
				"productInfo.specs.dial.color": { $nin: [null, "", "N/A"] },
			},
		},
		{
			$group: {
				_id: "$productInfo.specs.dial.color",
				count: { $sum: "$products.quantity" },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: 8 },
	]);

	// ── Watch-specific: Doanh thu theo Danh mục (Sales by Category) ─────────────
	const categoryStats = await Order.aggregate([
		{ $match: paidRangeMatch },
		{ $unwind: "$products" },
		{
			$lookup: {
				from: "products",
				localField: "products.product",
				foreignField: "_id",
				as: "productInfo",
			},
		},
		{ $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
		{
			$lookup: {
				from: "categories",
				localField: "productInfo.categoryId",
				foreignField: "_id",
				as: "categoryInfo",
			},
		},
		{ $unwind: { path: "$categoryInfo", preserveNullAndEmptyArrays: true } },
		{
			$group: {
				_id: { $ifNull: ["$categoryInfo.name", "Khác/Chưa phân loại"] },
				count: { $sum: "$products.quantity" },
				revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
			},
		},
		{ $sort: { revenue: -1 } },
	]);

	// ── Danh sách Đơn hàng chờ duyệt (Recent Pending Orders) ───────────────────
	const recentPendingOrders = await Order.find({
		$or: [
			{ status: "pending" },
			{ paymentStatus: "pending" },
			{ status: "processing" }
		]
	})
		.sort({ createdAt: -1 })
		.limit(5)
		.select("_id orderCode totalAmount shippingDetails.fullName createdAt status paymentStatus")
		.lean();

	// ── Doanh thu dự kiến: đơn đang giao nhưng chưa thanh toán hoàn tất ─────────
	const pendingRevenueData = await Order.aggregate([
		{
			$match: {
				...cashFlowMatch,
			},
		},
		{
			$group: {
				_id: null,
				pendingRevenue: { $sum: "$totalAmount" },
				pendingCount: { $sum: 1 },
			},
		},
	]);
	const pendingRevenue = pendingRevenueData[0]?.pendingRevenue || 0;
	const pendingCount = pendingRevenueData[0]?.pendingCount || 0;

	// ── Tỷ lệ hủy đơn / hoàn hàng ──────────────────────────────────────────────
	const totalAllOrders = await Order.countDocuments(rangeMatch);
	const cancelledOrReturned = await Order.countDocuments(closeoutMatch);
	const cancellationRate = totalAllOrders > 0
		? Math.round((cancelledOrReturned / totalAllOrders) * 1000) / 10
		: 0;

	// Tổng số đơn hàng đã hoàn thành (để tính Conversion Rate)
	const totalOrdersPlaced = await Order.countDocuments(paidRangeMatch);

	// AOV = Average Order Value
	const aov = totalOrdersPlaced > 0 ? Math.round((salesData[0]?.totalRevenue || 0) / totalOrdersPlaced) : 0;

	// Hourly Sales (for today, timezone VN)
	const todayStart = new Date();
	todayStart.setHours(0, 0, 0, 0);
	const hourlySales = await Order.aggregate([
		{
			$match: {
				paymentStatus: "paid",
				createdAt: { $gte: todayStart }
			}
		},
		{
			$group: {
				_id: { $hour: { date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } },
				revenue: { $sum: "$totalAmount" },
				count: { $sum: 1 }
			}
		},
		{ $sort: { _id: 1 } }
	]);

	// Fill 0 for missing hours (0-23)
	const hourlyMap = {};
	hourlySales.forEach(h => { hourlyMap[h._id] = h; });
	const hourlySalesData = Array.from({ length: 24 }, (_, i) => ({
		hour: `${String(i).padStart(2, '0')}:00`,
		revenue: hourlyMap[i]?.revenue || 0,
		count: hourlyMap[i]?.count || 0
	}));

	return {
		users: totalUsers,
		products: totalProducts,
		totalSales,
		totalRevenue,
		aov,
		totalOrdersPlaced,
		hourlySalesData,
		// Doanh thu dự kiến & tỷ lệ hủy
		pendingRevenue,
		pendingCount,
		cancellationRate,
		cancelledOrReturned,
		paymentStats: paymentStats.map(s => ({
			name: s._id === "stripe" ? "Stripe" : s._id === "cod" ? "COD" : s._id === "vnpay" ? "VNPay" : s._id || "Khác",
			value: s.revenue,
			count: s.count
		})),
		wristSizeStats: wristSizeStats.map(s => ({
			size: String(s._id),
			count: s.count
		})),
		// Watch-specific analytics
		watchTypeStats: watchTypeStats.map(s => ({
			name: s._id === "automatic" ? "Cơ tự động" :
				s._id === "mechanical" ? "Cơ lên cót tay" :
				s._id === "quartz" ? "Máy pin" :
				s._id === "solar" ? "Năng lượng ánh sáng" :
				s._id || "Khác",
			value: s.count,
			revenue: s.revenue,
		})),
		dialColorStats: dialColorStats.map(s => ({
			name: s._id,
			value: s.count,
		})),
		categoryStats: categoryStats.map(s => ({
			name: s._id,
			value: s.revenue, // PieChart for Sales by Category
			count: s.count,
		})),
		recentPendingOrders,
	};
};

export const getDailySalesData = async (startDate, endDate) => {
	const dailySalesData = await Order.aggregate([
		{
			$match: {
				paymentStatus: "paid",
				createdAt: {
					$gte: startDate,
					$lte: endDate,
				},
			},
		},
		{
			$group: {
				_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } },
				sales: { $sum: 1 },
				revenue: { $sum: "$totalAmount" },
			},
		},
		{ $sort: { _id: 1 } },
	]);

	const dateArray = getDatesInRange(startDate, endDate);

	return dateArray.map((date) => {
		const foundData = dailySalesData.find((item) => item._id === date);
		return {
			name: formatDateLabel(date),
			date,
			sales: foundData?.sales || 0,
			revenue: foundData?.revenue || 0,
		};
	});
};

function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);
	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}
	return dates;
}

function formatDateLabel(dateStr) {
	const d = new Date(dateStr + "T00:00:00Z");
	return d.toLocaleDateString("vi-VN", { month: "short", day: "numeric", timeZone: "UTC" });
}

export const getAnalytics = async (req, res) => {
	try {
		const days = parseInt(req.query.days) || 7;
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - days + 1);
		startDate.setHours(0, 0, 0, 0);

		const analyticsData = await getAnalyticsData({ startDate, endDate });
		const dailySales = await getDailySalesData(startDate, endDate);

		let prevDailySales = [];
		if (req.query.includePrev === "true") {
			const prevEndDate = new Date(startDate);
			prevEndDate.setDate(prevEndDate.getDate() - 1);
			prevEndDate.setHours(23, 59, 59, 999);
			const prevStartDate = new Date(prevEndDate);
			prevStartDate.setDate(prevStartDate.getDate() - days + 1);
			prevStartDate.setHours(0, 0, 0, 0);
			prevDailySales = await getDailySalesData(prevStartDate, prevEndDate);
		}

		res.status(200).json({
			...analyticsData,
			dailySales,
			prevDailySales
		});
	} catch (error) {
		console.error("Error fetching analytics data:", error);
		res.status(500).json({ message: "Failed to fetch analytics data", error: error.message });
	}
};

export const sendTestEmail = async (req, res) => {
	try {
		const { type, automationId } = req.body;
		const adminEmail = req.user.email;

		let subject = "[WatchStore] Test Email";
		let html = `<p>Đây là bản tin thử nghiệm cho loại <strong>${type}</strong> (ID: ${automationId})</p>`;

		if (type === "Abandoned Cart 24h") {
			subject = "[WatchStore] Don't forget your items!";
			html = `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
					<div style="background-color: #000; padding: 20px; text-align: center; color: #d4af37;">
						<h1 style="margin: 0;">WATCH STORE</h1>
					</div>
					<div style="padding: 30px;">
						<h2>Vẫn còn sản phẩm trong giỏ hàng của bạn!</h2>
						<p>Chúng tôi nhận thấy bạn vẫn chưa hoàn thành đơn hàng. Những chiếc đồng hồ yêu thích đang chờ đón bạn.</p>
						<div style="text-align: center; margin-top: 30px;">
							<a href="${process.env.CLIENT_URL}/cart" style="background-color: #d4af37; color: #000; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 8px;">Quay lại giỏ hàng</a>
						</div>
					</div>
				</div>
			`;
		}

		await sendEmail(adminEmail, subject, html);
		res.json({ message: "Email test đã được gửi tới " + adminEmail });
	} catch (error) {
		console.error("Error sending test email:", error);
		res.status(500).json({ message: "Không thể gửi email test", error: error.message });
	}
};

// C3: P&L Report — Revenue vs Cost vs Gross Profit
export const getProfitLoss = async (req, res) => {
	try {
		const days = parseInt(req.query.days) || 30;
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(endDate.getDate() - days + 1);
		startDate.setHours(0, 0, 0, 0);

		// Aggregate: unwind products, lookup costPrice from Product collection
		const plData = await Order.aggregate([
			{
				$match: {
					paymentStatus: "paid",
					createdAt: { $gte: startDate, $lte: endDate },
				},
			},
			{ $unwind: "$products" },
			{
				$lookup: {
					from: "products",
					localField: "products.product",
					foreignField: "_id",
					as: "productInfo",
				},
			},
			{ $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Asia/Ho_Chi_Minh" } },
					revenue: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
					cogs: {
						$sum: {
							$multiply: [
								{ $ifNull: ["$productInfo.costPrice", { $multiply: ["$products.price", 0.6] }] }, // fallback: 60% of price
								"$products.quantity",
							],
						},
					},
					orderCount: { $addToSet: "$_id" },
				},
			},
			{ $sort: { _id: 1 } },
			{
				$project: {
					date: "$_id",
					revenue: 1,
					cogs: 1,
					grossProfit: { $subtract: ["$revenue", "$cogs"] },
					margin: {
						$cond: [
							{ $gt: ["$revenue", 0] },
							{ $multiply: [{ $divide: [{ $subtract: ["$revenue", "$cogs"] }, "$revenue"] }, 100] },
							0,
						],
					},
					orders: { $size: "$orderCount" },
				},
			},
		]);

		// FIX E4: After $project, field is always 'date', not '_id'. Use Map for O(1) lookup.
		const plMap = new Map(plData.map((d) => [d.date, d]));
		const dateArray = getDatesInRange(startDate, endDate);
		const filled = dateArray.map((date) => {
			const found = plMap.get(date);
			return {
				name: formatDateLabel(date),
				date,
				revenue: found?.revenue || 0,
				cogs: found?.cogs || 0,
				grossProfit: found?.grossProfit || 0,
				margin: found ? Math.round(found.margin * 10) / 10 : 0,
				orders: found?.orders || 0,
			};
		});


		// Totals summary
		const totalRevenue = filled.reduce((s, d) => s + d.revenue, 0);
		const totalCogs = filled.reduce((s, d) => s + d.cogs, 0);
		const totalGrossProfit = totalRevenue - totalCogs;
		const totalMargin = totalRevenue > 0 ? Math.round((totalGrossProfit / totalRevenue) * 1000) / 10 : 0;

		res.json({
			summary: { totalRevenue, totalCogs, totalGrossProfit, totalMargin, days },
			daily: filled,
		});
	} catch (error) {
		console.error("Error in getProfitLoss:", error);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};
