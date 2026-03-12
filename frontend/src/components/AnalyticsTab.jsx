import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import {
	LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart
} from "recharts";

const DAYS_OPTIONS = [
	{ label: "7 ngày", value: 7 },
	{ label: "30 ngày", value: 30 },
	{ label: "90 ngày", value: 90 },
];

const formatVND = (value) => {
	if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + " tỷ";
	if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + " tr";
	return value?.toLocaleString("vi-VN");
};

const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-gray-900 border border-gray-700 p-3 rounded-lg shadow-xl text-xs">
				<p className="font-bold text-white mb-2">{label}</p>
				{payload.map((entry) => (
					<p key={entry.name} style={{ color: entry.color }}>
						{entry.name === "revenue"
							? `Doanh thu: ${formatVND(entry.value)} ₫`
							: `Đơn hàng: ${entry.value}`}
					</p>
				))}
			</div>
		);
	}
	return null;
};

const AnalyticsTab = () => {
	const [analyticsData, setAnalyticsData] = useState({
		users: 0,
		products: 0,
		totalSales: 0,
		totalRevenue: 0,
	});
	const [isLoading, setIsLoading] = useState(true);
	const [dailySalesData, setDailySalesData] = useState([]);
	const [days, setDays] = useState(7);

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			setIsLoading(true);
			try {
				const response = await axios.get(`/analytics?days=${days}`);
				const data = response.data;
				setAnalyticsData({
					users: data.users,
					products: data.products,
					totalSales: data.totalSales,
					totalRevenue: data.totalRevenue,
				});
				setDailySalesData(data.dailySales || data.dailySalesData || []);
			} catch (error) {
				console.error("Error fetching analytics data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAnalyticsData();
	}, [days]);

	const hasChartData = dailySalesData.some((d) => d.sales > 0 || d.revenue > 0);

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<AnalyticsCard
					title="Tổng người dùng"
					value={analyticsData.users.toLocaleString()}
					icon={Users}
					color="from-emerald-500 to-teal-700"
				/>
				<AnalyticsCard
					title="Tổng sản phẩm"
					value={analyticsData.products.toLocaleString()}
					icon={Package}
					color="from-blue-500 to-blue-700"
				/>
				<AnalyticsCard
					title="Tổng đơn hàng"
					value={analyticsData.totalSales.toLocaleString()}
					icon={ShoppingCart}
					color="from-purple-500 to-purple-700"
				/>
				<AnalyticsCard
					title="Doanh thu (đã TT)"
					value={formatVND(analyticsData.totalRevenue) + " ₫"}
					icon={DollarSign}
					color="from-amber-500 to-yellow-700"
				/>
			</div>

			{/* Chart Section */}
			<motion.div
				className="bg-gray-800/60 rounded-xl p-6 shadow-lg"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-emerald-400" />
						<h2 className="text-lg font-bold text-white">Doanh thu &amp; Đơn hàng</h2>
					</div>
					<div className="flex gap-2">
						{DAYS_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								onClick={() => setDays(opt.value)}
								className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
									days === opt.value
										? "bg-emerald-500 text-white"
										: "bg-gray-700 text-gray-300 hover:bg-gray-600"
								}`}
							>
								{opt.label}
							</button>
						))}
					</div>
				</div>

				{isLoading ? (
					<div className="flex items-center justify-center h-72 text-emerald-400">
						Đang tải dữ liệu...
					</div>
				) : !hasChartData ? (
					<div className="flex flex-col items-center justify-center h-72 text-gray-500 gap-3">
						<ShoppingCart className="w-12 h-12 opacity-30" />
						<p className="text-sm">Chưa có đơn hàng đã thanh toán trong {days} ngày qua</p>
					</div>
				) : (
					<ResponsiveContainer width="100%" height={350}>
						<LineChart data={dailySalesData}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" />
							<XAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
							<YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={(v) => v} />
							<YAxis
								yAxisId="right"
								orientation="right"
								stroke="#9CA3AF"
								tick={{ fontSize: 11 }}
								tickFormatter={(v) => formatVND(v)}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Legend />
							<Line
								yAxisId="left"
								type="monotone"
								dataKey="sales"
								stroke="#10B981"
								activeDot={{ r: 6 }}
								name="Đơn hàng"
								strokeWidth={2}
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="revenue"
								stroke="#F59E0B"
								activeDot={{ r: 6 }}
								name="Doanh thu (₫)"
								strokeWidth={2}
							/>
						</LineChart>
					</ResponsiveContainer>
				)}
			</motion.div>
		</div>
	);
};

export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
	<motion.div
		className={`bg-gray-800 rounded-xl p-6 shadow-lg overflow-hidden relative`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className="flex justify-between items-center">
			<div className="z-10 relative">
				<p className="text-emerald-300 text-sm mb-1 font-semibold">{title}</p>
				<h3 className="text-white text-2xl font-bold">{value}</h3>
			</div>
		</div>
		<div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
		<div className="absolute -bottom-4 -right-4 text-emerald-800 opacity-20">
			<Icon className="h-28 w-28" />
		</div>
	</motion.div>
);
