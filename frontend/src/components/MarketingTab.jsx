import { useState, useEffect } from "react";
import { Plus, Megaphone, Image as ImageIcon, MoreVertical, Filter, ChevronLeft, ChevronRight, Trash2, Power } from "lucide-react";
import { motion } from "framer-motion";
import { useCampaignStore } from "../stores/useCampaignStore";
import { useProductStore } from "../stores/useProductStore";

const MarketingTab = () => {
    const { campaigns, loading, fetchCampaigns, createCampaign, toggleCampaignStatus, deleteCampaign } = useCampaignStore();
    const { products } = useProductStore();

    const [formData, setFormData] = useState({
        name: "",
        group: "Entire Catalog",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        isGlobal: true,
    });

    useEffect(() => {
        fetchCampaigns();
    }, [fetchCampaigns]);

    const handleCreate = async () => {
        if (!formData.name || !formData.discountPercentage || !formData.startDate || !formData.endDate) {
            return;
        }
        const { success } = await createCampaign({
            ...formData,
            discountPercentage: Number(formData.discountPercentage),
            isGlobal: formData.group === "Entire Catalog"
        });
        if (success) {
            setFormData({
                name: "",
                group: "Entire Catalog",
                discountPercentage: "",
                startDate: "",
                endDate: "",
                isGlobal: true,
            });
        }
    };

    // Calculate preview product
    const previewProduct = products?.find(p => formData.group === "Entire Catalog" ? true : p.category === formData.group);

    // Formatting date helper
    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const banners = [
        { id: 1, title: "Heritage 2024 Collection", status: "ACTIVE", path: "/collections/heritage" },
        { id: 2, title: "Mastering Precision Sale", status: "SCHEDULED", path: "Starts: Nov 24, 2024" },
    ];

    return (
        <div className='space-y-12'>
            {/* Header & Stats */}
            <div className='flex flex-col md:flex-row md:items-end justify-between gap-6'>
                <div className='space-y-2'>
                    <h1 className='text-4xl font-bold text-white tracking-tight'>Marketing & Chiến Dịch</h1>
                    <p className='text-luxury-text-muted max-w-2xl'>
                        Thiết lập và tự động hoá các chương trình khuyến mãi cho hệ thống toàn cầu.
                    </p>
                </div>
                <div className='flex gap-4'>
                    <div className='bg-luxury-dark border border-luxury-border p-4 rounded-2xl min-w-[140px]'>
                        <p className='text-xs font-semibold text-luxury-text-muted uppercase tracking-widest mb-1'>Hoạt động</p>
                        <div className='flex items-end gap-2'>
                            <span className='text-3xl font-bold text-white'>{campaigns?.filter(c => c.status === "Active").length || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Banner Management (Static for now) */}
            <section className='space-y-6'>
                <div className='flex items-center justify-between'>
                    <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                        <ImageIcon className='w-5 h-5 text-luxury-gold' /> Quản lý Banner Trang chủ
                    </h2>
                    <button className='flex items-center gap-2 text-luxury-gold text-sm font-bold hover:text-luxury-gold-light transition'>
                        <Plus className='w-4 h-4' /> Thêm Banner
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
                            <p className='text-luxury-gold font-bold text-sm'>Tải lên Banner Mới</p>
                            <p className='text-[10px] text-luxury-text-muted mt-1'>Recommended: 1920x1080px</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
                {/* Create Campaign Form */}
                <div className='lg:col-span-1 bg-luxury-dark border border-luxury-border rounded-3xl p-8 space-y-6'>
                    <h2 className='text-xl font-bold text-white flex items-center gap-2'>
                        <Plus className='w-5 h-5 text-luxury-gold' /> Tạo chiến dịch mới
                    </h2>

                    <div className='space-y-4'>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Tên chiến dịch</label>
                            <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} type="text" placeholder="Vd: Holiday Luxury Sale" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                        </div>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Nhóm Sản Phẩm</label>
                            <select value={formData.group} onChange={(e) => setFormData({ ...formData, group: e.target.value })} className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition appearance-none'>
                                <option value="Entire Catalog">Tất cả sản phẩm</option>
                                <option value="Đồng hồ Nam">Đồng hồ Nam</option>
                                <option value="Đồng hồ Nữ">Đồng hồ Nữ</option>
                            </select>
                        </div>
                        <div className='space-y-2'>
                            <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Phần trăm giảm (%)</label>
                            <div className='relative'>
                                <input value={formData.discountPercentage} onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })} type="number" placeholder="15" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                                <span className='absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold font-bold text-lg'>%</span>
                            </div>
                        </div>

                        {/* PREVIEW DISCOUNT UI */}
                        {previewProduct && formData.discountPercentage && (
                            <div className='bg-emerald-900/20 border border-emerald-500/30 p-4 rounded-xl space-y-2'>
                                <p className='text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1'>Mô phỏng giá trị</p>
                                <div className='flex items-center gap-3'>
                                    <img src={previewProduct.image} className='w-12 h-12 rounded-lg object-cover' />
                                    <div>
                                        <p className='text-xs text-white font-medium line-clamp-1'>{previewProduct.name}</p>
                                        <div className='flex gap-2 items-center'>
                                            <span className='line-through text-xs text-luxury-text-muted'>{previewProduct.price.toLocaleString("vi-VN")}₫</span>
                                            <span className='font-bold text-emerald-400 text-sm'>
                                                {(previewProduct.price * (1 - formData.discountPercentage / 100)).toLocaleString("vi-VN")}₫
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Bắt đầu</label>
                                <input value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} type="datetime-local" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-2 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                            </div>
                            <div className='space-y-2'>
                                <label className='text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Kết thúc</label>
                                <input value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} type="datetime-local" className='w-full bg-luxury-darker border border-luxury-border rounded-xl px-2 py-3 text-sm text-white focus:outline-none focus:border-luxury-gold transition' />
                            </div>
                        </div>
                        <button onClick={handleCreate} disabled={loading} className='w-full bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-bold py-4 rounded-xl transition duration-300 mt-4 shadow-lg shadow-luxury-gold/20 disabled:opacity-50'>
                            {loading ? "Đang xử lý..." : "Kích hoạt chiến dịch"}
                        </button>
                    </div>
                </div>

                {/* Active & Scheduled Campaigns Table */}
                <div className='lg:col-span-2 bg-luxury-dark border border-luxury-border rounded-3xl p-8 space-y-6'>
                    <div className='flex items-center justify-between'>
                        <h2 className='text-xl font-bold text-white'>Danh sách chiến dịch</h2>
                    </div>

                    <div className='overflow-x-auto'>
                        <table className='w-full'>
                            <thead>
                                <tr className='text-left border-b border-luxury-border/50'>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Chiến dịch</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Nhóm</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Discount</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Thời gian</th>
                                    <th className='pb-4 text-[10px] font-bold text-luxury-text-muted uppercase tracking-widest'>Status</th>
                                    <th className='pb-4'></th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-luxury-border/30'>
                                {(!campaigns || campaigns.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-luxury-text-muted">Chưa có chiến dịch nào</td>
                                    </tr>
                                )}
                                {campaigns?.map((camp) => (
                                    <tr key={camp._id} className={`group hover:bg-white/5 transition-colors ${!camp.isActive ? "opacity-50" : ""}`}>
                                        <td className='py-5'>
                                            <div className='font-bold text-white'>{camp.name}</div>
                                            <div className='text-[10px] text-luxury-text-muted mt-0.5'>ID: {camp._id.substring(0, 8)}...</div>
                                        </td>
                                        <td className='py-5 text-sm text-luxury-text-muted'>
                                            {camp.isGlobal ? "Toàn bộ" : camp.group}
                                        </td>
                                        <td className='py-5 font-bold text-luxury-gold'>{camp.discountPercentage}%</td>
                                        <td className='py-5 text-[10px] text-luxury-text-muted'>
                                            {formatDate(camp.startDate)} <br /><span className="text-gray-500">tới</span> {formatDate(camp.endDate)}
                                        </td>
                                        <td className='py-5'>
                                            <div className='flex items-center gap-2'>
                                                <span className={`w-2 h-2 rounded-full 
                                                    ${camp.status === 'Active' ? 'bg-emerald-500' :
                                                        camp.status === 'Scheduled' ? 'bg-blue-500' : 'bg-gray-500'}`} />
                                                <span className={`text-xs font-bold uppercase tracking-wider
                                                    ${camp.status === 'Active' ? 'text-emerald-500' :
                                                        camp.status === 'Scheduled' ? 'text-blue-500' : 'text-gray-500'}`}>{camp.status}</span>
                                            </div>
                                        </td>
                                        <td className='py-5 text-right'>
                                            <button onClick={() => toggleCampaignStatus(camp._id)} className='p-2 text-luxury-text-muted hover:text-luxury-gold transition-colors mr-2' title="Bật/Tắt">
                                                <Power className='w-4 h-4' />
                                            </button>
                                            <button onClick={() => deleteCampaign(camp._id)} className='p-2 text-luxury-text-muted hover:text-red-400 transition-colors' title="Xoá">
                                                <Trash2 className='w-4 h-4' />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketingTab;
