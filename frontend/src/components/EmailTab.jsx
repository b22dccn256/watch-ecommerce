import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
	Mail, Send, MousePointer2, ShoppingCart, Plus, Monitor, 
	Smartphone, Eye, Power, Inbox, Users, BarChart3, 
	FileCode, Settings, Trash2, CheckCircle2, Clock, 
	ChevronRight, RefreshCcw, ExternalLink
} from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { 
	LineChart, Line, XAxis, YAxis, CartesianGrid, 
	Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";

const EmailTab = () => {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState({
		messages: [],
		subscribers: [],
		campaigns: [],
		templates: [],
		stats: { openRate: 0, clickRate: 0, totalSent: 0 }
	});

	useEffect(() => {
		fetchData();
	}, [activeTab]);

	const fetchData = async () => {
		setLoading(true);
		try {
			if (activeTab === "inbox") {
				const res = await axios.get("/mail/inbox");
				setData(prev => ({ ...prev, messages: res.data.messages }));
			} else if (activeTab === "subscribers") {
				const res = await axios.get("/mail/subscribers");
				setData(prev => ({ ...prev, subscribers: res.data.subscribers }));
			} else if (activeTab === "campaigns") {
				const res = await axios.get("/mail/campaigns");
				setData(prev => ({ ...prev, campaigns: res.data.campaigns }));
			} else if (activeTab === "templates") {
				const res = await axios.get("/mail/templates");
				setData(prev => ({ ...prev, templates: res.data.templates }));
			}
		} catch (error) {
			console.error("Fetch error:", error);
		} finally {
			setLoading(false);
		}
	};

	const tabs = [
		{ id: "dashboard", label: "Dashboard", icon: BarChart3 },
		{ id: "inbox", label: "Hộp thư đến", icon: Inbox },
		{ id: "subscribers", label: "Người đăng ký", icon: Users },
		{ id: "campaigns", label: "Chiến dịch", icon: Send },
		{ id: "templates", label: "Mẫu Email", icon: FileCode },
		{ id: "automation", label: "Tự động hóa", icon: Settings },
	];

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Top Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
						<Mail className="text-luxury-gold w-8 h-8" />
						Quản lý Email & Marketing
					</h1>
					<p className="text-gray-500 dark:text-luxury-text-muted text-sm">Hệ thống gửi tin và chăm sóc khách hàng tự động.</p>
				</div>
				<button 
					onClick={() => toast.success("Feature coming soon: New Template Builder")}
					className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-white hover:scale-105 transition-all shadow-lg"
				>
					<Plus className="w-4 h-4" /> TẠO MỚI
				</button>
			</div>

			{/* Sub-tabs Navigation */}
			<div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-luxury-border pb-px">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all relative ${
							activeTab === tab.id 
								? "border-luxury-gold text-luxury-gold" 
								: "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-white"
						}`}
					>
						<tab.icon className="w-4 h-4" />
						{tab.label}
						{activeTab === tab.id && (
							<motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold" />
						)}
					</button>
				))}
			</div>

			{/* Tab Content */}
			<div className="mt-8">
				<AnimatePresence mode="wait">
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
					>
						{activeTab === "dashboard" && <DashboardView />}
						{activeTab === "inbox" && <InboxView messages={data.messages} loading={loading} />}
						{activeTab === "subscribers" && <SubscribersView subscribers={data.subscribers} loading={loading} />}
						{activeTab === "campaigns" && <CampaignsView campaigns={data.campaigns} loading={loading} />}
						{activeTab === "templates" && <TemplatesView templates={data.templates} loading={loading} />}
						{activeTab === "automation" && <AutomationView />}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
};

// --- SUB-VIEWS ---

const DashboardView = () => {
	const chartData = [
		{ name: "Mon", sent: 400, opened: 240, clicked: 120 },
		{ name: "Tue", sent: 300, opened: 139, clicked: 98 },
		{ name: "Wed", sent: 980, opened: 560, clicked: 320 },
		{ name: "Thu", sent: 390, opened: 280, clicked: 100 },
		{ name: "Fri", sent: 480, opened: 390, clicked: 210 },
		{ name: "Sat", sent: 380, opened: 190, clicked: 80 },
		{ name: "Sun", sent: 430, opened: 250, clicked: 150 },
	];

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard label="Tỷ lệ mở" value="28.4%" change="+4.3%" icon={Eye} color="emerald" />
				<StatCard label="Tỷ lệ nhấp" value="12.1%" change="-0.8%" icon={MousePointer2} color="blue" />
				<StatCard label="Tổng gửi" value="12,854" change="+15%" icon={Send} color="luxury-gold" />
			</div>

			<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl">
				<h3 className="text-xl font-bold mb-8">Hiệu quả chiến dịch (7 ngày qua)</h3>
				<div className="h-[350px] w-full">
					<ResponsiveContainer width="100%" height="100%">
						<AreaChart data={chartData}>
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

const InboxView = ({ messages, loading }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl overflow-hidden">
		<table className="w-full text-left">
			<thead className="bg-gray-50 dark:bg-white/5 border-b border-luxury-border">
				<tr>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Khách hàng</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Chủ đề</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Ngày</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Trạng thái</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right">Hành động</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-luxury-border">
				{messages.length > 0 ? messages.map((m) => (
					<tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
						<td className="px-6 py-4">
							<div className="font-bold">{m.name}</div>
							<div className="text-xs text-luxury-text-muted">{m.email}</div>
						</td>
						<td className="px-6 py-4 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-sm">
							{m.subject || "No Subject"}
						</td>
						<td className="px-6 py-4 text-xs text-gray-500">
							{new Date(m.createdAt).toLocaleDateString()}
						</td>
						<td className="px-6 py-4">
							<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
								m.status === "new" ? "bg-red-500/10 text-red-400" :
								m.status === "read" ? "bg-blue-500/10 text-blue-400" :
								"bg-emerald-500/10 text-emerald-400"
							}`}>
								{m.status}
							</span>
						</td>
						<td className="px-6 py-4 text-right">
							<button className="p-2 hover:bg-luxury-gold/20 rounded-lg text-luxury-gold transition">
								<Eye className="w-4 h-4" />
							</button>
						</td>
					</tr>
				)) : (
					<tr>
						<td colSpan="5" className="px-6 py-20 text-center text-gray-500 italic">Hộp thư trống</td>
					</tr>
				)}
			</tbody>
		</table>
	</div>
);

const SubscribersView = ({ subscribers, loading }) => (
	<div className="space-y-4">
		<div className="flex justify-between items-center text-sm font-bold text-gray-400 dark:text-luxury-text-muted px-2">
			<span>{subscribers.length} Emails đăng ký</span>
			<button className="text-luxury-gold hover:underline">Xuất file CSV</button>
		</div>
		<div className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl">
			<ul className="divide-y divide-luxury-border">
				{subscribers.map((s) => (
					<li key={s._id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5">
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
								<Users className="w-5 h-5" />
							</div>
							<div>
								<div className="font-bold">{s.email}</div>
								<div className="text-[10px] uppercase tracking-widest text-gray-500">Nguồn: {s.source}</div>
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</div>
							<button className="text-red-400 hover:text-red-500 p-2">
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	</div>
);

const CampaignsView = ({ campaigns, loading }) => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
		{campaigns.map((c) => (
			<div key={c._id} className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl p-6 space-y-5 hover:border-luxury-gold/50 transition-all">
				<div className="flex justify-between items-start">
					<div className="space-y-1">
						<h4 className="font-bold text-lg">{c.title}</h4>
						<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">SUB: {c.subject}</p>
					</div>
					<StatusBadge status={c.status} />
				</div>
				
				<div className="grid grid-cols-3 gap-2 py-4 border-y border-luxury-border">
					<MiniStat label="Gửi" value={c.stats.sent} />
					<MiniStat label="Mở" value={c.stats.opened} />
					<MiniStat label="Nhấp" value={c.stats.clicked} />
				</div>

				<div className="flex gap-3">
					<button className="flex-1 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold hover:bg-white transition">Thống kê</button>
					<button className="flex-1 py-2 border border-luxury-border rounded-lg text-xs font-bold hover:bg-white/5 transition">Sao chép</button>
				</div>
			</div>
		))}
	</div>
);

const TemplatesView = ({ templates }) => (
	<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		{templates.map((t) => (
			<div key={t._id} className="group cursor-pointer">
				<div className="aspect-[3/4] bg-white border border-luxury-border rounded-3xl mb-3 overflow-hidden group-hover:shadow-2xl transition-all relative">
					<div className="absolute inset-0 bg-transparent group-hover:bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
						<button className="bg-luxury-gold text-luxury-dark px-4 py-2 rounded-lg font-bold text-xs">Preview</button>
					</div>
					<div className="p-4 scale-50 origin-top text-[8px] opacity-40 select-none" dangerouslySetInnerHTML={{ __html: t.htmlContent }} />
				</div>
				<h5 className="font-bold text-center">{t.name}</h5>
				<p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">{t.category}</p>
			</div>
		))}
	</div>
);

const AutomationView = () => (
	<div className="space-y-6">
		<div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-400">
			<Clock className="w-5 h-5 shrink-0" />
			<p className="text-sm">Các tiến trình tự động được xử lý bởi BullMQ Worker & Redis mỗi 1 giờ.</p>
		</div>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			<AutomationCard 
				title="Abandoned Cart" 
				desc="Tự động gửi email nhắc nhở sau 24h nếu giỏ hàng không trống." 
				active={true}
			/>
			<AutomationCard 
				title="Welcome Email" 
				desc="Gửi lời chào và mã giảm giá 10% ngay khi khách đăng ký Newsletter." 
				active={true}
			/>
			<AutomationCard 
				title="Birthday Email" 
				desc="Tự động gửi lời chúc và quà tặng vào ngày sinh nhật khách hàng." 
				active={false}
			/>
		</div>
	</div>
);

// --- HELPER COMPONENTS ---

const StatCard = ({ label, value, change, icon: Icon, color }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl shadow-xl hover:scale-105 transition-all">
		<div className="flex items-center justify-between mb-6">
			<div className={`p-4 rounded-2xl bg-${color}-500/10 text-${color}-500`}>
				<Icon className="w-6 h-6" />
			</div>
			<span className={`${change.startsWith("+") ? "text-emerald-500" : "text-red-500"} font-bold text-sm`}>{change}</span>
		</div>
		<span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</span>
		<div className="text-4xl font-bold">{value}</div>
	</div>
);

const MiniStat = ({ label, value }) => (
	<div className="text-center">
		<p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{label}</p>
		<p className="text-sm font-bold">{value}</p>
	</div>
);

const StatusBadge = ({ status }) => {
	const colors = {
		sent: "bg-emerald-500/10 text-emerald-400",
		scheduled: "bg-amber-500/10 text-amber-400",
		draft: "bg-gray-500/10 text-gray-500",
		sending: "bg-blue-500/10 text-blue-400",
		failed: "bg-red-500/10 text-red-500"
	};
	return (
		<span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${colors[status]}`}>
			{status}
		</span>
	);
};

const AutomationCard = ({ title, desc, active }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl flex items-start gap-6 group hover:border-luxury-gold transition-all">
		<div className={`p-4 rounded-2xl ${active ? "bg-luxury-gold/10 text-luxury-gold" : "bg-gray-500/10 text-gray-500"}`}>
			<Power className="w-6 h-6" />
		</div>
		<div className="flex-1 space-y-2">
			<div className="flex items-center justify-between">
				<h4 className="font-bold text-lg">{title}</h4>
				<span className={`text-[10px] font-bold uppercase ${active ? "text-emerald-500" : "text-red-500"}`}>
					{active ? "Active" : "Disabled"}
				</span>
			</div>
			<p className="text-sm text-luxury-text-muted leading-relaxed">{desc}</p>
			<div className="pt-4 flex gap-4">
				<button className="text-xs font-bold text-luxury-gold flex items-center gap-1 group-hover:gap-2 transition-all">
					Cấu hình <ChevronRight className="w-3 h-3" />
				</button>
			</div>
		</div>
	</div>
);

export default EmailTab;
