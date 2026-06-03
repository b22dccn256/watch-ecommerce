export const WATCH_CATEGORY_FILTERS = [
  { value: "dong-ho-nam", label: "Đồng hồ nam" },
  { value: "dong-ho-nu", label: "Đồng hồ nữ" },
  { value: "dong-ho-unisex", label: "Đồng hồ unisex" },
  { value: "smartwatch", label: "Smartwatch" },
];

export const MOVEMENT_FILTERS = [
  { value: "quartz", label: "Máy pin" },
  { value: "automatic", label: "Cơ tự động" },
  { value: "mechanical", label: "Cơ lên cót tay" },
  { value: "solar", label: "Năng lượng ánh sáng" },
];

export const MOVEMENT_LABELS = MOVEMENT_FILTERS.reduce(
  (labels, item) => ({ ...labels, [item.value]: item.label }),
  {},
);

export const PRICE_PRESETS = [
  { value: "under_5", label: "Dưới 5 triệu", minPrice: 0, maxPrice: 5_000_000 },
  {
    value: "5_10",
    label: "5-10 triệu",
    minPrice: 5_000_000,
    maxPrice: 10_000_000,
  },
  {
    value: "10_20",
    label: "10-20 triệu",
    minPrice: 10_000_000,
    maxPrice: 20_000_000,
  },
  {
    value: "20_50",
    label: "20-50 triệu",
    minPrice: 20_000_000,
    maxPrice: 50_000_000,
  },
  {
    value: "over_50",
    label: "Trên 50 triệu",
    minPrice: 50_000_000,
    maxPrice: 1_000_000_000,
  },
];

export const SIZE_RANGE_FILTERS = [
  { value: "under_38", label: "Dưới 38mm" },
  { value: "38_40", label: "38-40mm" },
  { value: "40_42", label: "40-42mm" },
  { value: "42_44", label: "42-44mm" },
  { value: "over_44", label: "Trên 44mm" },
];

export const STRAP_MATERIAL_FILTERS = [
  { value: "Da", label: "Dây da" },
  { value: "Thép", label: "Dây thép" },
  { value: "Cao su", label: "Dây cao su" },
  { value: "Vải NATO", label: "Vải NATO" },
  { value: "Ceramic", label: "Ceramic" },
  { value: "Titanium", label: "Titanium" },
];

export const CASE_MATERIAL_FILTERS = [
  { value: "Thép", label: "Thép" },
  { value: "Titanium", label: "Titanium" },
  { value: "Vàng", label: "Vàng" },
  { value: "Ceramic", label: "Ceramic" },
];

export const WATER_RESISTANCE_FILTERS = [
  { value: "30", label: "30m" },
  { value: "50", label: "50m" },
  { value: "100", label: "100m" },
  { value: "200_plus", label: "200m+" },
];

export const GLASS_FILTERS = [
  { value: "Sapphire", label: "Sapphire" },
  { value: "Mineral", label: "Mineral" },
  { value: "Hardlex", label: "Hardlex" },
  { value: "Acrylic", label: "Acrylic" },
];

export const FUNCTION_FILTERS = [
  { value: "Chronograph", label: "Chronograph" },
  { value: "GMT", label: "GMT" },
  { value: "Moonphase", label: "Moonphase" },
];

export const COLOR_FILTERS = [
  { value: "Đen", name: "Đen", hex: "#111111" },
  { value: "Bạc", name: "Bạc", hex: "#C0C0C0" },
  { value: "Vàng", name: "Vàng", hex: "#D4AF37" },
  { value: "Xanh dương", name: "Xanh dương", hex: "#1D4ED8" },
  { value: "Trắng", name: "Trắng", hex: "#F5F5F5" },
  { value: "Nâu", name: "Nâu", hex: "#92400E" },
  { value: "Xanh lá", name: "Xanh lá", hex: "#065F46" },
  { value: "Đỏ", name: "Đỏ", hex: "#B91C1C" },
  { value: "Xám", name: "Xám", hex: "#6B7280" },
  { value: "Champagne", name: "Champagne", hex: "#E6C78A" },
];

export const filterLabel = (options, value) =>
  options.find((option) => option.value === value)?.label || value;
