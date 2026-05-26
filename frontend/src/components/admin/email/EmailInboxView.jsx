import { Eye } from "lucide-react";

const EmailInboxView = ({ messages, onMarkRead }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border rounded-3xl overflow-hidden">
		<table className="w-full text-left">
			<thead className="bg-gray-50 dark:bg-white/5 border-b border-luxury-border">
				<tr>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Khách hàng</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Chủ đề</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Ngày</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400">Trạng thái</th>
					<th className="px-6 py-4 text-xs font-bold uppercase text-gray-400 text-right">Hành động</th>
				</tr>
			</thead>
			<tbody className="divide-y divide-luxury-border">
				{messages.length > 0 ? messages.map((m) => (
					<tr key={m._id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
						<td className="px-6 py-4">
							<div className="font-bold">{m.name}</div>
							<div className="text-xs text-luxury-text-muted">{m.email}</div>
						</td>
						<td className="px-6 py-4 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap text-sm">
							{m.subject || "No Subject"}
						</td>
						<td className="px-6 py-4 text-xs text-gray-500">
							{new Date(m.createdAt).toLocaleDateString()}
						</td>
						<td className="px-6 py-4">
							<span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
								m.status === "new" ? "bg-red-500/10 text-red-400" :
								m.status === "read" ? "bg-blue-500/10 text-blue-400" :
								"bg-emerald-500/10 text-emerald-400"
							}`}>
								{m.status}
							</span>
						</td>
						<td className="px-6 py-4 text-right">
							<button
								onClick={() => onMarkRead?.(m._id)}
								className="p-2 hover:bg-luxury-gold/20 rounded-lg text-luxury-gold transition"
								title={m.status === "read" ? "Đã đọc" : "Đánh dấu đã đọc"}
								disabled={m.status === "read"}
							>
								<Eye className="w-4 h-4" />
							</button>
						</td>
					</tr>
				)) : (
					<tr>
						<td colSpan="5" className="px-6 py-20 text-center text-gray-500 italic">Hộp thư trống</td>
					</tr>
				)}
			</tbody>
		</table>
	</div>
);

export default EmailInboxView;
