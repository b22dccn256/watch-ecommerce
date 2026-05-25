import { motion } from "framer-motion";
import { Users, Shield, Zap, ShieldCheck, MoreVertical, Eye, Trash2 } from "lucide-react";

const UsersTable = ({
	users,
	loading,
	currentUser,
	openMenu,
	onSetOpenMenu,
	onSelectUser,
	onDeleteUser,
	onUpdateRole,
	getSegmentBadge,
	menuRef,
	selectedUserIds = [],
	onToggleSelectUser,
	onToggleSelectAll
}) => {
	const activeUsers = users.filter(u => u._id !== currentUser?._id);
	const isAllSelected = activeUsers.length > 0 && activeUsers.every(u => selectedUserIds.includes(u._id));

	return (
		<div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
			<table className='w-full'>
				<thead className="sticky top-0 z-10 bg-gray-50 dark:bg-luxury-dark border-b border-gray-100 dark:border-luxury-border/50">
					<tr className='text-left'>
						<th className='px-6 py-4 w-12'>
							<input
								type="checkbox"
								checked={isAllSelected}
								onChange={() => onToggleSelectAll(activeUsers)}
								className="rounded border-gray-300 dark:border-luxury-border text-luxury-gold focus:ring-luxury-gold/50 cursor-pointer w-4 h-4 bg-transparent"
								disabled={loading || activeUsers.length === 0}
							/>
						</th>
						<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Người dùng</th>
						<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Nhóm</th>
						<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Chi tiêu</th>
						<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Đơn hàng</th>
						<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest text-right'>Hành động</th>
					</tr>
				</thead>
				<tbody className='divide-y divide-gray-100 dark:divide-luxury-border/30'>
					{loading ? (
						Array.from({length:5}).map((_,i) => (
							<tr key={i} className="animate-pulse">
								<td className="px-6 py-4" colSpan="6">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-luxury-border admin-skeleton flex-shrink-0"/>
										<div className="flex-1 space-y-2">
											<div className="h-3 w-32 rounded bg-gray-200 dark:bg-luxury-border admin-skeleton"/>
											<div className="h-3 w-24 rounded bg-gray-200 dark:bg-luxury-border admin-skeleton"/>
										</div>
									</div>
								</td>
							</tr>
						))
					) : users.length === 0 ? (
						<tr>
							<td colSpan="6">
								<div className="flex flex-col items-center py-12 gap-2">
									<Users className="w-10 h-10 text-gray-200 dark:text-gray-700"/>
									<p className="text-sm text-gray-400">Không tìm thấy người dùng nào</p>
								</div>
							</td>
						</tr>
					) : users.map((user) => (
						<tr key={user._id} className='hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative'>
							<td className='px-6 py-4 w-12'>
								{user._id !== currentUser?._id && (
									<input
										type="checkbox"
										checked={selectedUserIds.includes(user._id)}
										onChange={() => onToggleSelectUser(user._id)}
										className="rounded border-gray-300 dark:border-luxury-border text-luxury-gold focus:ring-luxury-gold/50 cursor-pointer w-4 h-4 bg-transparent"
									/>
								)}
							</td>
							<td className='px-6 py-4'>
								<div className='flex items-center gap-3'>
									<div className='w-8 h-8 rounded-full bg-gray-200 dark:bg-luxury-border flex items-center justify-center text-xs font-bold text-gray-600 dark:text-white uppercase'>
										{user.name.substring(0, 2)}
									</div>
									<div>
										<div className='text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2'>
											{user.name}
											{user.role !== "customer" && (
												<Shield className={`w-3 h-3 ${user.role === "admin" ? "text-luxury-gold" : "text-blue-400"}`} />
											)}
										</div>
										<div className='text-[10px] text-gray-500 dark:text-luxury-text-muted'>{user.email}</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4'>
								<span className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${getSegmentBadge(user.segment)}`}>
									{user.segment === "VIP" ? "KHÁCH VIP" : 
									 user.segment === "Potential" ? "TIỀM NĂNG" :
									 user.segment === "Regular" ? "THÂN THIẾT" :
									 user.segment === "At Risk" ? "CÓ RỦI RO" : "KHÁCH MỚI"}
								</span>
							</td>
							<td className='px-6 py-4 text-xs font-bold text-gray-900 dark:text-white'>
								{(user.totalSpend || 0).toLocaleString("vi-VN")} ₫
							</td>
							<td className='px-6 py-4 text-xs text-gray-500 dark:text-luxury-text-muted'>
								{user.orderCount || 0} đơn thành công
							</td>
							<td className='px-6 py-4 text-right'>
								<div className='relative inline-block' ref={openMenu === user._id ? menuRef : null}>
									<button
										onClick={() => onSetOpenMenu(openMenu === user._id ? null : user._id)}
										className='p-2 rounded-lg text-luxury-text-muted hover:text-white hover:bg-white/10 transition-colors'
									>
										<MoreVertical className='w-4 h-4' />
									</button>
									{openMenu === user._id && (
										<motion.div
											initial={{ opacity: 0, scale: 0.95, y: -5 }}
											animate={{ opacity: 1, scale: 1, y: 0 }}
											className='absolute right-0 top-full mt-1 w-56 bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl shadow-2xl z-20 overflow-hidden'
										>
											<button
												onClick={() => { onSelectUser(user); onSetOpenMenu(null); }}
												className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
											>
												<Eye className='w-4 h-4 text-luxury-gold' /> Xem chi tiết
											</button>
											
											{currentUser?.role === "admin" && (
												<>
													<div className='px-4 py-2 text-[9px] font-bold text-gray-400 uppercase border-t border-gray-100 dark:border-luxury-border/50'>Đổi vai trò</div>
													
													{user.role !== "customer" && (
														<button
															onClick={() => onUpdateRole(user._id, "customer", user.name)}
															className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
														>
															<Zap className='w-4 h-4 text-gray-400' /> Thành Khách hàng
														</button>
													)}
													{user.role !== "admin" && (
														<button
															onClick={() => onUpdateRole(user._id, "admin", user.name)}
															className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
														>
															<ShieldCheck className='w-4 h-4 text-luxury-gold' /> Thành Quản trị viên
														</button>
													)}

													<div className='border-t border-gray-100 dark:border-luxury-border/50' />
													<button
														onClick={() => onDeleteUser(user._id, user.name)}
														className='w-full px-4 py-3 flex items-center gap-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors text-left'
													>
														<Trash2 className='w-4 h-4' /> Xóa tài khoản
													</button>
												</>
											)}
										</motion.div>
									)}
								</div>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default UsersTable;
