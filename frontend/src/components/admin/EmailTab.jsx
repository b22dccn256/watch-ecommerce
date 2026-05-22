import { motion, AnimatePresence } from "framer-motion";
import {
	Mail, Send, MousePointer2, Plus,
	Eye, Inbox, Users, BarChart3,
	FileCode, Settings,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useEmailTabData } from "../../hooks/useEmailTabData";

import EmailDashboardView from "./email/EmailDashboardView";
import EmailInboxView from "./email/EmailInboxView";
import EmailSubscribersView from "./email/EmailSubscribersView";
import EmailCampaignsView from "./email/EmailCampaignsView";
import EmailTemplatesView from "./email/EmailTemplatesView";
import EmailAutomationView from "./email/EmailAutomationView";

const TABS = [
	{ id: "dashboard",   label: "Dashboard",       icon: BarChart3   },
	{ id: "inbox",       label: "Hộp thư đến",     icon: Inbox       },
	{ id: "subscribers", label: "Người đăng ký",   icon: Users       },
	{ id: "campaigns",   label: "Chiến dịch",      icon: Send        },
	{ id: "templates",   label: "Mẫu Email",       icon: FileCode    },
	{ id: "automation",  label: "Tự động hóa",     icon: Settings    },
];

const EmailTab = () => {
	const {
		activeTab,
		setActiveTab,
		loading,
		data,
		automations,
		handleDeleteSubscriber,
		handleMarkMessageRead,
		handleToggleAutomation,
	} = useEmailTabData();

	const renderTabContent = () => {
		switch (activeTab) {
			case "dashboard":   return <EmailDashboardView stats={data.stats} chartData={data.chartData} />;
			case "inbox":       return <EmailInboxView messages={data.messages} loading={loading} onMarkRead={handleMarkMessageRead} />;
			case "subscribers": return <EmailSubscribersView subscribers={data.subscribers} loading={loading} onDelete={handleDeleteSubscriber} />;
			case "campaigns":   return <EmailCampaignsView campaigns={data.campaigns} loading={loading} />;
			case "templates":   return <EmailTemplatesView templates={data.templates} loading={loading} />;
			case "automation":  return <EmailAutomationView automations={automations} onToggle={handleToggleAutomation} />;
			default:            return null;
		}
	};

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
					onClick={() => setActiveTab("campaigns")}
					className="flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-yellow-500 hover:scale-105 transition-all shadow-lg"
				>
					<Plus className="w-4 h-4" /> TẠO CHIẾN DỊCH MỚI
				</button>
			</div>

			{/* Sub-tabs Navigation */}
			<div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-luxury-border pb-px">
				{TABS.map((tab) => (
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
							<motion.div layoutId="activeEmailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-luxury-gold" />
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
						{renderTabContent()}
					</motion.div>
				</AnimatePresence>
			</div>
		</div>
	);
};

export default EmailTab;
