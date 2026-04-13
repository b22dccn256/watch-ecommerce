import { Minus, Plus, Trash, Bookmark, AlertTriangle, PencilLine, X } from "lucide-react";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useUserStore } from "../stores/useUserStore";
import { useState, useEffect, useContext, useMemo } from "react";
import { I18nContext } from "../contexts/I18nContext";
import { formatCurrency } from "../i18n/format";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const CartItem = ({ item }) => {
	const { removeFromCart, updateQuantity, updateCartItemAttributes, selectedItems, toggleSelectItem, getUniqueId } = useCartStore();
	const { toggleWishlist } = useWishlistStore();
	const { user } = useUserStore();
	const [localQuantity, setLocalQuantity] = useState(item.quantity);
	const [showAttributeModal, setShowAttributeModal] = useState(false);
	const [draftWristSize, setDraftWristSize] = useState(item.wristSize || "");
	const [draftColor, setDraftColor] = useState(item.selectedColor || item.colors?.[0] || null);
	const [draftSize, setDraftSize] = useState(item.selectedSize || item.sizes?.[0] || null);
	const [isSavingAttributes, setIsSavingAttributes] = useState(false);

	const isSelected = selectedItems.includes(getUniqueId(item));
	const availableColors = useMemo(() => (Array.isArray(item.colors) ? item.colors : []), [item.colors]);
	const availableSizes = useMemo(() => (Array.isArray(item.sizes) ? item.sizes : []), [item.sizes]);
	const availableWristOptions = useMemo(() => (Array.isArray(item.wristSizeOptions) ? item.wristSizeOptions : []), [item.wristSizeOptions]);
	const hasWristOptions = availableWristOptions.length > 0;
	const isFreeWristSizing = !hasWristOptions && !!item.specs?.strap?.material?.toLowerCase().match(/steel|metal|titanium|thép|kim loại/);

	// Sync local quantity with remote prop changes
	useEffect(() => {
		setLocalQuantity(item.quantity);
	}, [item.quantity]);

	useEffect(() => {
		setDraftWristSize(item.wristSize || (availableWristOptions[0]?.size || ""));
		setDraftColor(item.selectedColor || availableColors[0] || null);
		setDraftSize(item.selectedSize || availableSizes[0] || null);
	}, [item._id, item.wristSize, item.selectedColor, item.selectedSize, availableWristOptions, availableColors, availableSizes]);

	const handleQuantityBlur = () => {
		let val = parseInt(localQuantity);
		if (isNaN(val) || val < 1) val = 1;
		if (val > item.stock) {
			val = item.stock;
			toast.error(`Sản phẩm này chỉ còn ${item.stock} cái trong kho`);
		}
		setLocalQuantity(val);
		if (val !== item.quantity) {
			updateQuantity(item._id, val, item.stock, item.wristSize, item.selectedColor, item.selectedSize);
		}
	};

	const handleQuantityKeyDown = (e) => {
		if (e.key === 'Enter') {
			e.target.blur();
		}
	};

	const handleSaveAttributes = async () => {
		setIsSavingAttributes(true);
		try {
			await updateCartItemAttributes(
				item._id,
				{
					wristSize: item.wristSize || null,
					selectedColor: item.selectedColor || null,
					selectedSize: item.selectedSize || null,
				},
				{
					wristSize: hasWristOptions ? draftWristSize : (isFreeWristSizing ? draftWristSize : null),
					selectedColor: draftColor || null,
					selectedSize: draftSize || null,
				}
			);
			setShowAttributeModal(false);
		} finally {
			setIsSavingAttributes(false);
		}
	};

	const { lang, currency } = useContext(I18nContext);
	return (
		<>
		<div className='rounded-lg border p-4 shadow-sm border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 md:p-6'>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='flex items-center gap-4 shrink-0 md:order-1'>
					<input 
						type="checkbox"
						checked={isSelected}
						onChange={() => toggleSelectItem(item)}
						className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
					/>
					<img className='h-20 md:h-32 rounded object-cover' src={item.image} />
				</div>
				<label className='sr-only'>Choose quantity:</label>

				<div className='flex flex-col items-center justify-between md:order-3 md:justify-end gap-2'>
					<div className='flex items-center gap-2'>
						<button
							className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border
							 border-gray-200 dark:border-yellow-900 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-yellow-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed'
							onClick={() => {
							const newQ = localQuantity - 1;
								setLocalQuantity(newQ);
								updateQuantity(item._id, newQ, item.stock, item.wristSize, item.selectedColor, item.selectedSize);
							}}
							disabled={localQuantity <= 1}
						>
							<Minus className='text-gray-600 dark:text-gray-300 w-4 h-4' />
						</button>
						<input
							type="number"
							value={localQuantity}
							onChange={(e) => setLocalQuantity(e.target.value)}
							onBlur={handleQuantityBlur}
							onKeyDown={handleQuantityKeyDown}
							min="1"
							max={item.stock}
							className="w-12 text-center text-sm font-semibold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
						/>
						<button
							className='inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border
							 border-gray-200 dark:border-yellow-900 bg-gray-100 dark:bg-zinc-900 hover:bg-gray-200 dark:hover:bg-yellow-900 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] transition disabled:opacity-50 disabled:cursor-not-allowed'
							onClick={() => {
								const newQ = localQuantity + 1;
								setLocalQuantity(newQ);
								updateQuantity(item._id, newQ, item.stock, item.wristSize, item.selectedColor, item.selectedSize);
							}}
							disabled={localQuantity >= item.stock}
						>
							<Plus className='text-gray-600 dark:text-gray-300 w-4 h-4' />
						</button>
					</div>

					<div className='text-end md:order-4 min-w-[120px]'>
						<p className='text-lg font-bold text-emerald-600 dark:text-[#D4AF37]'>
							{formatCurrency(item.price * localQuantity, currency, lang)}
						</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-3 md:order-2 md:max-w-md'>
					<p className='text-base font-semibold text-gray-900 dark:text-white hover:text-[#D4AF37] transition cursor-pointer line-clamp-2'>
						{item.name}
					</p>

					{item.wristSize && (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Yêu cầu cắt dây: <span className="font-medium text-gray-800 dark:text-gray-200">{item.wristSize} mm</span>
						</p>
					)}

					{item.selectedColor && (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Màu sắc: <span className="font-medium text-gray-800 dark:text-gray-200">{item.selectedColor}</span>
						</p>
					)}

					{item.selectedSize && (
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Kích cỡ: <span className="font-medium text-gray-800 dark:text-gray-200">{item.selectedSize}</span>
						</p>
					)}

					<button
						type="button"
						onClick={() => setShowAttributeModal(true)}
						className="inline-flex items-center gap-2 text-xs font-semibold text-[#D4AF37] hover:text-amber-400 transition"
					>
						<PencilLine className="w-3.5 h-3.5" />
						Đổi thuộc tính
					</button>

					{item.stock <= 5 && item.stock > 0 && (
						<p className="text-xs text-orange-400 flex items-center gap-1 font-medium bg-orange-400/10 w-fit px-2 py-1 rounded">
							<AlertTriangle className="w-3 h-3" />
							Chỉ còn {item.stock} sản phẩm
						</p>
					)}
					{item.stock === 0 && (
						<p className="text-xs text-red-500 font-bold bg-red-500/10 w-fit px-2 py-1 rounded">
							Đã hết hàng
						</p>
					)}

					<div className='flex items-center gap-6 pt-2'>
						<button
							className='inline-flex items-center text-sm font-medium text-red-500 hover:text-red-400 transition hover:bg-red-500/10 px-2 py-1 -ml-2 rounded'
							onClick={() => removeFromCart(item._id, item.wristSize, item.selectedColor, item.selectedSize)}
							title='Xóa khỏi giỏ hàng'
						>
							<Trash className="w-4 h-4" />
							<span className='ml-1.5'>Xóa</span>
						</button>
						<button
							className='inline-flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition hover:bg-blue-400/10 px-2 py-1 rounded'
							onClick={() => {
								toggleWishlist(item, !!user);
								removeFromCart(item._id, item.wristSize, item.selectedColor, item.selectedSize);
							}}
							title='Lưu lại mua sau'
						>
							<Bookmark className="w-4 h-4" />
							<span className='ml-1.5'>Mua sau</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<AnimatePresence>
			{showAttributeModal && (
				<div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAttributeModal(false)}>
					<motion.div
						initial={{ opacity: 0, y: 18, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 18, scale: 0.98 }}
						transition={{ duration: 0.2 }}
						onClick={(e) => e.stopPropagation()}
						className="w-full max-w-2xl rounded-3xl overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-2xl"
					>
						<div className="p-5 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
							<div>
								<p className="text-xs uppercase tracking-[0.3em] text-gray-400 font-semibold">Sửa thuộc tính</p>
								<h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{item.name}</h3>
							</div>
							<button type="button" onClick={() => setShowAttributeModal(false)} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white">
								<X className="w-5 h-5" />
							</button>
						</div>

						<div className="p-5 md:p-6 space-y-5">
							{hasWristOptions && (
								<div>
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Kích cỡ / phân loại</p>
									<div className="flex flex-wrap gap-2">
										{availableWristOptions.map((option) => {
											const isSelected = draftWristSize === option.size;
											const isOut = option.stock <= 0;
											return (
												<button
													key={option.size}
													type="button"
													onClick={() => !isOut && setDraftWristSize(option.size)}
													disabled={isOut}
													className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all relative ${isSelected ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] ring-2 ring-[#D4AF37]/30" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37]"} ${isOut ? "opacity-50 cursor-not-allowed" : ""}`}
												>
													{option.size}
													{isOut && <span className="ml-2 text-[10px] uppercase">Hết</span>}
												</button>
											);
										})}
									</div>
								</div>
							)}

							{isFreeWristSizing && (
								<div>
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Cắt dây theo cổ tay (mm)</p>
									<input
										type="number"
										value={draftWristSize}
										onChange={(e) => setDraftWristSize(e.target.value)}
										className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#D4AF37]"
										placeholder="Ví dụ: 170"
									/>
								</div>
							)}

							{availableColors.length > 0 && (
								<div>
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Màu sắc</p>
									<div className="flex flex-wrap gap-2">
										{availableColors.map((color) => (
											<button
												key={color}
												type="button"
												onClick={() => setDraftColor(color)}
												className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${draftColor === color ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] ring-2 ring-[#D4AF37]/20" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37]"}`}
											>
												{color}
											</button>
										))}
									</div>
								</div>
							)}

							{availableSizes.length > 0 && (
								<div>
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">Kích cỡ</p>
									<div className="flex flex-wrap gap-2">
										{availableSizes.map((size) => (
											<button
												key={size}
												type="button"
												onClick={() => setDraftSize(size)}
												className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${draftSize === size ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] ring-2 ring-[#D4AF37]/20" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37]"}`}
											>
												{size}
											</button>
										))}
									</div>
								</div>
							)}
						</div>

						<div className="p-5 md:p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-3">
							<button type="button" onClick={() => setShowAttributeModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
								Hủy
							</button>
							<button
								type="button"
								onClick={handleSaveAttributes}
								disabled={isSavingAttributes}
								className="px-5 py-2.5 rounded-xl bg-[#D4AF37] text-black text-sm font-bold hover:bg-amber-400 transition disabled:opacity-60"
							>
								{isSavingAttributes ? "Đang lưu..." : "Xác nhận"}
							</button>
						</div>
					</motion.div>
				</div>
			)}
		</AnimatePresence>
		</>
	);
};
export default CartItem;
