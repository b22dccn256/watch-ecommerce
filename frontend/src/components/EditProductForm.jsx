import { useEffect, useState, useRef } from "react";
import { Save, Loader, ImagePlus, Tag, DollarSign, X, Plus } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = [
	"CÆ¡ Tá»± Äá»™ng (Automatic)",
	"CÆ¡ LĂªn CĂ³t Tay (Hand-wound)",
	"Bá»™ MĂ¡y Pin (Quartz)",
	"NÄƒng LÆ°á»£ng Ănh SĂ¡ng (Solar)",
	"Äá»“ng Há»“ Äiá»‡n Tá»­ (Digital)",
	"Äá»“ng Há»“ ThĂ´ng Minh (Smartwatch)",
];

const machineTypes = [
	{ value: "mechanical", label: "CÆ¡ lĂªn cĂ³t" },
	{ value: "quartz", label: "Bá»™ mĂ¡y pin" },
	{ value: "automatic", label: "CÆ¡ tá»± Ä‘á»™ng" },
	{ value: "digital", label: "Äiá»‡n tá»­" },
	{ value: "smartwatch", label: "Äá»“ng há»“ thĂ´ng minh" },
];

const inputCls = "w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/40 transition";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

/**
 * EditProductForm â€” pre-fills all fields from an existing `product` object.
 * Calls PUT /products/:id via updateProduct store action.
 *
 * Props:
 *  - product {Object}    the product being edited (required)
 *  - onSuccess {Function} called after successful save
 *  - onClose {Function}   called when user cancels
 */
const EditProductForm = ({ product, onSuccess, onClose }) => {
	const { updateProduct, loading, brands, fetchBrands } = useProductStore();
	const fileInputRef = useRef(null);
	const [dragOver, setDragOver] = useState(false);

	// Pre-fill form from product prop
	const [formData, setFormData] = useState({
		name: product?.name || "",
		description: product?.description || "",
		price: product?.price ?? "",
		originalPrice: product?.originalPrice ?? "",
		category: product?.category || "",
		image: product?.image || "",
		stock: product?.stock ?? "",
		brand: typeof product?.brand === "object" ? (product?.brand?._id || "") : (product?.brand || ""),
		type: product?.type || "",
		wristSizeOptions: Array.isArray(product?.wristSizeOptions) ? product.wristSizeOptions : [],
	});

	useEffect(() => {
		fetchBrands();
	}, [fetchBrands]);

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
		});

		if (onSuccess) onSuccess();
	};

	// â”€â”€ Wrist size options helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

	// â”€â”€ Image helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
	const processImageFile = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => setFormData((prev) => ({ ...prev, image: reader.result }));
		reader.readAsDataURL(file);
	};

	const handleImageChange = (e) => processImageFile(e.target.files[0]);
	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		processImageFile(e.dataTransfer.files[0]);
	};

	// â”€â”€ Discount preview â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

				{/* â”€â”€ Column 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
				<div className="space-y-4">

					{/* TĂªn sáº£n pháº©m */}
					<div>
						<label htmlFor="edit-name" className={labelCls}>TĂªn Sáº£n Pháº©m *</label>
						<input
							type="text" id="edit-name" required
							value={formData.name}
							onChange={(e) => setFormData({ ...formData, name: e.target.value })}
							className={inputCls}
							placeholder="VD: Rolex Oyster Perpetual 41mm..."
						/>
					</div>

					{/* ThÆ°Æ¡ng hiá»‡u */}
					<div>
						<label htmlFor="edit-brand" className={labelCls}>ThÆ°Æ¡ng hiá»‡u *</label>
						<select
							id="edit-brand" required
							value={formData.brand}
							onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
							className={inputCls}
						>
							<option value="">Chá»n thÆ°Æ¡ng hiá»‡u</option>
							{Array.isArray(brands) && brands.map((b) => (
								<option key={b._id} value={b._id}>{b.name}</option>
							))}
						</select>
					</div>

					{/* GiĂ¡ bĂ¡n + GiĂ¡ gá»‘c */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="edit-price" className={labelCls}>GiĂ¡ bĂ¡n (â‚«) *</label>
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
								GiĂ¡ gá»‘c (â‚«)
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
									placeholder="Äá»ƒ trá»‘ng náº¿u khĂ´ng giáº£m"
								/>
							</div>
						</div>
					</div>

					{/* Tá»“n kho */}
					<div>
						<label htmlFor="edit-stock" className={labelCls}>Tá»“n kho (Tá»•ng) *</label>
						<input
							type="number" id="edit-stock" min="0"
							required={formData.wristSizeOptions.length === 0}
							value={formData.wristSizeOptions.length > 0 ? totalStock : formData.stock}
							onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
							disabled={formData.wristSizeOptions.length > 0}
							className={inputCls + (formData.wristSizeOptions.length > 0 ? " bg-gray-200 dark:bg-gray-700 cursor-not-allowed" : "")}
						/>
						{formData.wristSizeOptions.length > 0 && (
							<p className="text-xs text-gray-400 mt-1">Tá»•ng tá»“n kho tá»± Ä‘á»™ng tĂ­nh tá»« cĂ¡c size.</p>
						)}
					</div>

					{/* Wrist size options */}
					<div className="pt-2 border-t border-gray-100 dark:border-luxury-border">
						<div className="flex items-center justify-between mb-2">
							<label className={labelCls + " !mb-0"}>KĂ­ch cá»¡ cá»• tay (TĂ¹y chá»n)</label>
							<button
								type="button" onClick={addWristSizeOption}
								className="text-xs flex items-center gap-1 text-luxury-gold hover:text-yellow-500 font-medium cursor-pointer"
							>
								<Plus className="w-3 h-3" /> ThĂªm size
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
											type="number" placeholder="Sá»‘ lÆ°á»£ng" min="0" required
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
							<p className="text-xs text-gray-400 italic">KhĂ´ng cĂ³ phĂ¢n loáº¡i kĂ­ch cá»¡.</p>
						)}
					</div>
				</div>

				{/* â”€â”€ Column 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
				<div className="space-y-4">

					{/* Danh má»¥c */}
					<div>
						<label htmlFor="edit-category" className={labelCls}>Danh má»¥c *</label>
						<select
							id="edit-category" required
							value={formData.category}
							onChange={(e) => setFormData({ ...formData, category: e.target.value })}
							className={inputCls}
						>
							<option value="">Chá»n danh má»¥c</option>
							{categories.map((c) => <option key={c} value={c}>{c}</option>)}
						</select>
					</div>

					{/* Bá»™ mĂ¡y */}
					<div>
						<label htmlFor="edit-type" className={labelCls}>Loáº¡i bá»™ mĂ¡y (Movement) *</label>
						<select
							id="edit-type" required
							value={formData.type}
							onChange={(e) => setFormData({ ...formData, type: e.target.value })}
							className={inputCls}
						>
							<option value="">Chá»n bá»™ mĂ¡y</option>
							{machineTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
						</select>
					</div>

					{/* Image drag-and-drop */}
					<div>
						<label className={labelCls}>áº¢nh Ä‘áº¡i diá»‡n</label>
						<div
							className={`drop-zone p-4 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[140px] ${dragOver ? "drag-over" : ""}`}
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
						>
							{formData.image ? (
								<div className="flex items-center gap-4 w-full">
									<img src={formData.image} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-luxury-gold/30 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-700 dark:text-gray-300">áº¢nh hiá»‡n táº¡i</p>
										<p className="text-xs text-gray-400 mt-0.5">Click Ä‘á»ƒ thay Ä‘á»•i</p>
									</div>
								</div>
							) : (
								<>
									<ImagePlus className="w-8 h-8 text-gray-400" />
									<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
										KĂ©o tháº£ áº£nh hoáº·c <span className="text-luxury-gold font-medium">chá»n file</span>
									</p>
									<p className="text-xs text-gray-400">PNG, JPG, WEBP â€“ tá»‘i Ä‘a 5MB</p>
								</>
							)}
						</div>
						<input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
					</div>
				</div>
			</div>

			{/* â”€â”€ MĂ´ táº£ full width â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div>
				<div className="flex items-center justify-between mb-1.5">
					<label htmlFor="edit-description" className={labelCls + " mb-0"}>MĂ´ táº£ sáº£n pháº©m *</label>
					<span className={`text-xs ${descLen >= 200 ? "text-green-500" : "text-gray-400"}`}>
						{descLen} / 200+ kĂ½ tá»±
					</span>
				</div>
				<textarea
					id="edit-description" required rows="4"
					value={formData.description}
					onChange={(e) => setFormData({ ...formData, description: e.target.value })}
					className={inputCls + " resize-none"}
					placeholder="Chi tiáº¿t sáº£n pháº©m: cháº¥t liá»‡u, tĂ­nh nÄƒng, Ä‘á»™ sĂ¢u chá»‘ng nÆ°á»›c..."
				/>
				{descLen > 0 && descLen < 80 && (
					<p className="text-xs text-amber-500 mt-1">NĂªn thĂªm Ă­t nháº¥t 80 kĂ½ tá»± cho mĂ´ táº£ háº¥p dáº«n hÆ¡n.</p>
				)}
			</div>

			{/* â”€â”€ Buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-luxury-border">
				<button
					type="button" onClick={onClose}
					className="px-6 py-2.5 rounded-lg border border-gray-200 dark:border-luxury-border text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition"
				>
					Há»§y
				</button>
				<button
					type="submit" disabled={loading}
					className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-luxury-gold/20 text-luxury-dark bg-luxury-gold hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition disabled:opacity-50 min-w-[160px]"
				>
					{loading ? (
						<><Loader className="h-4 w-4 animate-spin" /> Äang lÆ°u...</>
					) : (
						<><Save className="h-4 w-4" /> LÆ°u thay Ä‘á»•i</>
					)}
				</button>
			</div>
		</form>
	);
};

export default EditProductForm;

