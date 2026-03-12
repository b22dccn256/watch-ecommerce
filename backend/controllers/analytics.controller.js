import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

export const getAnalyticsData = async () => {
	const totalUsers = await User.countDocuments();
	const totalProducts = await Product.countDocuments();

	const salesData = await Order.aggregate([
		{
			$group: {
				_id: null,
				totalSales: { $sum: 1 },
				totalRevenue: { $sum: "$totalAmount" },
			},
		},
	]);

	const { totalSales, totalRevenue } = salesData[0] || { totalSales: 0, totalRevenue: 0 };

	return {
		users: totalUsers,
		products: totalProducts,
		totalSales,
		totalRevenue,
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

		const analyticsData = await getAnalyticsData();
		const dailySales = await getDailySalesData(startDate, endDate);

		res.status(200).json({
			...analyticsData,
			dailySales,
		});
	} catch (error) {
		console.error("Error fetching analytics data:", error);
		res.status(500).json({ message: "Failed to fetch analytics data", error: error.message });
	}
};
