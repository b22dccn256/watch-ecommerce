import { Users, Zap, ShieldCheck } from "lucide-react";

const UsersStats = ({ users, totalUsers }) => {
	const stats = [
		{ label: "Tổng người dùng", value: (totalUsers || 0).toLocaleString(), icon: Users },
		{ label: "Nhóm VIP", value: users.filter(u => u.segment === "VIP").length.toString(), icon: Zap, color: "text-luxury-gold" },
		{ label: "Phân nhóm Tiềm năng", value: users.filter(u => u.segment === "Potential").length.toString(), icon: Zap, color: "text-blue-400" },
		{ label: "Đã bật 2FA", value: users.filter(u => u.twoFactorEnabled).length.toString(), icon: ShieldCheck, color: "text-emerald-400" },
	];

	return (
		<div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
			{stats.map((stat, idx) => (
				<div key={idx} className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-5 rounded-2xl shadow-xl dark:shadow-none'>
					<p className='text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest mb-2'>{stat.label}</p>
					<div className="flex items-center justify-between">
						<h3 className='text-2xl font-bold text-gray-900 dark:text-white'>{stat.value}</h3>
						<stat.icon className={`w-5 h-5 ${stat.color || "text-gray-400"}`} />
					</div>
				</div>
			))}
		</div>
	);
};

export default UsersStats;
