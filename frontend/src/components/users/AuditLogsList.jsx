import { Key, ShieldAlert, UserCog, Clock } from "lucide-react";

const AuditLogsList = ({
	auditLogs,
	logsLoading,
	logsPagination,
	onSetLogsPagination,
	onShowLogDetail
}) => {
	return (
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
						onClick={() => onShowLogDetail(log)}
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
						onClick={() => onSetLogsPagination(p => ({ ...p, currentPage: p.currentPage - 1 }))}
						className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:underline"
					>
						Trang trước
					</button>
					<button 
						disabled={logsPagination.currentPage === logsPagination.totalPages}
						onClick={() => onSetLogsPagination(p => ({ ...p, currentPage: p.currentPage + 1 }))}
						className="text-[10px] font-bold text-luxury-gold uppercase tracking-widest disabled:opacity-30 hover:underline"
					>
						Tiếp theo
					</button>
				</div>
			)}

			{/* Security summary removed per admin UX preference */}
		</div>
	);
};

export default AuditLogsList;
