import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Megaphone, Calendar, Tag, Percent, Image as ImageIcon, MoreVertical, Filter, ChevronLeft, ChevronRight } from "lucide-react";

const MarketingTab = () => {
    const [campaigns, setCampaigns] = useState([
        { id: "CAM-9012", name: "Midnight Gala Sale", group: "Men's Luxury", discount: "20%", period: "Oct 12 - Oct 25", status: "Active", statusColor: "bg-emerald-500" },
        { id: "CAM-9044", name: "Black Friday Early", group: "Entire Catalog", discount: "15%", period: "Nov 20 - Nov 28", status: "Scheduled", statusColor: "bg-yellow-500" },
        { id: "CAM-8891", name: "Summer Serenity", group: "Women's Diamond", discount: "10%", period: "Aug 01 - Aug 30", status: "Ended", statusColor: "bg-gray-500" },
    ]);

    const banners = [
        { id: 1, title: "Heritage 2024 Collection", status: "ACTIVE", path: "/collections/heritage" },
        { id: 2, title: "Mastering Precision Sale", status: "SCHEDULED", path: "Starts: Nov 24, 2024" },
    ];

    return (
        <div className='space-y-12'>
            {/* Header & Stats */}
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div className='space-y-2'>
                    <h1 className='text-4xl font-bold text-white tracking-tight'>Marketing & Ads Management</h1>
                    <p className='text-luxury-text-muted max-w-2xl'>
                        Strategize and oversee your luxury brand's global digital presence and promotional campaigns.
                    </p>
                </div>
                <div className='flex gap-4'>
                    <div className='bg-luxury-dark border border-luxury-border p-4 rounded-2xl min-w-[140px]'>
                        <p className='text-xs font-semibold text-luxury-text-muted uppercase tracking-widest mb-1'>Active</p>
                        <div className='flex items-end gap-2'>
                            <span className='text-3xl font-bold text-white'>12</span>
                            <span className='text-emerald-400 text-xs font-bold mb-1'>↗+2.1%</span>
                        </div>
                    </div>
                    <div className='bg-luxury-dark border border-luxury-border p-4 rounded-2xl min-w-[140px]'>
                        <p className='text-xs font-semibold text-luxury-text-muted uppercase tracking-widest mb-1'>Reach</p>
                        <div className='flex items-end gap-2'>
                            <span className='text-3xl font-bold text-white'>1.2M</span>
                            <span className='text-emerald-400 text-xs font-bold mb-1'>↗+15%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero Banner Management */}
            <section className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                        <ImageIcon className='w-5 h-5 text-luxury-gold' /> Hero Banner Management
                    </h2>
                    <button className='flex items-center gap-2 text-luxury-gold text-sm font-bold hover:text-luxury-gold-light transition'>
                        <Plus className='w-4 h-4' /> Add New Banner
                    </button>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    {banners.map((banner) => (
                        <div key={banner.id} className='relative group h-48 rounded-2xl overflow-hidden border border-luxury-border'>
                            <div className='absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent' />
                            <div className='absolute top-4 left-4'>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest ${banner.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-blue-500'} text-white`}>
                                    {banner.status}
                                </span>
                            </div>
                            <div className='absolute bottom-4 left-4 right-4'>
                                <h3 className='text-white font-bold mb-1'>{banner.title}</h3>
                                <p className='text-luxury-text-muted text-[10px]'>{banner.path}</p>
                            </div>
                            <div className='absolute inset-0 bg-luxury-gold/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                        </div>
                    ))}
                    <div className='border-2 border-dashed border-luxury-border rounded-2xl flex flex-col items-center justify-center p-8 gap-4 hover:border-luxury-gold transition-colors cursor-pointer bg-luxury-dark/30 group'>
                        <div className='w-12 h-12 rounded-full bg-luxury-dark flex items-center justify-center text-luxury-gold group-hover:scale-110 transition-transform'>
                            <Plus className='w-6 h-6' />
                        </div>
                        <div className='text-center'>
                            <p className='text-luxury-gold font-bold text-sm'>Upload New Banner</p>
                            <p className='text-[10px] text-luxury-text-muted mt-1'>Recommended: 1920x1080px</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Create Campaign Form */}
                <div className='lg:col-span-1 bg-luxury-dark border border-luxury-border rounded-3xl p-8 space-y-6'>
                    <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                        <Plus className='w-5 h-5 text-luxury-gold' /> Create Campaign
                    </h2>

                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Campaign Name</label>
                            <input type="text" placeholder="e.g., Holiday Luxury Sale" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                        </div>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Product Group</label>
                            <select className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition appearance-none'>
                                <option>Select Group</option>
                                <option>Men's Luxury</option>
                                <option>Women's Diamond</option>
                                <option>Entire Catalog</option>
                            </select>
                        </div>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Discount Percentage (%)</label>
                            <div className='relative'>
                                <input type="number" placeholder="15" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold font-bold text-lg'>%</span>
                            </div>
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Start Date</label>
                                <input type="date" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                            </div>
                            <div className='space-y-2'>
                                <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>End Date</label>
                                <input type="date" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                            </div>
                        </div>
                        <button className='w-full bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-bold py-4 rounded-xl transition duration-300 mt-4 shadow-lg shadow-luxury-gold/20'>
                            Activate Campaign
                        </button>
                        <p className='text-[10px] text-luxury-text-muted text-center italic'>
                            Campaigns will be automatically managed by background jobs.
                        </p>
                    </div>
                </div>

                {/* Active & Scheduled Campaigns Table */}
                <div className='lg:col-span-2 bg-luxury-dark border border-luxury-border rounded-3xl p-8 space-y-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold text-white'>Active & Scheduled Campaigns</h2>
                        <button className='flex items-center gap-2 px-3 py-1.5 bg-luxury-darker border border-luxury-border rounded-lg text-xs font-medium text-luxury-text-muted hover:text-white transition'>
                            <Filter className='w-3 h-3' /> Filter
                        </button>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead>
                                <tr className='text-left border-b border-luxury-border/50'>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Campaign</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Group</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Discount</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Period</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Status</th>
                                    <th className='pb-4'></th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-luxury-border/30'>
                                {campaigns.map((camp) => (
                                    <tr key={camp.id} className='group hover:bg-white/5 transition-colors'>
                                        <td className='py-5'>
                                            <div className='font-bold text-white'>{camp.name}</div>
                                            <div className='text-[10px] text-luxury-text-muted mt-0.5'>ID: {camp.id}</div>
                                        </td>
                                        <td className='py-5 text-sm text-luxury-text-muted'>{camp.group}</td>
                                        <td className='py-5 font-bold text-luxury-gold'>{camp.discount}</td>
                                        <td className='py-5 text-[10px] text-luxury-text-muted'>{camp.period}</td>
                                        <td className='py-5'>
                                            <div className='flex items-center gap-2'>
                                                <span className={`w-2 h-2 rounded-full ${camp.statusColor}`} />
                                                <span className='text-xs font-medium text-white'>{camp.status}</span>
                                            </div>
                                        </td>
                                        <td className='py-5 text-right'>
                                            <button className='p-2 text-luxury-text-muted hover:text-white'>
                                                <MoreVertical className='w-4 h-4' />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className='flex items-center justify-between pt-6 border-t border-luxury-border/50'>
                        <p className='text-[10px] text-luxury-text-muted italic'>Showing 3 of 12 campaigns</p>
                        <div className='flex items-center gap-2'>
                            <button className='p-1.5 rounded-md border border-luxury-border text-luxury-text-muted hover:text-white transition'>
                                <ChevronLeft className='w-4 h-4' />
                            </button>
                            <div className='flex items-center gap-1'>
                                <span className='w-8 h-8 flex items-center justify-center rounded-md bg-luxury-gold text-luxury-dark text-xs font-bold'>1</span>
                                <span className='w-8 h-8 flex items-center justify-center rounded-md hover:bg-luxury-border text-luxury-text-muted text-xs font-medium cursor-pointer transition'>2</span>
                                <span className='w-8 h-8 flex items-center justify-center rounded-md hover:bg-luxury-border text-luxury-text-muted text-xs font-medium cursor-pointer transition'>3</span>
                            </div>
                            <button className='p-1.5 rounded-md border border-luxury-border text-luxury-text-muted hover:text-white transition'>
                                <ChevronRight className='w-4 h-4' />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingTab;
