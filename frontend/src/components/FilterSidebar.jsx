import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, RotateCcw, Star } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const BRANDS = ["Rolex", "Casio", "Seiko", "Citizen", "Garmin", "Patek Philippe", "Audemars Piguet", "Hublot", "Omega", "Cartier", "Tag Heuer", "IWC"];
const MACHINE_TYPES = ["Mechanical", "Quartz", "Automatic", "Digital", "Smartwatch"];
const COLORS = [
    { name: "Đen", hex: "#000000" }, { name: "Bạc", hex: "#C0C0C0" },
    { name: "Vàng", hex: "#FFD700" }, { name: "Xanh dương", hex: "#0000FF" },
    { name: "Trắng", hex: "#FFFFFF" }, { name: "Nâu", hex: "#8B4513" }
];
const SIZES = ["38mm", "40mm", "41mm", "42mm", "44mm", "45mm"];
const RATINGS = [5, 4, 3, 2, 1];

const FilterSidebar = () => {
    const { filters, setFilters, fetchFilteredProducts } = useProductStore();
    const [priceSlider, setPriceSlider] = useState(filters.maxPrice);

    // Live Fetch Trigger logic
    const applyLiveFilters = useCallback((newFilters) => {
        setFilters(newFilters);
        fetchFilteredProducts();
    }, [setFilters, fetchFilteredProducts]);

    // Handle generic array toggle (brands, machine types, colors, sizes)
    const toggleArrayFilter = (arrayName, value) => {
        const currentArr = filters[arrayName] || [];
        const updatedArr = currentArr.includes(value)
            ? currentArr.filter((item) => item !== value)
            : [...currentArr, value];

        applyLiveFilters({ [arrayName]: updatedArr });
    };

    // Debounce for Price Slider
    useEffect(() => {
        const timer = setTimeout(() => {
            if (priceSlider !== filters.maxPrice) {
                applyLiveFilters({ maxPrice: priceSlider });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [priceSlider, filters.maxPrice, applyLiveFilters]);

    const handleReset = () => {
        const reset = {
            brands: [], maxPrice: 1000000000, minPrice: 0,
            machineType: [], strapMaterial: [], colors: [], sizes: [], minRating: 0
        };
        setPriceSlider(1000000000);
        applyLiveFilters(reset);
    };

    return (
        <aside className="w-60 flex-shrink-0">
            <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 custom-scrollbar pb-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="text-[#D4AF37] w-5 h-5" />
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Bộ lọc</h2>
                    </div>
                    <button onClick={handleReset} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#D4AF37] transition">
                        <RotateCcw className="w-3 h-3" /> Đặt lại
                    </button>
                </div>

                {/* THƯƠNG HIỆU */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Thương hiệu</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {BRANDS.map((brand) => (
                            <label key={brand} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleArrayFilter("brands", brand)}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${filters.brands?.includes(brand) ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300 dark:border-yellow-900 group-hover:border-[#D4AF37]"}`}>
                                    {filters.brands?.includes(brand) && <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 9L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                                </div>
                                <span className={`text-sm transition ${filters.brands?.includes(brand) ? "text-[#D4AF37]" : "text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"}`}>{brand}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* KHOẢNG GIÁ */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Khoảng giá (VNĐ)</h3>
                    <input type="range" min={0} max={1000000000} step={5000000} value={priceSlider} onChange={(e) => setPriceSlider(Number(e.target.value))} className="w-full" style={{ accentColor: '#D4AF37' }} />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0đ</span>
                        <span className="text-[#D4AF37]">
                            {priceSlider >= 1000000000 ? `${(priceSlider / 1000000000).toFixed(1)} Tỷ+` : `${(priceSlider / 1000000).toFixed(0)} Tr`}
                        </span>
                    </div>
                </div>

                {/* BỘ MÁY */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Bộ máy</h3>
                    <div className="flex flex-wrap gap-2">
                        {MACHINE_TYPES.map((type) => (
                            <button key={type} onClick={() => toggleArrayFilter('machineType', type)} className={`px-3 py-1.5 rounded-full text-xs border transition ${filters.machineType?.includes(type) ? "bg-[#D4AF37] border-[#D4AF37] text-black font-semibold" : "border-gray-200 dark:border-yellow-900/50 text-gray-500 dark:text-gray-400 hover:border-[#D4AF37] hover:text-black dark:hover:text-white"}`}>
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* MÀU SẮC */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Màu sắc</h3>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map((color) => (
                            <button key={color.name} onClick={() => toggleArrayFilter('colors', color.name)} title={color.name} className={`w-8 h-8 rounded-full border-2 transition-all ${filters.colors?.includes(color.name) ? "border-[#D4AF37] scale-110 shadow-[0_0_8px_rgba(212,175,55,0.6)]" : "border-transparent hover:scale-105"}`} style={{ backgroundColor: color.hex, borderColor: filters.colors?.includes(color.name) ? '#D4AF37' : color.hex === '#000000' ? '#333' : 'transparent' }}>
                            </button>
                        ))}
                    </div>
                </div>

                {/* KÍCH THƯỚC */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Kích thước</h3>
                    <div className="grid grid-cols-3 gap-2">
                        {SIZES.map((size) => (
                            <button key={size} onClick={() => toggleArrayFilter('sizes', size)} className={`py-2 rounded text-xs border transition ${filters.sizes?.includes(size) ? "bg-[#D4AF37] border-[#D4AF37] text-black font-semibold" : "bg-gray-100 dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 text-gray-500 dark:text-gray-400 hover:border-[#D4AF37] hover:text-black dark:hover:text-white"}`}>
                                {size}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ĐÁNH GIÁ */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">Đánh giá</h3>
                    <div className="space-y-2">
                        {RATINGS.map((rating) => (
                            <label key={rating} className="flex items-center gap-3 cursor-pointer group" onClick={(e) => { e.preventDefault(); applyLiveFilters({ minRating: rating === filters.minRating ? 0 : rating }); }}>
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${filters.minRating === rating ? "bg-[#D4AF37] border-[#D4AF37]" : "border-gray-300 dark:border-zinc-700 group-hover:border-[#D4AF37]"}`}>
                                    {filters.minRating === rating && <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12"><path d="M10 3L5 9L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>}
                                </div>
                                <div className="flex items-center gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-4 h-4 ${i < rating ? "text-[#D4AF37] fill-[#D4AF37]" : "text-gray-300 dark:text-zinc-700"}`} />
                                    ))}
                                    <span className={`text-xs ml-1 transition ${filters.minRating === rating ? "text-[#D4AF37]" : "text-gray-500 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white"}`}>{rating} sao {rating < 5 ? "trở lên" : ""}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div >
        </aside >
    );
};

export default FilterSidebar;
