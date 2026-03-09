import { useState } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const BRANDS = ["Rolex", "Casio", "Seiko", "Citizen", "Garmin", "Patek Philippe", "Audemars Piguet", "Hublot", "Omega", "Cartier", "Tag Heuer", "IWC"];
const MACHINE_TYPES = ["Mechanical", "Quartz", "Automatic", "Digital", "Smartwatch"];

const FilterSidebar = () => {
    const { filters, setFilters, fetchFilteredProducts } = useProductStore();
    const [local, setLocal] = useState({ ...filters });

    const toggleBrand = (brand) => {
        const updated = local.brands.includes(brand)
            ? local.brands.filter((b) => b !== brand)
            : [...local.brands, brand];
        setLocal({ ...local, brands: updated });
    };

    const toggleMachine = (type) => {
        const updated = local.machineType.includes(type)
            ? local.machineType.filter((t) => t !== type)
            : [...local.machineType, type];
        setLocal({ ...local, machineType: updated });
    };

    const handleApply = () => {
        setFilters(local);
        fetchFilteredProducts();
    };

    const handleReset = () => {
        const reset = {
            brands: [],
            minPrice: 0,
            maxPrice: 1000000000,
            machineType: [],
            strapMaterial: [],
        };
        setLocal(reset);
        setFilters(reset);
        fetchFilteredProducts();
    };

    return (
        <aside className="w-60 flex-shrink-0">
            <div className="sticky top-24">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="text-yellow-400 w-5 h-5" />
                        <h2 className="text-base font-semibold text-white">Bộ lọc</h2>
                    </div>
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-yellow-400 transition"
                    >
                        <RotateCcw className="w-3 h-3" /> Đặt lại
                    </button>
                </div>

                {/* THƯƠNG HIỆU */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">
                        Thương hiệu
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {BRANDS.map((brand) => (
                            <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                <div
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition ${local.brands.includes(brand)
                                        ? "bg-yellow-400 border-yellow-400"
                                        : "border-yellow-900 group-hover:border-yellow-400"
                                        }`}
                                    onClick={() => toggleBrand(brand)}
                                >
                                    {local.brands.includes(brand) && (
                                        <svg className="w-2.5 h-2.5 text-black" fill="currentColor" viewBox="0 0 12 12">
                                            <path d="M10 3L5 9L2 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
                                        </svg>
                                    )}
                                </div>
                                <span
                                    className={`text-sm transition ${local.brands.includes(brand) ? "text-yellow-400" : "text-gray-400 group-hover:text-white"
                                        }`}
                                    onClick={() => toggleBrand(brand)}
                                >
                                    {brand}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* KHOẢNG GIÁ */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">
                        Khoảng giá (VNĐ)
                    </h3>
                    <input
                        type="range"
                        min={0}
                        max={1000000000}
                        step={5000000}
                        value={local.maxPrice}
                        onChange={(e) => setLocal({ ...local, maxPrice: Number(e.target.value) })}
                        className="w-full"
                        style={{ accentColor: '#D4AF37' }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0đ</span>
                        <span className="text-[#D4AF37]">
                            {local.maxPrice >= 1000000000
                                ? `${(local.maxPrice / 1000000000).toFixed(1)} Tỷ ${local.maxPrice === 1000000000 ? '+' : ''}`
                                : `${(local.maxPrice / 1000000).toFixed(0)} Tr`}
                        </span>
                    </div>
                </div>

                {/* BỘ MÁY */}
                <div className="mb-7">
                    <h3 className="text-[10px] font-semibold tracking-widest text-gray-500 uppercase mb-3">
                        Bộ máy
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {MACHINE_TYPES.map((type) => (
                            <button
                                key={type}
                                onClick={() => toggleMachine(type)}
                                className={`px-3 py-1.5 rounded-full text-xs border transition ${local.machineType.includes(type)
                                    ? "bg-yellow-400 border-yellow-400 text-black font-semibold"
                                    : "border-yellow-900/50 text-gray-400 hover:border-yellow-400 hover:text-white"
                                    }`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Apply Button */}
                <button
                    onClick={handleApply}
                    className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-semibold py-3 rounded-xl transition text-sm"
                >
                    Áp dụng bộ lọc
                </button>
            </div >
        </aside >
    );
};

export default FilterSidebar;
