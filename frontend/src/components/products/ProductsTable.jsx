import { CheckSquare, Square, Package, Star, Pencil, Trash } from "lucide-react";
import { SkeletonTableRow } from "../SkeletonLoaders";

const machineLabels = {
	mechanical: "Cơ lên cót",
	quartz: "Bộ máy pin",
	automatic: "Cơ tự động",
	solar: "Năng lượng ánh sáng",
	digital: "Điện tử",
	smartwatch: "Đồng hồ thông minh",
};

// Stock badge helper
const StockBadge = ({ stock }) => {
	if (stock === undefined || stock === null) return <span className="text-gray-400 text-xs">—</span>;
	if (stock <= 0) return <span className="stock-badge-out px-2 py-0.5 rounded-full text-xs font-semibold">Hết hàng</span>;
	if (stock <= 5) return <span className="stock-badge-low px-2 py-0.5 rounded-full text-xs font-semibold">Còn {stock}</span>;
	return <span className="stock-badge-high px-2 py-0.5 rounded-full text-xs font-semibold">Còn {stock}</span>;
};

const ProductsTable = ({
	products,
	loading,
	selectedIds,
	allPageSelected,
	onToggleSelectAll,
	onToggleSelect,
	onEdit,
	onDelete,
	onToggleFeatured,
	search
}) => {
	const paginated = products || [];

	return (
		<div className="overflow-x-auto overflow-y-auto max-h-[72vh] custom-scrollbar">
			<table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
				<thead className="bg-gray-50/95 dark:bg-gray-700/95 backdrop-blur-sm sticky top-0 z-10">
					<tr>
						{/* Checkbox */}
						<th className="px-3 py-3 w-10">
							<button onClick={onToggleSelectAll} className="text-gray-400 hover:text-luxury-gold transition">
								{allPageSelected ? <CheckSquare className="w-4 h-4 text-luxury-gold pointer-events-none" /> : <Square className="w-4 h-4 pointer-events-none" />}
							</button>
						</th>
						<th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[350px]">Sản phẩm</th>
						<th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Thương hiệu</th>
						<th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giá</th>
						<th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Bộ máy</th>
						<th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tồn kho</th>
						<th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Danh mục</th>
						<th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nổi bật</th>
						<th className="px-4 py-3 w-12"></th>
					</tr>
				</thead>
				<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
					{loading ? (
						Array.from({ length: 8 }).map((_, i) => (
							<SkeletonTableRow key={`skeleton-${i}`} />
						))
					) : paginated.length === 0 ? (
						<tr>
							<td colSpan="9" className="text-center py-16 text-gray-400 dark:text-gray-500">
								<Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
								<p className="font-medium">{search ? `Không tìm thấy "${search}"` : "Chưa có sản phẩm nào"}</p>
								<p className="text-xs mt-1 opacity-60">Thêm sản phẩm đầu tiên bằng nút &quot;Thêm mới&quot;</p>
							</td>
						</tr>
					) : (
						paginated.map((product) => {
							const brandName = typeof product.brand === "string" ? product.brand : product.brand?.name || "—";
							const isSelected = selectedIds.has(product._id);
							return (
								<tr
									key={product._id}
									className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${isSelected ? "bg-luxury-gold/5 dark:bg-luxury-gold/5" : ""}`}
								>
									<td className="px-3 py-3 text-center">
										<button onClick={() => onToggleSelect(product._id)} className="text-gray-400 hover:text-luxury-gold transition">
											{isSelected ? <CheckSquare className="w-4 h-4 text-luxury-gold pointer-events-none" /> : <Square className="w-4 h-4 pointer-events-none" />}
										</button>
									</td>
									<td className="px-4 py-3">
										<div className="flex items-center gap-3">
											<img
												className="h-10 w-10 rounded-md object-cover flex-shrink-0 border border-gray-200 dark:border-gray-600"
												src={product.image}
												alt={product.name}
												onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
											/>
											<div className="min-w-0 flex-1">
												<p className="text-sm font-semibold text-gray-900 dark:text-white truncate" title={product.name}>{product.name}</p>
												<p className="text-xs text-gray-500 mt-0.5 truncate">{product.categoryId?.name || product.category || '—'}</p>
											</div>
										</div>
									</td>
									<td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{brandName}</td>
									<td className="px-4 py-3 whitespace-nowrap text-right text-sm font-bold text-luxury-gold">
										{product.price?.toLocaleString("vi-VN")} ₫
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										{product.type ? (
											<span className="px-2 py-1 bg-luxury-gold/10 text-luxury-gold text-xs font-semibold rounded-full border border-luxury-gold/20">
												{machineLabels[product.type] || product.type}
											</span>
										) : <span className="text-gray-400 text-xs">—</span>}
									</td>
									<td className="px-4 py-3 whitespace-nowrap text-right">
										<StockBadge stock={product.stock} />
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										{(() => {
											const parentCategoryName = product.categoryId?.parentCategory?.name;
											const currentCategoryName = product.categoryId?.name || product.category || product.categoryName || '—';
											const categoryName = parentCategoryName ? `${parentCategoryName} > ${currentCategoryName}` : currentCategoryName;
											return (
												<span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs font-medium text-gray-600 dark:text-gray-300 max-w-[170px] truncate inline-block" title={categoryName}>
												{categoryName}
											</span>
											);
										})()}
									</td>
									<td className="px-4 py-3 whitespace-nowrap text-center">
										<button
											onClick={() => onToggleFeatured(product._id, product.isFeatured)}
											className={`p-1.5 rounded-md transition-colors ${product.isFeatured ? "bg-yellow-400 text-gray-900 shadow-sm" : "bg-gray-100 dark:bg-gray-600 text-gray-400 hover:bg-yellow-500 hover:text-white"}`}
											title={product.isFeatured ? "Bỏ nổi bật" : "Đặt nổi bật"}
										>
											<Star className="h-4 w-4 pointer-events-none" />
										</button>
									</td>
									<td className="px-4 py-3 whitespace-nowrap">
										<div className="flex items-center gap-1.5 justify-end">
											<button
												onClick={() => onEdit(product)}
												className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors"
												title="Chỉnh sửa sản phẩm"
											>
												<Pencil className="h-4 w-4 pointer-events-none" />
											</button>
											<button
												onClick={() => onDelete(product._id)}
												className="p-1.5 text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
												title="Xóa sản phẩm"
											>
												<Trash className="h-4 w-4 pointer-events-none" />
											</button>
										</div>
									</td>
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);
};

export default ProductsTable;
