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
	{ id: "dashboard", label: "Trang chủ", icon: BarChart3 },
	{ id: "inbox", label: "Hộp thư đến", icon: Inbox },
	{ id: "subscribers", label: "Người đăng ký", icon: Users },
	{ id: "campaigns", label: "Chiến dịch", icon: Send },
	{ id: "templates", label: "Mẫu Email", icon: FileCode },
	{ id: "automation", label: "Tự động hóa", icon: Settings },
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
			case "dashboard": return <EmailDashboardView stats={data.stats} chartData={data.chartData} />;
			case "inbox": return <EmailInboxView messages={data.messages} loading={loading} onMarkRead={handleMarkMessageRead} />;
			case "subscribers": return <EmailSubscribersView subscribers={data.subscribers} loading={loading} onDelete={handleDeleteSubscriber} />;
			case "campaigns": return <EmailCampaignsView campaigns={data.campaigns} loading={loading} />;
			case "templates": return <EmailTemplatesView templates={data.templates} loading={loading} />;
			case "automation": return <EmailAutomationView automations={automations} onToggle={handleToggleAutomation} />;
			default: return null;
		}
	};

	return (
		<div className="space-y-8 min-h-[600px]">
			{/* Top Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
				<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
					Quản lý Email & Marketing
				</h2>
				<button
					onClick={() => setActiveTab("campaigns")}
					className="flex items-center gap-2 px-6 py-2.5 bg-[#1e40af] text-white rounded text-sm font-semibold hover:bg-blue-800 transition-colors shadow-sm"
				>
					TẠO CHIẾN DỊCH MỚI
				</button>
			</div>

			{/* Sub-tabs Navigation */}
			<div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800">
				{TABS.map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id)}
						className={`relative px-4 py-3 text-sm font-medium transition-colors ${activeTab === tab.id
							? "text-[#1e40af] dark:text-blue-400"
							: "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
							}`}
					>
						{tab.label}
						{activeTab === tab.id && (
							<motion.div layoutId="activeEmailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e40af] dark:bg-blue-400" />
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
