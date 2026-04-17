import {
	PlusCircle, ShoppingBasket, LayoutDashboard, Users, Mail,
	Megaphone, ShieldCheck, Archive, Menu, X, Watch, LayoutTemplate
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";
import MarketingTab from "../components/MarketingTab";
import EmailTab from "../components/EmailTab";
import UsersTab from "../components/UsersTab";
import AITab from "../components/AITab";
import InventoryTab from "../components/InventoryTab";
import StoreSettingsTab from "../components/StoreSettingsTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const tabs = [
	{ id: "analytics", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
	{ id: "orders",    label: "Đơn hàng",  icon: ShoppingBasket, roles: ["admin", "staff"] },
	{ id: "products",  label: "Sản phẩm",  icon: PlusCircle, roles: ["admin", "staff"] },
	{ id: "inventory", label: "Kho hàng",  icon: Archive, roles: ["admin", "staff"] },
	{ id: "marketing", label: "Marketing", icon: Megaphone, roles: ["admin", "staff"] },
	{ id: "email",     label: "Email",     icon: Mail, roles: ["admin", "staff"] },
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

	useEffect(() => { fetchAllProducts(); }, [fetchAllProducts]);

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
			case "products":   return <div className="space-y-4"><ProductsList /></div>;
			case "inventory":  return <InventoryTab />;
			case "marketing":  return <MarketingTab />;
			case "email":      return <EmailTab />;
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

				{/* Desktop page title bar */}
				<header className="hidden md:flex items-center justify-between px-8 py-5 border-b border-gray-100 dark:border-luxury-border bg-white dark:bg-luxury-darker sticky top-0 z-30">
					<motion.h1
						key={activeTab}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.2 }}
						className="text-xl font-bold text-luxury-gold flex items-center gap-3"
					>
						{(() => { const t = accessibleTabs.find((t) => t.id === activeTab); return t ? <><t.icon className="w-5 h-5" />{t.label}</> : null; })()}
					</motion.h1>
					<p className="text-xs text-gray-400">Watch E-commerce Admin 2026</p>
				</header>

				{/* Tab content */}
				<main className="flex-1 p-4 md:p-8 overflow-auto space-y-6">
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
