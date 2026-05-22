import { useState } from "react";
import { toast } from "react-hot-toast";
import { X, TrendingUp, MousePointerClick, Eye, Send, Calendar, Clock } from "lucide-react";

const MiniStat = ({ label, value }) => (
	<div className="text-center">
		<p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{label}</p>
		<p className="text-sm font-bold">{value}</p>
	</div>
);

const StatusBadge = ({ status }) => {
	const colors = {
		sent: "bg-emerald-500/10 text-emerald-400",
		scheduled: "bg-amber-500/10 text-amber-400",
		draft: "bg-gray-500/10 text-gray-500",
		sending: "bg-blue-500/10 text-blue-400",
		failed: "bg-red-500/10 text-red-500"
	};
	return (
		<span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${colors[status]}`}>
			{status}
		</span>
	);
};

const EmailCampaignsView = ({ campaigns }) => {
	const [statsModal, setStatsModal] = useState(null);

	const openRate = (c) => c.stats.sent > 0 ? ((c.stats.opened / c.stats.sent) * 100).toFixed(1) : 0;
	const clickRate = (c) => c.stats.sent > 0 ? ((c.stats.clicked / c.stats.sent) * 100).toFixed(1) : 0;

	return (
		<>
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{campaigns.map((c) => (
				<div key={c._id} className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl p-6 space-y-5 hover:border-luxury-gold/50 transition-all">
					<div className="flex justify-between items-start">
						<div className="space-y-1">
							<h4 className="font-bold text-lg">{c.title}</h4>
							<p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">SUB: {c.subject}</p>
						</div>
						<StatusBadge status={c.status} />
					</div>

					<div className="grid grid-cols-3 gap-2 py-4 border-y border-luxury-border">
						<MiniStat label="Gửi" value={c.stats.sent} />
						<MiniStat label="Mở" value={c.stats.opened} />
						<MiniStat label="Nhấp" value={c.stats.clicked} />
					</div>

					<div className="flex gap-3">
						<button
							onClick={() => setStatsModal(c)}
							className="flex-1 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold hover:bg-yellow-500 transition"
						>
							Thống kê
						</button>
						<button
							onClick={() => { navigator.clipboard?.writeText(c._id); toast.success("Đã sao chép ID chiến dịch"); }}
							className="flex-1 py-2 border border-luxury-border rounded-lg text-xs font-bold hover:bg-white/5 transition"
						>
							Sao chép
						</button>
					</div>
				</div>
			))}
		</div>

		{/* Stats Detail Modal */}
		{statsModal && (
			<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setStatsModal(null)}>
				<div className="bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto custom-scrollbar p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
					<div className="flex items-center justify-between mb-4">
						<h3 className="font-bold text-lg text-primary">{statsModal.title}</h3>
						<button onClick={() => setStatsModal(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
							<X className="w-4 h-4" />
						</button>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="p-3 rounded-xl bg-blue-500/10">
							<div className="flex items-center gap-2 mb-1"><Send className="w-3.5 h-3.5 text-blue-500" /><span className="text-[10px] text-gray-500">Đã gửi</span></div>
							<span className="text-lg font-bold">{statsModal.stats.sent}</span>
						</div>
						<div className="p-3 rounded-xl bg-emerald-500/10">
							<div className="flex items-center gap-2 mb-1"><Eye className="w-3.5 h-3.5 text-emerald-500" /><span className="text-[10px] text-gray-500">Tỉ lệ mở</span></div>
							<span className="text-lg font-bold">{openRate(statsModal)}%</span>
						</div>
						<div className="p-3 rounded-xl bg-amber-500/10">
							<div className="flex items-center gap-2 mb-1"><MousePointerClick className="w-3.5 h-3.5 text-amber-500" /><span className="text-[10px] text-gray-500">Tỉ lệ nhấp</span></div>
							<span className="text-lg font-bold">{clickRate(statsModal)}%</span>
						</div>
						<div className="p-3 rounded-xl bg-purple-500/10">
							<div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-purple-500" /><span className="text-[10px] text-gray-500">Tương tác</span></div>
							<span className="text-lg font-bold">{statsModal.stats.opened + statsModal.stats.clicked}</span>
						</div>
					</div>
					<div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 space-y-2">
						<div className="flex items-center gap-2 text-xs text-gray-500"><Calendar className="w-3 h-3" />Tạo: {new Date(statsModal.createdAt || Date.now()).toLocaleDateString("vi-VN")}</div>
						<div className="flex items-center gap-2 text-xs text-gray-500"><Clock className="w-3 h-3" />ID: {statsModal._id?.slice(-8)}</div>
					</div>
				</div>
			</div>
		)}
		</>
	);
};

export default EmailCampaignsView;
