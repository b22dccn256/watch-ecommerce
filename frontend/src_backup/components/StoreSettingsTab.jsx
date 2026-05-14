import { useEffect, useState } from "react";
import { Save, Layout, Type, Grid, MessageSquareText, Eye, EyeOff, ChevronUp, ChevronDown, Layers, GripVertical } from "lucide-react";
import { useStorefrontStore } from "../stores/useStorefrontStore";

const ALL_SECTIONS = [
	{ key: "hero",       label: "Hero Banner",        desc: "Ảnh lớn đầu trang kèm slogan" },
	{ key: "flashSale",  label: "Flash Sale",          desc: "Khu vực khuyến mãi & đếm ngược" },
	{ key: "bestSeller", label: "Sản phẩm Bán Chạy",  desc: "Grid sản phẩm doanh số cao nhất" },
	{ key: "newsletter", label: "Đăng ký nhận tin",    desc: "Form thu thập email khách hàng" },
];

const StoreSettingsTab = () => {
	const { config, fetchConfig, updateConfig, loading } = useStorefrontStore();
	const [formData, setFormData] = useState(null);
	const [sectionLayout, setSectionLayout] = useState([]);

	useEffect(() => { fetchConfig(); }, [fetchConfig]);

	useEffect(() => {
		if (config) {
			setFormData(config);
			const saved = config.homeLayout || ["hero", "flashSale", "bestSeller"];
			const ordered = saved.filter(k => ALL_SECTIONS.find(s => s.key === k));
			const disabled = ALL_SECTIONS.map(s => s.key).filter(k => !ordered.includes(k));
			setSectionLayout([
				...ordered.map(k => ({ key: k, enabled: true })),
				...disabled.map(k => ({ key: k, enabled: false })),
			]);
		}
	}, [config]);

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		const numberFields = ["gridColumns", "featuredCount"];
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : numberFields.includes(name) ? Number(value) : value,
		}));
	};

	const toggleSection = (key) => {
		setSectionLayout(prev => prev.map(s => s.key === key ? { ...s, enabled: !s.enabled } : s));
	};

	const moveSection = (key, direction) => {
		setSectionLayout(prev => {
			const idx = prev.findIndex(s => s.key === key);
			const newIdx = idx + direction;
			if (newIdx < 0 || newIdx >= prev.length) return prev;
			const arr = [...prev];
			[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
			return arr;
		});
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const homeLayout = sectionLayout.filter(s => s.enabled).map(s => s.key);
		updateConfig({ ...formData, homeLayout });
	};

	if (!formData) return <div className="p-8 text-center">Đang tải cấu hình Storefront...</div>;

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold font-luxury text-luxury-gold flex items-center gap-3">
					<Layout className="w-6 h-6" /> Quản Lý Giao Diện Khách Hàng
				</h2>
				<p className="text-gray-500 mt-2 text-sm">
					Tuỳ chỉnh cấu trúc hiển thị trang chủ và văn bản tiếp thị. Mọi thay đổi live ngay lập tức.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">

				{/* A3: SECTION MANAGER */}
				<div className="bg-white dark:bg-black/20 p-6 flex flex-col gap-4 rounded-2xl border border-gray-100 dark:border-white/5">
					<h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
						<Layers className="w-5 h-5 text-purple-500" /> Bật/Tắt & Sắp xếp Sections Trang Chủ
					</h3>
					<p className="text-xs text-gray-400 -mt-2">Dùng nút ↑↓ để đổi thứ tự. Nhấn biểu tượng mắt để ẩn/hiện từng section.</p>
					<div className="space-y-2">
						{sectionLayout.map((item, idx) => {
							const meta = ALL_SECTIONS.find(s => s.key === item.key);
							return (
								<div key={item.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.enabled ? "border-luxury-gold/30 bg-luxury-gold/5" : "border-gray-200 dark:border-gray-700 opacity-50"}`}>
									<GripVertical className="w-4 h-4 text-gray-400 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm text-gray-900 dark:text-white">{meta?.label}</p>
										<p className="text-xs text-gray-500">{meta?.desc}</p>
									</div>
									<div className="flex items-center gap-1">
										<button type="button" onClick={() => moveSection(item.key, -1)} disabled={idx === 0}
											className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20 transition" title="Lên trên">
											<ChevronUp className="w-4 h-4" />
										</button>
										<button type="button" onClick={() => moveSection(item.key, 1)} disabled={idx === sectionLayout.length - 1}
											className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20 transition" title="Xuống dưới">
											<ChevronDown className="w-4 h-4" />
										</button>
										<button type="button" onClick={() => toggleSection(item.key)}
											className={`p-1.5 rounded-lg transition ml-1 ${item.enabled ? "text-emerald-400 hover:bg-emerald-400/10" : "text-gray-400 hover:bg-white/10"}`}
											title={item.enabled ? "Tắt section" : "Bật section"}>
											{item.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
										</button>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				{/* TEXT CONTENT */}
				<div className="bg-white dark:bg-black/20 p-6 flex flex-col gap-6 rounded-2xl border border-gray-100 dark:border-white/5">
					<h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
						<Type className="w-5 h-5 text-indigo-500" /> Văn bản Tiếp thị
					</h3>
					<div>
						<label className="block text-sm font-medium mb-2 opacity-80">Slogan Trang Chủ (Hero Section)</label>
						<textarea name="heroSlogan" value={formData.heroSlogan || ""} onChange={handleChange}
							className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:ring-2 focus:ring-luxury-gold outline-none" rows="2" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">Tiêu đề Banner Flash Sale</label>
							<input type="text" name="flashSaleTitle" value={formData.flashSaleTitle || ""} onChange={handleChange}
								className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:ring-2 focus:ring-luxury-gold outline-none" />
						</div>
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">Tiêu đề Khối Sản phẩm Bán chạy</label>
							<input type="text" name="bestSellerTitle" value={formData.bestSellerTitle || ""} onChange={handleChange}
								className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:ring-2 focus:ring-luxury-gold outline-none" />
						</div>
					</div>
				</div>

				{/* LAYOUT SETTINGS */}
				<div className="bg-white dark:bg-black/20 p-6 flex flex-col gap-6 rounded-2xl border border-gray-100 dark:border-white/5">
					<h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
						<Grid className="w-5 h-5 text-emerald-500" /> Bố cục Lưới & Hiển thị
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">Số cột sản phẩm (Desktop)</label>
							<div className="flex gap-2">
								{[3, 4, 5, 6].map(num => (
									<label key={num} className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition ${Number(formData.gridColumns) === num ? "border-luxury-gold bg-luxury-gold/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
										<input type="radio" name="gridColumns" value={num} checked={Number(formData.gridColumns) === num} onChange={handleChange} className="sr-only" />
										<span className="font-bold text-lg mb-1">{num}</span>
										<span className="text-xs text-gray-500">Cột</span>
									</label>
								))}
							</div>
							<p className="text-xs text-gray-400 mt-2">Áp dụng trên trang Catalog. Đề xuất 4-5 cột.</p>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">Số SP nổi bật trang chủ</label>
							<div className="flex gap-2">
								{[4, 6, 8, 12].map(num => (
									<label key={num} className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition ${Number(formData.featuredCount) === num ? "border-luxury-gold bg-luxury-gold/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
										<input type="radio" name="featuredCount" value={num} checked={Number(formData.featuredCount) === num} onChange={handleChange} className="sr-only" />
										<span className="font-bold text-lg mb-1">{num}</span>
										<span className="text-xs text-gray-500">SP</span>
									</label>
								))}
							</div>
							<p className="text-xs text-gray-400 mt-2">Section &quot;Tuyển chọn tinh hoa&quot; trang chủ.</p>
						</div>
					</div>
					<label className="flex items-center gap-4 cursor-pointer bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
						<div className="relative">
							<input type="checkbox" name="showChatBot" checked={formData.showChatBot} onChange={handleChange} className="sr-only" />
							<div className={`block w-10 h-6 rounded-full transition-colors ${formData.showChatBot ? "bg-emerald-500" : "bg-gray-600"}`}></div>
							<div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.showChatBot ? "transform translate-x-4" : ""}`}></div>
						</div>
						<div className="flex items-center gap-3">
							<MessageSquareText className="w-5 h-5 text-emerald-500" />
							<span className="font-medium text-sm">Bật nút Trợ lý AI Cố vấn</span>
						</div>
					</label>
				</div>

				{/* SAVE BUTTON */}
				<div className="flex justify-end pt-2">
					<button type="submit" disabled={loading}
						className="bg-luxury-gold hover:bg-yellow-500 text-lux-dark font-bold px-10 py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:opacity-50">
						{loading ? <span className="animate-spin rounded-full w-5 h-5 border-b-2 border-lux-dark"></span> : <Save className="w-5 h-5" />}
						LƯU & XUẤT BẢN NGAY
					</button>
				</div>
			</form>
		</div>
	);
};

export default StoreSettingsTab;
