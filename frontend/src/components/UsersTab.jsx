import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
	Users, Shield, Zap,
	ShieldCheck, ShieldAlert, Key, Eye, Clock,
	MoreVertical, Trash2, UserCog, X
} from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const UsersTab = () => {
	const { user: currentUser } = useUserStore();
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
	const [search, setSearch] = useState("");
	const [roleFilter, setRoleFilter] = useState("");
	
	const [auditLogs, setAuditLogs] = useState([]);
	const [logsLoading, setLogsLoading] = useState(true);
	const [logsPagination, setLogsPagination] = useState({ currentPage: 1, totalPages: 1 });

	const [openMenu, setOpenMenu] = useState(null); // userId of open dropdown
	const [selectedUser, setSelectedUser] = useState(null);
	const [showLogDetail, setShowLogDetail] = useState(null); // log object for modal
	const menuRef = useRef(null);
	const searchRef = useRef(search);

	useEffect(() => {
		searchRef.current = search;
	}, [search]);

	const fetchUsers = useCallback(async (page, role, keyword) => {
		setLoading(true);
		try {
			const res = await axios.get("/auth/users", {
				params: {
					page,
					limit: 10,
					search: keyword,
					role,
				},
			});
			setUsers(Array.isArray(res.data?.users) ? res.data.users : []);
			setPagination({
				currentPage: res.data?.pagination?.currentPage ?? 1,
				totalPages: res.data?.pagination?.totalPages ?? 1,
				totalUsers: res.data?.pagination?.totalUsers ?? 0,
				limit: res.data?.pagination?.limit ?? 10,
			});
		} catch (error) {
			console.error("Failed to fetch users", error);
			toast.error("Không thể tải danh sách người dùng");
			setUsers([]);
			setPagination({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 10 });
		} finally {
			setLoading(false);
		}
	}, []);

	const fetchAuditLogs = useCallback(async (page) => {
		setLogsLoading(true);
		try {
			const res = await axios.get("/auth/audit-logs", {
				params: {
					page,
					limit: 10,
				},
			});
			setAuditLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
			setLogsPagination({
				currentPage: res.data?.pagination?.currentPage ?? 1,
				totalPages: res.data?.pagination?.totalPages ?? 1,
				totalLogs: res.data?.pagination?.totalLogs ?? 0,
				limit: res.data?.pagination?.limit ?? 10,
			});
		} catch (error) {
			console.error("Failed to fetch audit logs", error);
			setAuditLogs([]);
			setLogsPagination({ currentPage: 1, totalPages: 1, totalLogs: 0, limit: 10 });
		} finally {
			setLogsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
	}, [pagination.currentPage, roleFilter, fetchUsers]);

	useEffect(() => {
		const delayDebounceFn = setTimeout(() => {
			if (pagination.currentPage !== 1) {
				setPagination(prev => ({ ...prev, currentPage: 1 }));
			} else {
				fetchUsers(1, roleFilter, search);
			}
		}, 500);
		return () => clearTimeout(delayDebounceFn);
	}, [search, pagination.currentPage, roleFilter, fetchUsers]);

	useEffect(() => {
		fetchAuditLogs(logsPagination.currentPage);
	}, [logsPagination.currentPage, fetchAuditLogs]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setOpenMenu(null);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleDeleteUser = async (userId, userName) => {
		if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${userName}"?`)) return;
		try {
			await axios.delete(`/auth/users/${userId}`);
			fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
			setOpenMenu(null);
			toast.success(`Đã xóa tài khoản ${userName}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi xóa người dùng");
		}
	};

	const handleUpdateRole = async (userId, newRole, userName) => {
		try {
			await axios.patch(`/auth/users/${userId}/role`, { role: newRole });
			fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
			setOpenMenu(null);
			toast.success(`Đã đổi vai trò ${userName} thành ${newRole}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi đổi vai trò");
		}
	};

	const getSegmentBadge = (segment) => {
		switch (segment) {
			case "VIP": return "text-luxury-gold border-luxury-gold/30 bg-luxury-gold/10";
			case "Potential": return "text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800";
			default: return "text-gray-500 border-gray-200 bg-gray-50 dark:bg-luxury-darker dark:border-luxury-border";
		}
	};

	return (
		<div className='space-y-8'>
			{/* Header */}
			<div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-gray-900 dark:text-white tracking-tight'>Quản Lý Người Dùng</h1>
					<p className='text-gray-500 dark:text-luxury-text-muted text-sm'>
						Tổng cộng {pagination.totalUsers || 0} tài khoản | {users.filter(u => u.role === "admin").length} Quản trị viên
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<div className='relative'>
						<input
							type='text'
							placeholder='Tìm theo tên, email, SĐT...'
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-luxury-gold/50 text-white placeholder-gray-500'
						/>
					</div>
					<select 
						value={roleFilter}
						onChange={(e) => setRoleFilter(e.target.value)}
						className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-xl px-3 py-2 text-sm text-gray-400 focus:outline-none cursor-pointer'
					>
						<option value="">Tất cả vai trò</option>
						<option value="customer">Khách hàng</option>
						<option value="admin">Quản trị viên</option>
						<option value="staff">Nhân viên</option>
					</select>
				</div>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				{[
					{ label: "Tổng người dùng", value: (pagination.totalUsers || 0).toLocaleString(), icon: Users },
					{ label: "Nhóm VIP", value: users.filter(u => u.segment === "VIP").length.toString(), icon: Zap, color: "text-luxury-gold" },
					{ label: "Phân nhóm Tiềm năng", value: users.filter(u => u.segment === "Potential").length.toString(), icon: Zap, color: "text-blue-400" },
					{ label: "Đã bật 2FA", value: users.filter(u => u.twoFactorEnabled).length.toString(), icon: ShieldCheck, color: "text-emerald-400" },
				].map((stat, idx) => (
					<div key={idx} className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-5 rounded-2xl shadow-xl dark:shadow-none'>
						<p className='text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest mb-2'>{stat.label}</p>
						<div className="flex items-center justify-between">
							<h3 className='text-2xl font-bold text-gray-900 dark:text-white'>{stat.value}</h3>
							<stat.icon className={`w-5 h-5 ${stat.color || "text-gray-400"}`} />
						</div>
					</div>
				))}
			</div>

			<div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
				{/* User Directory */}
				<div className='lg:col-span-2'>
					<div className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl overflow-hidden shadow-xl dark:shadow-none'>
						<div className='px-6 py-4 border-b border-gray-100 dark:border-luxury-border/50 flex items-center justify-between'>
							<h2 className='font-bold text-gray-900 dark:text-white flex items-center gap-2'>
								<Users className='w-4 h-4 text-luxury-gold' /> Danh sách người dùng
							</h2>
							<span className='text-[10px] text-gray-500 dark:text-luxury-text-muted'>TRANG {pagination.currentPage} / {pagination.totalPages}</span>
						</div>
						<div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
						<table className='w-full'>
							<thead className="sticky top-0 z-10 bg-gray-50 dark:bg-luxury-dark border-b border-gray-100 dark:border-luxury-border/50">
								<tr className='text-left'>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Người dùng</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Nhóm</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Chi tiêu</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Đơn hàng</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest text-right'>Hành động</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-100 dark:divide-luxury-border/30'>
								{loading ? (
									<tr>
										<td colSpan="5" className="text-center py-8">
											<div className="flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-luxury-gold"></div></div>
											<p className="mt-2 text-luxury-gold text-xs">Đang tải dữ liệu...</p>
										</td>
									</tr>
								) : users.length === 0 ? (
									<tr>
										<td colSpan="5" className="text-center py-8 text-gray-500 text-sm">Không tìm thấy người dùng nào</td>
									</tr>
								) : users.map((user) => (
									<tr key={user._id} className='hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative'>
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
												 user.segment === "Potential" ? "TIỀM NĂNG" : "KHÁCH MỚI"}
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
													onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
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
															onClick={() => { setSelectedUser(user); setOpenMenu(null); }}
															className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
														>
															<Eye className='w-4 h-4 text-luxury-gold' /> Xem chi tiết
														</button>
														
														{currentUser?.role === "admin" && (
															<>
																<div className='px-4 py-2 text-[9px] font-bold text-gray-400 uppercase border-t border-gray-100 dark:border-luxury-border/50'>Đổi vai trò</div>
																
																{user.role !== "customer" && (
																	<button
																		onClick={() => handleUpdateRole(user._id, "customer", user.name)}
																		className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
																	>
																		<Zap className='w-4 h-4 text-gray-400' /> Thành Khách hàng
																	</button>
																)}
																{user.role !== "staff" && (
																	<button
																		onClick={() => handleUpdateRole(user._id, "staff", user.name)}
																		className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
																	>
																		<Shield className='w-4 h-4 text-blue-400' /> Thành Nhân viên
																	</button>
																)}
																{user.role !== "admin" && (
																	<button
																		onClick={() => handleUpdateRole(user._id, "admin", user.name)}
																		className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
																	>
																		<ShieldCheck className='w-4 h-4 text-luxury-gold' /> Thành Quản trị viên
																	</button>
																)}

																<div className='border-t border-gray-100 dark:border-luxury-border/50' />
																<button
																	onClick={() => handleDeleteUser(user._id, user.name)}
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
						
						{/* Pagination Controls */}
						<div className='px-6 py-4 border-t border-gray-100 dark:border-luxury-border/50 flex items-center justify-between bg-gray-50/30 dark:bg-white/5'>
							<span className='text-xs text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest text-[9px]'>Trang {pagination.currentPage} / {pagination.totalPages}</span>
							<div className='flex gap-2'>
								<button
									disabled={pagination.currentPage === 1}
									onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
									className='px-4 py-2 rounded-xl border border-gray-100 dark:border-luxury-border text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:bg-luxury-gold/10 transition-colors'
								>
									Trước
								</button>
								<button
									disabled={pagination.currentPage === pagination.totalPages}
									onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
									className='px-4 py-2 rounded-xl border border-gray-100 dark:border-luxury-border text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:bg-luxury-gold/10 transition-colors'
								>
									Tiếp
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Security & Audit Logs */}
				<div className='space-y-6'>
					<h2 className='text-xl font-bold text-gray-800 dark:text-white'>Nhật ký hệ thống</h2>
					<div className='space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
						{logsLoading ? (
							<div className="flex flex-col items-center justify-center py-20">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-luxury-gold"></div>
								<p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">Đang tải nhật ký...</p>
							</div>
						) : auditLogs.length === 0 ? (
							<p className="text-center text-[10px] text-gray-400 py-10 uppercase tracking-widest">Chưa có nhật ký</p>
						) : auditLogs.map(log => (
							<div 
								key={log._id} 
								onClick={() => setShowLogDetail(log)}
								className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-4 rounded-2xl flex items-start gap-4 shadow-md dark:shadow-none cursor-pointer hover:border-luxury-gold/50 transition-all group'
							>
								<div className={`p-2 rounded-xl bg-gray-50 dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border ${log.action.includes("DENIED") ? "text-red-400" : log.action.includes("LOGIN") ? "text-emerald-400" : "text-luxury-gold"}`}>
									{log.action.includes("LOGIN") ? <Key className='w-4 h-4' /> : log.action.includes("DENIED") ? <ShieldAlert className='w-4 h-4' /> : <UserCog className='w-4 h-4' />}
								</div>
								<div className='flex-1 space-y-1'>
									<div className="flex items-center justify-between">
										<p className='text-xs font-bold text-gray-900 dark:text-white group-hover:text-luxury-gold transition-colors'>{log.action}</p>
										<span className="text-[8px] px-1.5 py-0.5 bg-gray-100 dark:bg-white/5 rounded text-gray-400 uppercase tracking-tighter">
											{log.userId?.role || "GUEST"}
										</span>
									</div>
									<p className='text-[10px] text-gray-500 dark:text-luxury-text-muted truncate'>{log.userId?.name || "Khách ẩn danh"}</p>
									<p className='text-[9px] font-bold text-gray-400 dark:text-luxury-text-muted flex items-center gap-1 uppercase'>
										<Clock className='w-3 h-3' /> {new Date(log.createdAt).toLocaleString("vi-VN")}
									</p>
								</div>
							</div>
						))}
					</div>
					
					{/* Audit Pagination */}
					{auditLogs.length > 0 && (
						<div className="flex justify-between items-center px-2">
							<button 
								disabled={logsPagination.currentPage === 1}
								onClick={() => setLogsPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
								className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:underline"
							>
								Trang trước
							</button>
							<button 
								disabled={logsPagination.currentPage === logsPagination.totalPages}
								onClick={() => setLogsPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
								className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:underline"
							>
								Tiếp theo
							</button>
						</div>
					)}

					<div className='bg-luxury-gold/5 border border-luxury-gold/10 dark:border-luxury-gold/20 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none'>
						<h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest'>Bảo mật hệ thống</h3>
						<p className='text-xs text-gray-600 dark:text-luxury-text-muted leading-relaxed'>
							Hệ thống đang hoạt động <span className='text-emerald-600 dark:text-emerald-400 font-bold'>ỔN ĐỊNH</span>. Mọi thay đổi quan trọng đều được ghi nhận trong Audit Log.
						</p>
					</div>
				</div>
			</div>

			{/* User Detail Modal */}
			{selectedUser && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl w-full max-w-md p-6 shadow-2xl"
					>
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiết người dùng</h2>
							<button onClick={() => setSelectedUser(null)} className="text-gray-400 dark:text-luxury-text-muted hover:text-white transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-luxury-border flex items-center justify-center text-2xl font-bold text-gray-600 dark:text-white uppercase font-sans">
									{selectedUser.name.substring(0, 2)}
								</div>
								<div>
									<p className="font-bold text-gray-900 dark:text-white text-lg font-sans">{selectedUser.name}</p>
									<p className="text-gray-500 dark:text-luxury-text-muted text-sm">{selectedUser.email}</p>
									<div className="flex gap-2 items-center mt-1">
										<span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${userRoleColor(selectedUser.role)} uppercase tracking-tighter`}>
											{selectedUser.role}
										</span>
										<span className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${getSegmentBadge(selectedUser.segment)} uppercase tracking-tighter`}>
											{selectedUser.segment}
										</span>
									</div>
								</div>
							</div>
							
							<div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-luxury-border">
								<div>
									<p className="text-gray-500 dark:text-luxury-text-muted text-[10px] uppercase font-bold mb-1 tracking-widest">Tổng chi tiêu</p>
									<p className="text-luxury-gold text-lg font-bold font-sans">{(selectedUser.totalSpend || 0).toLocaleString()} ₫</p>
								</div>
								<div>
									<p className="text-gray-500 dark:text-luxury-text-muted text-[10px] uppercase font-bold mb-1 tracking-widest">Đơn hàng thành công</p>
									<p className="text-gray-900 dark:text-white text-lg font-bold font-sans">{selectedUser.orderCount || 0}</p>
								</div>
							</div>

							<div className="space-y-2 pt-4 border-t border-gray-100 dark:border-luxury-border">
								<div className="flex justify-between text-xs">
									<span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Ngày tham gia:</span>
									<span className="text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Bảo mật 2FA:</span>
									<span className={selectedUser.twoFactorEnabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
										{selectedUser.twoFactorEnabled ? "Đang bật" : "Chưa kích hoạt"}
									</span>
								</div>
								<div className="flex justify-between text-xs">
									<span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Mã định danh:</span>
									<span className="text-gray-400 font-mono text-[9px]">{selectedUser._id}</span>
								</div>
							</div>

							{currentUser?.role === "admin" && (
								<div className="flex gap-3 pt-4">
									<button
										onClick={() => { handleDeleteUser(selectedUser._id, selectedUser.name); setSelectedUser(null); }}
										className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold hover:bg-red-500/20 transition uppercase tracking-widest"
									>
										Xóa tài khoản
									</button>
								</div>
							)}
						</div>
					</motion.div>
				</div>
			)}

			{/* Log Detail Modal */}
			{showLogDetail && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						animate={{ opacity: 1, scale: 1 }}
						className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl w-full max-w-lg p-6 shadow-2xl overflow-hidden"
					>
						<div className="flex items-center justify-between mb-6 border-b border-luxury-border pb-4">
							<div className="flex items-center gap-3">
								<div className={`p-2 rounded-xl bg-gray-50 dark:bg-luxury-darker border border-gray-100 dark:border-luxury-border ${showLogDetail.action.includes("DENIED") ? "text-red-400" : "text-luxury-gold"}`}>
									<ShieldAlert className="w-5 h-5" />
								</div>
								<div>
									<h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">{showLogDetail.action}</h2>
									<p className="text-[10px] text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">{new Date(showLogDetail.createdAt).toLocaleString("vi-VN")}</p>
								</div>
							</div>
							<button onClick={() => setShowLogDetail(null)} className="text-gray-400 dark:text-luxury-text-muted hover:text-white transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
							<div>
								<p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Người thực hiện</p>
								<div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-luxury-border">
									<div className="w-8 h-8 rounded-full bg-luxury-gold/20 flex items-center justify-center text-luxury-gold text-xs font-bold font-sans">
										{showLogDetail.userId?.name.substring(0, 2).toUpperCase() || "G"}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-bold text-white truncate">{showLogDetail.userId?.name || "Khách ẩn danh"}</p>
										<p className="text-[10px] text-gray-500 truncate">{showLogDetail.userId?.email || "Không có email"}</p>
									</div>
									<span className="px-2 py-0.5 bg-luxury-gold/10 text-luxury-gold text-[9px] font-bold rounded border border-luxury-gold/30 uppercase tracking-tighter">
										{showLogDetail.userId?.role || "GUEST"}
									</span>
								</div>
							</div>

							{showLogDetail.changes && showLogDetail.changes.length > 0 && (
								<div>
									<p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Chi tiết thay đổi</p>
									<div className="space-y-2">
										{showLogDetail.changes.map((change, idx) => (
											<div key={idx} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-luxury-border text-xs">
												<p className="font-bold text-luxury-gold mb-2 uppercase tracking-tighter">Trường: {change.field}</p>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-1">
														<p className="text-[10px] text-gray-500 uppercase tracking-tighter">Cũ</p>
														<div className="text-red-400 font-mono bg-red-400/5 p-2 rounded border border-red-400/20 break-all max-h-32 overflow-y-auto custom-scrollbar">
															{typeof change.old === 'object' ? JSON.stringify(change.old, null, 2) : String(change.old)}
														</div>
													</div>
													<div className="space-y-1">
														<p className="text-[10px] text-gray-500 uppercase tracking-tighter">Mới</p>
														<div className="text-emerald-400 font-mono bg-emerald-400/5 p-2 rounded border border-emerald-400/20 break-all max-h-32 overflow-y-auto custom-scrollbar">
															{typeof change.new === 'object' ? JSON.stringify(change.new, null, 2) : String(change.new)}
														</div>
													</div>
												</div>
											</div>
										))}
									</div>
								</div>
							)}

							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest text-[8px]">Địa chỉ IP</p>
									<p className="text-xs text-white font-mono bg-black/20 p-2 rounded">{showLogDetail.ip || "Unknown"}</p>
								</div>
								<div>
									<p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest text-[8px]">Model đích</p>
									<p className="text-xs text-white uppercase bg-black/20 p-2 rounded truncate">{showLogDetail.targetModel || "N/A"}</p>
								</div>
							</div>

							<div>
								<p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest text-[8px]">Trình duyệt / Thiết bị</p>
								<p className="text-[9px] text-gray-400 leading-relaxed bg-black/20 p-2 rounded break-words italic">{showLogDetail.userAgent}</p>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	);
};

const userRoleColor = (role) => {
	switch (role) {
		case "admin": return "text-luxury-gold border-luxury-gold/30 bg-luxury-gold/10";
		case "staff": return "text-blue-400 border-blue-400/30 bg-blue-400/10";
		default: return "text-gray-500 border-gray-200 bg-gray-50 dark:bg-luxury-darker";
	}
};

export default UsersTab;
