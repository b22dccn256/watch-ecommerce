import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
    Users, Shield, Zap, AlertTriangle,
    ShieldCheck, ShieldAlert, Key, Globe, Eye, Clock,
    MoreVertical, Trash2, UserCog, X, ChevronDown
} from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenu, setOpenMenu] = useState(null); // userId of open dropdown
    const [selectedUser, setSelectedUser] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setOpenMenu(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/auth/users");
            setUsers(res.data);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Bạn có chắc muốn xóa tài khoản "${userName}"?`)) return;
        try {
            await axios.delete(`/auth/users/${userId}`);
            setUsers(prev => prev.filter(u => u._id !== userId));
            setOpenMenu(null);
            toast.success(`Đã xóa tài khoản ${userName}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi xóa user");
        }
    };

    const handleToggleRole = async (userId, currentRole, userName) => {
        const newRole = currentRole === "admin" ? "customer" : "admin";
        try {
            await axios.patch(`/auth/users/${userId}/role`, { role: newRole });
            setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
            setOpenMenu(null);
            toast.success(`Đã đổi role ${userName} thành ${newRole}`);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi đổi role");
        }
    };

    const events = [
        { id: 1, type: "Password changed", user: "Admin account", time: "12 MINS AGO", icon: Key, color: "text-emerald-400" },
        { id: 2, type: "IP Blocked: 192.168.1.1", user: "Multiple failed login attempts", time: "1 HOUR AGO", icon: ShieldAlert, color: "text-red-400" },
        { id: 3, type: "Spam account flagged", user: "AI flagged suspicious activity", time: "4 HOURS AGO", icon: AlertTriangle, color: "text-yellow-400" },
    ];

    return (
        <div className='space-y-8'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div className='space-y-2'>
                    <h1 className='text-3xl font-bold text-white tracking-tight'>User Control Center</h1>
                    <p className='text-luxury-text-muted text-sm'>{users.length} tài khoản trong hệ thống</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {[
                    { label: "Total Users", value: users.length.toString(), icon: Users },
                    { label: "Admin Accounts", value: users.filter(u => u.role === "admin").length.toString(), icon: Shield },
                    { label: "Customers", value: users.filter(u => u.role !== "admin").length.toString(), icon: Zap },
                ].map((stat, idx) => (
                    <div key={idx} className='bg-luxury-dark border border-luxury-border p-5 rounded-2xl'>
                        <p className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest mb-2'>{stat.label}</p>
                        <h3 className='text-2xl font-bold text-white'>{stat.value}</h3>
                    </div>
                ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* User Directory */}
                <div className='lg:col-span-2'>
                    <div className='bg-luxury-dark border border-luxury-border rounded-2xl overflow-hidden'>
                        <div className='px-6 py-4 border-b border-luxury-border/50 flex items-center justify-between'>
                            <h2 className='font-bold text-white flex items-center gap-2'>
                                <Users className='w-4 h-4 text-luxury-gold' /> User Directory
                            </h2>
                            <span className='text-[10px] text-luxury-text-muted'>{users.length} users</span>
                        </div>
                        <table className='w-full'>
                            <thead>
                                <tr className='text-left border-b border-luxury-border/50 bg-white/5'>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>User</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Role</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Joined</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest text-right'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-luxury-border/30'>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4 text-emerald-400">Loading users...</td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user._id} className='hover:bg-white/5 transition-colors relative'>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-8 h-8 rounded-full bg-luxury-border flex items-center justify-center text-xs font-bold text-white uppercase'>
                                                    {user.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className='text-sm font-bold text-white'>{user.name}</div>
                                                    <div className='text-[10px] text-luxury-text-muted'>{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${user.role === "admin" ? "text-luxury-gold border-luxury-gold/30 bg-luxury-gold/10" : "text-luxury-text-muted border-luxury-border bg-luxury-darker"}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 text-xs text-luxury-text-muted'>
                                            {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className='px-6 py-4 text-right'>
                                            <div className='relative inline-block' ref={openMenu === user._id ? menuRef : null}>
                                                <button
                                                    onClick={() => setOpenMenu(openMenu === user._id ? null : user._id)}
                                                    className='p-2 rounded-lg text-luxury-text-muted hover:text-white hover:bg-white/10 transition-colors'
                                                >
                                                    <MoreVertical className='w-4 h-4' />
                                                </button>
                                                {openMenu === user._id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                                        className='absolute right-0 top-full mt-1 w-48 bg-luxury-dark border border-luxury-border rounded-xl shadow-2xl z-20 overflow-hidden'
                                                    >
                                                        <button
                                                            onClick={() => { setSelectedUser(user); setOpenMenu(null); }}
                                                            className='w-full px-4 py-3 flex items-center gap-3 text-sm text-white hover:bg-white/10 transition-colors text-left'
                                                        >
                                                            <Eye className='w-4 h-4 text-luxury-gold' /> Xem chi tiết
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleRole(user._id, user.role, user.name)}
                                                            className='w-full px-4 py-3 flex items-center gap-3 text-sm text-white hover:bg-white/10 transition-colors text-left'
                                                        >
                                                            <UserCog className='w-4 h-4 text-blue-400' />
                                                            {user.role === "admin" ? "Hạ xuống Customer" : "Nâng lên Admin"}
                                                        </button>
                                                        <div className='border-t border-luxury-border/50' />
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id, user.name)}
                                                            className='w-full px-4 py-3 flex items-center gap-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors text-left'
                                                        >
                                                            <Trash2 className='w-4 h-4' /> Xóa tài khoản
                                                        </button>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Security Events */}
                <div className='space-y-6'>
                    <h2 className='text-xl font-bold text-white'>Security Events</h2>
                    <div className='space-y-4'>
                        {events.map(event => (
                            <div key={event.id} className='bg-luxury-dark border border-luxury-border p-4 rounded-2xl flex items-start gap-4'>
                                <div className={`p-2 rounded-xl bg-luxury-darker border border-luxury-border ${event.color}`}>
                                    <event.icon className='w-4 h-4' />
                                </div>
                                <div className='flex-1 space-y-1'>
                                    <p className='text-sm font-bold text-white'>{event.type}</p>
                                    <p className='text-[10px] text-luxury-text-muted'>{event.user}</p>
                                    <p className='text-[9px] font-bold text-luxury-text-muted flex items-center gap-1 uppercase'>
                                        <Clock className='w-3 h-3' /> {event.time}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='bg-luxury-gold/5 border border-luxury-gold/20 rounded-2xl p-6 space-y-4'>
                        <h3 className='text-sm font-bold text-luxury-gold uppercase tracking-widest'>AI Threat Summary</h3>
                        <p className='text-xs text-luxury-text-muted leading-relaxed'>
                            Overall security risk is <span className='text-emerald-400 font-bold'>LOW</span>. System is operating normally.
                        </p>
                    </div>
                </div>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-luxury-dark border border-luxury-border rounded-2xl w-full max-w-md p-6"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">Chi tiết tài khoản</h2>
                            <button onClick={() => setSelectedUser(null)} className="text-luxury-text-muted hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-luxury-border flex items-center justify-center text-2xl font-bold text-white uppercase">
                                    {selectedUser.name.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-lg">{selectedUser.name}</p>
                                    <p className="text-luxury-text-muted text-sm">{selectedUser.email}</p>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${selectedUser.role === "admin" ? "text-luxury-gold border-luxury-gold/30" : "text-luxury-text-muted border-luxury-border"}`}>
                                        {selectedUser.role}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-luxury-border">
                                <div>
                                    <p className="text-luxury-text-muted text-xs mb-1">Ngày tạo</p>
                                    <p className="text-white text-sm font-bold">{new Date(selectedUser.createdAt).toLocaleDateString("vi-VN")}</p>
                                </div>
                                <div>
                                    <p className="text-luxury-text-muted text-xs mb-1">User ID</p>
                                    <p className="text-white text-xs font-mono">{selectedUser._id.substring(0, 12)}...</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => { handleToggleRole(selectedUser._id, selectedUser.role, selectedUser.name); setSelectedUser(null); }}
                                    className="flex-1 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-xl text-sm font-bold hover:bg-blue-500/20 transition"
                                >
                                    {selectedUser.role === "admin" ? "Hạ xuống Customer" : "Nâng lên Admin"}
                                </button>
                                <button
                                    onClick={() => { handleDeleteUser(selectedUser._id, selectedUser.name); setSelectedUser(null); }}
                                    className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm font-bold hover:bg-red-500/20 transition"
                                >
                                    Xóa tài khoản
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default UsersTab;
