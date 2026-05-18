import { Eye, MousePointer2, Send } from "lucide-react";
import {
	XAxis, YAxis, CartesianGrid,
	Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";

const StatCard = ({ label, value, change, icon: Icon, color }) => {
	const colorMap = {
		emerald: "bg-emerald-500/10 text-emerald-500",
		blue: "bg-blue-500/10 text-blue-500",
		"luxury-gold": "bg-luxury-gold/10 text-luxury-gold",
	};
	const colorClasses = colorMap[color] || "bg-gray-100 text-gray-500";
	return (
		<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl shadow-xl hover:scale-105 transition-all">
			<div className="flex items-center justify-between mb-6">
				<div className={`p-4 rounded-2xl ${colorClasses}`}>
					<Icon className="w-6 h-6" />
				</div>
				<span className={`${change?.startsWith("+") ? "text-emerald-500" : "text-red-500"} font-bold text-sm`}>{change}</span>
			</div>
			<span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</span>
			<div className="text-4xl font-bold">{value}</div>
		</div>
	);
};

const EmailDashboardView = ({ stats, chartData }) => {
	const displayData = chartData && chartData.length > 0 ? chartData : [];

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard label="Tỷ lệ mở" value={`${stats?.openRate || 0}%`} change="" icon={Eye} color="emerald" />
				<StatCard label="Số chiến dịch" value={stats?.totalCampaigns || 0} change="" icon={MousePointer2} color="blue" />
				<StatCard label="Tổng gửi" value={stats?.sentEmails?.toLocaleString() || 0} change="" icon={Send} color="luxury-gold" />
			</div>

			<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl">
				<h3 className="text-xl font-bold mb-8">Hiệu quả chiến dịch (7 ngày qua)</h3>
				<div className="h-[350px] w-full">
					<ResponsiveContainer width="100%" height={350}>
						<AreaChart data={displayData}>
							<defs>
								<linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#D4AF37" stopOpacity={0.1}/>
									<stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="#88888820" />
							<XAxis dataKey="name" stroke="#888" fontSize={12} />
							<YAxis stroke="#888" fontSize={12} />
							<Tooltip
								contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333", color: "#fff" }}
								itemStyle={{ color: "#D4AF37" }}
							/>
							<Area type="monotone" dataKey="sent" stroke="#D4AF37" fillOpacity={1} fill="url(#colorSent)" />
							<Area type="monotone" dataKey="opened" stroke="#10b981" fillOpacity={0} />
							<Area type="monotone" dataKey="clicked" stroke="#3b82f6" fillOpacity={0} />
						</AreaChart>
					</ResponsiveContainer>
				</div>
			</div>
		</div>
	);
};

export default EmailDashboardView;
