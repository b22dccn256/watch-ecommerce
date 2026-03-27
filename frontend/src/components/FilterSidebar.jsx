import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, RotateCcw, Star, ChevronDown, X, Filter } from "lucide-react";
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
const MACHINE_TYPES = ["Mechanical", "Quartz", "Automatic", "Solar", "Digital", "Smartwatch"];
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

// Collapsible section component
const FilterSection = ({ title, children, defaultOpen = true }) => {
	const [open, setOpen] = useState(defaultOpen);
	return (
		<div className="mb-6">
			<button
				onClick={() => setOpen(!open)}
				className="w-full flex items-center justify-between mb-3 group"
			>
				<h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase group-hover:text-[#D4AF37] transition">
					{title}
				</h3>
				<ChevronDown
					className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
				/>
			</button>
			{open && <div className="animate-fade-in">{children}</div>}
		</div>
	);
};

const FilterSidebar = () => {
	const { filters, setFilters, fetchFilteredProducts } = useProductStore();

	const [minPriceInput, setMinPriceInput] = useState(
		filters.minPrice > 0 ? String(filters.minPrice / 1_000_000) : ""
	);
	const [maxPriceInput, setMaxPriceInput] = useState(
		filters.maxPrice < 1_000_000_000 ? String(filters.maxPrice / 1_000_000) : ""
	);

	// Compute active filter count
	const activeCount = [
		(filters.brands?.length || 0) > 0,
		!!filters.category && filters.category !== "",
		filters.machineType?.length > 0,
		filters.strapMaterial?.length > 0,
		filters.colors?.length > 0,
		filters.sizes?.length > 0,
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

	// Price apply on blur / Enter
	const applyPriceFilter = () => {
		const min = minPriceInput ? Number(minPriceInput) * 1_000_000 : 0;
		const max = maxPriceInput ? Number(maxPriceInput) * 1_000_000 : 1_000_000_000;
		applyLiveFilters({ minPrice: min, maxPrice: max });
	};

	const handleReset = () => {
		const reset = {
			brands: [],
			category: "",
			maxPrice: 1000000000,
			minPrice: 0,
			machineType: [],
			strapMaterial: [],
			colors: [],
			sizes: [],
			minRating: 0,
		};
		setMinPriceInput("");
		setMaxPriceInput("");
		setFilters(reset);
		setTimeout(() => fetchFilteredProducts(), 0);
	};

	return (
		<aside className="w-60 flex-shrink-0">
			<div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 custom-scrollbar pb-10">

				{/* ── Header ─────────────────────────────── */}
				<div className="flex items-center justify-between mb-6">
					<div className="flex items-center gap-2">
						<Filter className="text-[#D4AF37] w-4 h-4" />
						<h2 className="text-sm font-semibold text-gray-900 dark:text-white">
							Bộ lọc
							{activeCount > 0 && (
								<span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D4AF37] text-lux-dark text-[10px] font-bold">
									{activeCount}
								</span>
							)}
						</h2>
					</div>
					{activeCount > 0 && (
						<button
							onClick={handleReset}
							className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#D4AF37] transition"
						>
							<RotateCcw className="w-3 h-3" /> Đặt lại
						</button>
					)}
				</div>

				{/* ── CATEGORY ────────────────────────────── */}
				<FilterSection title="Loại đồng hồ" defaultOpen={true}>
					<select
						value={filters.category || ""}
						onChange={(e) => applyLiveFilters({ category: e.target.value })}
						className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition"
					>
						<option value="">Tất cả loại</option>
						{CATEGORIES.map((cat) => (
							<option key={cat} value={cat}>{cat}</option>
						))}
					</select>
				</FilterSection>

				{/* ── BRAND ────────────────────────────────── */}
				<FilterSection title="Thương hiệu" defaultOpen={true}>
					<div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
						{BRANDS.map((brand) => (
							<label
								key={brand}
								className="flex items-center gap-3 cursor-pointer group"
								onClick={() => toggleArrayFilter("brands", brand)}
							>
								<div
									className={`w-4 h-4 rounded border flex items-center justify-center transition flex-shrink-0 ${
										filters.brands?.includes(brand)
											? "bg-[#D4AF37] border-[#D4AF37]"
											: "border-gray-300 dark:border-zinc-600 group-hover:border-[#D4AF37]"
									}`}
								>
									{filters.brands?.includes(brand) && (
										<svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 12 12">
											<path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									)}
								</div>
								<span
									className={`text-xs transition ${
										filters.brands?.includes(brand)
											? "text-[#D4AF37] font-medium"
											: "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
									}`}
								>
									{brand}
								</span>
							</label>
						))}
					</div>
				</FilterSection>

				{/* ── PRICE RANGE ──────────────────────────── */}
				<FilterSection title="Khoảng giá (Triệu ₫)" defaultOpen={true}>
					<div className="flex items-center gap-2">
						<input
							type="number"
							placeholder="Từ"
							value={minPriceInput}
							onChange={(e) => setMinPriceInput(e.target.value)}
							onBlur={applyPriceFilter}
							onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
							min={0}
							className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition"
						/>
						<span className="text-gray-400 text-xs flex-shrink-0">–</span>
						<input
							type="number"
							placeholder="Đến"
							value={maxPriceInput}
							onChange={(e) => setMaxPriceInput(e.target.value)}
							onBlur={applyPriceFilter}
							onKeyDown={(e) => e.key === "Enter" && applyPriceFilter()}
							min={0}
							className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37] transition"
						/>
					</div>
					<button
						onClick={applyPriceFilter}
						className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition"
					>
						Áp dụng
					</button>
				</FilterSection>

				{/* ── MACHINE TYPE ─────────────────────────── */}
				<FilterSection title="Bộ máy" defaultOpen={false}>
					<div className="flex flex-wrap gap-2">
						{MACHINE_TYPES.map((type) => (
							<button
								key={type}
								onClick={() => toggleArrayFilter("machineType", type)}
								className={`px-3 py-1.5 rounded-full text-xs border transition ${
									filters.machineType?.includes(type)
										? "bg-[#D4AF37] border-[#D4AF37] text-black font-semibold"
										: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-[#D4AF37] hover:text-black dark:hover:text-white"
								}`}
							>
								{type}
							</button>
						))}
					</div>
				</FilterSection>

				{/* ── STRAP MATERIAL ──────────────────────── */}
				<FilterSection title="Dây đeo" defaultOpen={false}>
					<div className="flex flex-wrap gap-2">
						{STRAP_MATERIALS.map((mat) => (
							<button
								key={mat}
								onClick={() => toggleArrayFilter("strapMaterial", mat)}
								className={`px-3 py-1.5 rounded-full text-xs border transition ${
									filters.strapMaterial?.includes(mat)
										? "bg-[#D4AF37] border-[#D4AF37] text-black font-semibold"
										: "border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-gray-400 hover:border-[#D4AF37] hover:text-black dark:hover:text-white"
								}`}
							>
								{mat}
							</button>
						))}
					</div>
				</FilterSection>

				{/* ── COLORS ───────────────────────────────── */}
				<FilterSection title="Màu sắc" defaultOpen={false}>
					<div className="flex flex-wrap gap-2">
						{COLORS.map((color) => (
							<button
								key={color.name}
								onClick={() => toggleArrayFilter("colors", color.name)}
								title={color.name}
								className={`w-8 h-8 rounded-full transition-all border-2 ${
									filters.colors?.includes(color.name)
										? "scale-110 shadow-[0_0_8px_rgba(212,175,55,0.6)]"
										: "hover:scale-105"
								}`}
								style={{
									backgroundColor: color.hex,
									borderColor: filters.colors?.includes(color.name)
										? "#D4AF37"
										: color.hex === "#F5F5F5" || color.hex === "#C0C0C0"
										? "#9CA3AF"
										: "transparent",
								}}
							/>
						))}
					</div>
				</FilterSection>

				{/* ── SIZES ────────────────────────────────── */}
				<FilterSection title="Kích thước mặt" defaultOpen={false}>
					<div className="grid grid-cols-4 gap-1.5">
						{SIZES.map((size) => (
							<button
								key={size}
								onClick={() => toggleArrayFilter("sizes", size)}
								className={`py-1.5 rounded-lg text-[10px] border transition ${
									filters.sizes?.includes(size)
										? "bg-[#D4AF37] border-[#D4AF37] text-black font-semibold"
										: "bg-gray-50 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-[#D4AF37] hover:text-black dark:hover:text-white"
								}`}
							>
								{size}
							</button>
						))}
					</div>
				</FilterSection>

				{/* ── RATING ───────────────────────────────── */}
				<FilterSection title="Đánh giá" defaultOpen={false}>
					<div className="space-y-2">
						{RATINGS.map((rating) => (
							<label
								key={rating}
								className="flex items-center gap-3 cursor-pointer group"
								onClick={(e) => {
									e.preventDefault();
									applyLiveFilters({ minRating: rating === filters.minRating ? 0 : rating });
								}}
							>
								<div
									className={`w-4 h-4 rounded border flex items-center justify-center transition flex-shrink-0 ${
										filters.minRating === rating
											? "bg-[#D4AF37] border-[#D4AF37]"
											: "border-gray-300 dark:border-zinc-700 group-hover:border-[#D4AF37]"
									}`}
								>
									{filters.minRating === rating && (
										<svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 12 12">
											<path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
										</svg>
									)}
								</div>
								<div className="flex items-center gap-0.5">
									{[...Array(5)].map((_, i) => (
										<Star
											key={i}
											className={`w-3.5 h-3.5 ${
												i < rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-gray-200 dark:text-zinc-700"
											}`}
										/>
									))}
									<span
										className={`text-[10px] ml-1 transition ${
											filters.minRating === rating
												? "text-[#D4AF37]"
												: "text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
										}`}
									>
										{rating === 5 ? "5 sao" : `${rating}+ sao`}
									</span>
								</div>
							</label>
						))}
					</div>
				</FilterSection>
			</div>
		</aside>
	);
};

export default FilterSidebar;
