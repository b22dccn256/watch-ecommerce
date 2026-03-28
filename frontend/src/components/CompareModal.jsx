import { X, Trash2, ShieldCheck, Scale, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompareStore } from "../stores/useCompareStore";
import { useCartStore } from "../stores/useCartStore";
import { useNavigate } from "react-router-dom";
import React, { useContext } from "react";
import { I18nContext } from "../App";
import { formatCurrency } from "../i18n/format";


const CompareModal = ({ isOpen, onClose }) => {
	const { compareItems, removeFromCompare, clearCompare } = useCompareStore();
	const { addToCart } = useCartStore();
	const navigate = useNavigate();
	const { t, lang, currency } = useContext(I18nContext);

	if (!isOpen) return null;

	const handleNavigate = (id) => {
		onClose();
		navigate(`/product/${id}`);
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm shadow-2xl">
					<motion.div
						initial={{ opacity: 0, scale: 0.95, y: 20 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.95, y: 20 }}
						className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-800"
					>
						{/* Header */}
						<div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/50">
							<h2 className="text-2xl font-bold flex items-center gap-2">
								<Scale className="w-6 h-6 text-emerald-500 dark:text-yellow-400" />
								So sánh sản phẩm ({compareItems.length}/3)
							</h2>
							<div className="flex items-center gap-4">
								{compareItems.length > 0 && (
									<button 
										onClick={clearCompare} 
										className="text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition"
									>
										Xóa tất cả
									</button>
								)}
								<button 
									onClick={onClose} 
									className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition"
								>
									<X className="w-6 h-6" />
								</button>
							</div>
						</div>

						{/* Body */}
						<div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
							{compareItems.length === 0 ? (
								<div className="flex flex-col items-center justify-center h-full py-20 text-gray-500">
									<Scale className="w-16 h-16 mb-4 opacity-20" />
									<p className="text-lg">Bạn chưa có sản phẩm nào trong danh sách so sánh.</p>
									<button onClick={onClose} className="mt-6 font-bold text-emerald-600 dark:text-yellow-400 hover:underline">Tiếp tục mua sắm</button>
								</div>
							) : (
								<div className="min-w-[800px]">
									{/* Products Row */}
									<div className="grid grid-cols-4 gap-6 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-6 border-b border-gray-100 dark:border-gray-800">
										<div className="col-span-1 pt-4 text-gray-500 font-medium">TỔNG QUAN</div>
										{compareItems.map((item) => (
											<div key={item._id} className="col-span-1 relative group bg-gray-50 dark:bg-black/40 p-4 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-800 transition">
												<button 
													onClick={() => removeFromCompare(item._id)}
													className="absolute top-2 right-2 p-1.5 bg-white dark:bg-gray-800 rounded-full text-gray-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition"
												>
													<Trash2 className="w-4 h-4" />
												</button>
												<img src={item.image} alt={item.name} className="w-32 h-32 mx-auto object-cover rounded-xl mb-4 cursor-pointer" onClick={() => handleNavigate(item._id)} />
												<h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 cursor-pointer hover:text-emerald-600 dark:hover:text-yellow-400" onClick={() => handleNavigate(item._id)}>{item.name}</h3>
												<p className="text-xl font-bold text-emerald-600 dark:text-yellow-400 mb-4">{formatCurrency(item.price, currency, lang)}</p>
												
												<button
													onClick={() => {
														addToCart(item);
														onClose();
													}}
													className="w-full bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white font-semibold py-2.5 rounded-xl transition"
												>
													Thêm vào giỏ
												</button>
											</div>
										))}
									</div>

									{/* Specs Rows */}
									<div className="mt-8 space-y-6 text-sm">
										<div className="grid grid-cols-4 gap-6 items-center">
											<div className="font-semibold text-gray-500">Mã sản phẩm</div>
											{compareItems.map(item => <div className="font-medium" key={item._id}>{item._id.slice(-6).toUpperCase()}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Bộ máy (Movement)</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.movement?.type || item.type || '-'} <br/><span className="text-gray-400 text-xs">{item.specs?.movement?.caliber}</span></div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Dự trữ năng lượng</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.movement?.powerReserve || '-'}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Kích thước vỏ</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.case?.diameter || '-'} <br/><span className="text-gray-400 text-xs">Độ dày: {item.specs?.case?.thickness || '-'}</span></div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Chất liệu vỏ</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.case?.material || '-'}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Dây đeo</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.strap?.material || '-'}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Khóa</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.strap?.claspType || '-'}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Chống nước</div>
											{compareItems.map(item => <div key={item._id}>{item.specs?.waterResistance || '-'}</div>)}
										</div>
										<div className="grid grid-cols-4 gap-6 items-center border-t border-gray-100 dark:border-gray-800 pt-6">
											<div className="font-semibold text-gray-500">Bảo hành</div>
											{compareItems.map(item => <div key={item._id} className="flex items-center gap-1 text-emerald-500"><ShieldCheck className="w-4 h-4"/> 5 năm</div>)}
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
