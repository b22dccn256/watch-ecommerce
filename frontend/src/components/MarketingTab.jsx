import { useState, useEffect, useRef } from "react";
import { Plus, Image as ImageIcon, Trash2, Power } from "lucide-react";
import { motion } from "framer-motion";
import { useCampaignStore } from "../stores/useCampaignStore";
import { useProductStore } from "../stores/useProductStore";
import { toast } from "react-hot-toast";
import axios from "../lib/axios";

const MarketingTab = () => {
    const { campaigns, loading, fetchCampaigns, createCampaign, toggleCampaignStatus, deleteCampaign } = useCampaignStore();
    const { products } = useProductStore();
    const bannerInputRef = useRef(null);

    const [formData, setFormData] = useState({
        name: "",
        group: "Entire Catalog",
        discountPercentage: "",
        startDate: "",
        endDate: "",
        isGlobal: true,
    });

    // Persistent Banners using API
    const [banners, setBanners] = useState([]);
    const [bannersLoading, setBannersLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchCampaigns();
        fetchBanners();
    }, [fetchCampaigns]);

    const fetchBanners = async () => {
        setBannersLoading(true);
        try {
            const res = await axios.get("/banners");
            setBanners(res.data);
        } catch (error) {
            console.error("Error fetching banners:", error);
            toast.error("Không thể tải danh sách banner");
        } finally {
            setBannersLoading(false);
        }
    };

    // ─── Campaign handlers ────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!formData.name.trim()) { toast.error("Vui lòng nhập tên chiến dịch"); return; }
        if (!formData.discountPercentage || Number(formData.discountPercentage) <= 0 || Number(formData.discountPercentage) > 99) { toast.error("Vui lòng nhập phần trăm giảm hợp lệ (1-99)"); return; }
        if (!formData.startDate || !formData.endDate) { toast.error("Vui lòng chọn ngày bắt đầu và ngày kết thúc"); return; }
        
        const startDateObj = new Date(formData.startDate);
        const endDateObj = new Date(formData.endDate);
        const now = new Date();
        
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) { toast.error("Định dạng ngày không hợp lệ"); return; }
        if (endDateObj <= startDateObj) { toast.error("Ngày kết thúc phải sau ngày bắt đầu"); return; }
        if (startDateObj < now && startDateObj.getTime() < now.getTime() - 60000) { toast.error("Ngày bắt đầu không được trong quá khứ"); return; }

        setCreating(true);
        const { success } = await createCampaign({
            ...formData,
            discountPercentage: Number(formData.discountPercentage),
            isGlobal: formData.group === "Entire Catalog",
        });
        
        if (success) {
            setFormData({ name: "", group: "Entire Catalog", discountPercentage: "", startDate: "", endDate: "", isGlobal: true });
            toast.success("Chiến dịch đã được tạo thành công!");
        }
        setCreating(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const d = new Date(dateString);
        return d.toLocaleDateString("vi-VN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    };

    const previewProduct = products?.find(p => formData.group === "Entire Catalog" ? true : p.category === formData.group);

    // ─── Banner handlers (API based) ──────────────────────────────────────
    const handleBannerUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) { toast.error("Vui lòng chọn file ảnh (JPG, PNG, WEBP...)"); return; }
        if (file.size > 5 * 1024 * 1024) { toast.error("Ảnh phải nhỏ hơn 5MB"); return; }

        const reader = new FileReader();
        reader.onload = async (ev) => {
            const toastId = toast.loading("Đang tải banner lên...");
            try {
                const res = await axios.post("/banners", {
                    title: file.name.replace(/\.[^.]+$/, ""),
                    image: ev.target.result,
                });
                setBanners(prev => [res.data, ...prev]);
                toast.success("Banner đã được tải lên thành công!", { id: toastId });
            } catch (error) {
                toast.error("Lỗi khi tải banner lên", { id: toastId });
            }
        };
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const handleDeleteBanner = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
        try {
            await axios.delete(`/banners/${id}`);
            setBanners(prev => prev.filter(b => b._id !== id));
            toast.success("Đã xóa banner");
        } catch (error) {
            toast.error("Không thể xóa banner");
        }
    };

    const handleToggleBannerStatus = async (id) => {
        try {
            const res = await axios.patch(`/banners/${id}/toggle`);
            setBanners(prev => prev.map(b => b._id === id ? res.data : b));
        } catch (error) {
            toast.error("Lỗi khi cập nhật trạng thái banner");
        }
    };

    return (
        <div className="space-y-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Marketing & Chiến Dịch</h1>
                    <p className="text-gray-500 dark:text-luxury-text-muted max-w-2xl">
                        Thiết lập và tự động hoá các chương trình khuyến mãi cho hệ thống toàn cầu.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border p-4 rounded-2xl min-w-[140px] shadow-xl dark:shadow-none">
                        <p className="text-xs font-semibold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest mb-1">Đang hoạt động</p>
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{campaigns?.filter(c => c.status === "Active").length || 0}</span>
                    </div>
                </div>
            </div>

            {/* ═══ BANNER MANAGEMENT ═══ */}
            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-luxury-gold" /> Quản lý Banner Trang chủ
                    </h2>
                    <button
                        onClick={() => bannerInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2 bg-luxury-gold text-luxury-dark rounded-xl text-sm font-bold hover:bg-luxury-gold-light transition"
                    >
                        <Plus className="w-4 h-4" /> Tải lên Banner Mới
                    </button>
                    <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Upload placeholder */}
                    <div
                        onClick={() => bannerInputRef.current?.click()}
                        className="relative group h-48 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-luxury-border hover:border-luxury-gold bg-gray-50 dark:bg-transparent transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
                    >
                        <ImageIcon className="w-10 h-10 text-gray-400 dark:text-luxury-text-muted group-hover:text-luxury-gold transition-colors" />
                        <p className="text-sm text-gray-500 dark:text-luxury-text-muted group-hover:text-gray-900 dark:group-hover:text-white transition-colors font-medium">Click để tải banner mới</p>
                        <p className="text-[10px] text-gray-400 dark:text-luxury-text-muted">JPG, PNG, WEBP — tối đa 5MB</p>
                    </div>

                    {bannersLoading ? (
                        <div className="col-span-full py-12 text-center text-gray-500 dark:text-luxury-text-muted">Đang tải danh sách banner...</div>
                    ) : banners.map((banner) => (
                        <div key={banner._id} className="relative group h-48 rounded-2xl overflow-hidden border border-gray-100 dark:border-luxury-border shadow-lg dark:shadow-none bg-white dark:bg-luxury-dark">
                            {banner.imageUrl ? (
                                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-luxury-darker flex items-center justify-center">
                                    <ImageIcon className="w-12 h-12 text-luxury-border" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                            <div className="absolute top-3 left-3">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold tracking-widest ${banner.status === "ACTIVE" ? "bg-emerald-500" : "bg-gray-500"} text-white`}>
                                    {banner.status}
                                </span>
                            </div>
                            <div className="absolute bottom-3 left-3 right-3">
                                <h3 className="text-white font-bold text-sm truncate">{banner.title}</h3>
                                <p className="text-gray-300 dark:text-luxury-text-muted text-[10px]">{formatDate(banner.uploadedAt)}</p>
                            </div>
                            {/* Hover actions */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                <button
                                    onClick={() => handleToggleBannerStatus(banner._id)}
                                    className="p-2 bg-luxury-dark rounded-lg text-luxury-gold hover:bg-luxury-gold hover:text-luxury-dark transition"
                                    title={banner.status === "ACTIVE" ? "Tắt" : "Bật"}
                                >
                                    <Power className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteBanner(banner._id)}
                                    className="p-2 bg-luxury-dark rounded-lg text-red-400 hover:bg-red-500 hover:text-white transition"
                                    title="Xóa banner"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ CAMPAIGN CREATION ═══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form tạo chiến dịch */}
                <div className="lg:col-span-1 bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border shadow-xl dark:shadow-none rounded-3xl p-8 space-y-6 h-fit">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tạo chiến dịch mới</h2>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Tên chiến dịch</label>
                        <input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            type="text"
                            placeholder="VD: Flash Sale 8/3"
                            className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Nhóm áp dụng</label>
                        <select
                            value={formData.group}
                            onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                            className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
                        >
                            <option value="Entire Catalog">Toàn bộ danh mục</option>
                            <option value="Đồng hồ Nam">Đồng hồ Nam</option>
                            <option value="Đồng hồ Nữ">Đồng hồ Nữ</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Phần trăm giảm (%)</label>
                        <div className="relative">
                            <input
                                value={formData.discountPercentage}
                                onChange={(e) => setFormData({ ...formData, discountPercentage: e.target.value })}
                                type="number"
                                min="1" max="100"
                                placeholder="15"
                                className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold font-bold text-lg">%</span>
                        </div>
                    </div>

                    {/* Preview discount */}
                    {previewProduct && formData.discountPercentage && (
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-500/30 p-4 rounded-xl space-y-2 shadow-sm">
                            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Mô phỏng giá trị</p>
                            <div className="flex items-center gap-3">
                                <img src={previewProduct.image} className="w-12 h-12 rounded-lg object-cover" alt="" />
                                <div>
                                    <p className="text-xs text-gray-900 dark:text-white font-medium line-clamp-1">{previewProduct.name}</p>
                                    <div className="flex gap-2 items-center">
                                        <span className="line-through text-xs text-gray-400 dark:text-luxury-text-muted">{previewProduct.price.toLocaleString("vi-VN")}₫</span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {(previewProduct.price * (1 - formData.discountPercentage / 100)).toLocaleString("vi-VN")}₫
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Bắt đầu</label>
                            <input
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                type="datetime-local"
                                className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl px-2 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Kết thúc</label>
                            <input
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                type="datetime-local"
                                className="w-full bg-gray-50 dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-xl px-2 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold transition"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating}
                        className="w-full bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-bold py-4 rounded-xl transition duration-300 mt-4 shadow-lg shadow-luxury-gold/20 disabled:opacity-50 flex justify-center items-center gap-2"
                    >
                        {creating ? (
                            <>
                                <span className="w-5 h-5 border-2 border-luxury-dark border-t-transparent rounded-full animate-spin"></span>
                                Đang xử lý...
                            </>
                        ) : "Kích hoạt chiến dịch"}
                    </button>
                </div>

                {/* Campaign list */}
                <div className="lg:col-span-2 bg-white dark:bg-luxury-dark border border-gray-100 dark:border-luxury-border shadow-xl dark:shadow-none rounded-3xl p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Danh sách chiến dịch</h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left border-b border-gray-100 dark:border-luxury-border/50">
                                    <th className="pb-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Chiến dịch</th>
                                    <th className="pb-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Nhóm</th>
                                    <th className="pb-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Discount</th>
                                    <th className="pb-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Thời gian</th>
                                    <th className="pb-4 text-[10px] font-bold text-gray-500 dark:text-luxury-text-muted uppercase tracking-widest">Status</th>
                                    <th className="pb-4"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-luxury-border/30">
                                {(!campaigns || campaigns.length === 0) && (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-gray-400 dark:text-luxury-text-muted">Chưa có chiến dịch nào</td>
                                    </tr>
                                )}
                                {campaigns?.map((camp) => (
                                    <tr key={camp._id} className={`group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${!camp.isActive ? "opacity-50" : ""}`}>
                                        <td className="py-5">
                                            <div className="font-bold text-gray-900 dark:text-white">{camp.name}</div>
                                            <div className="text-[10px] text-gray-500 dark:text-luxury-text-muted mt-0.5">ID: {camp._id.substring(0, 8)}...</div>
                                        </td>
                                        <td className="py-5 text-sm text-gray-600 dark:text-luxury-text-muted">{camp.isGlobal ? "Toàn bộ" : camp.group}</td>
                                        <td className="py-5 font-bold text-luxury-gold">{camp.discountPercentage}%</td>
                                        <td className="py-5 text-[10px] text-gray-500 dark:text-luxury-text-muted">
                                            {formatDate(camp.startDate)} <br /><span className="text-gray-400 dark:text-gray-500">tới</span> {formatDate(camp.endDate)}
                                        </td>
                                        <td className="py-5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${camp.status === "Active" ? "bg-emerald-500" : camp.status === "Scheduled" ? "bg-blue-500" : "bg-gray-500"}`} />
                                                <span className={`text-xs font-bold uppercase tracking-wider ${camp.status === "Active" ? "text-emerald-500" : camp.status === "Scheduled" ? "text-blue-500" : "text-gray-500"}`}>
                                                    {camp.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-5 text-right">
                                            <button onClick={() => toggleCampaignStatus(camp._id)} className="p-2 text-gray-400 dark:text-luxury-text-muted hover:text-luxury-gold transition-colors mr-2" title="Bật/Tắt">
                                                <Power className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => deleteCampaign(camp._id)} className="p-2 text-gray-400 dark:text-luxury-text-muted hover:text-red-400 transition-colors" title="Xoá">
                                                <Trash2 className="w-4 h-4" />
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
