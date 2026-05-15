import { motion } from "framer-motion";
import { ShieldAlert, X } from "lucide-react";

const LogDetailModal = ({ showLogDetail, onClose }) => {
	return (
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
					<button onClick={onClose} className="text-gray-400 dark:text-luxury-text-muted hover:text-white transition-colors">
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
	);
};

export default LogDetailModal;
