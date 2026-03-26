import { PlusCircle, ShoppingBasket, LayoutDashboard, Users, Mail, Megaphone, ShieldCheck, Archive } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";
import MarketingTab from "../components/MarketingTab";
import EmailTab from "../components/EmailTab";
import UsersTab from "../components/UsersTab";
import AITab from "../components/AITab";
import InventoryTab from "../components/InventoryTab";
import { useProductStore } from "../stores/useProductStore";
import { useUserStore } from "../stores/useUserStore";

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState("analytics");
	const { fetchAllProducts } = useProductStore();
	const { user } = useUserStore();

	useEffect(() => {
		fetchAllProducts();
	}, [fetchAllProducts]);

	const tabs = [
		{ id: "analytics", label: "Tổng quan", icon: LayoutDashboard },
		{ id: "orders", label: "Đơn hàng", icon: ShoppingBasket },
		{ id: "products", label: "Sản phẩm", icon: PlusCircle },
		{ id: "inventory", label: "Kho hàng", icon: Archive },
		{ id: "marketing", label: "Marketing", icon: Megaphone },
		{ id: "email", label: "Email", icon: Mail },
		{ id: "users", label: "Người dùng", icon: Users },
		{ id: "ai", label: "Hệ thống AI", icon: ShieldCheck, adminOnly: true },
	];

	const filteredTabs = tabs.filter(tab => !tab.adminOnly || user?.role === "admin");

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				<motion.h1
					className='text-4xl font-bold mb-8 text-luxury-gold text-center tracking-tight font-sans'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					Bảng Quản Trị Hệ Thống
				</motion.h1>

				<div className='flex flex-wrap justify-center mb-8 gap-4'>
					{filteredTabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center px-6 py-3 rounded-lg font-bold transition-all duration-300 ${activeTab === tab.id
								? "bg-luxury-gold text-luxury-dark shadow-lg shadow-luxury-gold/20"
								: "bg-white dark:bg-luxury-darker text-gray-500 dark:text-luxury-text-muted hover:bg-gray-50 dark:hover:bg-luxury-border/50 border border-gray-100 dark:border-luxury-border shadow-md dark:shadow-none"
								}`}
						>
							<tab.icon className='mr-2 h-5 w-5' />
							{tab.label}
						</button>
					))}
				</div>

				<div className="bg-white dark:bg-luxury-darker/50 backdrop-blur-md rounded-2xl border border-gray-100 dark:border-luxury-border shadow-xl dark:shadow-none p-8 min-h-[600px]">
					{activeTab === "analytics" && <AnalyticsTab />}
					{activeTab === "orders" && <OrdersTab />}
					{activeTab === "products" && (
						<div className="space-y-6">
							<ProductsList />
						</div>
					)}
					{activeTab === "inventory" && <InventoryTab />}
					{activeTab === "marketing" && <MarketingTab />}
					{activeTab === "email" && <EmailTab />}
					{activeTab === "users" && <UsersTab />}
					{activeTab === "ai" && <AITab />}
				</div>
			</div>
		</div>
	);
};
export default AdminPage;
