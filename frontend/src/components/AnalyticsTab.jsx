import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import axios from "../lib/axios";
import { Users, Package, ShoppingCart, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, Download, Trophy, AlertTriangle } from "lucide-react";
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
		users: 0, products: 0, totalSales: 0, totalRevenue: 0, aov: 0, totalOrdersPlaced: 0,
		housrySalesData: [], paymentStats: [], wristSizeStats: []
	});
	const [prevData, setPrevData] = useState(null); // C1: kỳ trước
	const [isLoading, setIsLoading] = useState(true);
	const [dailySalesData, setDailySalesData] = useState([]);
	const [days, setDays] = useState(7);
	const [topProducts, setTopProducts] = useState([]); // C2
	const [bottomProducts, setBottomProducts] = useState([]); // C2
	const [plData, setPlData] = useState(null); // C3: P&L
	const chartRef = useRef(null);
	const [chartReady, setChartReady] = useState(false);

	useEffect(() => {
		const observer = new ResizeObserver((entries) => {
			const width = entries?.[0]?.contentRect?.width || 0;
			setChartReady(width > 0);
		});
		if (chartRef.current) observer.observe(chartRef.current);
		return () => observer.disconnect();
	}, []);

	useEffect(() => {
		const fetchAnalyticsData = async () => {
			setIsLoading(true);
			try {
				// C1: Fetch current + previous period in parallel
				const [currentRes, prevRes, topRes, bottomRes] = await Promise.allSettled([
					axios.get(`/analytics?days=${days}`),
					axios.get(`/analytics?days=${days * 2}`), // prev period approximation
					axios.get(`/products?sort=best_selling&limit=10`),
					axios.get(`/products?sort=name_asc&limit=10&minPrice=1`), // bottom stock proxy
				]);

				if (currentRes.status === "fulfilled") {
					const data = currentRes.value.data;
					setAnalyticsData({
						users: data.users, products: data.products, totalSales: data.totalSales,
						totalRevenue: data.totalRevenue, aov: data.aov || 0,
						totalOrdersPlaced: data.totalOrdersPlaced || 0,
						conversionRate: data.conversionRate || 0,
						hourlySalesData: data.hourlySalesData || [],
						paymentStats: data.paymentStats || [],
						wristSizeStats: data.wristSizeStats || [],
					});
					setDailySalesData(data.dailySales || []);
				}

				// C1: Save prev period for comparison
				if (prevRes.status === "fulfilled") {
					const prev = prevRes.value.data;
					// Prev period = total - current (approximate)
					const curr = currentRes.status === "fulfilled" ? currentRes.value.data : null;
					if (curr) {
						setPrevData({
							totalRevenue: Math.max(0, prev.totalRevenue - curr.totalRevenue),
							totalSales: Math.max(0, prev.totalSales - curr.totalSales),
							aov: prev.aov || 0,
						});
					}
				}

				// C2: Top products
				if (topRes.status === "fulfilled") {
					setTopProducts((topRes.value.data?.products || []).slice(0, 8));
				}
				// C2: Low stock products as "bottom"
				if (bottomRes.status === "fulfilled") {
					setBottomProducts((bottomRes.value.data?.products || []).filter(p => p.stock <= (p.lowStockThreshold || 10)).slice(0, 8));
				}

				// C3: Fetch P&L
				try {
					const plRes = await axios.get(`/analytics/pl?days=${days}`);
					setPlData(plRes.data);
				} catch {}
			} catch (error) {
				console.error("Error fetching analytics data:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchAnalyticsData();
	}, [days]);

	// C1: Calculate delta %
	const getDelta = (current, previous) => {
		if (!previous || previous === 0) return null;
		const delta = ((current - previous) / previous) * 100;
		return { delta: delta.toFixed(1), positive: delta >= 0 };
	};

	// C4: Export CSV
	const handleExportCSV = () => {
		if (!dailySalesData.length) return;
		const headers = "Ngày,Đơn hàng,Doanh thu";
		const rows = dailySalesData.map(d => `${d.name},${d.sales},${d.revenue}`);
		const csv = [headers, ...rows].join("\n");
		const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url; a.download = `analytics_${days}days_${new Date().toISOString().split('T')[0]}.csv`;
		a.click(); URL.revokeObjectURL(url);
	};

	// C4: Export Products Excel (gọi backend)
	const handleExportProductsXLSX = () => {
		window.open("/api/products/export", "_blank");
	};

	const hasChartData = dailySalesData.some((d) => d.sales > 0 || d.revenue > 0);

	const revenueDeltas = prevData ? getDelta(analyticsData.totalRevenue, prevData.totalRevenue) : null;
	const salesDeltas = prevData ? getDelta(analyticsData.totalSales, prevData.totalSales) : null;

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
			{/* C4: Export buttons + header */}
			<div className="flex items-center justify-between">
				<h2 className="font-bold text-lg text-gray-900 dark:text-white">Tổng quan hiệu suất</h2>
				<div className="flex gap-2">
					<button onClick={handleExportCSV} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition">
						<Download className="w-3 h-3" /> CSV báo cáo
					</button>
					<button onClick={handleExportProductsXLSX} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
						<Download className="w-3 h-3" /> SP (.xlsx)
					</button>
				</div>
			</div>
			{/* KPI Cards */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<AnalyticsCard title="Tổng người dùng" value={analyticsData.users.toLocaleString()} icon={Users} color="from-emerald-500 to-teal-700" />
				<AnalyticsCard title="Tổng sản phẩm" value={analyticsData.products.toLocaleString()} icon={Package} color="from-blue-500 to-blue-700" />
				<AnalyticsCard title="Tổng đơn hàng" value={analyticsData.totalSales.toLocaleString()} icon={ShoppingCart} color="from-purple-500 to-purple-700" delta={salesDeltas} />
				<AnalyticsCard title="Doanh thu (đã TT)" value={formatVND(analyticsData.totalRevenue) + " ₫"} icon={DollarSign} color="from-amber-500 to-yellow-700" delta={revenueDeltas} />
			</div>

			{/* KPI Row 2: AOV, Orders Paid, Conversion Rate */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
				<div className="bg-white dark:bg-gray-800/60 rounded-xl p-5 border border-gray-100 dark:border-transparent shadow flex items-center gap-4">
					<div className="p-3 rounded-full bg-gradient-to-br from-emerald-500 to-green-700">
						<TrendingUp className="w-5 h-5 text-white" />
					</div>
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400">Tỷ lệ chuyển đổi</p>
						{(() => {
							const rate = analyticsData.conversionRate > 0 
								? analyticsData.conversionRate 
								: (analyticsData.totalSales > 0 ? (analyticsData.totalOrdersPlaced / analyticsData.totalSales) * 100 : 0);
							
							let colorCls = "text-gray-900 dark:text-white";
							if (rate > 2) colorCls = "text-emerald-500";
							else if (rate >= 1 && rate <= 2) colorCls = "text-yellow-500";
							else if (rate < 1 && rate > 0) colorCls = "text-red-500";

							return (
								<p className={`text-xl font-bold ${colorCls}`}>
									{rate > 0 ? `${rate.toFixed(2)}%` : "—"}
								</p>
							);
						})()}
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
					<div ref={chartRef} style={{ width: '100%', height: 350, minHeight: 350 }}>
						{chartReady ? (
							<ResponsiveContainer width="100%" height="100%">
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
						) : (
							<div className="flex items-center justify-center h-full text-sm text-gray-500">Đang khởi tạo biểu đồ...</div>
						)}
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
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height={256}>
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
						<div className="h-64 w-full">
							<ResponsiveContainer width="100%" height={256}>
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

			{/* C2: Top bán chạy + Hàng tồn kho thấp */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="bg-white dark:bg-gray-800/60 rounded-xl p-6 border border-gray-100 dark:border-transparent shadow">
					<h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
						<Trophy className="w-4 h-4 text-amber-400" /> Top 8 Sản phẩm Bán chạy
					</h2>
					{topProducts.length === 0 ? (
						<p className="text-sm text-gray-400 py-4 text-center">Chưa có dữ liệu</p>
					) : topProducts.map((p, idx) => (
						<div key={p._id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
							<span className="text-[10px] font-bold text-gray-400 w-5">#{idx + 1}</span>
							{p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />}
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
								<p className="text-[10px] text-gray-400">{p.brand?.name}</p>
							</div>
							<div className="text-right">
								<p className="text-xs font-bold text-luxury-gold">{(p.salesCount || 0).toLocaleString()} bán</p>
								<p className="text-[10px] text-gray-400">Tồn: {p.stock}</p>
							</div>
						</div>
					))}
				</div>
				<div className="bg-white dark:bg-gray-800/60 rounded-xl p-6 border border-gray-100 dark:border-transparent shadow">
					<h2 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
						<AlertTriangle className="w-4 h-4 text-red-400" /> Hàng Tồn Kho Thấp
					</h2>
					{bottomProducts.length === 0 ? (
						<p className="text-sm text-gray-400 py-4 text-center">Không có sản phẩm cảnh báo 🎉</p>
					) : bottomProducts.map((p, idx) => (
						<div key={p._id} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
							<span className={`text-[10px] font-bold w-12 px-1.5 py-0.5 rounded text-center ${ p.stock === 0 ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10" }`}>{p.stock === 0 ? "HẾT" : p.stock}</span>
							{p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />}
							<div className="flex-1 min-w-0">
								<p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
								<p className="text-[10px] text-gray-400">Ngưỡng: {p.lowStockThreshold}</p>
							</div>
							<p className="text-xs font-bold text-gray-700 dark:text-gray-300">{p.price?.toLocaleString("vi-VN")} ₫</p>
						</div>
					))}
				</div>
			</div>


		{/* C3: P&L Report */}
		{plData && (
			<div className="mt-6 bg-white dark:bg-gray-800/60 rounded-2xl p-6 border border-gray-100 dark:border-transparent shadow">
				<div className="flex items-center justify-between mb-5">
					<h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
						<TrendingUp className="w-4 h-4 text-luxury-gold" /> Bao Cao Loi Nhuan Gop (P&L)
					</h2>
					<span className="text-xs text-gray-400">{plData.summary?.days} ngay gan nhat</span>
				</div>
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
					{[
						{ label: "Doanh thu", value: formatVND(plData.summary?.totalRevenue || 0) + " ₫", clr: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
						{ label: "Gia von (COGS)", value: formatVND(plData.summary?.totalCogs || 0) + " ₫", clr: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
						{ label: "Loi nhuan gop", value: formatVND(plData.summary?.totalGrossProfit || 0) + " ₫", clr: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" },
						{ label: "Bien loi nhuan", value: (plData.summary?.totalMargin || 0).toFixed(1) + "%", clr: "text-luxury-gold bg-luxury-gold/10 border-luxury-gold/20" },
					].map(item => (
						<div key={item.label} className={"rounded-xl p-4 border " + item.clr}>
							<p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{item.label}</p>
							<p className="text-lg font-bold">{item.value}</p>
						</div>
					))}
				</div>
				{plData.daily?.length > 0 && (
					<ResponsiveContainer width="100%" height={240}>
						<BarChart data={plData.daily} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
							<CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.3} />
							<XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} />
							<YAxis tickFormatter={v => formatVND(v)} tick={{ fill: "#9ca3af", fontSize: 10 }} axisLine={false} tickLine={false} width={60} />
							<Tooltip contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }} formatter={(v, name) => [formatVND(v) + " ₫", name === "revenue" ? "Doanh thu" : name === "cogs" ? "Gia von" : "Loi nhuan"]} />
							<Legend formatter={(v) => v === "revenue" ? "Doanh thu" : v === "cogs" ? "Gia von" : "Loi nhuan gop"} />
							<Bar dataKey="revenue" fill="#3b82f6" radius={[4,4,0,0]} maxBarSize={24} />
							<Bar dataKey="cogs" fill="#f97316" radius={[4,4,0,0]} maxBarSize={24} />
							<Bar dataKey="grossProfit" fill="#10b981" radius={[4,4,0,0]} maxBarSize={24} />
						</BarChart>
					</ResponsiveContainer>
				)}
				<p className="text-[10px] text-gray-400 mt-2">* Gia von dung costPrice tu san pham. Neu khong co, he thong uoc tinh 60% gia ban.</p>
			</div>
		)}

		</div>
	);
};

export default AnalyticsTab;

const AnalyticsCard = ({ title, value, icon: Icon, color, delta }) => (
	<motion.div
		className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-xl dark:shadow-lg overflow-hidden relative border border-gray-100 dark:border-transparent`}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className="flex justify-between items-start">
			<div className="z-10 relative">
				<p className="text-emerald-600 dark:text-emerald-300 text-sm mb-1 font-semibold">{title}</p>
				<h3 className="text-gray-900 dark:text-white text-2xl font-bold">{value}</h3>
			</div>
			{/* C1: Delta badge */}
			{delta && (
				<span className={`z-10 relative flex items-center gap-0.5 text-[11px] font-bold px-2 py-1 rounded-lg ${ delta.positive ? "text-emerald-500 bg-emerald-500/10" : "text-red-400 bg-red-400/10" }`}>
					{delta.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
					{delta.positive ? "+" : ""}{delta.delta}%
				</span>
			)}
		</div>
		<div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-20`} />
		<div className="absolute -bottom-4 -right-4 text-emerald-800 opacity-20">
			<Icon className="h-28 w-28" />
		</div>
	</motion.div>
);
