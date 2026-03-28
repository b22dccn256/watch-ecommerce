import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../lib/email.js";

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

	const paymentStats = await Order.aggregate([
		{
			$group: {
				_id: "$paymentMethod",
				count: { $sum: 1 },
				revenue: { $sum: "$totalAmount" },
			},
		},
	]);

	const wristSizeStats = await Order.aggregate([
		{ $unwind: "$products" },
		{ $match: { "products.wristSize": { $ne: null, $ne: "Mặc định" } } },
		{
			$group: {
				_id: "$products.wristSize",
				count: { $sum: "$products.quantity" },
			},
		},
		{ $sort: { count: -1 } },
		{ $limit: 10 }
	]);

	// Tổng số đơn hàng đã hoàn thành (để tính Conversion Rate)
	const totalOrdersPlaced = await Order.countDocuments({ paymentStatus: "paid" });

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
		housrySalesData: hourlySalesData,
		paymentStats: paymentStats.map(s => ({
			name: s._id === "stripe" ? "Stripe" : s._id === "qr" ? "VietQR" : s._id === "cod" ? "COD" : s._id === "vnpay" ? "VNPay" : s._id === "momo" ? "MoMo" : s._id === "zalopay" ? "ZaloPay" : s._id || "Khác",
			value: s.revenue,
			count: s.count
		})),
		wristSizeStats: wristSizeStats.map(s => ({
			size: String(s._id),
			count: s.count
		}))
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
