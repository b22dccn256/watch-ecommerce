import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Send, MousePointer2, ShoppingCart, MoreVertical, Plus, Monitor, Smartphone, Layout, Eye } from "lucide-react";

const EmailTab = () => {
    const stats = [
        { label: "Open Rate", value: "24.5%", change: "+2.1%", icon: Mail },
        { label: "CTR", value: "12.8%", change: "-0.5%", icon: MousePointer2 },
        { label: "Conversions", value: "4.2%", change: "+1.2%", icon: ShoppingCart },
    ];

    const automations = [
        { id: 1, name: "Abandoned Cart 24h", trigger: "24h AFTER CART EXIT", status: "ACTIVE", sent: "1,204", open: "28.2%", conv: "3.1%" },
        { id: 2, name: "Birthday Greeting", trigger: "USER BIRTHDAY DATE", status: "ACTIVE", sent: "452", open: "54.0%", conv: "1.8%" },
        { id: 3, name: "Post-purchase Follow-up", trigger: "7 DAYS AFTER DELIVERY", status: "INACTIVE", sent: "--", open: "--", conv: "--" },
    ];

    return (
        <div className='space-y-12'>
            {/* Header */}
            <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
                <div className='space-y-1'>
                    <h1 className='text-3xl font-bold text-white'>Email Automation</h1>
                    <p className='text-luxury-text-muted text-sm'>Create and manage automated email workflows for your customers.</p>
                </div>
                <button className='flex items-center gap-2 px-6 py-3 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-luxury-gold-light transition shadow-lg shadow-luxury-gold/20'>
                    <Plus className='w-4 h-4' /> Create New Automation
                </button>
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                {stats.map((stat, idx) => (
                    <div key={idx} className='bg-luxury-dark border border-luxury-border p-6 rounded-2xl'>
                        <div className='flex items-center justify-between mb-4'>
                            <span className='text-xs font-bold text-luxury-text-muted uppercase tracking-widest'>{stat.label}</span>
                            <stat.icon className='w-5 h-5 text-luxury-gold' />
                        </div>
                        <div className='flex items-end gap-3'>
                            <span className='text-3xl font-bold text-white'>{stat.value}</span>
                            <span className={`${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'} text-xs font-bold mb-1`}>{stat.change}</span>
                        </div>
                        <div className='mt-4 h-1.5 w-full bg-luxury-darker rounded-full overflow-hidden'>
                            <div className='h-full bg-luxury-gold rounded-full' style={{ width: stat.value }} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Active Automations */}
            <section className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-bold text-white'>Active Automations</h2>
                    <button className='text-luxury-gold text-sm font-bold hover:underline'>View all triggers</button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {automations.map((auto) => (
                        <div key={auto.id} className='bg-luxury-dark border border-luxury-border p-6 rounded-2xl space-y-6 group hover:border-luxury-gold transition-colors'>
                            <div className='flex items-start justify-between'>
                                <div className='space-y-1'>
                                    <div className='flex items-center gap-3'>
                                        <h3 className='font-bold text-white'>{auto.name}</h3>
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${auto.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-500/10 text-gray-400'}`}>
                                            {auto.status}
                                        </span>
                                    </div>
                                    <p className='text-[9px] font-bold text-luxury-text-muted uppercase tracking-wider'>TRIGGER: {auto.trigger}</p>
                                </div>
                                <button className='text-luxury-text-muted hover:text-white'>
                                    <MoreVertical className='w-4 h-4' />
                                </button>
                            </div>

                            <div className='grid grid-cols-3 gap-4 border-t border-luxury-border/50 pt-6'>
                                <div className='text-center'>
                                    <p className='text-[8px] font-bold text-luxury-text-muted uppercase mb-1'>Sent</p>
                                    <p className='text-sm font-bold text-white'>{auto.sent}</p>
                                </div>
                                <div className='text-center'>
                                    <p className='text-[8px] font-bold text-luxury-text-muted uppercase mb-1'>Open</p>
                                    <p className='text-sm font-bold text-white'>{auto.open}</p>
                                </div>
                                <div className='text-center'>
                                    <p className='text-[8px] font-bold text-luxury-text-muted uppercase mb-1'>Conv.</p>
                                    <p className='text-sm font-bold text-white'>{auto.conv}</p>
                                </div>
                            </div>

                            <div className='flex items-center justify-between pt-2'>
                                <p className='text-[9px] text-luxury-text-muted italic'>Last sent: {auto.sent === '--' ? '2 days ago' : 'Today, 2:14 PM'}</p>
                                <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity'>
                                    <div className='w-1 h-1 rounded-full bg-luxury-gold' />
                                    <div className='w-1 h-1 rounded-full bg-luxury-gold' />
                                    <div className='w-1 h-1 rounded-full bg-luxury-gold' />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Template Library & Builder Preview */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
                <section className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold text-white'>Template Library</h2>
                        <button className='text-[10px] font-bold text-luxury-gold uppercase tracking-widest hover:underline'>Import HTML</button>
                    </div>
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='aspect-[3/4] rounded-2xl bg-luxury-darker border border-luxury-border overflow-hidden relative group cursor-pointer'>
                            <img src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=400" alt="Template" className='w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity' />
                            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                <button className='bg-luxury-gold text-luxury-dark p-3 rounded-full shadow-xl'>
                                    <Eye className='w-5 h-5' />
                                </button>
                            </div>
                        </div>
                        <div className='aspect-[3/4] rounded-2xl bg-luxury-darker border border-luxury-border overflow-hidden relative group cursor-pointer'>
                            <img src="https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=400" alt="Template" className='w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity' />
                            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'>
                                <button className='bg-luxury-gold text-luxury-dark p-3 rounded-full shadow-xl'>
                                    <Eye className='w-5 h-5' />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='space-y-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold text-white'>Email Builder Preview</h2>
                        <div className='flex gap-2 p-1 bg-luxury-dark border border-luxury-border rounded-lg'>
                            <button className='p-1.5 rounded bg-luxury-darker text-luxury-gold'>
                                <Smartphone className='w-4 h-4' />
                            </button>
                            <button className='p-1.5 rounded text-luxury-text-muted hover:text-white'>
                                <Monitor className='w-4 h-4' />
                            </button>
                        </div>
                    </div>
                    <div className='bg-white rounded-3xl overflow-hidden shadow-2xl scale-95 origin-top border-[8px] border-luxury-dark'>
                        <div className='p-8 space-y-8 text-center bg-luxury-dark'>
                            <div className='flex justify-center'>
                                <span className='text-xl font-bold text-luxury-gold tracking-widest'>LVX WATCHES</span>
                            </div>
                            <div className='aspect-video rounded-2xl overflow-hidden'>
                                <img src="https://images.unsplash.com/photo-1547996160-81dfa63595dd?auto=format&fit=crop&q=80&w=600" alt="Promo" className='w-full h-full object-cover' />
                            </div>
                            <div className='space-y-4'>
                                <h3 className='text-2xl font-bold text-white font-luxury'>The Gold Standard</h3>
                                <p className='text-luxury-text-muted text-sm leading-relaxed'>
                                    Your cart is waiting. Experience the precision of the new Chrono-Gold series with an exclusive 10% offer.
                                </p>
                            </div>
                            <button className='bg-luxury-gold text-luxury-dark px-10 py-4 rounded-xl font-bold text-sm uppercase tracking-widest'>
                                Complete Purchase
                            </button>
                            <div className='pt-8 border-t border-luxury-border/30'>
                                <p className='text-[10px] text-luxury-text-muted'>
                                    You are receiving this because you left items in your cart. <br />
                                    <span className='underline cursor-pointer'>Unsubscribe</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default EmailTab;
