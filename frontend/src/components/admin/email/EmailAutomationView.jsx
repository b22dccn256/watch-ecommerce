import { Power, ChevronRight, Clock } from "lucide-react";

const AutomationCard = ({ title, desc, active, onToggle }) => (
	<div className="bg-white dark:bg-luxury-dark border border-luxury-border p-8 rounded-3xl flex items-start gap-6 group hover:border-luxury-gold transition-all">
		<button
			onClick={onToggle}
			title={active ? "Tắt automation" : "Bật automation"}
			className={`p-4 rounded-2xl transition-colors cursor-pointer ${
				active
					? "bg-luxury-gold/10 text-luxury-gold hover:bg-luxury-gold/20"
					: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"
			}`}
		>
			<Power className="w-6 h-6" />
		</button>
		<div className="flex-1 space-y-2">
			<div className="flex items-center justify-between">
				<h4 className="font-bold text-lg">{title}</h4>
				<span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
					active
						? "text-emerald-500 bg-emerald-500/10"
						: "text-red-500 bg-red-500/10"
				}`}>
					{active ? "Active" : "Disabled"}
				</span>
			</div>
			<p className="text-sm text-luxury-text-muted leading-relaxed">{desc}</p>
			<div className="pt-4 flex gap-4">
				<button className="text-xs font-bold text-luxury-gold flex items-center gap-1 group-hover:gap-2 transition-all">
					Cấu hình <ChevronRight className="w-3 h-3" />
				</button>
			</div>
		</div>
	</div>
);

const EmailAutomationView = ({ automations, onToggle }) => (
	<div className="space-y-6">
		<div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 text-amber-400">
			<Clock className="w-5 h-5 shrink-0" />
			<p className="text-sm">Các tiến trình tự động được xử lý bởi BullMQ Worker & Redis mỗi 1 giờ.</p>
		</div>
		<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
			{automations.map(automation => (
				<AutomationCard
					key={automation.id}
					title={automation.title}
					desc={automation.desc}
					active={automation.active}
					onToggle={() => onToggle(automation.id)}
				/>
			))}
		</div>
	</div>
);

export default EmailAutomationView;
