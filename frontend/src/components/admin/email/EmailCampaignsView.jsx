import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Plus, X, Calendar, Activity, Eye, MousePointerClick, RefreshCw } from "lucide-react";

const EmailCampaignsView = ({ campaigns, templates, onCreateCampaign, onSendCampaign, loading }) => {
	const [isCreating, setIsCreating] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [newCampaign, setNewCampaign] = useState({
		title: "",
		subject: "",
		template: "",
		targetAudience: "newsletter"
	});

	const handleCreate = async () => {
		setIsSaving(true);
		const success = await onCreateCampaign(newCampaign);
		setIsSaving(false);
		if (success) {
			setIsCreating(false);
			setNewCampaign({ title: "", subject: "", template: "", targetAudience: "newsletter" });
		}
	};

	const getStatusBadge = (status) => {
		switch (status) {
			case "sent": return <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-green-600 bg-green-100 rounded-full uppercase">Đã gửi</span>;
			case "sending": return <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-blue-600 bg-blue-100 rounded-full uppercase flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin"/> Đang gửi</span>;
			case "scheduled": return <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-amber-600 bg-amber-100 rounded-full uppercase">Lên lịch</span>;
			case "failed": return <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-red-600 bg-red-100 rounded-full uppercase">Thất bại</span>;
			default: return <span className="px-2.5 py-1 text-[10px] font-bold tracking-widest text-gray-600 bg-gray-100 rounded-full uppercase">Bản nháp</span>;
		}
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
				<div>
					<h3 className="text-xl font-bold text-gray-900 dark:text-white">Danh sách Chiến dịch</h3>
					<p className="text-sm text-gray-500 mt-1">Quản lý và theo dõi hiệu quả các chiến dịch email marketing.</p>
				</div>
				<button 
					onClick={() => setIsCreating(true)}
					className="flex items-center gap-2 bg-luxury-gold hover:bg-yellow-500 text-luxury-dark px-4 py-2 rounded-lg font-bold transition-all shadow-sm"
				>
					<Plus className="w-4 h-4" /> Tạo chiến dịch
				</button>
			</div>

			{/* List */}
			<div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
						<thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
							<tr>
								<th className="px-6 py-4 font-bold">Chiến dịch</th>
								<th className="px-6 py-4 font-bold text-center">Trạng thái</th>
								<th className="px-6 py-4 font-bold text-center">Thống kê</th>
								<th className="px-6 py-4 font-bold text-center">Thời gian</th>
								<th className="px-6 py-4 font-bold text-right">Hành động</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-gray-200 dark:divide-gray-800">
							{loading ? (
								<tr><td colSpan="5" className="px-6 py-8 text-center">Đang tải dữ liệu...</td></tr>
							) : campaigns.length === 0 ? (
								<tr><td colSpan="5" className="px-6 py-8 text-center">Chưa có chiến dịch nào.</td></tr>
							) : (
								campaigns.map(camp => (
									<tr key={camp._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
										<td className="px-6 py-4">
											<div className="font-semibold text-gray-900 dark:text-white mb-1">{camp.title || camp.name}</div>
											<div className="text-xs text-gray-500">Chủ đề: {camp.subject}</div>
											<div className="text-[10px] uppercase mt-1 tracking-widest text-[#1e40af] font-bold">Đối tượng: {camp.targetAudience === 'all' ? 'Tất cả' : camp.targetAudience}</div>
										</td>
										<td className="px-6 py-4 text-center">
											{getStatusBadge(camp.status)}
										</td>
										<td className="px-6 py-4">
											<div className="flex items-center justify-center gap-4 text-xs">
												<div className="flex items-center gap-1.5" title="Đã gửi"><Send className="w-3.5 h-3.5 text-gray-400" /> <span className="font-medium text-gray-700 dark:text-gray-300">{camp.stats?.totalSent || 0}</span></div>
												<div className="flex items-center gap-1.5" title="Đã mở"><Eye className="w-3.5 h-3.5 text-gray-400" /> <span className="font-medium text-gray-700 dark:text-gray-300">{camp.stats?.opened || 0}</span></div>
												<div className="flex items-center gap-1.5" title="Lượt click"><MousePointerClick className="w-3.5 h-3.5 text-gray-400" /> <span className="font-medium text-gray-700 dark:text-gray-300">{camp.stats?.clicked || 0}</span></div>
											</div>
										</td>
										<td className="px-6 py-4 text-center text-xs">
											<div className="flex items-center justify-center gap-1.5 text-gray-500">
												<Calendar className="w-3.5 h-3.5" />
												{new Date(camp.createdAt).toLocaleDateString("en-GB")}
											</div>
										</td>
										<td className="px-6 py-4 text-right">
											{camp.status === "draft" && (
												<button 
													onClick={() => onSendCampaign(camp._id)}
													className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e40af] text-white rounded font-medium text-xs hover:bg-blue-800 transition shadow-sm"
												>
													<Send className="w-3 h-3" /> Gửi ngay
												</button>
											)}
										</td>
									</tr>
								))
							)}
						</tbody>
					</table>
				</div>
			</div>

			{/* Create Modal */}
			<AnimatePresence>
				{isCreating && (
					<motion.div
						initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
						className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
					>
						<motion.div
							initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
							className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
						>
							<div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
								<h3 className="text-lg font-bold text-gray-900 dark:text-white">Tạo chiến dịch mới</h3>
								<button onClick={() => setIsCreating(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition">
									<X className="w-5 h-5 text-gray-500" />
								</button>
							</div>
							<div className="p-6 space-y-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tên chiến dịch</label>
									<input 
										type="text" 
										value={newCampaign.title} 
										onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold" 
										placeholder="Ví dụ: Khuyến mãi mùa Hè 2026"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chủ đề email (Subject)</label>
									<input 
										type="text" 
										value={newCampaign.subject} 
										onChange={(e) => setNewCampaign({...newCampaign, subject: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold" 
										placeholder="Tiêu đề hiển thị trong hộp thư khách hàng"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Đối tượng nhận</label>
									<select 
										value={newCampaign.targetAudience}
										onChange={(e) => setNewCampaign({...newCampaign, targetAudience: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold"
									>
										<option value="newsletter">Người đăng ký nhận tin (Newsletter)</option>
										<option value="customers">Khách đã mua hàng</option>
										<option value="all">Tất cả (Newsletter + Customers)</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mẫu Email (Template)</label>
									<select 
										value={newCampaign.template}
										onChange={(e) => setNewCampaign({...newCampaign, template: e.target.value})}
										className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-transparent focus:outline-none focus:border-luxury-gold"
									>
										<option value="">-- Chọn một mẫu email --</option>
										{templates.map(t => (
											<option key={t._id} value={t._id}>{t.name} ({t.category})</option>
										))}
									</select>
								</div>
							</div>
							<div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
								<button 
									onClick={() => setIsCreating(false)}
									className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-800 transition"
								>
									Hủy
								</button>
								<button 
									onClick={handleCreate}
									disabled={isSaving || !newCampaign.title || !newCampaign.subject || !newCampaign.template}
									className="px-4 py-2 bg-luxury-gold text-lux-dark rounded-lg text-sm font-bold hover:bg-yellow-500 transition disabled:opacity-50"
								>
									{isSaving ? 'Đang tạo...' : 'Lưu nháp'}
								</button>
							</div>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};

export default EmailCampaignsView;
