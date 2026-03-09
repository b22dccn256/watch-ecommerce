import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Shield, Zap, AlertTriangle, Search, Filter, Plus, MoreVertical, ShieldCheck, ShieldAlert, Key, Globe, Eye, Clock } from "lucide-react";
import axios from "../lib/axios";

const UsersTab = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchUsers();
    }, []);
    const stats = [
        { label: "Total Users", value: users.length.toString(), change: "+2.4%", icon: Users },
        { label: "Active Sessions", value: "Live", status: "Tracking ON", icon: Zap },
        { label: "Flagged Accounts", value: "0", action: "Action required", icon: AlertTriangle, color: "text-red-400" },
        { label: "Blocked IPs", value: "1", status: "Automated firewall", icon: Shield },
    ];

    const events = [
        { id: 1, type: "Password changed", user: "Julian Vane", time: "12 MINS AGO", icon: Key, color: "text-emerald-400" },
        { id: 2, type: "IP Blocked: 192.168.1.1", user: "Multiple failed login attempts", time: "1 HOUR AGO", icon: ShieldAlert, color: "text-red-400" },
        { id: 3, type: "Spam account flagged", user: "AI flagged 'Bot_9921x'", time: "4 HOURS AGO", icon: AlertTriangle, color: "text-yellow-400" },
    ];

    return (
        <div className='space-y-8'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div className='space-y-2'>
                    <h1 className='text-3xl font-bold text-white tracking-tight'>User Control Center</h1>
                    <div className='relative w-full max-w-md'>
                        <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-luxury-text-muted' />
                        <input type="text" placeholder="Search accounts, IPs..." className='w-full bg-luxury-dark border border-luxury-border rounded-xl pl-12 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                    </div>
                </div>
                <div className='flex items-center gap-4'>
                    <div className='flex -space-x-2'>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className='w-8 h-8 rounded-full border-2 border-luxury-dark bg-luxury-border flex items-center justify-center text-[10px] font-bold text-white'>
                                {String.fromCharCode(64 + i)}
                            </div>
                        ))}
                        <div className='w-8 h-8 rounded-full border-2 border-luxury-dark bg-luxury-gold flex items-center justify-center text-[10px] font-bold text-luxury-dark'>+12</div>
                    </div>
                    <div className='text-right'>
                        <p className='text-[10px] font-bold text-white'>Julian Vane</p>
                        <p className='text-[8px] font-bold text-luxury-gold uppercase tracking-widest'>Super Admin</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                {stats.map((stat, idx) => (
                    <div key={idx} className='bg-luxury-dark border border-luxury-border p-5 rounded-2xl relative overflow-hidden group'>
                        <div className='relative z-10 space-y-3'>
                            <p className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>{stat.label}</p>
                            <div className='flex items-end justify-between'>
                                <h3 className={`text-2xl font-bold ${stat.color || 'text-white'}`}>{stat.value}</h3>
                                <stat.icon className={`w-5 h-5 ${stat.color || 'text-luxury-gold'}`} />
                            </div>
                            <p className='text-[9px] font-bold text-emerald-400'>{stat.change || stat.status || stat.action}</p>
                        </div>
                        <div className='absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity' />
                    </div>
                ))}
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* User Directory */}
                <div className='lg:col-span-2 space-y-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-6'>
                            <button className='text-sm font-bold text-luxury-gold border-b-2 border-luxury-gold pb-1 flex items-center gap-2'>
                                <Users className='w-4 h-4' /> User Directory
                            </button>
                            <button className='text-sm font-medium text-luxury-text-muted hover:text-white transition pb-1 flex items-center gap-2'>
                                <ShieldCheck className='w-4 h-4' /> Access Control
                            </button>
                            <button className='text-sm font-medium text-luxury-text-muted hover:text-white transition pb-1 flex items-center gap-2'>
                                <Globe className='w-4 h-4' /> Audit Logs
                            </button>
                        </div>
                        <div className='flex gap-2'>
                            <button className='p-2 bg-luxury-dark border border-luxury-border rounded-lg text-luxury-text-muted'>
                                <Filter className='w-4 h-4' />
                            </button>
                            <button className='flex items-center gap-2 px-4 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold'>
                                <Plus className='w-4 h-4' /> Add User
                            </button>
                        </div>
                    </div>

                    <div className='bg-luxury-dark border border-luxury-border rounded-2xl overflow-hidden'>
                        <table className='w-full'>
                            <thead>
                                <tr className='text-left border-b border-luxury-border/50 bg-white/5'>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>User</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Role</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Status</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Last Login</th>
                                    <th className='px-6 py-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>AI Risk</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-luxury-border/30'>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center py-4 text-emerald-400">Loading users...</td>
                                    </tr>
                                ) : users.map((user) => (
                                    <tr key={user._id} className='hover:bg-white/5 transition-colors'>
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
                                            <span className={`px-2 py-0.5 bg-luxury-darker border border-luxury-border rounded text-[9px] font-bold text-luxury-text-muted`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-2'>
                                                <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400`} />
                                                <span className='text-xs font-medium text-white'>Active</span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 text-xs text-luxury-text-muted'>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className={`px-2 py-1 rounded text-[9px] font-bold text-emerald-400 bg-emerald-400/10`}>
                                                CLEAR
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className='p-4 bg-white/5 flex items-center justify-between border-t border-luxury-border/50'>
                            <p className='text-[10px] text-luxury-text-muted'>Showing {users.length} of {users.length} users</p>
                            <div className='flex gap-2'>
                                <button className='px-3 py-1 border border-luxury-border rounded text-[10px] text-luxury-text-muted hover:text-white'>Previous</button>
                                <button className='px-3 py-1 border border-luxury-border rounded text-[10px] text-luxury-text-muted hover:text-white'>Next</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security Events & AI Report */}
                <div className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold text-white'>Security Events</h2>
                        <button className='text-[10px] font-bold text-luxury-gold uppercase tracking-widest hover:underline'>Clear Log</button>
                    </div>

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
                            Overall security risk is <span className='text-emerald-400 font-bold'>LOW</span>. High-volume traffic originating from Singapore has been throttled automatically.
                        </p>
                        <button className='w-full py-3 bg-luxury-dark border border-luxury-gold text-luxury-gold text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-luxury-gold hover:text-luxury-dark transition-colors duration-300'>
                            Detailed AI Report
                        </button>
                    </div>

                    <div className='bg-luxury-dark border border-luxury-border rounded-2xl p-4'>
                        <div className='flex items-center justify-between mb-2'>
                            <p className='text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2'>
                                <ShieldCheck className='w-3 h-3 text-luxury-gold' /> System Status
                            </p>
                        </div>
                        <p className='text-[10px] text-luxury-text-muted mb-3'>AI Threat detection active. All nodes secure.</p>
                        <div className='h-1.5 w-full bg-luxury-darker rounded-full overflow-hidden'>
                            <motion.div
                                className='h-full bg-luxury-gold'
                                initial={{ width: 0 }}
                                animate={{ width: "85%" }}
                                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UsersTab;
