import { Users, ShieldCheck, Award, TrendingUp } from "lucide-react";

const UsersStats = ({ users, totalUsers }) => {
	const stats = [
		{ label: "TỔNG NGƯỜI DÙNG", value: (totalUsers || 0).toLocaleString(), icon: Users, color: "text-[#b68a3c]", bgColor: "bg-[#b68a3c]/10" },
		{ label: "NHÓM VIP", value: users.filter(u => u.segment === "VIP").length.toLocaleString(), icon: Award, color: "text-amber-600", bgColor: "bg-amber-600/10" },
		{ label: "TIỀM NĂNG", value: users.filter(u => u.segment === "Potential").length.toLocaleString(), icon: TrendingUp, color: "text-blue-500", bgColor: "bg-blue-500/10" },
		{ label: "ĐÃ BẬT 2FA", value: (totalUsers ? ((users.filter(u => u.twoFactorEnabled).length / totalUsers) * 100).toFixed(1) : 0) + "%", icon: ShieldCheck, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
	];

	return (
		<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
			{stats.map((stat, idx) => (
				<div key={idx} className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-6 rounded-2xl shadow-sm dark:shadow-none flex items-center gap-4 hover:shadow-md transition-shadow'>
					<div className={`p-4 rounded-2xl ${stat.bgColor}`}>
						<stat.icon className={`w-8 h-8 ${stat.color}`} />
					</div>
					<div className="space-y-1">
						<p className='text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>{stat.label}</p>
						<h3 className='text-2xl font-bold text-gray-900 dark:text-white'>{stat.value}</h3>
					</div>
				</div>
			))}
		</div>
	);
};

export default UsersStats;
