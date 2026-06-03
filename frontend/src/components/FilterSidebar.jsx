import { useState, useCallback, useEffect, useMemo } from "react";
import { RotateCcw, Star, ChevronDown, Filter } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import {
  CASE_MATERIAL_FILTERS,
  FUNCTION_FILTERS,
  GLASS_FILTERS,
  MOVEMENT_FILTERS,
  PRICE_PRESETS,
  SIZE_RANGE_FILTERS,
  STRAP_MATERIAL_FILTERS,
  WATCH_CATEGORY_FILTERS,
  WATER_RESISTANCE_FILTERS,
} from "../constants/watchFilters";

const BRANDS = [
  "Hublot",
  "Audemars Piguet",
  "Panerai",
  "TAG Heuer",
  "Tudor",
  "Breitling",
  "Patek Philippe",
  "Rolex",
  "Longines",
  "Seiko",
  "Omega",
  "IWC",
  "Casio",
];

const RATINGS = [5, 4, 3, 2, 1];
const DEFAULT_FILTERS = {
  brands: [],
  category: "",
  maxPrice: 1000000000,
  minPrice: 0,
  machineType: [],
  strapMaterial: [],
  colors: [],
  sizes: [],
  sizeRange: [],
  caseMaterial: [],
  waterResistance: [],
  glass: [],
  functions: [],
  minRating: 0,
};

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);

  if (!children) return null;

  return (
    <div className="mb-5 rounded-2xl border border-black/5 dark:border-white/5 bg-white/85 dark:bg-white/5 px-4 py-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 transition group-hover:text-luxury-gold">
          {title}
        </h3>
        <ChevronDown
          className={`h-3.5 w-3.5 text-gray-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-4 animate-fade-in">{children}</div>}
    </div>
  );
};

const ChipGroup = ({
  options,
  activeValues = [],
  onToggle,
  columns = false,
}) => (
  <div
    className={columns ? "grid grid-cols-2 gap-1.5" : "flex flex-wrap gap-2"}
  >
    {options.map((option) => {
      const active = activeValues.includes(option.value);
      return (
        <button
          key={option.value}
          type="button"
          onClick={() => onToggle(option.value)}
          className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-luxury-gold bg-luxury-gold text-lux-dark font-semibold" : "border-gray-200 text-gray-500 hover:border-luxury-gold hover:text-black dark:border-zinc-700 dark:text-gray-400 dark:hover:text-white"}`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);

const FilterSidebar = () => {
  const {
    filters,
    setFilters,
    fetchFilteredProducts,
    brands,
    fetchBrands,
    categories,
    fetchCategories,
    products,
    allProducts,
  } = useProductStore();
  const [minPriceInput, setMinPriceInput] = useState(
    filters.minPrice > 0 ? String(filters.minPrice / 1_000_000) : "",
  );
  const [maxPriceInput, setMaxPriceInput] = useState(
    filters.maxPrice < 1_000_000_000
      ? String(filters.maxPrice / 1_000_000)
      : "",
  );

  const availableCategorySlugs = useMemo(
    () =>
      new Set((categories || []).map((cat) => cat.slug || cat._id || cat.name)),
    [categories],
  );
  const categoryOptions = WATCH_CATEGORY_FILTERS.filter(
    (option) =>
      availableCategorySlugs.size === 0 ||
      availableCategorySlugs.has(option.value),
  );
  const colorOptions = useMemo(() => {
    const sourceProducts = products?.length > 0 ? products : allProducts || [];
    const seen = new Map();

    sourceProducts.forEach((product) => {
      (product.colors || []).forEach((color) => {
        const value =
          typeof color === "string"
            ? color.trim()
            : color?.value || color?.name || "";
        if (!value || seen.has(value)) return;
        seen.set(value, {
          value,
          name: typeof color === "string" ? value : color?.name || value,
          hex: typeof color === "object" && color?.hex ? color.hex : "#D1D5DB",
        });
      });
    });

    return Array.from(seen.values());
  }, [products, allProducts]);

  const activeCount = [
    (filters.brands?.length || 0) > 0,
    !!filters.category && filters.category !== "",
    (filters.machineType?.length || 0) > 0,
    (filters.strapMaterial?.length || 0) > 0,
    (filters.colors?.length || 0) > 0,
    (filters.sizeRange?.length || 0) > 0,
    (filters.caseMaterial?.length || 0) > 0,
    (filters.waterResistance?.length || 0) > 0,
    (filters.glass?.length || 0) > 0,
    (filters.functions?.length || 0) > 0,
    filters.minRating > 0,
    filters.minPrice > 0 || filters.maxPrice < 1_000_000_000,
  ].filter(Boolean).length;

  const applyLiveFilters = useCallback(
    (newFilters) => {
      setFilters(newFilters);
      setTimeout(() => fetchFilteredProducts(), 0);
    },
    [setFilters, fetchFilteredProducts],
  );

  useEffect(() => {
    if (!brands || brands.length === 0) fetchBrands();
    if (!categories || categories.length === 0) fetchCategories();
  }, [brands, categories, fetchBrands, fetchCategories]);

  const toggleArrayFilter = (arrayName, value) => {
    const currentArr = filters[arrayName] || [];
    const updatedArr = currentArr.includes(value)
      ? currentArr.filter((item) => item !== value)
      : [...currentArr, value];
    applyLiveFilters({ [arrayName]: updatedArr });
  };

  const applyPriceFilter = () => {
    const min = minPriceInput ? Number(minPriceInput) * 1_000_000 : 0;
    const max = maxPriceInput
      ? Number(maxPriceInput) * 1_000_000
      : 1_000_000_000;
    applyLiveFilters({ minPrice: min, maxPrice: max });
  };

  const applyPricePreset = (preset) => {
    setMinPriceInput(
      preset.minPrice > 0 ? String(preset.minPrice / 1_000_000) : "",
    );
    setMaxPriceInput(
      preset.maxPrice < 1_000_000_000
        ? String(preset.maxPrice / 1_000_000)
        : "",
    );
    applyLiveFilters({ minPrice: preset.minPrice, maxPrice: preset.maxPrice });
  };

  const handleReset = () => {
    setMinPriceInput("");
    setMaxPriceInput("");
    setFilters(DEFAULT_FILTERS);
    setTimeout(() => fetchFilteredProducts(), 0);
  };

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 custom-scrollbar pb-10">
        <div className="rounded-[1.5rem] border border-black/5 dark:border-white/5 bg-[linear-gradient(180deg,rgba(248,245,240,0.95),rgba(255,255,255,0.96))] dark:bg-[linear-gradient(180deg,rgba(17,17,17,0.95),rgba(10,10,10,0.98))] px-4 py-4 mb-6 shadow-[0_24px_80px_-45px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-luxury-gold mb-3">
            Bộ lọc sản phẩm
          </p>
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
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-gray-500 transition hover:text-luxury-gold"
              >
                <RotateCcw className="h-3 w-3" /> Đặt lại
              </button>
            )}
          </div>
        </div>

        <FilterSection title="Thương hiệu" defaultOpen>
          <div className="space-y-2">
            {(brands && brands.length > 0 ? brands : BRANDS).map((brand) => {
              const name =
                typeof brand === "string"
                  ? brand
                  : brand.name || brand.label || brand.title;
              const active = filters.brands?.includes(name);
              return (
                <label
                  key={name}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() => toggleArrayFilter("brands", name)}
                >
                  <div
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${active ? "border-luxury-gold bg-luxury-gold" : "border-gray-300 dark:border-zinc-600"}`}
                  >
                    {active && (
                      <svg
                        className="h-2.5 w-2.5 text-black"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs transition ${active ? "font-medium text-luxury-gold" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {name}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Khoảng giá" defaultOpen>
          <div className="mb-3 flex flex-wrap gap-2">
            {PRICE_PRESETS.map((preset) => {
              const active =
                filters.minPrice === preset.minPrice &&
                filters.maxPrice === preset.maxPrice;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => applyPricePreset(preset)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition ${active ? "border-luxury-gold bg-luxury-gold text-lux-dark font-semibold" : "border-gray-200 text-gray-500 hover:border-luxury-gold hover:text-black dark:border-zinc-700 dark:text-gray-400 dark:hover:text-white"}`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
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
            <span className="flex-shrink-0 text-xs text-gray-400">-</span>
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
          <button
            type="button"
            onClick={applyPriceFilter}
            className="btn-outline mt-2 w-full rounded-2xl py-2 text-xs font-semibold hover:bg-luxury-gold hover:text-lux-dark hover:border-luxury-gold"
          >
            Áp dụng
          </button>
        </FilterSection>

        <FilterSection title="Danh mục" defaultOpen>
          <div className="space-y-2">
            {categoryOptions.map((cat) => {
              const active = filters.category === cat.value;
              return (
                <label
                  key={cat.value}
                  className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-black/5 dark:hover:bg-white/5"
                  onClick={() =>
                    applyLiveFilters({ category: active ? "" : cat.value })
                  }
                >
                  <div
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${active ? "border-luxury-gold bg-luxury-gold" : "border-gray-300 dark:border-zinc-600"}`}
                  >
                    {active && (
                      <svg
                        className="h-2.5 w-2.5 text-black"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-xs transition ${active ? "font-medium text-luxury-gold" : "text-gray-500 dark:text-gray-400"}`}
                  >
                    {cat.label}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterSection>

        <FilterSection title="Bộ máy" defaultOpen={false}>
          <ChipGroup
            options={MOVEMENT_FILTERS}
            activeValues={filters.machineType}
            onToggle={(value) => toggleArrayFilter("machineType", value)}
          />
        </FilterSection>

        <FilterSection title="Kích thước mặt" defaultOpen={false}>
          <ChipGroup
            options={SIZE_RANGE_FILTERS}
            activeValues={filters.sizeRange}
            onToggle={(value) => toggleArrayFilter("sizeRange", value)}
            columns
          />
        </FilterSection>

        <FilterSection title="Dây đeo" defaultOpen={false}>
          <ChipGroup
            options={STRAP_MATERIAL_FILTERS}
            activeValues={filters.strapMaterial}
            onToggle={(value) => toggleArrayFilter("strapMaterial", value)}
          />
        </FilterSection>

        {colorOptions.length > 0 && (
          <FilterSection title="Màu sắc" defaultOpen={false}>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => {
                const active = filters.colors?.includes(color.value);
                const lightColor =
                  color.hex === "#F5F5F5" || color.hex === "#C0C0C0";
                return (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => toggleArrayFilter("colors", color.value)}
                    title={color.name}
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${active ? "scale-110 ring-2 ring-luxury-gold ring-offset-2 ring-offset-white shadow-[0_0_10px_rgba(212,175,55,0.35)] dark:ring-offset-zinc-950" : "hover:scale-105"}`}
                    style={{
                      backgroundColor: color.hex,
                      borderColor: active
                        ? "#D4AF37"
                        : lightColor
                          ? "#9CA3AF"
                          : "transparent",
                    }}
                  >
                    {active && (
                      <svg
                        className={`h-4 w-4 ${lightColor ? "text-gray-800" : "text-white"}`}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M20 6L9 17l-5-5"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        <FilterSection title="Chất liệu vỏ" defaultOpen={false}>
          <ChipGroup
            options={CASE_MATERIAL_FILTERS}
            activeValues={filters.caseMaterial}
            onToggle={(value) => toggleArrayFilter("caseMaterial", value)}
          />
        </FilterSection>

        <FilterSection title="Chống nước" defaultOpen={false}>
          <ChipGroup
            options={WATER_RESISTANCE_FILTERS}
            activeValues={filters.waterResistance}
            onToggle={(value) => toggleArrayFilter("waterResistance", value)}
          />
        </FilterSection>

        <FilterSection title="Loại kính" defaultOpen={false}>
          <ChipGroup
            options={GLASS_FILTERS}
            activeValues={filters.glass}
            onToggle={(value) => toggleArrayFilter("glass", value)}
          />
        </FilterSection>

        <FilterSection title="Chức năng" defaultOpen={false}>
          <ChipGroup
            options={FUNCTION_FILTERS}
            activeValues={filters.functions}
            onToggle={(value) => toggleArrayFilter("functions", value)}
          />
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
                  <div
                    className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition ${active ? "border-luxury-gold bg-luxury-gold" : "border-gray-300 dark:border-zinc-700"}`}
                  >
                    {active && (
                      <svg
                        className="h-2.5 w-2.5 text-black"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < rating ? "fill-luxury-gold text-luxury-gold" : "text-gray-200 dark:text-zinc-700"}`}
                      />
                    ))}
                    <span
                      className={`ml-1 text-[10px] transition ${active ? "text-luxury-gold" : "text-gray-500 dark:text-gray-400"}`}
                    >
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
