import { Key, ShieldAlert, UserCog, Clock, History } from "lucide-react";

const AuditLogsList = ({
	auditLogs,
	logsLoading,
	logsPagination,
	onSetLogsPagination,
	onShowLogDetail
}) => {
	return (
		<div className='space-y-4'>
			<h2 className='h-[42px] text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2'>
				<History className="w-5 h-5 text-gray-400" /> Nhật ký hệ thống
			</h2>
			<div className='space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar'>
				{logsLoading ? (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-luxury-gold"></div>
						<p className="mt-4 text-[10px] text-gray-400 uppercase tracking-widest">Đang tải nhật ký...</p>
					</div>
				) : auditLogs.length === 0 ? (
					<p className="text-center text-[10px] text-gray-400 py-10 uppercase tracking-widest">Chưa có nhật ký</p>
				) : auditLogs.map(log => {
					const isDanger = log.action.includes("DELETE") || log.action.includes("DENIED") || log.action.includes("SUSPEND");
					const isSuccess = log.action.includes("CREATE") || log.action.includes("LOGIN") || log.action.includes("SUCCESS");
					
					return (
						<div 
							key={log._id} 
							onClick={() => onShowLogDetail(log)}
							className={`bg-white dark:bg-luxury-dark border-y border-r border-l-4 ${isDanger ? 'border-l-red-500' : isSuccess ? 'border-l-emerald-500' : 'border-l-blue-400'} border-y-gray-100 border-r-gray-100 dark:border-y-luxury-border dark:border-r-luxury-border p-4 rounded-r-xl rounded-l-sm shadow-sm dark:shadow-none cursor-pointer hover:shadow-md transition-all`}
						>
							<div className='flex flex-col gap-2.5'>
								<div className="flex items-center">
									<span className={`text-[9px] font-bold px-2 py-1 bg-gray-100 dark:bg-white/5 rounded uppercase tracking-wider ${isDanger ? 'text-red-500' : isSuccess ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
										{log.action}
									</span>
								</div>
								<p className='text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-relaxed'>
									{log.details || `Đã thực hiện ${log.action}`}
								</p>
								<div className="flex items-center gap-2 mt-1">
									<div className="w-5 h-5 rounded-full bg-[#b68a3c] flex items-center justify-center overflow-hidden">
										{log.userId?.avatar ? (
											<img src={log.userId.avatar} alt={log.userId.name} className="w-full h-full object-cover" />
										) : (
											<span className="text-[8px] font-bold text-white">{log.userId?.name?.substring(0,2).toUpperCase() || "AD"}</span>
										)}
									</div>
									<span className='text-sm font-medium text-gray-600 dark:text-luxury-text-muted'>{log.userId?.name || "Hệ thống"}</span>
								</div>
							</div>
						</div>
					);
				})}
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
