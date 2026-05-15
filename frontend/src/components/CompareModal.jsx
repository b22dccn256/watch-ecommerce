import { X, Trash2, ShieldCheck, Scale } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompareStore } from "../stores/useCompareStore";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { I18nContext } from "../contexts/I18nContext";
import { formatCurrency } from "../i18n/format";


const CompareModal = ({ isOpen, onClose }) => {
	const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
	const { addToCart } = useCartStore();
	const navigate = useNavigate();
	const { lang, currency } = useContext(I18nContext);
	const compareSlots = [...compareItems, ...Array.from({ length: Math.max(0, 3 - compareItems.length) }, () => null)];

	if (!isOpen) return null;

	const handleNavigate = (id) => {
		onClose();
		navigate(`/product/${id}`);
	};

	const renderCell = (item, value) => {
		if (!item) return <div>-</div>;
		return value;
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-start justify-center px-4 pb-4 pt-20 sm:pt-24 bg-black/60 backdrop-blur-sm shadow-2xl">
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="bg-surface rounded-[1.8rem] w-full max-w-6xl max-h-[calc(100vh-6rem)] sm:max-h-[calc(100vh-7rem)] overflow-hidden flex flex-col border border-black/10 dark:border-white/10"
					>
						{/* Header */}
						<div className="flex items-center justify-between px-5 py-4 border-b border-black/8 dark:border-white/8 bg-surface-soft rounded-t-[1.8rem]">
							<h2 className="text-xl font-semibold flex items-center gap-2 text-primary">
								<Scale className="w-6 h-6 text-[color:var(--color-gold)]" />
								So sánh sản phẩm ({compareItems.length}/3)
							</h2>
							<div className="flex items-center gap-4">
								{compareItems.length > 0 && (
									<button
										onClick={clearCompare}
										className="text-sm font-medium text-secondary hover:bg-black/5 dark:hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
									>
										Xóa tất cả
									</button>
								)}
								<button
									onClick={onClose}
									className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition"
								>
									<X className="w-6 h-6" />
								</button>
							</div>
						</div>

						{/* Body */}
						<div className="flex-1 overflow-auto p-4 sm:p-5 custom-scrollbar compare-scroll">
							{compareItems.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full py-12 text-muted">
									<Scale className="w-14 h-14 mb-3 opacity-20" />
									<p className="text-base">Bạn chưa có sản phẩm nào trong danh sách so sánh.</p>
									<button onClick={onClose} className="mt-6 font-bold text-[color:var(--color-gold)] hover:underline">Tiếp tục mua sắm</button>
								</div>
							) : (
								<div className="min-w-[680px] sm:min-w-[780px]">
									{/* Products Row */}
									<div className="grid grid-cols-4 gap-4 sticky top-0 bg-surface z-10 pb-4 border-b border-black/8 dark:border-white/8">
										<div className="col-span-1 bg-surface-soft p-3.5 rounded-2xl border border-black/8 dark:border-white/8 min-h-[320px] flex items-start">
											<div className="text-muted font-semibold tracking-[0.04em]">TỔNG QUAN</div>
										</div>
										{compareSlots.map((item, index) => (
											<div key={item?._id || `empty-slot-${index}`} className="col-span-1 relative group bg-surface-soft p-3.5 rounded-2xl border border-black/8 dark:border-white/8 hover:border-[color:var(--color-gold)]/40 transition min-h-[320px] flex flex-col">
												{item ? (
													<>
														<button
															onClick={() => removeFromCompare(item._id)}
															className="absolute top-2 right-2 p-1.5 bg-surface rounded-full text-muted hover:text-[color:var(--color-gold)] shadow-sm opacity-0 group-hover:opacity-100 transition"
														>
															<Trash2 className="w-4 h-4" />
														</button>
														<img src={item.image} alt={item.name} className="w-36 h-36 mx-auto object-cover rounded-lg mb-3 cursor-pointer" onClick={() => handleNavigate(item._id)} />
														<h3 className="font-semibold text-base leading-tight mb-1 line-clamp-2 cursor-pointer hover:text-[color:var(--color-gold)]" onClick={() => handleNavigate(item._id)}>{item.name}</h3>
														<p className="text-lg font-semibold text-[color:var(--color-gold)] mb-3">{formatCurrency(item.price, currency, lang)}</p>
														<button
															onClick={() => {
																addToCart(item);
																onClose();
															}}
															className="btn-base btn-primary h-9 w-full mt-auto"
														>
															Thêm vào giỏ
														</button>
													</>
												) : (
													<div className="m-auto text-center">
														<div className="mx-auto mb-3 h-14 w-14 rounded-full border border-dashed border-black/20 dark:border-white/20 bg-surface" />
														<p className="text-xs uppercase tracking-[0.18em] text-muted">Ô trống</p>
														<p className="mt-1 text-sm text-secondary">Thêm sản phẩm để so sánh</p>
													</div>
												)}
											</div>
										))}
									</div>

									{/* Specs Rows */}
									<div className="mt-6 rounded-2xl border border-black/8 dark:border-white/8 bg-surface-soft/45 overflow-hidden text-sm">
										<div className="grid grid-cols-4 gap-6 items-center px-4 py-4">
											<div className="font-semibold text-muted">Mã sản phẩm</div>
											{compareSlots.map((item, index) => <div className="font-medium" key={item?._id || `code-${index}`}>{item?._id?.slice(-6).toUpperCase() || "-"}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Bộ máy (Movement)</div>
											{compareSlots.map((item, index) => (
												<div key={item?._id || `movement-${index}`}>
													{item ? <>{item.specs?.movement?.type || item.type || "-"} <br/><span className="text-gray-400 text-xs">{item.specs?.movement?.caliber}</span></> : "-"}
												</div>
											))}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Dự trữ năng lượng</div>
											{compareSlots.map((item, index) => <div key={item?._id || `reserve-${index}`}>{item?.specs?.movement?.powerReserve || "-"}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Kích thước vỏ</div>
											{compareSlots.map((item, index) => (
												<div key={item?._id || `diameter-${index}`}>
													{item ? <>{item.specs?.case?.diameter || "-"} <br/><span className="text-gray-400 text-xs">Độ dày: {item.specs?.case?.thickness || "-"}</span></> : "-"}
												</div>
											))}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Chất liệu vỏ</div>
											{compareSlots.map((item, index) => <div key={item?._id || `case-${index}`}>{item?.specs?.case?.material || "-"}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Dây đeo</div>
											{compareSlots.map((item, index) => <div key={item?._id || `strap-${index}`}>{item?.specs?.strap?.material || "-"}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Khóa</div>
											{compareSlots.map((item, index) => <div key={item?._id || `clasp-${index}`}>{item?.specs?.strap?.claspType || "-"}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Chống nước</div>
											{compareSlots.map((item, index) => <div key={item?._id || `water-${index}`}>{item?.specs?.waterResistance || "-"}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-black/8 dark:border-white/8 px-4 py-4">
											<div className="font-semibold text-muted">Bảo hành</div>
											{compareSlots.map((item, index) => <div key={item?._id || `warranty-${index}`} className="flex items-center gap-1 text-secondary">{renderCell(item, <><ShieldCheck className="w-4 h-4 text-[color:var(--color-gold)]"/> 5 năm</>)}</div>)}
										</div>
									</div>
								</div>
							)}
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
	);
};

export default CompareModal;
