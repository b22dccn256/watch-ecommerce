import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "../../stores/useUserStore";

// Imported modals
import ConfirmModal from "../ConfirmModal";
import InputModal from "../InputModal";

// Extracted components
import UsersStats from "../users/UsersStats";
import UsersToolbar from "../users/UsersToolbar";
import UsersTable from "../users/UsersTable";
import AuditLogsList from "../users/AuditLogsList";
import UserDetailModal from "../users/UserDetailModal";
import LogDetailModal from "../users/LogDetailModal";

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
			toast.error("Không thể tải danh sách người dùng");
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
			title: `Xóa tài khoản "${userName}"`,
			message: "Thao tác này sẽ xóa vĩnh viễn tài khoản và không thể hoàn tác.",
			variant: "danger",
			confirmLabel: "Xóa tài khoản",
			onConfirm: async () => {
				await axios.delete(`/auth/users/${userId}`);
				fetchUsers(pagination.currentPage, roleFilter, searchRef.current);
				setOpenMenu(null);
				toast.success(`Đã xóa tài khoản ${userName}`);
			},
		});
	};

	const handleConfirmLoyalty = async (value) => {
		if (value === null || value === "") return;
		if (isNaN(Number(value))) { toast.error('Vui lòng nhập số hợp lệ'); return; }
		try {
			const res = await axios.patch('/auth/users/' + selectedUser._id + '/loyalty', { delta: Number(value) });
			toast.success(res.data.message);
			setSelectedUser(prev => ({ ...prev, rewardPoints: res.data.rewardPoints }));
		} catch (e) {
			toast.error(e.response?.data?.message || 'Lỗi');
		}
		setShowLoyaltyModal(false);
	};

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
			toast.success(`Đã đổi vai trò ${userName} thành ${newRole}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi khi đổi vai trò");
		}
	};

	const handleUpdateTags = async (userId, tags) => {
		try {
			const res = await axios.patch(`/auth/users/${userId}/admin-notes`, { tags });
			setSelectedUser(res.data.user);
			toast.success('Đã cập nhật tags');
		} catch (error) {
			toast.error('Lỗi khi cập nhật tags');
		}
	};

	const handleUpdateNotes = async (userId, adminNotes) => {
		try {
			await axios.patch(`/auth/users/${userId}/admin-notes`, { adminNotes });
		} catch (error) {
			console.error('Lỗi khi cập nhật ghi chú');
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
				title: `Điều chỉnh điểm cho ${selectedUser.name}`,
				message: "Nhập số điểm tăng/giảm (ví dụ -10 để trừ 10 điểm)",
				label: "Số điểm (âm để trừ)",
				confirmLabel: "Áp dụng",
				onConfirm: handleConfirmLoyalty,
			} : null}
			onClose={() => setShowLoyaltyModal(false)}
		/>
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
				<div className='space-y-2'>
					<h1 className='text-3xl font-bold text-gray-900 dark:text-white tracking-tight'>Quản Lý Người Dùng</h1>
					<p className='text-gray-500 dark:text-luxury-text-muted text-sm'>
						Tổng cộng {pagination.totalUsers || 0} tài khoản | {users.filter(u => u.role === "admin").length} Quản trị viên
					</p>
				</div>
				<UsersToolbar
					search={search}
					onSearchChange={(e) => setSearch(e.target.value)}
					roleFilter={roleFilter}
					onRoleFilterChange={(e) => setRoleFilter(e.target.value)}
				/>
			</div>

			{/* Stats Grid */}
			<UsersStats users={users} totalUsers={pagination.totalUsers} />

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
						
						<UsersTable
							users={users}
							loading={loading}
							currentUser={currentUser}
							openMenu={openMenu}
							onSetOpenMenu={setOpenMenu}
							onSelectUser={openUserDetail}
							onDeleteUser={handleDeleteUser}
							onUpdateRole={handleUpdateRole}
							getSegmentBadge={getSegmentBadge}
							menuRef={menuRef}
						/>
						
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
				<AuditLogsList
					auditLogs={auditLogs}
					logsLoading={logsLoading}
					logsPagination={logsPagination}
					onSetLogsPagination={setLogsPagination}
					onShowLogDetail={setShowLogDetail}
				/>
			</div>

			{/* User Detail Modal */}
			{selectedUser && (
				<UserDetailModal
					selectedUser={selectedUser}
					onClose={() => setSelectedUser(null)}
					userDetailTab={userDetailTab}
					onSetUserDetailTab={setUserDetailTab}
					userOrders={userOrders}
					userOrdersLoading={userOrdersLoading}
					onFetchUserOrders={fetchUserOrders}
					onShowLoyaltyModal={() => setShowLoyaltyModal(true)}
					getSegmentBadge={getSegmentBadge}
					currentUser={currentUser}
					onDeleteUser={(id, name) => { handleDeleteUser(id, name); setSelectedUser(null); }}
					onUpdateTags={handleUpdateTags}
					onUpdateNotes={handleUpdateNotes}
				/>
			)}

			{/* Log Detail Modal */}
			{showLogDetail && (
				<LogDetailModal
					showLogDetail={showLogDetail}
					onClose={() => setShowLogDetail(null)}
				/>
			)}
		</div>
		</>
	);
};

export default UsersTab;
