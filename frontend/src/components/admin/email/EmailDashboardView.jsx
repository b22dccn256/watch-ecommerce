import { TrendingUp, TrendingDown } from "lucide-react";
import {
	XAxis, YAxis, CartesianGrid,
	Tooltip, ResponsiveContainer, AreaChart, Area, LabelList
} from "recharts";

const StatCard = ({ label, value, changeText, isPositive, colorTheme }) => {
	return (
		<div className={`bg-white dark:bg-[#1a1a1a] border-2 ${colorTheme.border} p-6 rounded-2xl shadow-sm relative flex flex-col justify-between min-h-[160px] transition-transform hover:scale-[1.02]`}>
			<div>
				<h3 className="text-[16px] font-semibold text-gray-800 dark:text-gray-200">{label}</h3>
				<div className="text-[40px] font-bold text-gray-900 dark:text-white mt-1">{value}</div>
			</div>
			
			<div className="flex items-center gap-2 mt-4">
				<div className={`flex items-center justify-center w-6 h-6 rounded-md ${colorTheme.iconBg} ${colorTheme.iconColor}`}>
					{isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
				</div>
				<span className="text-[14px] text-gray-600 dark:text-gray-400">{changeText}</span>
			</div>

			{/* Vertical Bar */}
			<div className={`absolute right-6 top-1/2 -translate-y-1/2 w-2.5 h-[70px] rounded-full ${colorTheme.bar}`}></div>
		</div>
	);
};

const CustomTooltip = ({ active, payload, label }) => {
	if (active && payload && payload.length) {
		return (
			<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-lg text-sm text-center min-w-[100px]">
				<p className="font-semibold text-gray-800 dark:text-gray-200">{label}: {payload[0].value.toLocaleString()}</p>
				<p className="text-gray-500 dark:text-gray-400">Lượt mở</p>
			</div>
		);
	}
	return null;
};

const EmailDashboardView = ({ stats, chartData }) => {
	const displayData = chartData && chartData.length > 0 ? chartData : [];

	return (
		<div className="space-y-8">
			{/* Stat Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard 
					label="Tỷ lệ mở" 
					value={`${stats?.openRate || 0}%`} 
					changeText="Tăng 12% so với tuần trước" 
					isPositive={true}
					colorTheme={{
						border: "border-cyan-300 dark:border-cyan-700",
						bar: "bg-cyan-400",
						iconBg: "bg-cyan-50 dark:bg-cyan-900/50",
						iconColor: "text-cyan-500"
					}} 
				/>
				<StatCard 
					label="Số chiến dịch" 
					value={stats?.totalCampaigns || 0} 
					changeText="Giảm 2 chiến dịch" 
					isPositive={false}
					colorTheme={{
						border: "border-orange-300 dark:border-orange-700",
						bar: "bg-orange-400",
						iconBg: "bg-orange-50 dark:bg-orange-900/50",
						iconColor: "text-orange-500"
					}} 
				/>
				<StatCard 
					label="Tổng gửi" 
					value={stats?.sentEmails?.toLocaleString() || 0} 
					changeText="Tăng 5,000 email" 
					isPositive={true}
					colorTheme={{
						border: "border-purple-300 dark:border-purple-700",
						bar: "bg-purple-500",
						iconBg: "bg-purple-50 dark:bg-purple-900/50",
						iconColor: "text-purple-500"
					}} 
				/>
			</div>

			{/* Chart */}
			<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-8 rounded-3xl shadow-sm">
				<h3 className="text-xl font-bold mb-8 text-gray-900 dark:text-white">Hiệu quả chiến dịch (7 ngày qua)</h3>
				<div className="h-[350px] w-full">
					<ResponsiveContainer width="100%" height={350}>
						<AreaChart data={displayData} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
							<defs>
								<linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
									<stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
							<XAxis 
								dataKey="name" 
								axisLine={false} 
								tickLine={false} 
								tick={{ fill: '#6b7280', fontSize: 13 }} 
								dy={10} 
							/>
							<YAxis 
								axisLine={false} 
								tickLine={false} 
								tick={{ fill: '#6b7280', fontSize: 13 }}
							/>
							<Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '3 3' }} />
							<Area 
								type="monotone" 
								dataKey="opened" 
								stroke="#3b82f6" 
								strokeWidth={3}
								fillOpacity={1} 
								fill="url(#colorMain)" 
								activeDot={{ r: 6, strokeWidth: 0 }}
								dot={{ r: 5, strokeWidth: 2, fill: "white", stroke: "#3b82f6" }}
							>
								<LabelList dataKey="opened" position="top" offset={10} fill="#4b5563" fontSize={13} fontWeight={500} />
							</Area>
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};

export default EmailDashboardView;
