import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
	Mail, Send, MousePointer2, Plus,
	Eye, Power, Inbox, Users, BarChart3,
	FileCode, Settings, Trash2, Clock,
	ChevronRight
} from "lucide-react";
import axios from "../lib/axios";
import { confirmToast } from "../lib/confirmToast";
import { toast } from "react-hot-toast";
import DOMPurify from "dompurify"; // FIX B1: import DOMPurify for safe HTML rendering
import { 
	XAxis, YAxis, CartesianGrid,
	Tooltip, ResponsiveContainer, AreaChart, Area 
} from "recharts";

// Automation rules â€” seed defaults; toggle state managed locally + persisted via API
const DEFAULT_AUTOMATIONS = [
	{ id: "abandoned-cart", title: "Abandoned Cart", desc: "Tá»± Ä‘á»™ng gá»­i email nháº¯c nhá»Ÿ sau 24h náº¿u giá» hĂ ng khĂ´ng trá»‘ng.", active: true },
	{ id: "welcome-email", title: "Welcome Email", desc: "Gá»­i lá»i chĂ o vĂ  mĂ£ giáº£m giĂ¡ 10% ngay khi khĂ¡ch Ä‘Äƒng kĂ½ Newsletter.", active: true },
	{ id: "birthday-email", title: "Birthday Email", desc: "Tá»± Ä‘á»™ng gá»­i lá»i chĂºc vĂ  quĂ  táº·ng vĂ o ngĂ y sinh nháº­t khĂ¡ch hĂ ng.", active: false },
];

const EmailTab = () => {
	const [activeTab, setActiveTab] = useState("dashboard");
	const [loading, setLoading] = useState(false);
	const [data, setData] = useState({
		messages: [],
		subscribers: [],
		campaigns: [],
		templates: [],
		stats: { openRate: 0, clickRate: 0, totalSent: 0 },
		chartData: []
	});
	const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);
	const fetchStateRef = useRef({});

	const fetchData = useCallback(async () => {
		const tabState = fetchStateRef.current[activeTab] || { promise: null, lastFetched: 0 };
		fetchStateRef.current[activeTab] = tabState;
		const now = Date.now();
		if (tabState.promise) return tabState.promise;
		if (now - tabState.lastFetched < 15000) return;

		setLoading(true);
		tabState.promise = (async () => {
			try {
			if (activeTab === "dashboard") {
				const res = await axios.get("/mail/stats?days=7");
				setData(prev => ({ ...prev, stats: res.data.stats, chartData: res.data.chartData || [] }));
			} else if (activeTab === "inbox") {
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
				tabState.lastFetched = Date.now();
				setLoading(false);
				fetchStateRef.current[activeTab].promise = null;
			}
		})();
		return tabState.promise;
	}, [activeTab]);

	useEffect(() => {
		fetchData();
	}, [fetchData]);

	const handleDeleteSubscriber = (id, email) => {
		confirmToast(`XĂ³a subscriber "${email}"?`, async () => {
			try {
				await axios.delete(`/mail/subscribers/${id}`);
				setData(prev => ({ ...prev, subscribers: prev.subscribers.filter(s => s._id !== id) }));
				toast.success("ÄĂ£ xĂ³a subscriber");
			} catch {
				toast.error("KhĂ´ng thá»ƒ xĂ³a subscriber");
			}
		});
	};

	const handleToggleAutomation = async (automationId) => {
		// Optimistic update â€” flip locally first
		setAutomations(prev =>
			prev.map(a => a.id === automationId ? { ...a, active: !a.active } : a)
		);
		try {
			// Fire-and-forget API call (backend may not have this endpoint yet)
			await axios.patch(`/mail/automations/${automationId}/toggle`);
		} catch {
			// Rollback on failure
			setAutomations(prev =>
				prev.map(a => a.id === automationId ? { ...a, active: !a.active } : a)
			);
			toast.error("KhĂ´ng thá»ƒ cáº­p nháº­t tráº¡ng thĂ¡i automation");
		}
	};

	const tabs = [
		{ id: "dashboard", label: "Dashboard", icon: BarChart3 },
		{ id: "inbox", label: "Há»™p thÆ° Ä‘áº¿n", icon: Inbox },
		{ id: "subscribers", label: "NgÆ°á»i Ä‘Äƒng kĂ½", icon: Users },
		{ id: "campaigns", label: "Chiáº¿n dá»‹ch", icon: Send },
		{ id: "templates", label: "Máº«u Email", icon: FileCode },
		{ id: "automation", label: "Tá»± Ä‘á»™ng hĂ³a", icon: Settings },
	];

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Top Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<div className="space-y-1">
					<h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
						<Mail className="text-luxury-gold w-8 h-8" />
						Quáº£n lĂ½ Email & Marketing
					</h1>
					<p className="text-gray-500 dark:text-luxury-text-muted text-sm">Há»‡ thá»‘ng gá»­i tin vĂ  chÄƒm sĂ³c khĂ¡ch hĂ ng tá»± Ä‘á»™ng.</p>
				</div>
				<button 
					onClick={() => toast("TĂ­nh nÄƒng Ä‘ang phĂ¡t triá»ƒn: New Template Builder", { icon: "â³" })}
					className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-white hover:scale-105 transition-all shadow-lg"
				>
					<Plus className="w-4 h-4" /> Táº O Má»I
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
						{activeTab === "dashboard" && <DashboardView stats={data.stats} chartData={data.chartData} />}
						{activeTab === "inbox" && <InboxView messages={data.messages} loading={loading} />}
						{activeTab === "subscribers" && <SubscribersView subscribers={data.subscribers} loading={loading} onDelete={handleDeleteSubscriber} />}
						{activeTab === "campaigns" && <CampaignsView campaigns={data.campaigns} loading={loading} />}
						{activeTab === "templates" && <TemplatesView templates={data.templates} loading={loading} />}
						{activeTab === "automation" && <AutomationView automations={automations} onToggle={handleToggleAutomation} />}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
};

// --- SUB-VIEWS ---

const DashboardView = ({ stats, chartData }) => {
	const displayData = chartData && chartData.length > 0 ? chartData : [];

	return (
		<div className="space-y-8">
			<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
				<StatCard label="Tá»· lá»‡ má»Ÿ" value={`${stats?.openRate || 0}%`} change="" icon={Eye} color="emerald" />
				<StatCard label="Sá»‘ chiáº¿n dá»‹ch" value={stats?.totalCampaigns || 0} change="" icon={MousePointer2} color="blue" />
				<StatCard label="Tá»•ng gá»­i" value={stats?.sentEmails?.toLocaleString() || 0} change="" icon={Send} color="luxury-gold" />
			</div>

			<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl">
				<h3 className="text-xl font-bold mb-8">Hiá»‡u quáº£ chiáº¿n dá»‹ch (7 ngĂ y qua)</h3>
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

const InboxView = ({ messages }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl overflow-hidden">
		<table className="w-full text-left">
			<thead className="bg-gray-50 dark:bg-white/5 border-b border-luxury-border">
				<tr>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">KhĂ¡ch hĂ ng</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Chá»§ Ä‘á»</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">NgĂ y</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Tráº¡ng thĂ¡i</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right">HĂ nh Ä‘á»™ng</th>
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
							<button
								onClick={async () => {
									try {
										await axios.patch(`/mail/inbox/${m._id}/read`);
										toast.success("ÄĂ£ Ä‘Ă¡nh dáº¥u Ä‘Ă£ Ä‘á»c");
									} catch { toast.error("KhĂ´ng thá»ƒ cáº­p nháº­t"); }
								}} // FIX C5: was missing onClick handler
								className="p-2 hover:bg-luxury-gold/20 rounded-lg text-luxury-gold transition"
							>
								<Eye className="w-4 h-4" />
							</button>
						</td>
					</tr>
				)) : (
					<tr>
						<td colSpan="5" className="px-6 py-20 text-center text-gray-500 italic">Há»™p thÆ° trá»‘ng</td>
					</tr>
				)}
			</tbody>
		</table>
	</div>
);

const SubscribersView = ({ subscribers, onDelete }) => (
	<div className="space-y-4">
			<div className="flex justify-between items-center text-sm font-bold text-gray-400 dark:text-luxury-text-muted px-2">
			<span>{subscribers.length} Emails Ä‘Äƒng kĂ½</span>
			{/* FIX C6: was missing onClick handler */}
			<button
				onClick={() => window.open("/api/mail/subscribers/export", "_blank")}
				className="text-luxury-gold hover:underline"
			>Xuáº¥t file CSV</button>
		</div>
		<div className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl">
			<ul className="divide-y divide-luxury-border">
				{subscribers.length === 0 && (
					<li className="px-6 py-12 text-center text-gray-400 text-sm">ChÆ°a cĂ³ ai Ä‘Äƒng kĂ½ newsletter</li>
				)}
				{subscribers.map((s) => (
					<li key={s._id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5">
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
								<Users className="w-5 h-5" />
							</div>
							<div>
								<div className="font-bold">{s.email}</div>
								<div className="text-[10px] uppercase tracking-widest text-gray-500">Nguá»“n: {s.source}</div>
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</div>
							<button
								onClick={() => onDelete(s._id, s.email)}
								className="text-red-400 hover:text-red-500 p-2 transition-colors"
								title="XĂ³a subscriber"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	</div>
);

const CampaignsView = ({ campaigns }) => (
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
					<MiniStat label="Gá»­i" value={c.stats.sent} />
					<MiniStat label="Má»Ÿ" value={c.stats.opened} />
					<MiniStat label="Nháº¥p" value={c.stats.clicked} />
				</div>

				<div className="flex gap-3">
					{/* FIX C11: add onClick to previously-stub campaign buttons */}
					<button
						onClick={() => toast("Thá»‘ng kĂª chi tiáº¿t Ä‘ang phĂ¡t triá»ƒn", { icon: "đŸ“" })}
						className="flex-1 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold hover:bg-white transition"
					>Thá»‘ng kĂª</button>
					<button
						onClick={() => { navigator.clipboard?.writeText(c._id); toast.success("ÄĂ£ sao chĂ©p ID chiáº¿n dá»‹ch"); }}
						className="flex-1 py-2 border border-luxury-border rounded-lg text-xs font-bold hover:bg-white/5 transition"
					>Sao chĂ©p</button>
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
				<div className="p-4 scale-50 origin-top text-[8px] opacity-40 select-none"
					dangerouslySetInnerHTML={{
						// FIX B1: sanitize htmlContent with DOMPurify before rendering
						__html: DOMPurify.sanitize(t.htmlContent || "", { USE_PROFILES: { html: true } })
					}} />
				</div>
				<h5 className="font-bold text-center">{t.name}</h5>
				<p className="text-[10px] text-gray-500 text-center uppercase tracking-widest">{t.category}</p>
			</div>
		))}
	</div>
);

const AutomationView = ({ automations, onToggle }) => (
	<div className="space-y-6">
		<div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-400">
			<Clock className="w-5 h-5 shrink-0" />
			<p className="text-sm">CĂ¡c tiáº¿n trĂ¬nh tá»± Ä‘á»™ng Ä‘Æ°á»£c xá»­ lĂ½ bá»Ÿi BullMQ Worker & Redis má»—i 1 giá».</p>
		</div>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{automations.map(automation => (
				<AutomationCard
					key={automation.id}
					title={automation.title}
					desc={automation.desc}
					active={automation.active}
					onToggle={() => onToggle(automation.id)}
				/>
			))}
		</div>
	</div>
);

// --- HELPER COMPONENTS ---

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
			<span className={`${change.startsWith("+") ? "text-emerald-500" : "text-red-500"} font-bold text-sm`}>{change}</span>
		</div>
		<span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">{label}</span>
		<div className="text-4xl font-bold">{value}</div>
	</div>
	);
};

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

const AutomationCard = ({ title, desc, active, onToggle }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl flex items-start gap-6 group hover:border-luxury-gold transition-all">
		<button
			onClick={onToggle}
			title={active ? "Táº¯t automation" : "Báº­t automation"}
			className={`p-4 rounded-2xl transition-colors cursor-pointer ${
				active
					? "bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold/20"
					: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
			}`}
		>
			<Power className="w-6 h-6" />
		</button>
		<div className="flex-1 space-y-2">
			<div className="flex items-center justify-between">
				<h4 className="font-bold text-lg">{title}</h4>
				{/* FIX C12: badge is display-only; removed onClick to fix double-toggle bug */}
				<span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
					active
						? "text-emerald-500 bg-emerald-500/10"
						: "text-red-500 bg-red-500/10"
				}`}>
					{active ? "Active" : "Disabled"}
				</span>
			</div>
			<p className="text-sm text-luxury-text-muted leading-relaxed">{desc}</p>
			<div className="pt-4 flex gap-4">
				<button className="text-xs font-bold text-luxury-gold flex items-center gap-1 group-hover:gap-2 transition-all">
					Cáº¥u hĂ¬nh <ChevronRight className="w-3 h-3" />
				</button>
			</div>
		</div>
	</div>
);

export default EmailTab;

