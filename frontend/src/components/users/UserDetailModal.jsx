import { motion } from "framer-motion";
import { X } from "lucide-react";

const userRoleColor = (role) => {
	switch (role) {
		case "admin": return "text-luxury-gold border-luxury-gold/30 bg-luxury-gold/10";
		case "staff": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
		default: return "text-gray-500 border-gray-200 bg-gray-50 dark:bg-luxury-darker";
	}
};

const UserDetailModal = ({
	selectedUser,
	onClose,
	userDetailTab,
	onSetUserDetailTab,
	userOrders,
	userOrdersLoading,
	onFetchUserOrders,
	onShowLoyaltyModal,
	getSegmentBadge,
	currentUser,
	onDeleteUser,
	onUpdateTags,
	onUpdateNotes
}) => {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
			<motion.div
				initial={{ opacity: 0, scale: 0.95 }}
				animate={{ opacity: 1, scale: 1 }}
				className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
			>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết người dùng</h2>
					<button onClick={onClose} className="text-gray-400 dark:text-luxury-text-muted hover:text-white transition-colors">
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Tab Switcher */}
				<div className="flex gap-1 mb-4 bg-gray-100 dark:bg-luxury-border/30 p-1 rounded-xl">
					{[{ id: "info", label: "Thông tin" }, { id: "orders", label: "Lịch sử đơn hàng" }].map(tab => (
						<button key={tab.id} onClick={() => { onSetUserDetailTab(tab.id); if (tab.id === "orders") onFetchUserOrders(selectedUser._id); }}
							className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${userDetailTab === tab.id ? "bg-white dark:bg-luxury-darker text-luxury-gold shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"}`}>
							{tab.label}
						</button>
					))}
				</div>
				<div className="space-y-4">

					{/* Info Tab */}
					{userDetailTab === "info" && (
						<>
						<div className="flex items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-luxury-border flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-white uppercase font-sans">
								{selectedUser.name.substring(0, 2)}
							</div>
							<div>
								<p className="font-bold text-gray-900 dark:text-white text-lg font-sans">{selectedUser.name}</p>
								<p className="text-gray-500 dark:text-luxury-text-muted text-sm">{selectedUser.email}</p>
								<div className="flex gap-2 items-center mt-1">
									<span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${userRoleColor(selectedUser.role)} uppercase tracking-tighter`}>{selectedUser.role}</span>
									<span className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${getSegmentBadge(selectedUser.segment)} uppercase tracking-tighter`}>{selectedUser.segment}</span>
								</div>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-luxury-border">
							<div><p className="text-gray-500 dark:text-luxury-text-muted text-[10px] uppercase font-bold mb-1 tracking-widest">Tổng chi tiêu</p><p className="text-luxury-gold text-lg font-bold font-sans">{(selectedUser.totalSpend || 0).toLocaleString()} ₫</p></div>
							<div><p className="text-gray-500 dark:text-luxury-text-muted text-[10px] uppercase font-bold mb-1 tracking-widest">Đơn thành công</p><p className="text-gray-900 dark:text-white text-lg font-bold font-sans">{selectedUser.orderCount || 0}</p></div>
						</div>
						<div className="space-y-2 pt-4 border-t border-gray-100 dark:border-luxury-border">
							<div className="flex justify-between text-xs"><span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Ngày tham gia:</span><span className="text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</span></div>
							<div className="flex justify-between text-xs"><span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Bảo mật 2FA:</span><span className={selectedUser.twoFactorEnabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{selectedUser.twoFactorEnabled ? "Đang bật" : "Chưa kích hoạt"}</span></div>
							<div className="flex justify-between text-xs"><span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Mã định danh:</span><span className="text-gray-400 font-mono text-[9px]">{selectedUser._id}</span></div>
						</div>

						{/* Loyalty Points */}
						<div className="pt-4 border-t border-gray-100 dark:border-luxury-border">
							<p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Điểm Tích Lũy</p>
							<div className="flex items-center gap-3">
								<span className="text-2xl font-bold text-luxury-gold">{selectedUser.rewardPoints || 0}</span>
								<span className="text-xs text-gray-400">/ {selectedUser.totalPointsEarned || 0} tổng đã tích</span>
								<button onClick={onShowLoyaltyModal} className="ml-auto px-3 py-1 text-xs font-bold bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-lg hover:bg-amber-400/20 transition">+/- Điểm</button>
							</div>
						</div>
						{/* Admin Notes & Tags */}
						<div className="pt-4 border-t border-gray-100 dark:border-luxury-border space-y-2">
							<p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Tags Nội Bộ</p>
							<div className="flex flex-wrap gap-1">
								{["VIP", "Wholesale", "Problematic", "New", "Loyal"].map(tag => {
									const isActive = (selectedUser.tags || []).includes(tag);
									return (
										<button key={tag} onClick={() => {
											const curr = selectedUser.tags || [];
											const next = isActive ? curr.filter(t => t !== tag) : [...curr, tag];
											onUpdateTags(selectedUser._id, next);
										}} className={"text-[10px] font-bold px-2 py-0.5 rounded border transition " + (isActive ? "text-luxury-gold border-luxury-gold/50 bg-luxury-gold/10" : "text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300")}>{tag}</button>
									);
								})}
							</div>
							<textarea rows={2} placeholder="Ghi chú nội bộ..." defaultValue={selectedUser.adminNotes || ''} onBlur={(e) => onUpdateNotes(selectedUser._id, e.target.value)} className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none resize-none" />
						</div>

						{currentUser?.role === "admin" && (
							<div className="flex gap-3 pt-4">
								<button onClick={() => onDeleteUser(selectedUser._id, selectedUser.name)}
									className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold hover:bg-red-500/20 transition uppercase tracking-widest">Xóa tài khoản</button>
							</div>
						)}
						</>
					)}

					{/* Orders Tab */}
					{userDetailTab === "orders" && (
						<div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
							{userOrdersLoading ? (
								<div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-b-2 border-luxury-gold rounded-full" /></div>
							) : userOrders.length === 0 ? (
								<p className="text-center text-sm text-gray-400 py-8">Chưa có đơn hàng nào</p>
							) : userOrders.map(order => (
								<div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-luxury-darker rounded-lg border border-gray-100 dark:border-luxury-border">
									<div>
										<p className="text-xs font-bold text-gray-900 dark:text-white">#{order.orderCode || order._id?.slice(0,8).toUpperCase()}</p>
										<p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
									</div>
									<div className="text-right">
										<p className="text-xs font-bold text-luxury-gold">{order.totalAmount?.toLocaleString("vi-VN")} ₫</p>
										<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${ order.status === "delivered" ? "text-emerald-400 bg-emerald-400/10" : order.status === "cancelled" ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10" }`}>{order.status}</span>
									</div>
								</div>
							))}
						</div>
					)}

				</div>
			</motion.div>
		</div>
	);
};

export default UserDetailModal;
