import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import {
	LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Bar, BarChart, PieChart, Pie, Cell
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
			<div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-xl text-xs">
				<p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
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
		aov: 0,
		totalOrdersPlaced: 0,
		housrySalesData: [],
		paymentStats: [],
		wristSizeStats: []
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
						aov: data.aov || 0,
						totalOrdersPlaced: data.totalOrdersPlaced || 0,
						conversionRate: data.conversionRate || 0,
						hourlySalesData: data.hourlySalesData || [],
						paymentStats: data.paymentStats || [],
						wristSizeStats: data.wristSizeStats || [],
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

			{/* KPI Row 2: AOV, Orders Paid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
				<div className="bg-white dark:bg-gray-800/60 rounded-xl p-5 border border-gray-100 dark:border-transparent shadow flex items-center gap-4">
					<div className="p-3 rounded-full bg-gradient-to-br from-pink-500 to-rose-700">
						<TrendingUp className="w-5 h-5 text-white" />
					</div>
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400">AOV (Giá trị đơn TB)</p>
						<p className="text-xl font-bold text-gray-900 dark:text-white">{formatVND(analyticsData.aov)} ₫</p>
					</div>
				</div>
				<div className="bg-white dark:bg-gray-800/60 rounded-xl p-5 border border-gray-100 dark:border-transparent shadow flex items-center gap-4">
					<div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-700">
						<ShoppingCart className="w-5 h-5 text-white" />
					</div>
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400">Đơn đã thanh toán</p>
						<p className="text-xl font-bold text-gray-900 dark:text-white">{analyticsData.totalOrdersPlaced?.toLocaleString()} đơn</p>
					</div>
				</div>
			</div>

			{/* Chart Section */}
			<motion.div
				className="bg-white dark:bg-gray-800/60 rounded-xl p-6 shadow-xl dark:shadow-lg border border-gray-100 dark:border-transparent"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<TrendingUp className="w-5 h-5 text-emerald-500" />
						<h2 className="text-lg font-bold text-gray-900 dark:text-white">Doanh thu &amp; Đơn hàng</h2>
					</div>
					<div className="flex gap-2">
						{DAYS_OPTIONS.map((opt) => (
							<button
								key={opt.value}
								onClick={() => setDays(opt.value)}
								className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
									days === opt.value
										? "bg-emerald-500 text-white"
										: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
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
					<div style={{ width: '100%', height: 350, minHeight: 350 }}>
						<ResponsiveContainer width="99%" height="100%">
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
					</div>
				)}
			</motion.div>

			{/* Secondary Charts: Payment Methods & Wrist Sizes */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
				{/* Payment Methods */}
				<motion.div
					className="bg-white dark:bg-gray-800/60 rounded-xl p-6 shadow-xl dark:shadow-lg border border-gray-100 dark:border-transparent"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
				>
					<h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Doanh thu theo Thanh toán</h2>
					{analyticsData.paymentStats?.length > 0 ? (
						<div className="h-64">
							<ResponsiveContainer width="99%" height="100%">
								<PieChart>
									<Pie
										data={analyticsData.paymentStats}
										cx="50%"
										cy="50%"
										innerRadius={60}
										outerRadius={80}
										paddingAngle={5}
										dataKey="value"
									>
										{analyticsData.paymentStats.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6'][index % 4]} />
										))}
									</Pie>
									<Tooltip formatter={(value) => formatVND(value) + " ₫"} />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="flex items-center justify-center h-64 text-gray-500 text-sm">Chưa có dữ liệu thanh toán</div>
					)}
				</motion.div>

				{/* Wrist Sizes */}
				<motion.div
					className="bg-white dark:bg-gray-800/60 rounded-xl p-6 shadow-xl dark:shadow-lg border border-gray-100 dark:border-transparent"
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
				>
					<h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Top Size Cổ Tay Được Chọn</h2>
					{analyticsData.wristSizeStats?.length > 0 ? (
						<div className="h-64">
							<ResponsiveContainer width="99%" height="100%">
								<BarChart data={analyticsData.wristSizeStats} layout="vertical" margin={{ left: 20 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
									<XAxis type="number" stroke="#9CA3AF" />
									<YAxis type="category" dataKey="size" stroke="#9CA3AF" />
									<Tooltip cursor={{fill: 'transparent'}} />
									<Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} barSize={24} name="Số lượng" />
								</BarChart>
							</ResponsiveContainer>
						</div>
					) : (
						<div className="flex items-center justify-center h-64 text-gray-500 text-sm">Chưa có dữ liệu size</div>
					)}
				</motion.div>
			</div>
		</div>
	);
};

export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
	<motion.div
		className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl dark:shadow-lg overflow-hidden relative border border-gray-100 dark:border-transparent`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className="flex justify-between items-center">
			<div className="z-10 relative">
				<p className="text-emerald-600 dark:text-emerald-300 text-sm mb-1 font-semibold">{title}</p>
				<h3 className="text-gray-900 dark:text-white text-2xl font-bold">{value}</h3>
			</div>
		</div>
		<div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
		<div className="absolute -bottom-4 -right-4 text-emerald-800 opacity-20">
			<Icon className="h-28 w-28" />
		</div>
	</motion.div>
);
