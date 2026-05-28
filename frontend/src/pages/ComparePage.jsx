import { Trash2, ShieldCheck, Scale, ArrowLeft } from "lucide-react";
import { useCompareStore } from "../stores/useCompareStore";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { I18nContext } from "../contexts/I18nContext";
import { formatCurrency } from "../i18n/format";
import { buildProductPath } from "../utils/productUrl";

const ComparePage = () => {
	const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
	const { addToCart } = useCartStore();
	const navigate = useNavigate();
	const { lang, currency } = useContext(I18nContext);
	const compareSlots = [...compareItems, ...Array.from({ length: Math.max(0, 3 - compareItems.length) }, () => null)];

	const handleNavigate = (product) => {
		const path = buildProductPath(product);
		if (path) navigate(path);
	};

	const renderCell = (item, value) => {
		if (!item) return <div>-</div>;
		return value;
	};

	return (
		<div className="min-h-screen bg-[linear-gradient(180deg,#f8f5f0_0%,#ffffff_100%)] text-gray-900 pt-24 pb-20 dark:bg-zinc-950 dark:text-white">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				{/* Breadcrumbs & Back Button */}
				<div className="flex items-center justify-between mb-8">
					<button
						onClick={() => navigate(-1)}
						className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[color:var(--color-gold)] transition"
					>
						<ArrowLeft className="w-4 h-4" /> Quay lại
					</button>
					<h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-950 dark:text-white flex items-center gap-2">
						<Scale className="w-7 h-7 text-[color:var(--color-gold)]" /> So sánh chi tiết
					</h1>
					{compareItems.length > 0 ? (
						<button
							onClick={clearCompare}
							className="text-sm font-semibold text-red-500 hover:text-red-700 transition"
						>
							Xóa tất cả ({compareItems.length})
						</button>
					) : <div />}
				</div>

				{compareItems.length === 0 ? (
					<div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 p-12 text-center shadow-sm">
						<Scale className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
						<p className="text-lg text-gray-600 dark:text-gray-400">Bạn chưa có sản phẩm nào trong danh sách so sánh.</p>
						<button
							onClick={() => navigate("/catalog")}
							className="mt-6 inline-flex items-center justify-center px-6 py-2.5 bg-black text-white hover:opacity-90 font-semibold rounded-lg transition dark:bg-white dark:text-black"
						>
							Khám phá sản phẩm
						</button>
					</div>
				) : (
					<div className="bg-white dark:bg-zinc-900 rounded-3xl border border-black/5 dark:border-white/5 p-6 shadow-sm overflow-x-auto custom-scrollbar">
						<div className="min-w-[900px]">
							{/* Products Header Row */}
							<div className="grid grid-cols-4 gap-6 pb-6 border-b border-gray-100 dark:border-zinc-800">
								<div className="col-span-1 flex flex-col justify-end pr-2">
									<div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-2">TỔNG QUAN</div>
									<p className="text-xs text-gray-500 dark:text-gray-400">So sánh thông số kỹ thuật trực diện của các siêu phẩm.</p>
								</div>
								{compareSlots.map((item, index) => (
									<div
										key={item?._id || `empty-slot-${index}`}
										className="col-span-1 relative group bg-gray-50/50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 hover:border-[color:var(--color-gold)]/40 transition flex flex-col min-h-[300px]"
									>
										{item ? (
											<>
												<button
													onClick={() => removeFromCompare(item._id)}
													className="absolute top-2 right-2 p-1.5 bg-white dark:bg-zinc-800 rounded-full text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition"
												>
													<Trash2 className="w-4 h-4" />
												</button>
												<img
													src={item.image}
													alt={item.name}
													className="w-32 h-32 mx-auto object-cover rounded-lg mb-4 cursor-pointer hover:scale-105 transition duration-300"
													onClick={() => handleNavigate(item)}
												/>
												<h3
													className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-snug mb-1 line-clamp-2 cursor-pointer hover:text-[color:var(--color-gold)] transition"
													onClick={() => handleNavigate(item)}
												>
													{item.name}
												</h3>
												<p className="text-base font-bold text-[color:var(--color-gold)] mb-4">
													{formatCurrency(item.price, currency, lang)}
												</p>
												<button
													onClick={() => addToCart(item)}
													className="w-full py-2 bg-black hover:bg-black/90 text-white font-semibold text-xs rounded-lg mt-auto transition shadow-sm dark:bg-white dark:text-black dark:hover:bg-gray-200"
												>
													Thêm vào giỏ
												</button>
											</>
										) : (
											<div className="m-auto text-center py-6">
												<div className="mx-auto mb-3 h-12 w-12 rounded-full border border-dashed border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center text-gray-300 dark:text-gray-700 font-bold text-lg">+</div>
												<p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Ô trống</p>
												<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Thêm sản phẩm</p>
											</div>
										)}
									</div>
								))}
							</div>

							{/* Specifications Table */}
							<div className="divide-y divide-gray-100 dark:divide-zinc-800 text-sm mt-6">
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Mã sản phẩm</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `code-${index}`}>
											{item?._id?.slice(-6).toUpperCase() || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Thương hiệu</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `brand-${index}`}>
											{item?.brand?.name || item?.brand || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Bộ máy (Movement)</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `movement-${index}`}>
											{item ? (
												<>
													{item.specs?.movement?.type || item.type || "-"}
													{item.specs?.movement?.caliber && (
														<span className="block text-gray-400 text-xs mt-0.5">{item.specs.movement.caliber}</span>
													)}
												</>
											) : (
												"-"
											)}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Dự trữ năng lượng</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `reserve-${index}`}>
											{item?.specs?.movement?.powerReserve || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Kích thước vỏ</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `diameter-${index}`}>
											{item ? (
												<>
													Đường kính: {item.specs?.case?.diameter || "-"}
													{item.specs?.case?.thickness && (
														<span className="block text-gray-400 text-xs mt-0.5">Độ dày: {item.specs.case.thickness}</span>
													)}
												</>
											) : (
												"-"
											)}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Chất liệu vỏ</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `case-${index}`}>
											{item?.specs?.case?.material || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Dây đeo</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `strap-${index}`}>
											{item?.specs?.strap?.material || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Khóa</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `clasp-${index}`}>
											{item?.specs?.strap?.claspType || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Chống nước</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `water-${index}`}>
											{item?.specs?.waterResistance || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Chất liệu kính</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `glass-${index}`}>
											{item?.specs?.glass || "-"}
										</div>
									))}
								</div>
								<div className="grid grid-cols-4 gap-6 items-center py-4">
									<div className="font-semibold text-gray-400">Bảo hành</div>
									{compareSlots.map((item, index) => (
										<div className="font-medium text-gray-800 dark:text-gray-200" key={item?._id || `warranty-${index}`}>
											{renderCell(
												item,
												<span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 font-semibold">
													<ShieldCheck className="w-4 h-4 text-[color:var(--color-gold)]" /> 5 năm chính hãng
												</span>
											)}
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default ComparePage;
