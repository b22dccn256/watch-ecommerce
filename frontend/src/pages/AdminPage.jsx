import {
	PlusCircle, ShoppingBasket, LayoutDashboard, Users, Mail,
	Megaphone, ShieldCheck, Archive, Menu, X, Watch, LayoutTemplate, Tag, MessageSquare, Layers,
	AlertTriangle, Clock, CheckCircle, Search, Bell
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

import AnalyticsTab from "../components/AnalyticsTab";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";
import MarketingTab from "../components/MarketingTab";
import EmailTab from "../components/EmailTab";
import UsersTab from "../components/UsersTab";
import AITab from "../components/AITab";
import InventoryTab from "../components/InventoryTab";
import StoreSettingsTab from "../components/StoreSettingsTab";
import CouponsTab from "../components/CouponsTab";
import ReviewsTab from "../components/ReviewsTab";
import CatalogTab from "../components/CatalogTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
	{ id: "analytics", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
	{ id: "orders",    label: "Đơn hàng",  icon: ShoppingBasket, roles: ["admin", "staff"] },
	{ id: "catalog",   label: "Danh mục & Thương hiệu", icon: Layers, roles: ["admin", "staff"] },
	{ id: "products",  label: "Sản phẩm",  icon: PlusCircle, roles: ["admin", "staff"] },
	{ id: "inventory", label: "Kho hàng",  icon: Archive, roles: ["admin", "staff"] },
	{ id: "marketing", label: "Marketing", icon: Megaphone, roles: ["admin", "staff"] },
	{ id: "email",     label: "Email",     icon: Mail, roles: ["admin", "staff"] },
	{ id: "reviews",   label: "Reviews & Q&A", icon: MessageSquare, roles: ["admin", "staff"] },
	{ id: "coupons",   label: "Mã giảm giá", icon: Tag, roles: ["admin"] },
	{ id: "users",     label: "Người dùng",icon: Users, roles: ["admin"] },
	{ id: "ai",        label: "AI System", icon: ShieldCheck, roles: ["admin"] },
	{ id: "settings",  label: "Giao diện", icon: LayoutTemplate, roles: ["admin"] },
];

const resolveTabFromParams = (searchParams, accessibleTabs) => {
	const tabParam = searchParams.get("tab");
	const accessibleTabIds = new Set(accessibleTabs.map((tab) => tab.id));
	return accessibleTabIds.has(tabParam) ? tabParam : accessibleTabs[0]?.id || "analytics";
};

const AdminPage = () => {
	const { user } = useUserStore();
	const currentRole = user?.role || "admin";
	const accessibleTabs = useMemo(
		() => tabs.filter((tab) => tab.roles.includes(currentRole)),
		[currentRole]
	);
	const [searchParams, setSearchParams] = useSearchParams();
	const [activeTab, setActiveTab] = useState(() => resolveTabFromParams(searchParams, accessibleTabs));
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const { fetchAllProducts } = useProductStore();

	// B4: Today's Tasks state
	const [tasks, setTasks] = useState({ pendingOrders: 0, lowStock: 0, pendingReviews: 0, unansweredQuestions: 0 });

	// B5: Global search state
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState({ products: [], orders: [], users: [] });
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchLoading, setSearchLoading] = useState(false);

	// B2: Notification center state
	const [notifications, setNotifications] = useState([]);
	const [notifOpen, setNotifOpen] = useState(false);
	const [notifCount, setNotifCount] = useState(0);

	useEffect(() => { fetchAllProducts(); }, [fetchAllProducts]);

	// B4: Fetch Today's Tasks counters (polling every 60s)
	const fetchTasks = useCallback(async () => {
		try {
			const [ordersRes, inventoryRes] = await Promise.allSettled([
				axios.get("/orders?status=pending&limit=1"),
				axios.get("/products/inventory/alerts?limit=1"),
			]);
			setTasks({
				pendingOrders: ordersRes.status === "fulfilled" ? (ordersRes.value.data?.pagination?.totalOrders || 0) : 0,
				lowStock: inventoryRes.status === "fulfilled" ? (inventoryRes.value.data?.totalAlerts || 0) : 0,
				pendingReviews: 0,
				unansweredQuestions: 0,
			});
		} catch {}
	}, []);

	useEffect(() => {
		fetchTasks();
		const interval = setInterval(fetchTasks, 60000);
		return () => clearInterval(interval);
	}, [fetchTasks]);

	// B5: Global search with debounce
	useEffect(() => {
		if (!searchQuery.trim()) { setSearchResults({ products: [], orders: [], users: [] }); return; }
		const timer = setTimeout(async () => {
			setSearchLoading(true);
			try {
				const [pRes, oRes] = await Promise.allSettled([
					axios.get(`/products?q=${encodeURIComponent(searchQuery)}&limit=5`),
					axios.get(`/orders?search=${encodeURIComponent(searchQuery)}&limit=5`),
				]);
				setSearchResults({
					products: pRes.status === "fulfilled" ? (pRes.value.data?.products || []).slice(0, 4) : [],
					orders: oRes.status === "fulfilled" ? (oRes.value.data?.orders || []).slice(0, 4) : [],
					users: [],
				});
			} finally { setSearchLoading(false); }
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	// B2: Fetch notifications — polling 30s
	const fetchNotifications = useCallback(async () => {
		try {
			const [ordersRes, inventoryRes] = await Promise.allSettled([
				axios.get("/orders?status=pending&limit=5"),
				axios.get("/products/inventory/alerts?limit=3"),
			]);
			const notifs = [];
			if (ordersRes.status === "fulfilled") {
				(ordersRes.value.data?.orders || []).slice(0, 5).forEach(o => notifs.push({
					id: o._id, type: "order",
					title: "Đơn hàng mới chờ xử lý",
					desc: "#" + (o.orderCode || o._id?.slice(0, 8).toUpperCase()) + " — " + (o.shippingDetails?.fullName || ""),
					time: o.createdAt, tab: "orders",
				}));
			}
			if (inventoryRes.status === "fulfilled") {
				(inventoryRes.value.data?.products || []).slice(0, 3).forEach(p => notifs.push({
					id: "inv_" + p._id, type: "inventory",
					title: "Hàng sắp hết kho",
					desc: (p.name || "Sản phẩm") + " — còn " + p.stock + " cái",
					time: new Date().toISOString(), tab: "inventory",
				}));
			}
			setNotifications(notifs);
			setNotifCount(notifs.length);
		} catch {}
	}, []);

	useEffect(() => {
		fetchNotifications();
		const interval = setInterval(fetchNotifications, 30000);
		return () => clearInterval(interval);
	}, [fetchNotifications]);

	useEffect(() => {
		const tabFromUrl = resolveTabFromParams(searchParams, accessibleTabs);
		if (tabFromUrl !== activeTab) {
			setActiveTab(tabFromUrl);
		}

		const accessibleTabIds = new Set(accessibleTabs.map((tab) => tab.id));
		if (!searchParams.get("tab") || !accessibleTabIds.has(searchParams.get("tab"))) {
			const nextParams = new URLSearchParams(searchParams);
			nextParams.set("tab", tabFromUrl);
			setSearchParams(nextParams, { replace: true });
		}
	}, [searchParams, setSearchParams, activeTab, accessibleTabs]);

	const handleTabChange = (tabId) => {
		setActiveTab(tabId);
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set("tab", tabId);
		setSearchParams(nextParams, { replace: true });
	};

	const renderTab = () => {
		switch (activeTab) {
			case "analytics":  return <AnalyticsTab />;
			case "orders":     return <OrdersTab />;
			case "catalog":    return <CatalogTab />;
			case "products":   return <div className="space-y-4"><ProductsList /></div>;
			case "inventory":  return <InventoryTab />;
			case "marketing":  return <MarketingTab />;
			case "email":      return <EmailTab />;
			case "reviews":    return <ReviewsTab />;
			case "coupons":    return <CouponsTab />;
			case "users":      return <UsersTab />;
			case "ai":         return <AITab />;
			case "settings":   return <StoreSettingsTab />;
			default:           return null;
		}
	};

	return (
		<div className="min-h-screen flex bg-gray-50 dark:bg-luxury-dark">

			{/* ── Desktop Sidebar ─────────────────── */}
			<aside className="hidden md:flex flex-col w-56 flex-shrink-0 bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border min-h-screen sticky top-0">
				{/* Logo / Brand */}
				<div className="flex items-center gap-3 px-5 py-5 border-b border-gray-100 dark:border-luxury-border">
					<div className="w-8 h-8 rounded-lg bg-luxury-gold flex items-center justify-center flex-shrink-0">
						<Watch className="w-4 h-4 text-lux-dark" />
					</div>
					<div className="min-w-0">
						<p className="text-sm font-bold text-gray-900 dark:text-white truncate">Watch Admin</p>
						<p className="text-[10px] text-gray-400 truncate">Management Panel</p>
					</div>
				</div>

				{/* Nav items */}
				<nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
					{accessibleTabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => handleTabChange(tab.id)}
							className={`admin-sidebar-link w-full text-left ${activeTab === tab.id ? "active" : ""}`}
						>
							<tab.icon className="w-4 h-4 flex-shrink-0" />
							<span>{tab.label}</span>
						</button>
					))}
				</nav>

				{/* Footer */}
				<div className="px-5 py-4 border-t border-gray-100 dark:border-luxury-border">
					<p className="text-[10px] text-gray-400">Watch E-commerce © 2026</p>
				</div>
			</aside>

			{/* ── Mobile overlay sidebar ──────────── */}
			<AnimatePresence>
				{sidebarOpen && (
					<>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
							onClick={() => setSidebarOpen(false)}
						/>
						<motion.aside
							initial={{ x: -240 }}
							animate={{ x: 0 }}
							exit={{ x: -240 }}
							transition={{ type: "spring", damping: 28, stiffness: 300 }}
							className="fixed left-0 top-0 bottom-0 z-50 w-56 flex flex-col bg-white dark:bg-luxury-darker border-r border-gray-100 dark:border-luxury-border md:hidden"
						>
							<div className="flex items-center justify-between px-5 py-5 border-b border-gray-100 dark:border-luxury-border">
								<div className="flex items-center gap-3">
									<div className="w-7 h-7 rounded-lg bg-luxury-gold flex items-center justify-center">
										<Watch className="w-3.5 h-3.5 text-lux-dark" />
									</div>
									<p className="text-sm font-bold text-gray-900 dark:text-white">Watch Admin</p>
								</div>
								<button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg text-gray-400 hover:text-white transition">
									<X className="w-4 h-4" />
								</button>
							</div>
							<nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
								{accessibleTabs.map((tab) => (
									<button
										key={tab.id}
										onClick={() => { handleTabChange(tab.id); setSidebarOpen(false); }}
										className={`admin-sidebar-link w-full text-left ${activeTab === tab.id ? "active" : ""}`}
									>
										<tab.icon className="w-4 h-4 flex-shrink-0" />
										<span>{tab.label}</span>
									</button>
								))}
							</nav>
						</motion.aside>
					</>
				)}
			</AnimatePresence>

			{/* ── Main Content ─────────────────────── */}
			<div className="flex-1 flex flex-col min-w-0">
				<div className="pt-6" />

				{/* Top bar (mobile hamburger + page title) */}
				<header className="sticky top-0 z-30 bg-white dark:bg-luxury-darker border-b border-gray-100 dark:border-luxury-border px-5 py-3 flex items-center gap-4 md:hidden">
					<button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg text-gray-500 hover:text-luxury-gold hover:bg-gray-100 dark:hover:bg-luxury-border transition">
						<Menu className="w-5 h-5" />
					</button>
					<h1 className="text-base font-bold text-luxury-gold">
						{accessibleTabs.find((t) => t.id === activeTab)?.label}
					</h1>
				</header>

				{/* Desktop page title bar + B4 Tasks + B5 Search */}
				<header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-darker sticky top-0 z-30 gap-4">
					<motion.h1
						key={activeTab}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2 }}
						className="text-xl font-bold text-luxury-gold flex items-center gap-3 flex-shrink-0"
					>
						{(() => { const t = accessibleTabs.find((t) => t.id === activeTab); return t ? <><t.icon className="w-5 h-5" />{t.label}</> : null; })()}
					</motion.h1>

					{/* B5: Global Search Bar */}
					<div className="relative flex-1 max-w-md" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setSearchOpen(false); }} tabIndex={-1}>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
							<input
								type="text"
								placeholder="Tìm sản phẩm, đơn hàng..."
								value={searchQuery}
								onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
								onFocus={() => setSearchOpen(true)}
								className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl focus:outline-none focus:border-luxury-gold transition"
							/>
						</div>
						{searchOpen && searchQuery.trim() && (
							<div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto">
								{searchLoading && <div className="px-4 py-3 text-xs text-gray-400">Đang tìm kiếm...</div>}
								{searchResults.products.length > 0 && (
									<div>
										<p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">Sản phẩm</p>
										{searchResults.products.map(p => (
											<button key={p._id} onClick={() => { handleTabChange("products"); setSearchOpen(false); setSearchQuery(""); }}
												className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left">
												{p.image && <img src={p.image} alt={p.name} className="w-8 h-8 rounded object-cover" />}
												<div className="min-w-0">
													<p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
													<p className="text-xs text-luxury-gold">{p.price?.toLocaleString("vi-VN")} ₫</p>
												</div>
											</button>
										))}
									</div>
								)}
								{searchResults.orders.length > 0 && (
									<div>
										<p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b dark:border-luxury-border">Đơn hàng</p>
										{searchResults.orders.map(o => (
											<button key={o._id} onClick={() => { handleTabChange("orders"); setSearchOpen(false); setSearchQuery(""); }}
												className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left">
												<ShoppingBasket className="w-4 h-4 text-luxury-gold flex-shrink-0" />
												<div className="min-w-0">
													<p className="text-sm font-medium text-gray-900 dark:text-white truncate">#{o.orderCode || o._id?.slice(0,8)}</p>
													<p className="text-xs text-gray-500">{o.shippingDetails?.fullName}</p>
												</div>
											</button>
										))}
									</div>
								)}
								{!searchLoading && searchResults.products.length === 0 && searchResults.orders.length === 0 && (
									<div className="px-4 py-6 text-center text-sm text-gray-400">Không tìm thấy kết quả</div>
								)}
							</div>
						)}
					</div>

					{/* B2: Notification Bell */}
					<div className="relative flex-shrink-0" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setNotifOpen(false); }} tabIndex={-1}>
						<button
							onClick={() => setNotifOpen(o => !o)}
							className="relative p-2 rounded-xl bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border text-gray-500 hover:text-luxury-gold hover:border-luxury-gold/30 transition"
						>
							<Bell className="w-4 h-4" />
							{notifCount > 0 && (
								<span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
									{notifCount > 9 ? "9+" : notifCount}
								</span>
							)}
						</button>
						{notifOpen && (
							<div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border rounded-2xl shadow-2xl z-50 overflow-hidden">
								<div className="px-4 py-3 border-b border-gray-100 dark:border-luxury-border flex items-center justify-between">
									<p className="text-sm font-bold text-gray-900 dark:text-white">Thông báo</p>
									{notifCount > 0 && <span className="text-xs text-red-400 font-bold">{notifCount} mới</span>}
								</div>
								<div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-luxury-border/30">
									{notifications.length === 0 ? (
										<p className="text-center text-sm text-gray-400 py-6">Không có thông báo mới 🎉</p>
									) : notifications.map(n => (
										<button key={n.id} onClick={() => { handleTabChange(n.tab); setNotifOpen(false); setNotifCount(0); }}
											className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition text-left"
										>
											<div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "order" ? "bg-amber-400" : "bg-red-400"}`} />
											<div className="min-w-0 flex-1">
												<p className="text-xs font-bold text-gray-900 dark:text-white">{n.title}</p>
												<p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">{n.desc}</p>
											</div>
										</button>
									))}
								</div>
								{notifications.length > 0 && (
									<div className="px-4 py-2 border-t border-gray-100 dark:border-luxury-border">
										<button onClick={() => { setNotifications([]); setNotifCount(0); setNotifOpen(false); }} className="text-xs text-gray-400 hover:text-luxury-gold transition">
											Đánh dấu tất cả đã đọc
										</button>
									</div>
								)}
							</div>
						)}
					</div>
				</header>

				{/* Tab content */}
				<main className="flex-1 p-4 md:p-8 overflow-auto space-y-6">

					{/* B4: Today's Tasks Widget — only on analytics tab */}
					{activeTab === "analytics" && (tasks.pendingOrders > 0 || tasks.lowStock > 0) && (
						<div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
							{[
								{ label: "Đơn chờ xử lý", count: tasks.pendingOrders, icon: Clock, color: "text-amber-400 bg-amber-400/10 border-amber-400/30", tab: "orders" },
								{ label: "Hàng sắp hết", count: tasks.lowStock, icon: AlertTriangle, color: "text-red-400 bg-red-400/10 border-red-400/30", tab: "inventory" },
								{ label: "Review chờ duyệt", count: tasks.pendingReviews, icon: MessageSquare, color: "text-blue-400 bg-blue-400/10 border-blue-400/30", tab: "reviews" },
								{ label: "Câu hỏi chưa trả lời", count: tasks.unansweredQuestions, icon: CheckCircle, color: "text-purple-400 bg-purple-400/10 border-purple-400/30", tab: "reviews" },
							].map(item => (
								<button
									key={item.label}
									onClick={() => handleTabChange(item.tab)}
									className={`flex items-center gap-3 p-3 rounded-xl border ${item.color} hover:scale-[1.02] transition-transform text-left w-full`}
								>
									<item.icon className="w-5 h-5 flex-shrink-0" />
									<div>
										<p className="text-xl font-bold">{item.count}</p>
										<p className="text-[10px] font-medium opacity-80 leading-tight">{item.label}</p>
									</div>
								</button>
							))}
						</div>
					)}
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.22 }}
						className="bg-white dark:bg-luxury-darker/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-luxury-border shadow-sm dark:shadow-none p-6 min-h-[500px]"
					>
						{renderTab()}
					</motion.div>
				</main>
			</div>
		</div>
	);
};

export default AdminPage;
