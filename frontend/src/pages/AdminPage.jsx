import { BarChart, PlusCircle, ShoppingBasket, LayoutDashboard, Users, Mail, Megaphone, Settings, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import AnalyticsTab from "../components/AnalyticsTab";
import CreateProductForm from "../components/CreateProductForm";
import ProductsList from "../components/ProductsList";
import OrdersTab from "../components/OrdersTab";
import MarketingTab from "../components/MarketingTab";
import EmailTab from "../components/EmailTab";
import UsersTab from "../components/UsersTab";
import AITab from "../components/AITab";
import { useProductStore } from "../stores/useProductStore";

const tabs = [
	{ id: "analytics", label: "Dashboard", icon: LayoutDashboard },
	{ id: "orders", label: "Orders", icon: ShoppingBasket },
	{ id: "products", label: "Inventory", icon: PlusCircle },
	{ id: "marketing", label: "Marketing", icon: Megaphone },
	{ id: "email", label: "Email", icon: Mail },
	{ id: "users", label: "Users", icon: Users },
	{ id: "ai", label: "AI System", icon: ShieldCheck },
];

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState("analytics");
	const { fetchAllProducts } = useProductStore();

	useEffect(() => {
		fetchAllProducts();
	}, [fetchAllProducts]);

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				<motion.h1
					className='text-4xl font-bold mb-8 text-luxury-gold text-center tracking-wider-luxury'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					Admin Dashboard
				</motion.h1>

				<div className='flex flex-wrap justify-center mb-8 gap-4'>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${activeTab === tab.id
								? "bg-luxury-gold text-luxury-dark shadow-lg shadow-luxury-gold/20"
								: "bg-luxury-darker text-luxury-text-muted hover:bg-luxury-border/50 border border-luxury-border"
								}`}
						>
							<tab.icon className='mr-2 h-5 w-5' />
							{tab.label}
						</button>
					))}
				</div>

				<div className="bg-luxury-darker/50 backdrop-blur-md rounded-2xl border border-luxury-border p-8 min-h-[600px]">
					{activeTab === "analytics" && <AnalyticsTab />}
					{activeTab === "orders" && <OrdersTab />}
					{activeTab === "products" && (
						<div className="space-y-12">
							<section>
								<h2 className="text-2xl font-bold text-luxury-gold mb-6 flex items-center gap-2">
									<PlusCircle className="w-6 h-6" /> Add New Watch
								</h2>
								<CreateProductForm />
							</section>
							<div className="border-t border-luxury-border pt-12" />
							<section>
								<h2 className="text-2xl font-bold text-luxury-gold mb-6 flex items-center gap-2">
									<ShoppingBasket className="w-6 h-6" /> Product Inventory
								</h2>
								<ProductsList />
							</section>
						</div>
					)}
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
