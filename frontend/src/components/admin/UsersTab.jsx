import { useEffect, useRef, useState } from 'react';
import { Users, Trash2, Download, UserPlus } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';

// Custom hooks
import useUsersData from '../../hooks/useUsersData';
import useAuditLogs from '../../hooks/useAuditLogs';
import useUsersModal from '../../hooks/useUsersModal';

// Imported modals
import ConfirmModal from '../ConfirmModal';
import InputModal from '../InputModal';

// Extracted components
import UsersStats from '../users/UsersStats';
import UsersToolbar from '../users/UsersToolbar';
import UsersTable from '../users/UsersTable';
import AuditLogsList from '../users/AuditLogsList';
import UserDetailModal from '../users/UserDetailModal';
import LogDetailModal from '../users/LogDetailModal';

const UsersTab = () => {
	const { user: currentUser } = useUserStore();

	// ============ NEW: Use custom hooks for cleaner state management ============
	const {
		users,
		loading,
		pagination,
		search,
		roleFilter,
		setSearch,
		setRoleFilter,
		setPagination,
		fetchUsers,
		handleDeleteUser,
		handleUpdateRole,
		handleBulkDeleteUsers,
	} = useUsersData();

	const [selectedUserIds, setSelectedUserIds] = useState([]);

	const { auditLogs, logsLoading, logsPagination, setLogsPagination, fetchAuditLogs } = useAuditLogs();

	const {
		selectedUser,
		userDetailTab,
		setUserDetailTab,
		userOrders,
		userOrdersLoading,
		showLogDetail,
		setShowLogDetail,
		confirmConfig,
		setConfirmConfig,
		showLoyaltyModal,
		setShowLoyaltyModal,
		openMenu,
		setOpenMenu,
		openUserDetail,
		closeUserDetail,
		fetchUserOrders,
		handleUpdateTags,
		handleUpdateNotes,
		handleConfirmLoyalty,
		closeMenu,
	} = useUsersModal();

	// Menu ref for click-outside handling
	const menuRef = useRef(null);

	// ============ Effects ============

	// Fetch users when page, role filter, or search changes
	useEffect(() => {
		fetchUsers(pagination.currentPage, roleFilter, search);
		setSelectedUserIds([]);
	}, [pagination.currentPage, roleFilter, search, fetchUsers]);

	// Fetch audit logs when page changes
	useEffect(() => {
		fetchAuditLogs(logsPagination.currentPage);
	}, [logsPagination.currentPage, fetchAuditLogs]);

	// Handle click outside menu to close it
	useEffect(() => {
		const handleClickOutside = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				closeMenu();
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [closeMenu]);

	// ============ Event Handlers ============

	/**
	 * Handle delete user with confirmation modal
	 */
	const handleDeleteUserClick = (userId, userName) => {
		setConfirmConfig({
			title: `Xóa tài khoản "${userName}"`,
			message: 'Thao tác này sẽ xóa vĩnh viễn tài khoản và không thể hoàn tác.',
			variant: 'danger',
			confirmLabel: 'Xóa tài khoản',
			onConfirm: async () => {
				const success = await handleDeleteUser(userId, userName);
				if (success) {
					closeMenu();
				}
			},
		});
	};

	/**
	 * Handle update loyalty modal
	 */
	const handleShowLoyaltyModal = () => {
		setShowLoyaltyModal(true);
	};

	/**
	 * Handle update role and close menu
	 */
	const handleUpdateRoleClick = async (userId, newRole, userName) => {
		const success = await handleUpdateRole(userId, newRole, userName);
		if (success) {
			closeMenu();
		}
	};

	const handleToggleSelectUser = (userId) => {
		setSelectedUserIds((prev) =>
			prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
		);
	};

	const handleToggleSelectAll = (activeUsers) => {
		const activeIds = activeUsers.map((u) => u._id);
		const allSelectedOnPage = activeIds.every((id) => selectedUserIds.includes(id));

		if (allSelectedOnPage) {
			setSelectedUserIds((prev) => prev.filter((id) => !activeIds.includes(id)));
		} else {
			setSelectedUserIds((prev) => {
				const newSelection = [...prev];
				activeIds.forEach((id) => {
					if (!newSelection.includes(id)) {
						newSelection.push(id);
					}
				});
				return newSelection;
			});
		}
	};

	/**
	 * Handle bulk delete users with confirmation
	 */
	const handleBulkDeleteClick = () => {
		if (selectedUserIds.length === 0) return;
		setConfirmConfig({
			title: `Xóa ${selectedUserIds.length} tài khoản`,
			message: `Bạn có chắc chắn muốn xóa vĩnh viễn ${selectedUserIds.length} tài khoản đã chọn? Thao tác này KHÔNG thể hoàn tác!`,
			variant: 'danger',
			confirmLabel: 'Xóa tất cả',
			onConfirm: async () => {
				const success = await handleBulkDeleteUsers(selectedUserIds);
				if (success) {
					setSelectedUserIds([]);
				}
			},
		});
	};

	/**
	 * Handle delete user from detail modal
	 */
	const handleDeleteFromDetail = (id, name) => {
		handleDeleteUserClick(id, name);
		closeUserDetail();
	};

	/**
	 * Get segment badge classes
	 */
	const getSegmentBadge = (segment) => {
		switch (segment) {
			case 'VIP':
				return 'text-luxury-gold border-luxury-gold/30 bg-luxury-gold/10';
			case 'Potential':
				return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
			case 'Regular':
				return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
			case 'At Risk':
				return 'text-red-400 border-red-400/30 bg-red-400/10';
			default:
				return 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-luxury-darker dark:border-luxury-border';
		}
	};

	// ============ RENDER ============
	return (
		<>
			{/* Delete confirmation modal */}
			<ConfirmModal config={confirmConfig} onClose={() => setConfirmConfig(null)} />

			{/* Loyalty adjustment modal */}
			<InputModal
				config={
					showLoyaltyModal && selectedUser
						? {
							title: `Điều chỉnh điểm cho ${selectedUser.name}`,
							message: 'Nhập số điểm tăng/giảm (ví dụ -10 để trừ 10 điểm)',
							label: 'Số điểm (âm để trừ)',
							confirmLabel: 'Áp dụng',
							onConfirm: handleConfirmLoyalty,
						}
						: null
				}
				onClose={() => setShowLoyaltyModal(false)}
			/>

			<div className="space-y-6">
				{/* Stats Grid */}
				<UsersStats users={users} totalUsers={pagination.totalUsers} />

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* User Directory */}
					<div className="lg:col-span-2 space-y-4">
						<UsersToolbar
							search={search}
							onSearchChange={(e) => setSearch(e.target.value)}
							roleFilter={roleFilter}
							onRoleFilterChange={(e) => setRoleFilter(e.target.value)}
						/>

						<div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
							{selectedUserIds.length > 0 && (
								<div className="px-6 py-4 border-b border-gray-100 dark:border-luxury-border/50 flex items-center justify-between bg-red-50/50">
									<h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
										<Users className="w-4 h-4 text-luxury-gold" /> Đã chọn {selectedUserIds.length} người dùng
									</h2>
									<button
										onClick={handleBulkDeleteClick}
										className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold transition duration-200 flex items-center gap-1.5"
									>
										<Trash2 className="w-3.5 h-3.5" /> Xóa {selectedUserIds.length} mục đã chọn
									</button>
								</div>
							)}

							<UsersTable
								users={users}
								loading={loading}
								currentUser={currentUser}
								openMenu={openMenu}
								onSetOpenMenu={setOpenMenu}
								onSelectUser={openUserDetail}
								onDeleteUser={handleDeleteUserClick}
								onUpdateRole={handleUpdateRoleClick}
								getSegmentBadge={getSegmentBadge}
								menuRef={menuRef}
								selectedUserIds={selectedUserIds}
								onToggleSelectUser={handleToggleSelectUser}
								onToggleSelectAll={handleToggleSelectAll}
							/>

							{/* Pagination Controls */}
							<div className="px-6 py-4 border-t border-gray-100 dark:border-luxury-border/50 flex items-center justify-between bg-gray-50/30 dark:bg-white/5">
								<span className="text-xs text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest text-[9px]">
									Trang {pagination.currentPage} / {pagination.totalPages}
								</span>
								<div className="flex gap-2">
									<button
										disabled={pagination.currentPage === 1}
										onClick={() =>
											setPagination((prev) => ({
												...prev,
												currentPage: prev.currentPage - 1,
											}))
										}
										className="px-4 py-2 rounded-xl border border-gray-100 dark:border-luxury-border text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:bg-luxury-gold/10 transition-colors"
									>
										Trước
									</button>
									<button
										disabled={pagination.currentPage === pagination.totalPages}
										onClick={() =>
											setPagination((prev) => ({
												...prev,
												currentPage: prev.currentPage + 1,
											}))
										}
										className="px-4 py-2 rounded-xl border border-gray-100 dark:border-luxury-border text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:bg-luxury-gold/10 transition-colors"
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
						onClose={closeUserDetail}
						userDetailTab={userDetailTab}
						onSetUserDetailTab={setUserDetailTab}
						userOrders={userOrders}
						userOrdersLoading={userOrdersLoading}
						onFetchUserOrders={fetchUserOrders}
						onShowLoyaltyModal={handleShowLoyaltyModal}
						getSegmentBadge={getSegmentBadge}
						currentUser={currentUser}
						onDeleteUser={handleDeleteFromDetail}
						onUpdateTags={handleUpdateTags}
						onUpdateNotes={handleUpdateNotes}
					/>
				)}

				{/* Log Detail Modal */}
				{showLogDetail && <LogDetailModal showLogDetail={showLogDetail} onClose={() => setShowLogDetail(null)} />}
			</div>
		</>
	);
};

export default UsersTab;
