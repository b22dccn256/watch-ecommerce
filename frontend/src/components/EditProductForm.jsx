import { useEffect, useState, useRef } from "react";
import { Save, Loader, ImagePlus, Tag, DollarSign, X, Plus } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";
import { MOVEMENT_FILTERS } from "../constants/watchFilters";

const machineTypes = MOVEMENT_FILTERS;

const inputCls = "w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/40 transition";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

/**
 * EditProductForm — pre-fills all fields from an existing `product` object.
 * Calls PUT /products/:id via updateProduct store action.
 *
 * Props:
 *  - product {Object}    the product being edited (required)
 *  - onSuccess {Function} called after successful save
 *  - onClose {Function}   called when user cancels
 */
const EditProductForm = ({ product, onSuccess, onClose }) => {
	const { updateProduct, loading, brands, fetchBrands, categories, fetchCategories } = useProductStore();
	const fileInputRef = useRef(null);
	const [dragOver, setDragOver] = useState(false);

	// Pre-fill form from product prop
	const [formData, setFormData] = useState({
		name: product?.name || "",
		description: product?.description || "",
		price: product?.price ?? "",
		originalPrice: product?.originalPrice ?? "",
		category: product?.categoryId?._id || product?.categoryId || product?.category || "",
		image: product?.image || "",
		images: Array.isArray(product?.images) && product.images.length > 0 ? product.images : (product?.image ? [product.image] : []),
		stock: product?.stock ?? "",
		brand: typeof product?.brand === "object" ? (product?.brand?._id || "") : (product?.brand || ""),
		type: product?.type || "",
		wristSizeOptions: Array.isArray(product?.wristSizeOptions) ? product.wristSizeOptions : [],
		colors: Array.isArray(product?.colors) ? product.colors.join(', ') : (product?.colors || ""),
		sizes: Array.isArray(product?.sizes) ? product.sizes.join(', ') : (product?.sizes || ""),
		specsStrapMaterial: product?.specs?.strap?.material || "",
		specsCaseMaterial: product?.specs?.case?.material || "",
		specsCaseDiameter: product?.specs?.case?.diameter || "",
		specsWaterResistance: product?.specs?.waterResistance || "",
	});

	useEffect(() => {
		(async () => {
			if (brands.length === 0) await fetchBrands();
			if (categories.length === 0) await fetchCategories();
		})();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSubmit = async (e) => {
		e.preventDefault();
		const finalStock =
			formData.wristSizeOptions.length > 0
				? formData.wristSizeOptions.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
				: Number(formData.stock);

		await updateProduct(product._id, {
			...formData,
			stock: finalStock,
			price: Number(formData.price),
			originalPrice: formData.originalPrice ? Number(formData.originalPrice) : undefined,
			wristSizeOptions: formData.wristSizeOptions.filter((o) => o.size?.trim() !== ""),
			colors: typeof formData.colors === 'string' ? formData.colors.split(',').map(s => s.trim()).filter(Boolean) : (formData.colors || []),
			sizes: typeof formData.sizes === 'string' ? formData.sizes.split(',').map(s => s.trim()).filter(Boolean) : (formData.sizes || []),
			specs: {
				case: {
					material: formData.specsCaseMaterial || undefined,
					diameter: formData.specsCaseDiameter || undefined,
				},
				strap: { material: formData.specsStrapMaterial || undefined },
				waterResistance: formData.specsWaterResistance || undefined,
			},
		});

		if (onSuccess) onSuccess();
	};

	// ── Wrist size options helpers ────────────────────────────
	const addWristSizeOption = () =>
		setFormData((prev) => ({ ...prev, wristSizeOptions: [...prev.wristSizeOptions, { size: "", stock: 0 }] }));

	const updateWristOption = (index, field, value) => {
		const opts = [...formData.wristSizeOptions];
		opts[index][field] = value;
		setFormData((prev) => ({ ...prev, wristSizeOptions: opts }));
	};

	const removeWristOption = (index) => {
		setFormData((prev) => ({
			...prev,
			wristSizeOptions: prev.wristSizeOptions.filter((_, i) => i !== index),
		}));
	};

	// ── Image helpers ─────────────────────────────────────────

	const processImageFile = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => setFormData((prev) => ({ ...prev, images: [...prev.images, reader.result] }));
		reader.readAsDataURL(file);
	};

	const handleImageChange = (e) => {
		if (!e.target.files) return;
		Array.from(e.target.files).forEach(processImageFile);
	};

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		Array.from(e.dataTransfer.files || []).forEach(processImageFile);
	};

	const removeImageAt = (index) => {
		setFormData((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
	};

	// ── Discount preview ─────────────────────────────────────
	const discount =
		formData.originalPrice && formData.price && Number(formData.originalPrice) > 0
			? Math.round((1 - Number(formData.price) / Number(formData.originalPrice)) * 100)
			: null;

	const totalStock =
		formData.wristSizeOptions.length > 0
			? formData.wristSizeOptions.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
			: Number(formData.stock);

	const descLen = formData.description.length;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

				{/* ── Column 1 ──────────────────────────────────────────── */}
				<div className="space-y-4">

					{/* Tên sản phẩm */}
					<div>
						<label htmlFor="edit-name" className={labelCls}>Tên Sản Phẩm *</label>
						<input
							type="text" id="edit-name" required
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className={inputCls}
							placeholder="VD: Rolex Oyster Perpetual 41mm..."
						/>
					</div>

					{/* Thương hiệu */}
					<div>
						<label htmlFor="edit-brand" className={labelCls}>Thương hiệu *</label>
						<select
							id="edit-brand" required
							value={formData.brand}
							onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
							className={inputCls}
						>
							<option value="">Chọn thương hiệu</option>
							{Array.isArray(brands) && brands.map((b) => (
								<option key={b._id} value={b._id}>{b.name}</option>
							))}
						</select>
					</div>

					{/* Giá bán + Giá gốc */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="edit-price" className={labelCls}>Giá bán (₫) *</label>
							<div className="relative">
								<DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-luxury-gold" />
								<input
									type="number" id="edit-price" required min="0"
									value={formData.price}
									onChange={(e) => setFormData({ ...formData, price: e.target.value })}
									className={inputCls + " pl-8"}
								/>
							</div>
						</div>
						<div>
							<label htmlFor="edit-original-price" className={labelCls}>
								Giá gốc (₫)
								{discount !== null && discount > 0 && (
									<span className="ml-2 text-red-500 font-bold normal-case">-{discount}%</span>
								)}
							</label>
							<div className="relative">
								<Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
								<input
									type="number" id="edit-original-price" min="0"
									value={formData.originalPrice}
									onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
									className={inputCls + " pl-8"}
									placeholder="Để trống nếu không giảm"
								/>
							</div>
						</div>
					</div>

					{/* Tồn kho */}
					<div>
						<label htmlFor="edit-stock" className={labelCls}>Tồn kho (Tổng) *</label>
						<input
							type="number" id="edit-stock" min="0"
							required={formData.wristSizeOptions.length === 0}
							value={formData.wristSizeOptions.length > 0 ? totalStock : formData.stock}
							onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
							disabled={formData.wristSizeOptions.length > 0}
							className={inputCls + (formData.wristSizeOptions.length > 0 ? " bg-gray-200 dark:bg-gray-700 cursor-not-allowed" : "")}
						/>
						{formData.wristSizeOptions.length > 0 && (
							<p className="text-xs text-gray-400 mt-1">Tổng tồn kho tự động tính từ các size.</p>
						)}
					</div>

					{/* Wrist size options */}
					<div className="pt-2 border-t border-gray-100 dark:border-luxury-border">
						<div className="flex items-center justify-between mb-2">
							<label className={labelCls + " !mb-0"}>Kích cỡ cổ tay (Tùy chọn)</label>
							<button
								type="button" onClick={addWristSizeOption}
								className="text-xs flex items-center gap-1 text-luxury-gold hover:text-yellow-500 font-medium cursor-pointer"
							>
								<Plus className="w-3 h-3" /> Thêm size
							</button>
						</div>
						{formData.wristSizeOptions.length > 0 ? (
							<div className="space-y-2">
								{formData.wristSizeOptions.map((opt, i) => (
									<div key={i} className="flex items-center gap-2">
										<input
											type="text" placeholder="Size (vd: 38-42mm)" required
											value={opt.size}
											onChange={(e) => updateWristOption(i, "size", e.target.value)}
											className={inputCls + " flex-1 !py-1.5 !text-xs"}
										/>
										<input
											type="number" placeholder="Số lượng" min="0" required
											value={opt.stock}
											onChange={(e) => updateWristOption(i, "stock", Number(e.target.value))}
											className={inputCls + " w-24 !py-1.5 !text-xs text-center"}
										/>
										<button
											type="button" onClick={() => removeWristOption(i)}
											className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
										>
											<X className="w-4 h-4" />
										</button>
									</div>
								))}
							</div>
						) : (
							<p className="text-xs text-gray-400 italic">Không có phân loại kích cỡ.</p>
						)}
					</div>
				</div>

				{/* ── Column 2 ──────────────────────────────────────────── */}
				<div className="space-y-4">

					{/* Danh mục */}
					<div>
						<label htmlFor="edit-category" className={labelCls}>Danh mục *</label>
						<select
							id="edit-category" required
							value={formData.category}
							onChange={(e) => setFormData({ ...formData, category: e.target.value })}
							className={inputCls}
						>
							<option value="">Chọn danh mục</option>
							{Array.isArray(categories) && categories.map((c) => (
								<option key={c._id} value={c._id}>{c.name}</option>
							))}
						</select>
					</div>

					{/* Bộ máy */}
					<div>
						<label htmlFor="edit-type" className={labelCls}>Loại bộ máy (Movement) *</label>
						<select
							id="edit-type" required
							value={formData.type}
							onChange={(e) => setFormData({ ...formData, type: e.target.value })}
							className={inputCls}
						>
							<option value="">Chọn bộ máy</option>
							{machineTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</div>

					{/* Image drag-and-drop */}
					<div>
						<label className={labelCls}>Ảnh đại diện</label>
						<div
							className={`drop-zone p-4 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px] ${dragOver ? "drag-over" : ""}`}
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
						>
							{formData.images && formData.images.length > 0 ? (
								<div className="w-full">
									<div className="grid grid-cols-3 gap-3">
										{formData.images.map((src, idx) => (
											<div key={idx} className="relative">
												<img src={src} alt={`img-${idx}`} className="h-20 w-full object-cover rounded-lg border border-luxury-gold/30" />
												<button type="button" onClick={() => removeImageAt(idx)} className="absolute top-1 right-1 p-1 bg-white rounded-full shadow">
													<X className="w-3 h-3 text-red-500" />
												</button>
											</div>
										))}
									</div>
									<p className="text-xs text-gray-400 mt-2">Kéo để thay đổi hoặc chọn thêm file (nhiều ảnh được hỗ trợ)</p>
								</div>
							) : (
								<>
									<ImagePlus className="w-8 h-8 text-gray-400" />
									<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
										Kéo thả ảnh hoặc <span className="text-luxury-gold font-medium">chọn file</span>
									</p>
									<p className="text-xs text-gray-400">PNG, JPG, WEBP – tối đa 5MB</p>
								</>
							)}
						</div>
						<input ref={fileInputRef} type="file" accept="image/*" className="hidden" multiple onChange={handleImageChange} />
					</div>
				</div>
			</div>

			{/* ── Thuộc tính sản phẩm ── */}
			<div className="pt-4 border-t border-gray-100 dark:border-luxury-border">
				<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Thuộc tính sản phẩm</h3>
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					<div>
						<label className={labelCls}>Màu sắc</label>
						<input type="text" value={formData.colors}
							onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
							className={inputCls} placeholder="Đen, Bạc, Xanh dương..."
						/>
						<p className="text-[10px] text-gray-400 mt-0.5">Phân cách bằng dấu phẩy</p>
					</div>
					<div>
						<label className={labelCls}>Kích thước mặt</label>
						<input type="text" value={formData.sizes}
							onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
							className={inputCls} placeholder="36mm, 40mm, 44mm"
						/>
						<p className="text-[10px] text-gray-400 mt-0.5">Phân cách bằng dấu phẩy</p>
					</div>
					<div>
						<label className={labelCls}>Chất liệu dây</label>
						<select value={formData.specsStrapMaterial}
							onChange={(e) => setFormData({ ...formData, specsStrapMaterial: e.target.value })}
							className={inputCls}>
							<option value="">Chọn</option>
							<option>Da</option>
							<option>Thép không gỉ</option>
							<option>Cao su</option>
							<option>Vải NATO</option>
							<option>Ceramic</option>
							<option>Titanium</option>
						</select>
					</div>
					<div>
						<label className={labelCls}>Chất liệu vỏ</label>
						<select value={formData.specsCaseMaterial}
							onChange={(e) => setFormData({ ...formData, specsCaseMaterial: e.target.value })}
							className={inputCls}>
							<option value="">Chọn</option>
							<option>Thép không gỉ</option>
							<option>Titanium</option>
							<option>Vàng 18K</option>
							<option>Ceramic</option>
							<option>Nhựa</option>
						</select>
					</div>
					<div>
						<label className={labelCls}>Đường kính mặt</label>
						<input type="text" value={formData.specsCaseDiameter}
							onChange={(e) => setFormData({ ...formData, specsCaseDiameter: e.target.value })}
							className={inputCls} placeholder="40 mm"
						/>
					</div>
					<div>
						<label className={labelCls}>Chống nước</label>
						<input type="text" value={formData.specsWaterResistance}
							onChange={(e) => setFormData({ ...formData, specsWaterResistance: e.target.value })}
							className={inputCls} placeholder="30m / 100m / 300m"
						/>
					</div>
				</div>
			</div>

			{/* ── Mô tả full width ──────────────────────────────────────── */}
			<div>
				<div className="flex items-center justify-between mb-1.5">
					<label htmlFor="edit-description" className={labelCls + " mb-0"}>Mô tả sản phẩm *</label>
					<span className={`text-xs ${descLen >= 200 ? "text-green-500" : "text-gray-400"}`}>
						{descLen} / 200+ ký tự
					</span>
				</div>
				<textarea
					id="edit-description" required rows="4"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
					className={inputCls + " resize-none"}
					placeholder="Chi tiết sản phẩm: chất liệu, tính năng, độ sâu chống nước..."
				/>
				{descLen > 0 && descLen < 80 && (
					<p className="text-xs text-amber-500 mt-1">Nên thêm ít nhất 80 ký tự cho mô tả hấp dẫn hơn.</p>
				)}
			</div>

			{/* ── Buttons ──────────────────────────────────────────────── */}
			<div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-luxury-border">
				<button
					type="button" onClick={onClose}
					className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-luxury-border text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
				>
					Hủy
				</button>
				<button
					type="submit" disabled={loading}
					className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-luxury-gold/20 text-luxury-dark bg-luxury-gold hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition disabled:opacity-50 min-w-[160px]"
				>
					{loading ? (
						<><Loader className="h-4 w-4 animate-spin" /> Đang lưu...</>
					) : (
						<><Save className="h-4 w-4" /> Lưu thay đổi</>
					)}
				</button>
			</div>
		</form>
	);
};

export default EditProductForm;
