import { toast } from "react-hot-toast";

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

const EmailCampaignsView = ({ campaigns }) => (
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
						onClick={() => toast("Thống kê chi tiết đang phát triển", { icon: "📊" })}
						className="flex-1 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold hover:bg-white transition"
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
);

export default EmailCampaignsView;
