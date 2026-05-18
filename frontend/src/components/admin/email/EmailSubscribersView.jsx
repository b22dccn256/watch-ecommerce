import { Trash2, Users } from "lucide-react";

const EmailSubscribersView = ({ subscribers, onDelete }) => (
	<div className="space-y-4">
		<div className="flex justify-between items-center text-sm font-bold text-gray-400 dark:text-luxury-text-muted px-2">
			<span>{subscribers.length} Emails đăng ký</span>
			<button
				onClick={() => window.open("/api/mail/subscribers/export", "_blank")}
				className="text-luxury-gold hover:underline"
			>
				Xuất file CSV
			</button>
		</div>
		<div className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl">
			<ul className="divide-y divide-luxury-border">
				{subscribers.length === 0 && (
					<li className="px-6 py-12 text-center text-gray-400 text-sm">Chưa có ai đăng ký newsletter</li>
				)}
				{subscribers.map((s) => (
					<li key={s._id} className="px-6 py-4 flex items-center justify-between hover:bg-white/5">
						<div className="flex items-center gap-4">
							<div className="w-10 h-10 rounded-full bg-luxury-gold/10 flex items-center justify-center text-luxury-gold">
								<Users className="w-5 h-5" />
							</div>
							<div>
								<div className="font-bold">{s.email}</div>
								<div className="text-[10px] uppercase tracking-widest text-gray-500">Nguồn: {s.source}</div>
							</div>
						</div>
						<div className="flex items-center gap-6">
							<div className="text-xs text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</div>
							<button
								onClick={() => onDelete(s._id, s.email)}
								className="text-red-400 hover:text-red-500 p-2 transition-colors"
								title="Xóa subscriber"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	</div>
);

export default EmailSubscribersView;
