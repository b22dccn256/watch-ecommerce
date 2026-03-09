import { useState } from "react";
import { motion } from "framer-motion";
import { User, ShoppingBag, Lock, LogOut, ChevronRight, Eye } from "lucide-react";
import { useUserStore } from "../stores/useUserStore";

const ProfilePage = () => {
    const { user, logout } = useUserStore();
    const [activeTab, setActiveTab] = useState("info");

    const menuItems = [
        { id: "info", label: "Thông tin cá nhân", icon: User },
        { id: "orders", label: "Lịch sử đơn hàng", icon: ShoppingBag },
        { id: "password", label: "Đổi mật khẩu", icon: Lock },
    ];

    const orders = [
        { id: "#LW-99021", date: "12/10/2023", total: "450.000.000đ", status: "HOÀN THÀNH", statusColor: "text-emerald-400 bg-emerald-400/10" },
        { id: "#LW-98745", date: "05/11/2023", total: "1.250.000.000đ", status: "ĐANG GIAO", statusColor: "text-blue-400 bg-blue-400/10" },
        { id: "#LW-98210", date: "15/11/2023", total: "89.000.000đ", status: "ĐANG CHỜ", statusColor: "text-yellow-400 bg-yellow-400/10" },
        { id: "#LW-97112", date: "20/09/2023", total: "210.000.000đ", status: "ĐÃ HỦY", statusColor: "text-red-400 bg-red-400/10" },
    ];

    return (
        <div className='min-h-screen pt-28 pb-20 px-4'>
            <div className='max-w-6xl mx-auto'>
                <div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
                    {/* SIDEBAR */}
                    <div className='lg:col-span-1 space-y-6'>
                        <div className='bg-luxury-darker border border-luxury-border rounded-2xl p-6 flex flex-col items-center text-center'>
                            <div className='w-24 h-24 rounded-full bg-luxury-gold/10 border-2 border-luxury-gold flex items-center justify-center mb-4 overflow-hidden'>
                                {user?.avatar ? (
                                    <img src={user.avatar} alt={user.name} className='w-full h-full object-cover' />
                                ) : (
                                    <User className='w-12 h-12 text-luxury-gold' />
                                )}
                            </div>
                            <h2 className='text-xl font-bold text-white'>{user?.name || "Nguyễn Văn A"}</h2>
                            <p className='text-luxury-gold text-xs font-semibold tracking-wider uppercase mt-1'>
                                Thành viên Diamond
                            </p>
                        </div>

                        <nav className='bg-luxury-darker border border-luxury-border rounded-2xl overflow-hidden'>
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`w-full flex items-center justify-between px-6 py-4 text-sm font-medium transition-colors border-b border-luxury-border last:border-0 ${activeTab === item.id
                                            ? "bg-luxury-gold/10 text-luxury-gold"
                                            : "text-luxury-text-muted hover:bg-white/5 hover:text-white"
                                        }`}
                                >
                                    <div className='flex items-center gap-3'>
                                        <item.icon className='w-5 h-5' />
                                        {item.label}
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === item.id ? "rotate-90" : ""}`} />
                                </button>
                            ))}
                            <button
                                onClick={logout}
                                className='w-full flex items-center gap-3 px-6 py-4 text-sm font-medium text-red-400 hover:bg-red-400/5 transition-colors'
                            >
                                <LogOut className='w-5 h-5' />
                                Đăng xuất
                            </button>
                        </nav>

                        <div className='bg-luxury-gold rounded-2xl p-6 relative overflow-hidden group cursor-pointer'>
                            <div className='relative z-10'>
                                <p className='text-luxury-dark text-sm font-medium leading-relaxed mb-4'>
                                    Trải nghiệm đặc quyền tối thượng dành cho khách hàng VIP.
                                </p>
                                <button className='w-full bg-luxury-dark text-luxury-gold py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-black transition-colors'>
                                    Nâng cấp tài khoản
                                </button>
                            </div>
                            <div className='absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700' />
                        </div>
                    </div>

                    {/* CONTENT */}
                    <div className='lg:col-span-3 space-y-8'>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={activeTab}
                            className='bg-luxury-darker border border-luxury-border rounded-3xl p-8'
                        >
                            {activeTab === "info" && (
                                <div className='space-y-8'>
                                    <div className='flex items-center justify-between'>
                                        <h1 className='text-3xl font-bold text-white'>Hồ sơ cá nhân</h1>
                                    </div>
                                    <p className='text-luxury-text-muted'>Quản lý thông tin và theo dõi các đơn hàng đồng hồ cao cấp của bạn.</p>

                                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Họ và tên</label>
                                            <input
                                                type="text"
                                                defaultValue={user?.name || "Nguyễn Văn A"}
                                                className='w-full bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-white px-5 py-3 rounded-xl focus:outline-none transition'
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Ngày sinh</label>
                                            <input
                                                type="date"
                                                defaultValue="1990-01-01"
                                                className='w-full bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-white px-5 py-3 rounded-xl focus:outline-none transition'
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Số điện thoại</label>
                                            <div className='relative'>
                                                <input
                                                    type="text"
                                                    defaultValue="090 123 4567"
                                                    className='w-full bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-white px-5 py-3 rounded-xl focus:outline-none transition'
                                                />
                                                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md font-bold'>ĐÃ XÁC THỰC OTP</span>
                                            </div>
                                        </div>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Email</label>
                                            <div className='relative'>
                                                <input
                                                    type="email"
                                                    defaultValue={user?.email || "nguyen.vana@luxurywatch.vn"}
                                                    disabled
                                                    className='w-full bg-luxury-dark/50 border border-luxury-border text-luxury-text-muted px-5 py-3 rounded-xl focus:outline-none cursor-not-allowed'
                                                />
                                                <Lock className='absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-text-muted' />
                                            </div>
                                        </div>
                                    </div>

                                    <div className='flex justify-end pt-4'>
                                        <button className='bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark px-10 py-4 rounded-xl font-bold transition duration-300 shadow-lg shadow-luxury-gold/20'>
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "orders" && (
                                <div className='space-y-8'>
                                    <div className='flex items-center justify-between'>
                                        <h1 className='text-3xl font-bold text-white flex items-center gap-3'>
                                            <ShoppingBag className='w-8 h-8 text-luxury-gold' /> Lịch sử đơn hàng
                                        </h1>
                                        <button className='text-luxury-gold text-sm font-semibold hover:underline'>Xem tất cả</button>
                                    </div>

                                    <div className='overflow-x-auto'>
                                        <table className='w-full'>
                                            <thead>
                                                <tr className='text-left border-b border-luxury-border'>
                                                    <th className='pb-4 text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Mã đơn hàng</th>
                                                    <th className='pb-4 text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Ngày đặt</th>
                                                    <th className='pb-4 text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Tổng cộng</th>
                                                    <th className='pb-4 text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Trạng thái</th>
                                                    <th className='pb-4 text-xs font-semibold text-luxury-text-muted uppercase tracking-wider text-right'>Hành động</th>
                                                </tr>
                                            </thead>
                                            <tbody className='divide-y divide-luxury-border'>
                                                {orders.map((order) => (
                                                    <tr key={order.id} className='group hover:bg-white/5 transition-colors'>
                                                        <td className='py-6 font-bold text-white'>{order.id}</td>
                                                        <td className='py-6 text-luxury-text-muted'>{order.date}</td>
                                                        <td className='py-6 font-bold text-luxury-gold'>{order.total}</td>
                                                        <td className='py-6'>
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${order.statusColor}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td className='py-6 text-right'>
                                                            <button className='p-2 hover:bg-luxury-gold/10 rounded-full transition-colors group-hover:text-luxury-gold'>
                                                                <Eye className='w-5 h-5' />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === "password" && (
                                <div className='space-y-8'>
                                    <h1 className='text-3xl font-bold text-white'>Đổi mật khẩu</h1>
                                    <div className='max-w-md space-y-6'>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Mật khẩu hiện tại</label>
                                            <input
                                                type="password"
                                                className='w-full bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-white px-5 py-3 rounded-xl focus:outline-none transition'
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Mật khẩu mới</label>
                                            <input
                                                type="password"
                                                className='w-full bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-white px-5 py-3 rounded-xl focus:outline-none transition'
                                            />
                                        </div>
                                        <div className='space-y-2'>
                                            <label className='text-xs font-semibold text-luxury-text-muted uppercase tracking-wider'>Xác nhận mật khẩu mới</label>
                                            <input
                                                type="password"
                                                className='w-full bg-luxury-dark border border-luxury-border focus:border-luxury-gold text-white px-5 py-3 rounded-xl focus:outline-none transition'
                                            />
                                        </div>
                                        <button className='w-full bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark py-4 rounded-xl font-bold transition duration-300'>
                                            Cập nhật mật khẩu
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
