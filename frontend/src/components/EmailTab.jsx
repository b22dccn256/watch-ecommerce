import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, MousePointer2, ShoppingCart, Plus, Monitor, Smartphone, Eye, Power } from "lucide-react";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

const DEFAULT_AUTOMATIONS = [
    { id: 1, name: "Abandoned Cart 24h", trigger: "24h AFTER CART EXIT", status: "ACTIVE", sent: "1,204", open: "28.2%", conv: "3.1%" },
    { id: 2, name: "Birthday Greeting", trigger: "USER BIRTHDAY DATE", status: "ACTIVE", sent: "452", open: "54.0%", conv: "1.8%" },
    { id: 3, name: "Post-purchase Follow-up", trigger: "7 DAYS AFTER DELIVERY", status: "INACTIVE", sent: "--", open: "--", conv: "--" },
];

const EmailTab = () => {
    const [automations, setAutomations] = useState(DEFAULT_AUTOMATIONS);
    const [sendingTest, setSendingTest] = useState(null); // id of automation being tested

    const stats = [
        { label: "Open Rate", value: "24.5%", change: "+2.1%", icon: Mail },
        { label: "Click Rate (CTR)", value: "12.8%", change: "-0.5%", icon: MousePointer2 },
        { label: "Conversions", value: "4.2%", change: "+1.2%", icon: ShoppingCart },
    ];

    const toggleAutomation = (id) => {
        setAutomations(prev => prev.map(a =>
            a.id === id
                ? { ...a, status: a.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
                : a
        ));
        const auto = automations.find(a => a.id === id);
        const newStatus = auto.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        toast.success(`${auto.name}: ${newStatus === "ACTIVE" ? "✅ Đã bật" : "⏸ Đã tắt"}`);
    };

    const sendTestEmail = async (auto) => {
        setSendingTest(auto.id);
        try {
            await axios.post("/analytics/send-test-email", {
                type: auto.name,
                automationId: auto.id,
            });
            toast.success(`Email test "${auto.name}" đã được gửi!`);
        } catch (error) {
            // If endpoint not available, show demo success
            if (error.response?.status === 404) {
                toast.success(`Email test "${auto.name}" đã được gửi! (Demo mode)`);
            } else {
                toast.error(error.response?.data?.message || "Lỗi gửi email test");
            }
        } finally {
            setSendingTest(null);
        }
    };

    return (
        <div className='space-y-12'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div className='space-y-1'>
                    <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>Email Automation</h1>
                    <p className='text-gray-500 dark:text-luxury-text-muted text-sm'>Quản lý email tự động cho khách hàng. Số liệu mang tính tham khảo (demo data).</p>
                </div>
                <button className='flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-luxury-gold-light transition shadow-lg shadow-luxury-gold/20'>
                    <Plus className='w-4 h-4' /> Create New Automation
                </button>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {stats.map((stat, idx) => (
                    <div key={idx} className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-6 rounded-2xl shadow-xl dark:shadow-none'>
                        <div className='flex items-center justify-between mb-4'>
                            <span className='text-xs font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest'>{stat.label}</span>
                            <stat.icon className='w-5 h-5 text-luxury-gold' />
                        </div>
                        <div className='flex items-end gap-3'>
                            <span className='text-3xl font-bold text-gray-900 dark:text-white'>{stat.value}</span>
                            <span className={`${stat.change.startsWith("+") ? "text-emerald-500" : "text-red-500"} text-xs font-bold mb-1`}>{stat.change}</span>
                        </div>
                        <div className='mt-3 text-[10px] text-gray-400 dark:text-luxury-text-muted italic'>* Demo data</div>
                    </div>
                ))}
            </div>

            {/* Active Automations */}
            <section className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-bold text-gray-800 dark:text-white'>Active Automations</h2>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {automations.map((auto) => (
                        <div key={auto.id} className={`bg-white dark:bg-luxury-dark border rounded-2xl p-6 space-y-5 transition-colors shadow-lg dark:shadow-none ${auto.status === "ACTIVE" ? "border-luxury-gold/30" : "border-gray-100 dark:border-luxury-border"}`}>
                            <div className='flex items-start justify-between'>
                                <div className='space-y-1'>
                                    <div className='flex items-center gap-3'>
                                        <h3 className='font-bold text-gray-900 dark:text-white'>{auto.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${auto.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-500/10 text-gray-600 dark:text-gray-400"}`}>
                                            {auto.status}
                                        </span>
                                    </div>
                                    <p className='text-[9px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-wider'>TRIGGER: {auto.trigger}</p>
                                </div>
                            </div>

                            <div className='grid grid-cols-3 gap-4 border-t border-gray-100 dark:border-luxury-border/50 pt-4'>
                                <div className='text-center'>
                                    <p className='text-[8px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase mb-1'>Sent</p>
                                    <p className='text-sm font-bold text-gray-900 dark:text-white'>{auto.sent}</p>
                                </div>
                                <div className='text-center'>
                                    <p className='text-[8px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase mb-1'>Open</p>
                                    <p className='text-sm font-bold text-gray-900 dark:text-white'>{auto.open}</p>
                                </div>
                                <div className='text-center'>
                                    <p className='text-[8px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase mb-1'>Conv.</p>
                                    <p className='text-sm font-bold text-gray-900 dark:text-white'>{auto.conv}</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className='flex gap-2 pt-2'>
                                <button
                                    onClick={() => toggleAutomation(auto.id)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${auto.status === "ACTIVE"
                                        ? "bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20"
                                        : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                        }`}
                                >
                                    <Power className='w-3 h-3' />
                                    {auto.status === "ACTIVE" ? "Tắt" : "Bật"}
                                </button>
                                <button
                                    onClick={() => sendTestEmail(auto)}
                                    disabled={sendingTest === auto.id}
                                    className='flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50'
                                >
                                    <Send className='w-3 h-3' />
                                    {sendingTest === auto.id ? "Đang gửi..." : "Test gửi"}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Email Preview */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <section className='space-y-4'>
                    <h2 className='text-xl font-bold text-gray-800 dark:text-white'>Email Builder Preview</h2>
                    <div className='bg-white rounded-3xl overflow-hidden shadow-2xl border-[8px] border-gray-50 dark:border-luxury-dark'>
                        <div className='p-8 space-y-6 text-center bg-gray-50 dark:bg-luxury-dark'>
                            <span className='text-xl font-bold text-luxury-gold tracking-widest'>LVX WATCHES</span>
                            <div className='aspect-video rounded-2xl overflow-hidden'>
                                <img src="https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=600" alt="Promo" className='w-full h-full object-cover' />
                            </div>
                            <div className='space-y-3'>
                                <h3 className='text-2xl font-bold text-gray-900 dark:text-white'>The Gold Standard</h3>
                                <p className='text-gray-500 dark:text-luxury-text-muted text-sm leading-relaxed'>
                                    Your cart is waiting. Experience the precision of the new Chrono-Gold series with an exclusive 10% offer.
                                </p>
                            </div>
                            <button className='bg-luxury-gold text-luxury-dark px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest'>
                                Complete Purchase
                            </button>
                        </div>
                    </div>
                </section>

                <section className='space-y-4'>
                    <h2 className='text-xl font-bold text-gray-800 dark:text-white'>Quick Actions</h2>
                    <div className='space-y-3'>
                        <div className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-4 rounded-2xl flex items-center justify-between shadow-md dark:shadow-none'>
                            <div>
                                <p className='font-bold text-gray-900 dark:text-white text-sm'>Send All Active Automations</p>
                                <p className='text-gray-500 dark:text-luxury-text-muted text-xs'>Gửi ngay tất cả automation đang ACTIVE</p>
                            </div>
                            <button
                                onClick={() => {
                                    automations.filter(a => a.status === "ACTIVE").forEach(a => sendTestEmail(a));
                                }}
                                className='px-4 py-2 bg-luxury-gold text-luxury-dark rounded-lg text-xs font-bold whitespace-nowrap'
                            >
                                <Send className='w-4 h-4 inline mr-1' /> Send All
                            </button>
                        </div>
                        <div className='bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-4 rounded-2xl shadow-md dark:shadow-none'>
                            <p className='font-bold text-gray-800 dark:text-white text-sm mb-2'>Thống kê (Demo)</p>
                            <div className='grid grid-cols-2 gap-3 text-center'>
                                <div className='bg-gray-50 dark:bg-luxury-darker border border-gray-100 dark:border-transparent rounded-xl p-3'>
                                    <p className='text-2xl font-bold text-luxury-gold'>{automations.filter(a => a.status === "ACTIVE").length}</p>
                                    <p className='text-[10px] text-gray-500 dark:text-luxury-text-muted'>Automation ACTIVE</p>
                                </div>
                                <div className='bg-gray-50 dark:bg-luxury-darker border border-gray-100 dark:border-transparent rounded-xl p-3'>
                                    <p className='text-2xl font-bold text-gray-900 dark:text-white'>1,656</p>
                                    <p className='text-[10px] text-gray-500 dark:text-luxury-text-muted'>Tổng email đã gửi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EmailTab;
