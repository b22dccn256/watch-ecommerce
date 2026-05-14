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
import ConfirmModal from "./ConfirmModal";
import InputModal from "./InputModal";

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

	const [openMenu, setOpenMenu] = useState(null);
	const [selectedUser, setSelectedUser] = useState(null);
	const [userDetailTab, setUserDetailTab] = useState("info");
	const [userOrders, setUserOrders] = useState([]);
	const [userOrdersLoading, setUserOrdersLoading] = useState(false);
	const [showLogDetail, setShowLogDetail] = useState(null);
	const [confirmConfig, setConfirmConfig] = useState(null);
	const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
	const menuRef = useRef(null);
	const searchRef = useRef(search);
	const usersFetchRef = useRef({ promise: null, lastKey: "", lastFetched: 0 });
	const logsFetchRef = useRef({ promise: null, lastKey: "", lastFetched: 0 });

	useEffect(() => {
		searchRef.current = search;
	}, [search]);

	const fetchUsers = useCallback(async (page, role, keyword) => {
		const key = `${page}|${role}|${keyword}`;
		const now = Date.now();
		const fetchState = usersFetchRef.current;
		if (fetchState.promise && fetchState.lastKey === key) return fetchState.promise;
		if (fetchState.lastKey === key && now - fetchState.lastFetched < 1000) return;

		setLoading(true);
		fetchState.lastKey = key;
		fetchState.promise = (async () => {
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
			toast.error("KhĂ´ng thá»ƒ táº£i danh sĂ¡ch ngÆ°á»i dĂ¹ng");
			setUsers([]);
			setPagination({ currentPage: 1, totalPages: 1, totalUsers: 0, limit: 10 });
		} finally {
			fetchState.lastFetched = Date.now();
			fetchState.promise = null;
			setLoading(false);
		}
		})();
		return fetchState.promise;
	}, []);

	const fetchAuditLogs = useCallback(async (page) => {
		const key = `${page}`;
		const now = Date.now();
		const fetchState = logsFetchRef.current;
		if (fetchState.promise && fetchState.lastKey === key) return fetchState.promise;
		if (fetchState.lastKey === key && now - fetchState.lastFetched < 1000) return;

		setLogsLoading(true);
		fetchState.lastKey = key;
		fetchState.promise = (async () => {
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
			fetchState.lastFetched = Date.now();
			fetchState.promise = null;
			setLogsLoading(false);
		}
		})();
		return fetchState.promise;
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

	const handleDeleteUser = (userId, userName) => {
		setConfirmConfig({
			title: `XĂ³a tĂ i khoáº£n "${userName}"`,
			message: "Thao tĂ¡c nĂ y sáº½ xĂ³a vÄ©nh viá»…n tĂ i khoáº£n vĂ  khĂ´ng thá»ƒ hoĂ n tĂ¡c.",
			variant: "danger",
			confirmLabel: "XĂ³a tĂ i khoáº£n",
			onConfirm: async () => {
				await axios.delete(`/auth/users/${userId}`);
				fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
				setOpenMenu(null);
				toast.success(`ÄĂ£ xĂ³a tĂ i khoáº£n ${userName}`);
			},
		});
	};

	const handleConfirmLoyalty = async (value) => {
		if (value === null || value === "") return;
		if (isNaN(Number(value))) { toast.error('Vui lĂ²ng nháº­p sá»‘ há»£p lá»‡'); return; }
		try {
			const res = await axios.patch('/auth/users/' + selectedUser._id + '/loyalty', { delta: Number(value) });
			toast.success(res.data.message);
			setSelectedUser(prev => ({ ...prev, rewardPoints: res.data.rewardPoints }));
		} catch (e) {
			toast.error(e.response?.data?.message || 'Lá»—i');
		}
		setShowLoyaltyModal(false);
	};

	// D3: Fetch user's order history
	const fetchUserOrders = async (userId) => {
		setUserOrdersLoading(true);
		try {
			const res = await axios.get(`/orders?userId=${userId}&limit=10`);
			setUserOrders(res.data?.orders || []);
		} catch {
			setUserOrders([]);
		} finally {
			setUserOrdersLoading(false);
		}
	};

	const openUserDetail = (user) => {
		setSelectedUser(user);
		setUserDetailTab("info");
		setUserOrders([]);
	};

	const handleUpdateRole = async (userId, newRole, userName) => {
		try {
			await axios.patch(`/auth/users/${userId}/role`, { role: newRole });
			fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
			setOpenMenu(null);
			toast.success(`ÄĂ£ Ä‘á»•i vai trĂ² ${userName} thĂ nh ${newRole}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Lá»—i khi Ä‘á»•i vai trĂ²");
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
		<>
		<ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />
		<InputModal
			config={showLoyaltyModal && selectedUser ? {
				title: `Äiá»u chá»‰nh Ä‘iá»ƒm cho ${selectedUser.name}`,
				message: "Nháº­p sá»‘ Ä‘iá»ƒm tÄƒng/giáº£m (vĂ­ dá»¥ -10 Ä‘á»ƒ trá»« 10 Ä‘iá»ƒm)",
				label: "Sá»‘ Ä‘iá»ƒm (Ă¢m Ä‘á»ƒ trá»«)",
				confirmLabel: "Ăp dá»¥ng",
				onConfirm: handleConfirmLoyalty,
			} : null}
			onClose={() => setShowLoyaltyModal(false)}
		/>
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-gray-900 dark:text-white tracking-tight'>Quáº£n LĂ½ NgÆ°á»i DĂ¹ng</h1>
					<p className='text-gray-500 dark:text-luxury-text-muted text-sm'>
						Tá»•ng cá»™ng {pagination.totalUsers || 0} tĂ i khoáº£n | {users.filter(u => u.role === "admin").length} Quáº£n trá»‹ viĂªn
					</p>
				</div>
				<div className='flex items-center gap-3'>
					<div className='relative'>
						<input
							type='text'
							placeholder='TĂ¬m theo tĂªn, email, SÄT...'
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
						<option value="">Táº¥t cáº£ vai trĂ²</option>
						<option value="customer">KhĂ¡ch hĂ ng</option>
						<option value="admin">Quáº£n trá»‹ viĂªn</option>
						<option value="staff">NhĂ¢n viĂªn</option>
					</select>
				</div>
			</div>

			{/* Stats Grid */}
			<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
				{[
					{ label: "Tá»•ng ngÆ°á»i dĂ¹ng", value: (pagination.totalUsers || 0).toLocaleString(), icon: Users },
					{ label: "NhĂ³m VIP", value: users.filter(u => u.segment === "VIP").length.toString(), icon: Zap, color: "text-luxury-gold" },
					{ label: "PhĂ¢n nhĂ³m Tiá»m nÄƒng", value: users.filter(u => u.segment === "Potential").length.toString(), icon: Zap, color: "text-blue-400" },
					{ label: "ÄĂ£ báº­t 2FA", value: users.filter(u => u.twoFactorEnabled).length.toString(), icon: ShieldCheck, color: "text-emerald-400" },
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
								<Users className='w-4 h-4 text-luxury-gold' /> Danh sĂ¡ch ngÆ°á»i dĂ¹ng
							</h2>
							<span className='text-[10px] text-gray-500 dark:text-luxury-text-muted'>TRANG {pagination.currentPage} / {pagination.totalPages}</span>
						</div>
						<div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
						<table className='w-full'>
							<thead className="sticky top-0 z-10 bg-gray-50 dark:bg-luxury-dark border-b border-gray-100 dark:border-luxury-border/50">
								<tr className='text-left'>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>NgÆ°á»i dĂ¹ng</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>NhĂ³m</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>Chi tiĂªu</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>ÄÆ¡n hĂ ng</th>
									<th className='px-6 py-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest text-right'>HĂ nh Ä‘á»™ng</th>
								</tr>
							</thead>
							<tbody className='divide-y divide-gray-100 dark:divide-luxury-border/30'>
								{loading ? (
									Array.from({length:5}).map((_,i) => (
										<tr key={i} className="animate-pulse">
											<td className="px-6 py-4" colSpan="5">
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
										<td colSpan="5">
											<div className="flex flex-col items-center py-12 gap-2">
												<Users className="w-10 h-10 text-gray-200 dark:text-gray-700"/>
												<p className="text-sm text-gray-400">KhĂ´ng tĂ¬m tháº¥y ngÆ°á»i dĂ¹ng nĂ o</p>
											</div>
										</td>
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
												{user.segment === "VIP" ? "KHĂCH VIP" : 
												 user.segment === "Potential" ? "TIá»€M NÄ‚NG" : "KHĂCH Má»I"}
											</span>
										</td>
										<td className='px-6 py-4 text-xs font-bold text-gray-900 dark:text-white'>
											{(user.totalSpend || 0).toLocaleString("vi-VN")} â‚«
										</td>
										<td className='px-6 py-4 text-xs text-gray-500 dark:text-luxury-text-muted'>
											{user.orderCount || 0} Ä‘Æ¡n thĂ nh cĂ´ng
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
															<Eye className='w-4 h-4 text-luxury-gold' /> Xem chi tiáº¿t
														</button>
														
														{currentUser?.role === "admin" && (
															<>
																<div className='px-4 py-2 text-[9px] font-bold text-gray-400 uppercase border-t border-gray-100 dark:border-luxury-border/50'>Äá»•i vai trĂ²</div>
																
																{user.role !== "customer" && (
																	<button
																		onClick={() => handleUpdateRole(user._id, "customer", user.name)}
																		className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
																	>
																		<Zap className='w-4 h-4 text-gray-400' /> ThĂ nh KhĂ¡ch hĂ ng
																	</button>
																)}
																{user.role !== "staff" && (
																	<button
																		onClick={() => handleUpdateRole(user._id, "staff", user.name)}
																		className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
																	>
																		<Shield className='w-4 h-4 text-blue-400' /> ThĂ nh NhĂ¢n viĂªn
																	</button>
																)}
																{user.role !== "admin" && (
																	<button
																		onClick={() => handleUpdateRole(user._id, "admin", user.name)}
																		className='w-full px-4 py-3 flex items-center gap-3 text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors text-left'
																	>
																		<ShieldCheck className='w-4 h-4 text-luxury-gold' /> ThĂ nh Quáº£n trá»‹ viĂªn
																	</button>
																)}

																<div className='border-t border-gray-100 dark:border-luxury-border/50' />
																<button
																	onClick={() => handleDeleteUser(user._id, user.name)}
																	className='w-full px-4 py-3 flex items-center gap-3 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-400/10 transition-colors text-left'
																>
																	<Trash2 className='w-4 h-4' /> XĂ³a tĂ i khoáº£n
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
									TrÆ°á»›c
								</button>
								<button
									disabled={pagination.currentPage === pagination.totalPages}
									onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
									className='px-4 py-2 rounded-xl border border-gray-100 dark:border-luxury-border text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:bg-luxury-gold/10 transition-colors'
								>
									Tiáº¿p
								</button>
							</div>
						</div>
					</div>
				</div>

				{/* Security & Audit Logs */}
				<div className='space-y-6'>
					<h2 className='text-xl font-bold text-gray-800 dark:text-white'>Nháº­t kĂ½ há»‡ thá»‘ng</h2>
					<div className='space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
						{logsLoading ? (
							<div className="flex flex-col items-center justify-center py-20">
								<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-luxury-gold"></div>
								<p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">Äang táº£i nháº­t kĂ½...</p>
							</div>
						) : auditLogs.length === 0 ? (
							<p className="text-center text-[10px] text-gray-400 py-10 uppercase tracking-widest">ChÆ°a cĂ³ nháº­t kĂ½</p>
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
									<p className='text-[10px] text-gray-500 dark:text-luxury-text-muted truncate'>{log.userId?.name || "KhĂ¡ch áº©n danh"}</p>
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
								Trang trÆ°á»›c
							</button>
							<button 
								disabled={logsPagination.currentPage === logsPagination.totalPages}
								onClick={() => setLogsPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
								className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:underline"
							>
								Tiáº¿p theo
							</button>
						</div>
					)}

					<div className='bg-luxury-gold/5 border border-luxury-gold/10 dark:border-luxury-gold/20 rounded-2xl p-6 space-y-4 shadow-sm dark:shadow-none'>
						<h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest'>Báº£o máº­t há»‡ thá»‘ng</h3>
						<p className='text-xs text-gray-600 dark:text-luxury-text-muted leading-relaxed'>
							Há»‡ thá»‘ng Ä‘ang hoáº¡t Ä‘á»™ng <span className='text-emerald-600 dark:text-emerald-400 font-bold'>á»”N Äá»NH</span>. Má»i thay Ä‘á»•i quan trá»ng Ä‘á»u Ä‘Æ°á»£c ghi nháº­n trong Audit Log.
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
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-lg font-bold text-gray-900 dark:text-white">Chi tiáº¿t ngÆ°á»i dĂ¹ng</h2>
							<button onClick={() => setSelectedUser(null)} className="text-gray-400 dark:text-luxury-text-muted hover:text-white transition-colors">
								<X className="w-5 h-5" />
							</button>
						</div>

						{/* D3: Tab Switcher trong User Detail */}
						<div className="flex gap-1 mb-4 bg-gray-100 dark:bg-luxury-border/30 p-1 rounded-xl">
							{[{ id: "info", label: "ThĂ´ng tin" }, { id: "orders", label: "Lá»‹ch sá»­ Ä‘Æ¡n hĂ ng" }].map(tab => (
								<button key={tab.id} onClick={() => { setUserDetailTab(tab.id); if (tab.id === "orders") fetchUserOrders(selectedUser._id); }}
									className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${userDetailTab === tab.id ? "bg-white dark:bg-luxury-darker text-luxury-gold shadow" : "text-gray-500 hover:text-gray-700 dark:hover:text-white"}`}>
									{tab.label}
								</button>
							))}
						</div>
						<div className="space-y-4">

							{/* D3: Info Tab */}
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
									<div><p className="text-gray-500 dark:text-luxury-text-muted text-[10px] uppercase font-bold mb-1 tracking-widest">Tá»•ng chi tiĂªu</p><p className="text-luxury-gold text-lg font-bold font-sans">{(selectedUser.totalSpend || 0).toLocaleString()} â‚«</p></div>
									<div><p className="text-gray-500 dark:text-luxury-text-muted text-[10px] uppercase font-bold mb-1 tracking-widest">ÄÆ¡n thĂ nh cĂ´ng</p><p className="text-gray-900 dark:text-white text-lg font-bold font-sans">{selectedUser.orderCount || 0}</p></div>
								</div>
								<div className="space-y-2 pt-4 border-t border-gray-100 dark:border-luxury-border">
									<div className="flex justify-between text-xs"><span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">NgĂ y tham gia:</span><span className="text-gray-900 dark:text-white">{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</span></div>
									<div className="flex justify-between text-xs"><span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">Báº£o máº­t 2FA:</span><span className={selectedUser.twoFactorEnabled ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>{selectedUser.twoFactorEnabled ? "Äang báº­t" : "ChÆ°a kĂ­ch hoáº¡t"}</span></div>
									<div className="flex justify-between text-xs"><span className="text-gray-500 font-bold uppercase tracking-tighter text-[10px]">MĂ£ Ä‘á»‹nh danh:</span><span className="text-gray-400 font-mono text-[9px]">{selectedUser._id}</span></div>
								</div>

								{/* D1: Loyalty Points */}
								<div className="pt-4 border-t border-gray-100 dark:border-luxury-border">
									<p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-widest">Äiá»ƒm TĂ­ch LÅ©y</p>{/* FIX C2 */}
									<div className="flex items-center gap-3">
										<span className="text-2xl font-bold text-luxury-gold">{selectedUser.rewardPoints || 0}</span>
										<span className="text-xs text-gray-400">/ {selectedUser.totalPointsEarned || 0} tá»•ng Ä‘Ă£ tĂ­ch</span>{/* FIX C2 */}
										<button onClick={() => setShowLoyaltyModal(true)} className="ml-auto px-3 py-1 text-xs font-bold bg-amber-400/10 border border-amber-400/20 text-amber-400 rounded-lg hover:bg-amber-400/20 transition">+/- Äiá»ƒm</button>
									</div>
								</div>
								{/* D2: Admin Notes & Tags */}
								<div className="pt-4 border-t border-gray-100 dark:border-luxury-border space-y-2">
									<p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Tags Ná»™i Bá»™</p>{/* FIX C3 */}
									<div className="flex flex-wrap gap-1">
										{["VIP", "Wholesale", "Problematic", "New", "Loyal"].map(tag => {
											const isActive = (selectedUser.tags || []).includes(tag);
											return (
												<button key={tag} onClick={() => {
													const curr = selectedUser.tags || [];
													const next = isActive ? curr.filter(t => t !== tag) : [...curr, tag];
													axios.patch('/auth/users/' + selectedUser._id + '/admin-notes', { tags: next })
														.then(r => { setSelectedUser(r.data.user); toast.success('Da cap nhat tags'); })
														.catch(() => toast.error('Loi'));
												}} className={"text-[10px] font-bold px-2 py-0.5 rounded border transition " + (isActive ? "text-luxury-gold border-luxury-gold/50 bg-luxury-gold/10" : "text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300")}>{tag}</button>
											);
										})}
									</div>
									<textarea rows={2} placeholder="Ghi chĂº ná»™i bá»™..." defaultValue={selectedUser.adminNotes || ''} onBlur={(e) => axios.patch('/auth/users/' + selectedUser._id + '/admin-notes', { adminNotes: e.target.value }).catch(() => {})} className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none resize-none" />{/* FIX C3 */}
								</div>

								{currentUser?.role === "admin" && (
									<div className="flex gap-3 pt-4">
										<button onClick={() => { handleDeleteUser(selectedUser._id, selectedUser.name); setSelectedUser(null); }}
											className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 text-red-500 rounded-xl text-[10px] font-bold hover:bg-red-500/20 transition uppercase tracking-widest">XĂ³a tĂ i khoáº£n</button>
									</div>
								)}
								</>
							)}

							{/* D3: Orders Tab */}
							{userDetailTab === "orders" && (
								<div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
									{userOrdersLoading ? (
										<div className="flex justify-center py-8"><div className="animate-spin w-6 h-6 border-b-2 border-luxury-gold rounded-full" /></div>
									) : userOrders.length === 0 ? (
										<p className="text-center text-sm text-gray-400 py-8">ChÆ°a cĂ³ Ä‘Æ¡n hĂ ng nĂ o</p>
									) : userOrders.map(order => (
										<div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-luxury-darker rounded-lg border border-gray-100 dark:border-luxury-border">
											<div>
												<p className="text-xs font-bold text-gray-900 dark:text-white">#{order.orderCode || order._id?.slice(0,8).toUpperCase()}</p>
												<p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
											</div>
											<div className="text-right">
												<p className="text-xs font-bold text-luxury-gold">{order.totalAmount?.toLocaleString("vi-VN")} â‚«</p>
												<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${ order.status === "delivered" ? "text-emerald-400 bg-emerald-400/10" : order.status === "cancelled" ? "text-red-400 bg-red-400/10" : "text-amber-400 bg-amber-400/10" }`}>{order.status}</span>
											</div>
										</div>
									))}
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
								<p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">NgÆ°á»i thá»±c hiá»‡n</p>
								<div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-luxury-border">
									<div className="w-8 h-8 rounded-full bg-luxury-gold/20 flex items-center justify-center text-luxury-gold text-xs font-bold font-sans">
										{showLogDetail.userId?.name.substring(0, 2).toUpperCase() || "G"}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-bold text-white truncate">{showLogDetail.userId?.name || "KhĂ¡ch áº©n danh"}</p>
										<p className="text-[10px] text-gray-500 truncate">{showLogDetail.userId?.email || "KhĂ´ng cĂ³ email"}</p>
									</div>
									<span className="px-2 py-0.5 bg-luxury-gold/10 text-luxury-gold text-[9px] font-bold rounded border border-luxury-gold/30 uppercase tracking-tighter">
										{showLogDetail.userId?.role || "GUEST"}
									</span>
								</div>
							</div>

							{showLogDetail.changes && showLogDetail.changes.length > 0 && (
								<div>
									<p className="text-[10px] text-gray-500 uppercase font-bold mb-2 tracking-widest">Chi tiáº¿t thay Ä‘á»•i</p>
									<div className="space-y-2">
										{showLogDetail.changes.map((change, idx) => (
											<div key={idx} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-luxury-border text-xs">
												<p className="font-bold text-luxury-gold mb-2 uppercase tracking-tighter">TrÆ°á»ng: {change.field}</p>
												<div className="grid grid-cols-2 gap-4">
													<div className="space-y-1">
														<p className="text-[10px] text-gray-500 uppercase tracking-tighter">CÅ©</p>
														<div className="text-red-400 font-mono bg-red-400/5 p-2 rounded border border-red-400/20 break-all max-h-32 overflow-y-auto custom-scrollbar">
															{typeof change.old === 'object' ? JSON.stringify(change.old, null, 2) : String(change.old)}
														</div>
													</div>
													<div className="space-y-1">
														<p className="text-[10px] text-gray-500 uppercase tracking-tighter">Má»›i</p>
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
									<p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest text-[8px]">Äá»‹a chá»‰ IP</p>
									<p className="text-xs text-white font-mono bg-black/20 p-2 rounded">{showLogDetail.ip || "Unknown"}</p>
								</div>
								<div>
									<p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest text-[8px]">Model Ä‘Ă­ch</p>
									<p className="text-xs text-white uppercase bg-black/20 p-2 rounded truncate">{showLogDetail.targetModel || "N/A"}</p>
								</div>
							</div>

							<div>
								<p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest text-[8px]">TrĂ¬nh duyá»‡t / Thiáº¿t bá»‹</p>
								<p className="text-[9px] text-gray-400 leading-relaxed bg-black/20 p-2 rounded break-words italic">{showLogDetail.userAgent}</p>
							</div>
						</div>
					</motion.div>
				</div>
			)}
		</div>
		</>
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

