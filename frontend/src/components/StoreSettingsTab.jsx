import { useEffect, useState } from "react";
import { Save, Layout, Type, Grid, MessageSquareText, Eye, EyeOff, ChevronUp, ChevronDown, Layers, GripVertical } from "lucide-react";
import { useStorefrontStore } from "../stores/useStorefrontStore";

const ALL_SECTIONS = [
	{ key: "hero",       label: "Hero Banner",        desc: "áº¢nh lá»›n Ä‘áº§u trang kĂ¨m slogan" },
	{ key: "flashSale",  label: "Flash Sale",          desc: "Khu vá»±c khuyáº¿n mĂ£i & Ä‘áº¿m ngÆ°á»£c" },
	{ key: "bestSeller", label: "Sáº£n pháº©m BĂ¡n Cháº¡y",  desc: "Grid sáº£n pháº©m doanh sá»‘ cao nháº¥t" },
	{ key: "newsletter", label: "ÄÄƒng kĂ½ nháº­n tin",    desc: "Form thu tháº­p email khĂ¡ch hĂ ng" },
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

	if (!formData) return <div className="p-8 text-center">Äang táº£i cáº¥u hĂ¬nh Storefront...</div>;

	return (
		<div className="max-w-4xl mx-auto">
			<div className="mb-8">
				<h2 className="text-2xl font-bold font-luxury text-luxury-gold flex items-center gap-3">
					<Layout className="w-6 h-6" /> Quáº£n LĂ½ Giao Diá»‡n KhĂ¡ch HĂ ng
				</h2>
				<p className="text-gray-500 mt-2 text-sm">
					Tuá»³ chá»‰nh cáº¥u trĂºc hiá»ƒn thá»‹ trang chá»§ vĂ  vÄƒn báº£n tiáº¿p thá»‹. Má»i thay Ä‘á»•i live ngay láº­p tá»©c.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-8">

				{/* A3: SECTION MANAGER */}
				<div className="bg-white dark:bg-black/20 p-6 flex flex-col gap-4 rounded-2xl border border-gray-100 dark:border-white/5">
					<h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
						<Layers className="w-5 h-5 text-purple-500" /> Báº­t/Táº¯t & Sáº¯p xáº¿p Sections Trang Chá»§
					</h3>
					<p className="text-xs text-gray-400 -mt-2">DĂ¹ng nĂºt â†‘â†“ Ä‘á»ƒ Ä‘á»•i thá»© tá»±. Nháº¥n biá»ƒu tÆ°á»£ng máº¯t Ä‘á»ƒ áº©n/hiá»‡n tá»«ng section.</p>
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
											className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20 transition" title="LĂªn trĂªn">
											<ChevronUp className="w-4 h-4" />
										</button>
										<button type="button" onClick={() => moveSection(item.key, 1)} disabled={idx === sectionLayout.length - 1}
											className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-20 transition" title="Xuá»‘ng dÆ°á»›i">
											<ChevronDown className="w-4 h-4" />
										</button>
										<button type="button" onClick={() => toggleSection(item.key)}
											className={`p-1.5 rounded-lg transition ml-1 ${item.enabled ? "text-emerald-400 hover:bg-emerald-400/10" : "text-gray-400 hover:bg-white/10"}`}
											title={item.enabled ? "Táº¯t section" : "Báº­t section"}>
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
						<Type className="w-5 h-5 text-indigo-500" /> VÄƒn báº£n Tiáº¿p thá»‹
					</h3>
					<div>
						<label className="block text-sm font-medium mb-2 opacity-80">Slogan Trang Chá»§ (Hero Section)</label>
						<textarea name="heroSlogan" value={formData.heroSlogan || ""} onChange={handleChange}
							className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:ring-2 focus:ring-luxury-gold outline-none" rows="2" />
					</div>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">TiĂªu Ä‘á» Banner Flash Sale</label>
							<input type="text" name="flashSaleTitle" value={formData.flashSaleTitle || ""} onChange={handleChange}
								className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:ring-2 focus:ring-luxury-gold outline-none" />
						</div>
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">TiĂªu Ä‘á» Khá»‘i Sáº£n pháº©m BĂ¡n cháº¡y</label>
							<input type="text" name="bestSellerTitle" value={formData.bestSellerTitle || ""} onChange={handleChange}
								className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-white/10 bg-transparent text-sm focus:ring-2 focus:ring-luxury-gold outline-none" />
						</div>
					</div>
				</div>

				{/* LAYOUT SETTINGS */}
				<div className="bg-white dark:bg-black/20 p-6 flex flex-col gap-6 rounded-2xl border border-gray-100 dark:border-white/5">
					<h3 className="font-bold text-lg flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-4">
						<Grid className="w-5 h-5 text-emerald-500" /> Bá»‘ cá»¥c LÆ°á»›i & Hiá»ƒn thá»‹
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">Sá»‘ cá»™t sáº£n pháº©m (Desktop)</label>
							<div className="flex gap-2">
								{[3, 4, 5, 6].map(num => (
									<label key={num} className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition ${Number(formData.gridColumns) === num ? "border-luxury-gold bg-luxury-gold/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
										<input type="radio" name="gridColumns" value={num} checked={Number(formData.gridColumns) === num} onChange={handleChange} className="sr-only" />
										<span className="font-bold text-lg mb-1">{num}</span>
										<span className="text-xs text-gray-500">Cá»™t</span>
									</label>
								))}
							</div>
							<p className="text-xs text-gray-400 mt-2">Ăp dá»¥ng trĂªn trang Catalog. Äá» xuáº¥t 4-5 cá»™t.</p>
						</div>
						<div>
							<label className="block text-sm font-medium mb-2 opacity-80">Sá»‘ SP ná»•i báº­t trang chá»§</label>
							<div className="flex gap-2">
								{[4, 6, 8, 12].map(num => (
									<label key={num} className={`flex-1 flex flex-col items-center justify-center cursor-pointer p-4 rounded-xl border-2 transition ${Number(formData.featuredCount) === num ? "border-luxury-gold bg-luxury-gold/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
										<input type="radio" name="featuredCount" value={num} checked={Number(formData.featuredCount) === num} onChange={handleChange} className="sr-only" />
										<span className="font-bold text-lg mb-1">{num}</span>
										<span className="text-xs text-gray-500">SP</span>
									</label>
								))}
							</div>
							<p className="text-xs text-gray-400 mt-2">Section &quot;Tuyá»ƒn chá»n tinh hoa&quot; trang chá»§.</p>
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
							<span className="font-medium text-sm">Báº­t nĂºt Trá»£ lĂ½ AI Cá»‘ váº¥n</span>
						</div>
					</label>
				</div>

				{/* SAVE BUTTON */}
				<div className="flex justify-end pt-2">
					<button type="submit" disabled={loading}
						className="bg-luxury-gold hover:bg-yellow-500 text-lux-dark font-bold px-10 py-4 rounded-xl flex items-center justify-center gap-3 transition shadow-lg disabled:opacity-50">
						{loading ? <span className="animate-spin rounded-full w-5 h-5 border-b-2 border-lux-dark"></span> : <Save className="w-5 h-5" />}
						LÆ¯U & XUáº¤T Báº¢N NGAY
					</button>
				</div>
			</form>
		</div>
	);
};

export default StoreSettingsTab;

