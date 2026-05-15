import { useState, useCallback } from "react";
import { RotateCcw, Star, ChevronDown, Filter } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const CATEGORIES = [
	"Cơ Tự Động (Automatic)",
	"Cơ Lên Cót Tay (Hand-wound)",
	"Bộ Máy Pin (Quartz)",
	"Năng Lượng Ánh Sáng (Solar)",
	"Đồng Hồ Điện Tử (Digital)",
	"Đồng Hồ Thông Minh (Smartwatch)",
];

const BRANDS = ["Rolex", "Casio", "Seiko", "Citizen", "Garmin", "Patek Philippe", "Audemars Piguet", "Hublot", "Omega", "Cartier", "Tag Heuer", "IWC"];
const MACHINE_TYPES = [
	{ value: "Mechanical", label: "Cơ lên cót" },
	{ value: "Quartz", label: "Bộ máy pin" },
	{ value: "Automatic", label: "Cơ tự động" },
	{ value: "Solar", label: "Năng lượng ánh sáng" },
	{ value: "Digital", label: "Điện tử" },
	{ value: "Smartwatch", label: "Đồng hồ thông minh" },
];
const STRAP_MATERIALS = ["Da", "Thép không gỉ", "Cao su", "Vải NATO", "Ceramic", "Titanium"];
const COLORS = [
	{ name: "Đen", hex: "#111111" },
	{ name: "Bạc", hex: "#C0C0C0" },
	{ name: "Vàng", hex: "#D4AF37" },
	{ name: "Xanh dương", hex: "#1D4ED8" },
	{ name: "Trắng", hex: "#F5F5F5" },
	{ name: "Nâu", hex: "#92400E" },
	{ name: "Xanh lá", hex: "#065F46" },
	{ name: "Đỏ", hex: "#B91C1C" },
];
const SIZES = ["36mm", "38mm", "40mm", "41mm", "42mm", "44mm", "45mm", "46mm+"];
const RATINGS = [5, 4, 3, 2, 1];

const FilterSection = ({ title, children, defaultOpen = true }) => {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<div className="mb-5 rounded-2xl border border-black/5 dark:border-white/5 bg-white/85 dark:bg-white/5 px-4 py-4 shadow-sm">
			<button
				type="button"
				onClick={() => setOpen((value) => !value)}
				className="flex w-full items-center justify-between gap-3 text-left"
			>
				<h3 className="text-[10px] font-semibold uppercase tracking-[0.32em] text-gray-500 transition group-hover:text-luxury-gold">
					{title}
				</h3>
				<ChevronDown className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
			</button>
			{open && <div className="mt-4 animate-fade-in">{children}</div>}
		</div>
	);
};

const FilterSidebar = () => {
	const { filters, setFilters, fetchFilteredProducts } = useProductStore();
	const [minPriceInput, setMinPriceInput] = useState(filters.minPrice > 0 ? String(filters.minPrice / 1_000_000) : "");
	const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice < 1_000_000_000 ? String(filters.maxPrice / 1_000_000) : "");

	const activeCount = [
		(filters.brands?.length || 0) > 0,
		!!filters.category && filters.category !== "",
		(filters.machineType?.length || 0) > 0,
		(filters.strapMaterial?.length || 0) > 0,
		(filters.colors?.length || 0) > 0,
		(filters.sizes?.length || 0) > 0,
		filters.minRating > 0,
		filters.minPrice > 0 || filters.maxPrice < 1_000_000_000,
	].filter(Boolean).length;

	const applyLiveFilters = useCallback(
		(newFilters) => {
			setFilters(newFilters);
			setTimeout(() => fetchFilteredProducts(), 0);
		},
		[setFilters, fetchFilteredProducts]
	);

	const toggleArrayFilter = (arrayName, value) => {
		const currentArr = filters[arrayName] || [];
		const updatedArr = currentArr.includes(value)
			? currentArr.filter((item) => item !== value)
			: [...currentArr, value];
		applyLiveFilters({ [arrayName]: updatedArr });
	};

	const applyPriceFilter = () => {
		const min = minPriceInput ? Number(minPriceInput) * 1_000_000 : 0;
		const max = maxPriceInput ? Number(maxPriceInput) * 1_000_000 : 1_000_000_000;
		applyLiveFilters({ minPrice: min, maxPrice: max });
	};

	const handleReset = () => {
		setMinPriceInput("");
		setMaxPriceInput("");
		setFilters({
			brands: [],
			category: "",
			maxPrice: 1000000000,
			minPrice: 0,
			machineType: [],
			strapMaterial: [],
			colors: [],
			sizes: [],
			minRating: 0,
		});
		setTimeout(() => fetchFilteredProducts(), 0);
	};

	return (
		<aside className="w-full lg:w-72 flex-shrink-0">
			<div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 custom-scrollbar pb-10">
				<div className="rounded-[1.5rem] border border-black/5 dark:border-white/5 bg-[linear-gradient(180deg,rgba(248,245,240,0.95),rgba(255,255,255,0.96))] dark:bg-[linear-gradient(180deg,rgba(17,17,17,0.95),rgba(10,10,10,0.98))] px-4 py-4 mb-6 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)]">
					<p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-3">Filter controls</p>
					<div className="flex items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<Filter className="h-4 w-4 text-luxury-gold" />
							<h2 className="text-sm font-semibold text-gray-900 dark:text-white">
								Bộ lọc
								{activeCount > 0 && (
									<span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-luxury-gold text-lux-dark text-[10px] font-bold">
										{activeCount}
									</span>
								)}
							</h2>
						</div>
						{activeCount > 0 && (
							<button type="button" onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-luxury-gold">
								<RotateCcw className="h-3 w-3" /> Đặt lại
							</button>
						)}
					</div>
				</div>

				<FilterSection title="Loại đồng hồ" defaultOpen>
					<select
						value={filters.category || ""}
						onChange={(e) => applyLiveFilters({ category: e.target.value })}
						className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 transition focus:border-luxury-gold focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
					>
						<option value="">Tất cả loại</option>
						{CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>{cat}</option>
						))}
					</select>
				</FilterSection>

				<FilterSection title="Thương hiệu" defaultOpen>
					<div className="max-h-48 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
						{BRANDS.map((brand) => {
							const active = filters.brands?.includes(brand);
							return (
								<label key={brand} className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-black/5 dark:hover:bg-white/5" onClick={() => toggleArrayFilter("brands", brand)}>
									<div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${active ? "border-luxury-gold bg-luxury-gold" : "border-gray-300 dark:border-zinc-600"}`}>
										{active && (
											<svg className="h-2.5 w-2.5 text-black" fill="none" viewBox="0 0 12 12">
												<path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										)}
									</div>
									<span className={`text-xs transition ${active ? "font-medium text-luxury-gold" : "text-gray-500 dark:text-gray-400"}`}>
										{brand}
									</span>
								</label>
							);
						})}
					</div>
				</FilterSection>

				<FilterSection title="Khoảng giá (Triệu ₫)" defaultOpen>
					<div className="flex items-center gap-2">
						<input
							type="number"
							placeholder="Từ"
							value={minPriceInput}
							onChange={(e) => setMinPriceInput(e.target.value)}
							onBlur={applyPriceFilter}
							onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
							min={0}
							className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-900 transition focus:border-luxury-gold focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
						/>
						<span className="flex-shrink-0 text-xs text-gray-400">–</span>
						<input
							type="number"
							placeholder="Đến"
							value={maxPriceInput}
							onChange={(e) => setMaxPriceInput(e.target.value)}
							onBlur={applyPriceFilter}
							onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
							min={0}
							className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs text-gray-900 transition focus:border-luxury-gold focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
						/>
					</div>
					<button type="button" onClick={applyPriceFilter} className="btn-outline mt-2 w-full rounded-2xl py-2 text-xs font-semibold hover:bg-luxury-gold hover:text-lux-dark hover:border-luxury-gold">
						Áp dụng
					</button>
				</FilterSection>

				<FilterSection title="Bộ máy" defaultOpen={false}>
					<div className="flex flex-wrap gap-2">
						{MACHINE_TYPES.map((type) => {
							const active = filters.machineType?.includes(type.value);
							return (
								<button key={type.value} type="button" onClick={() => toggleArrayFilter("machineType", type.value)} className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-luxury-gold bg-luxury-gold text-lux-dark font-semibold" : "border-gray-200 text-gray-500 hover:border-luxury-gold hover:text-black dark:border-zinc-700 dark:text-gray-400 dark:hover:text-white"}`}>
									{type.label}
								</button>
							);
						})}
					</div>
				</FilterSection>

				<FilterSection title="Dây đeo" defaultOpen={false}>
					<div className="flex flex-wrap gap-2">
						{STRAP_MATERIALS.map((mat) => {
							const active = filters.strapMaterial?.includes(mat);
							return (
								<button key={mat} type="button" onClick={() => toggleArrayFilter("strapMaterial", mat)} className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-luxury-gold bg-luxury-gold text-lux-dark font-semibold" : "border-gray-200 text-gray-500 hover:border-luxury-gold hover:text-black dark:border-zinc-700 dark:text-gray-400 dark:hover:text-white"}`}>
									{mat}
								</button>
							);
						})}
					</div>
				</FilterSection>

				<FilterSection title="Màu sắc" defaultOpen={false}>
					<div className="flex flex-wrap gap-2">
						{COLORS.map((color) => {
							const active = filters.colors?.includes(color.name);
							const lightColor = color.hex === "#F5F5F5" || color.hex === "#C0C0C0";
							return (
								<button
									key={color.name}
									type="button"
									onClick={() => toggleArrayFilter("colors", color.name)}
									title={color.name}
									className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${active ? "scale-110 ring-2 ring-luxury-gold ring-offset-2 ring-offset-white shadow-[0_0_10px_rgba(212,175,55,0.35)] dark:ring-offset-zinc-950" : "hover:scale-105"}`}
									style={{
										backgroundColor: color.hex,
										borderColor: active ? "#D4AF37" : lightColor ? "#9CA3AF" : "transparent",
									}}
								>
									{active && (
										<svg className={`h-4 w-4 ${lightColor ? "text-gray-800" : "text-white"}`} viewBox="0 0 24 24" fill="none">
											<path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									)}
								</button>
							);
						})}
					</div>
				</FilterSection>

				<FilterSection title="Kích thước mặt" defaultOpen={false}>
					<div className="grid grid-cols-4 gap-1.5">
						{SIZES.map((size) => {
							const active = filters.sizes?.includes(size);
							return (
								<button key={size} type="button" onClick={() => toggleArrayFilter("sizes", size)} className={`rounded-lg border py-1.5 text-[10px] transition ${active ? "border-luxury-gold bg-luxury-gold text-lux-dark font-semibold" : "border-gray-200 bg-gray-50 text-gray-500 hover:border-luxury-gold hover:text-black dark:border-zinc-800 dark:bg-zinc-900 dark:text-gray-400 dark:hover:text-white"}`}>
									{size}
								</button>
							);
						})}
					</div>
				</FilterSection>

				<FilterSection title="Đánh giá" defaultOpen={false}>
					<div className="space-y-2">
						{RATINGS.map((rating) => {
							const active = filters.minRating === rating;
							return (
								<label
									key={rating}
									className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-black/5 dark:hover:bg-white/5"
									onClick={(e) => {
										e.preventDefault();
										applyLiveFilters({ minRating: active ? 0 : rating });
									}}
								>
									<div className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${active ? "border-luxury-gold bg-luxury-gold" : "border-gray-300 dark:border-zinc-700"}`}>
										{active && (
											<svg className="h-2.5 w-2.5 text-black" fill="none" viewBox="0 0 12 12">
												<path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
											</svg>
										)}
									</div>
									<div className="flex items-center gap-0.5">
										{[...Array(5)].map((_, i) => (
											<Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-luxury-gold text-luxury-gold" : "text-gray-200 dark:text-zinc-700"}`} />
										))}
										<span className={`ml-1 text-[10px] transition ${active ? "text-luxury-gold" : "text-gray-500 dark:text-gray-400"}`}>
											{rating === 5 ? "5 sao" : `${rating}+ sao`}
										</span>
									</div>
								</label>
							);
						})}
					</div>
				</FilterSection>
			</div>
		</aside>
	);
};

export default FilterSidebar;
