import { motion } from "framer-motion";
import { X } from "lucide-react";

const userRoleColor = (role) => {
	switch (role) {
		case "admin": return "text-[#b68a3c] border-[#b68a3c]/30 bg-[#b68a3c]/10";
		case "staff": return "text-blue-500 border-blue-500/30 bg-blue-500/10";
		default: return "text-gray-500 border-gray-200 bg-white dark:bg-luxury-darker dark:border-luxury-border";
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
				className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl"
			>
				<div className="p-6 pb-4 flex items-center justify-between border-b border-transparent">
					<h2 className="text-xl font-bold text-gray-900 dark:text-white">Chi tiết người dùng</h2>
					<button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:text-luxury-text-muted dark:hover:text-white transition-colors">
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="px-6 pb-6 overflow-y-auto custom-scrollbar flex-1">
					{/* Tab Switcher */}
					<div className="flex gap-1 mb-6 bg-gray-100 dark:bg-gray-800/50 p-1.5 rounded-xl">
						{[{ id: "info", label: "Thông tin" }, { id: "orders", label: "Lịch sử đơn hàng" }].map(tab => (
							<button key={tab.id} onClick={() => { onSetUserDetailTab(tab.id); if (tab.id === "orders") onFetchUserOrders(selectedUser._id); }}
								className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${userDetailTab === tab.id ? "bg-white dark:bg-luxury-dark text-[#b68a3c] shadow-sm" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}>
								{tab.label}
							</button>
						))}
					</div>
					
					{/* Info Tab */}
					{userDetailTab === "info" && (
						<div className="space-y-6">
							{/* User Profile */}
							<div className="flex items-center gap-5">
								<div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-luxury-border flex items-center justify-center text-2xl font-bold text-gray-700 dark:text-white uppercase">
									{selectedUser.name.substring(0, 2)}
								</div>
								<div>
									<p className="font-bold text-gray-900 dark:text-white text-lg">{selectedUser.name}</p>
									<p className="text-gray-500 dark:text-luxury-text-muted text-sm">{selectedUser.email}</p>
									<div className="flex gap-2 items-center mt-2">
										<span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${userRoleColor(selectedUser.role)}`}>{selectedUser.role}</span>
										<span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${selectedUser.segment === 'VIP' ? getSegmentBadge(selectedUser.segment) : 'text-gray-500 border-gray-200 bg-white dark:bg-luxury-darker dark:border-luxury-border'}`}>
											{selectedUser.segment === "VIP" ? "KHÁCH VIP" : 
											 selectedUser.segment === "Potential" ? "TIỀM NĂNG" :
											 selectedUser.segment === "Regular" ? "THÂN THIẾT" :
											 selectedUser.segment === "At Risk" ? "CÓ RỦI RO" : "KHÁCH MỚI"}
										</span>
									</div>
								</div>
							</div>

							{/* Stats */}
							<div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-100 dark:border-luxury-border">
								<div>
									<p className="text-gray-500 dark:text-luxury-text-muted text-[11px] uppercase font-bold mb-1.5 tracking-widest">Tổng chi tiêu</p>
									<p className="text-[#b68a3c] text-xl font-bold">{(selectedUser.totalSpend || 0).toLocaleString()} <span className="underline decoration-[#b68a3c]">đ</span></p>
								</div>
								<div>
									<p className="text-gray-500 dark:text-luxury-text-muted text-[11px] uppercase font-bold mb-1.5 tracking-widest">Đơn thành công</p>
									<p className="text-gray-900 dark:text-white text-xl font-bold">{selectedUser.orderCount || 0}</p>
								</div>
							</div>

							{/* Details */}
							<div className="space-y-3 py-2 border-b border-gray-100 dark:border-luxury-border pb-6">
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Ngày tham gia:</span>
									<span className="text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Bảo mật 2FA:</span>
									<span className={selectedUser.twoFactorEnabled ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>{selectedUser.twoFactorEnabled ? "Đang bật" : "Chưa kích hoạt"}</span>
								</div>
								<div className="flex justify-between items-center text-sm">
									<span className="text-gray-500 font-bold uppercase tracking-wider text-[11px]">Mã định danh:</span>
									<span className="text-gray-400 text-[11px]">{selectedUser._id}</span>
								</div>
							</div>

							{/* Loyalty Points */}
							<div className="border-b border-gray-100 dark:border-luxury-border pb-6">
								<p className="text-[11px] uppercase font-bold text-gray-400 dark:text-gray-500 mb-3 tracking-widest">Điểm Tích Lũy</p>
								<div className="flex items-center gap-3">
									<span className="text-3xl font-bold text-[#b68a3c]">{selectedUser.rewardPoints || 0}</span>
									<span className="text-sm text-gray-500">/ {selectedUser.totalPointsEarned || 0} tổng đã tích</span>
									<button onClick={onShowLoyaltyModal} className="ml-auto px-4 py-1.5 text-xs font-bold bg-[#b68a3c]/10 border border-[#b68a3c]/20 text-[#b68a3c] rounded-xl hover:bg-[#b68a3c]/20 transition-colors">+/- Điểm</button>
								</div>
							</div>

							{/* Admin Notes & Tags */}
							<div className="space-y-3">
								<p className="text-[11px] uppercase font-bold text-gray-400 dark:text-gray-500 tracking-widest">Tags Nội Bộ</p>
								<div className="flex flex-wrap gap-2">
									{["VIP", "Wholesale", "Problematic", "New", "Loyal"].map(tag => {
										const isActive = (selectedUser.tags || []).includes(tag);
										return (
											<button key={tag} onClick={() => {
												const curr = selectedUser.tags || [];
												const next = isActive ? curr.filter(t => t !== tag) : [...curr, tag];
												onUpdateTags(selectedUser._id, next);
											}} className={"text-xs font-bold px-3 py-1 rounded border transition-colors " + (isActive ? "text-[#b68a3c] border-[#b68a3c]/50 bg-[#b68a3c]/10" : "text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-luxury-darker")}>{tag}</button>
										);
									})}
								</div>
								<textarea rows={3} placeholder="Ghi chú nội bộ..." defaultValue={selectedUser.adminNotes || ''} onBlur={(e) => onUpdateNotes(selectedUser._id, e.target.value)} className="w-full text-sm px-4 py-3 bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none resize-none transition-shadow focus:ring-1 focus:ring-gray-300" />
							</div>

							{currentUser?.role === "admin" && (
								<div className="pt-2">
									<button onClick={() => onDeleteUser(selectedUser._id, selectedUser.name)}
										className="w-full py-3.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-500 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors uppercase tracking-widest">Xóa tài khoản</button>
								</div>
							)}
						</div>
					)}

					{/* Orders Tab */}
					{userDetailTab === "orders" && (
						<div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
							{userOrdersLoading ? (
								<div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-b-2 border-[#b68a3c] rounded-full" /></div>
							) : userOrders.length === 0 ? (
								<p className="text-center text-sm text-gray-500 py-12">Chưa có đơn hàng nào</p>
							) : userOrders.map(order => (
								<div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-luxury-darker rounded-xl border border-gray-100 dark:border-luxury-border">
									<div>
										<p className="text-sm font-bold text-gray-900 dark:text-white">#{order.orderCode || order._id?.slice(0,8).toUpperCase()}</p>
										<p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
									</div>
									<div className="text-right">
										<p className="text-sm font-bold text-[#b68a3c]">{order.totalAmount?.toLocaleString("vi-VN")} <span className="underline">đ</span></p>
										<span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${ order.status === "delivered" ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20" : order.status === "cancelled" ? "text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20" : "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20" }`}>{order.status}</span>
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
