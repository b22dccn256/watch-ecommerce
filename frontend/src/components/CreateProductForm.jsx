import { useEffect, useState, useRef } from "react";
import { PlusCircle, Loader, ImagePlus, Tag, DollarSign, X, Plus } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const machineTypes = [
	{ value: "Mechanical", label: "CÆ¡ lĂªn cĂ³t" },
	{ value: "Quartz", label: "Bá»™ mĂ¡y pin" },
	{ value: "Automatic", label: "CÆ¡ tá»± Ä‘á»™ng" },
	{ value: "Solar", label: "NÄƒng lÆ°á»£ng Ă¡nh sĂ¡ng" },
	{ value: "Digital", label: "Äiá»‡n tá»­" },
	{ value: "Smartwatch", label: "Äá»“ng há»“ thĂ´ng minh" },
];

const inputCls = "w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold/40 transition";
const labelCls = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5";

const CreateProductForm = ({ onSuccess }) => {
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		originalPrice: "",
		category: "",
		image: "",
		stock: "",
		brand: "",
		type: "",
		wristSizeOptions: [],
	});

	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef(null);

	const { createProduct, loading, brands, fetchBrands, categories, fetchCategories } = useProductStore();

	useEffect(() => {
		fetchBrands();
		fetchCategories();
	}, [fetchBrands, fetchCategories]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			const finalStock = newProduct.wristSizeOptions.length > 0 
				? newProduct.wristSizeOptions.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0)
				: Number(newProduct.stock);

			await createProduct({
				...newProduct,
				stock: finalStock,
				price: Number(newProduct.price),
				originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
				wristSizeOptions: newProduct.wristSizeOptions.filter(o => o.size.trim() !== "")
			});
			setNewProduct({ name: "", description: "", price: "", originalPrice: "", category: "", image: "", stock: "", brand: "", type: "", wristSizeOptions: [] });
			if (onSuccess) onSuccess();
		} catch {
			console.error("error creating a product");
		}
	};

	const addWristSizeOption = () => {
		setNewProduct(prev => ({ ...prev, wristSizeOptions: [...prev.wristSizeOptions, { size: "", stock: 0 }] }));
	};

	const updateWristOption = (index, field, value) => {
		const newOptions = [...newProduct.wristSizeOptions];
		newOptions[index][field] = value;
		setNewProduct(prev => ({ ...prev, wristSizeOptions: newOptions }));
	};

	const removeWristOption = (index) => {
		const newOptions = newProduct.wristSizeOptions.filter((_, i) => i !== index);
		setNewProduct(prev => ({ ...prev, wristSizeOptions: newOptions }));
	};

	const processImageFile = (file) => {
		if (!file) return;
		const reader = new FileReader();
		reader.onloadend = () => setNewProduct((prev) => ({ ...prev, image: reader.result }));
		reader.readAsDataURL(file);
	};

	const handleImageChange = (e) => processImageFile(e.target.files[0]);

	const handleDrop = (e) => {
		e.preventDefault();
		setDragOver(false);
		processImageFile(e.dataTransfer.files[0]);
	};

	// Discount preview
	const discount =
		newProduct.originalPrice && newProduct.price && Number(newProduct.originalPrice) > 0
			? Math.round((1 - Number(newProduct.price) / Number(newProduct.originalPrice)) * 100)
			: null;

	const descLen = newProduct.description.length;

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

				{/* â”€â”€ Column 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
				<div className="space-y-4">
					{/* TĂªn sáº£n pháº©m */}
					<div>
						<label htmlFor="name" className={labelCls}>TĂªn Sáº£n Pháº©m *</label>
						<input
							type="text" id="name" required
							value={newProduct.name}
							onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
							className={inputCls}
							placeholder="VD: Rolex Oyster Perpetual 41mm..."
						/>
					</div>

					{/* ThÆ°Æ¡ng hiá»‡u */}
					<div>
						<label htmlFor="brand" className={labelCls}>ThÆ°Æ¡ng hiá»‡u *</label>
						<select
							id="brand" required
							value={newProduct.brand}
							onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
							className={inputCls}
						>
							{brands?.length === 0 ? (
								<option value="">Äang táº£i thÆ°Æ¡ng hiá»‡u...</option>
							) : (
								<>
									<option value="">Chá»n thÆ°Æ¡ng hiá»‡u</option>
									{brands?.map((b) => (
										<option key={b._id} value={b._id}>{b.name}</option>
									))}
								</>
							)}
						</select>
					</div>

					{/* Price + Original Price */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="price" className={labelCls}>GiĂ¡ bĂ¡n (â‚«) *</label>
							<div className="relative">
								<DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-luxury-gold" />
								<input
									type="number" id="price" required min="0"
									value={newProduct.price}
									onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
									className={inputCls + " pl-8"}
								/>
							</div>
						</div>
						<div>
							<label htmlFor="originalPrice" className={labelCls}>
								GiĂ¡ gá»‘c (â‚«)
								{discount !== null && discount > 0 && (
									<span className="ml-2 text-red-500 font-bold normal-case">-{discount}%</span>
								)}
							</label>
							<div className="relative">
								<Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
								<input
									type="number" id="originalPrice" min="0"
									value={newProduct.originalPrice}
									onChange={(e) => setNewProduct({ ...newProduct, originalPrice: e.target.value })}
									className={inputCls + " pl-8"}
									placeholder="Äá»ƒ trá»‘ng náº¿u khĂ´ng giáº£m"
								/>
							</div>
						</div>
					</div>

					{/* Stock */}
					<div>
						<label htmlFor="stock" className={labelCls}>Tá»“n kho (Tá»•ng) *</label>
						<input
							type="number" id="stock" required={newProduct.wristSizeOptions.length === 0} min="0"
							value={newProduct.wristSizeOptions.length > 0 ? newProduct.wristSizeOptions.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0) : newProduct.stock}
							onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
							disabled={newProduct.wristSizeOptions.length > 0}
							className={inputCls + (newProduct.wristSizeOptions.length > 0 ? " bg-gray-200 cursor-not-allowed" : "")}
							placeholder="VD: 50"
						/>
						{newProduct.wristSizeOptions.length > 0 && <p className="text-xs text-gray-400 mt-1">Tá»•ng tá»“n kho tá»± Ä‘á»™ng tĂ­nh tá»« cĂ¡c size.</p>}
					</div>

					{/* Wrist Size Options */}
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
						{newProduct.wristSizeOptions.length > 0 ? (
							<div className="space-y-2">
								{newProduct.wristSizeOptions.map((opt, i) => (
									<div key={i} className="flex items-center gap-2">
										<input 
											type="text" placeholder="Size (vd: 38-42mm)" required
											value={opt.size} onChange={(e) => updateWristOption(i, "size", e.target.value)}
											className={inputCls + " flex-1 !py-1.5 !text-xs"} 
										/>
										<input 
											type="number" placeholder="Sá»‘ lÆ°á»£ng" min="0" required
											value={opt.stock} onChange={(e) => updateWristOption(i, "stock", Number(e.target.value))}
											className={inputCls + " w-24 !py-1.5 !text-xs text-center"} 
										/>
										<button type="button" onClick={() => removeWristOption(i)} className="p-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
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

				{/* â”€â”€ Column 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
				<div className="space-y-4">
					{/* Danh má»¥c */}
					<div>
						<label htmlFor="category" className={labelCls}>Danh má»¥c *</label>
						<select
							id="category" required
							value={newProduct.category}
							onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
							className={inputCls}
						>
							{categories?.length === 0 ? (
								<option value="">Äang táº£i danh má»¥c...</option>
							) : (
								<>
									<option value="">Chá»n danh má»¥c</option>
									{categories?.map((c) => (
										<option key={c._id} value={c._id}>{c.name}</option>
									))}
								</>
							)}
						</select>
					</div>

					{/* Bá»™ mĂ¡y */}
					<div>
						<label htmlFor="type" className={labelCls}>Loáº¡i bá»™ mĂ¡y (Movement) *</label>
						<select
							id="type" required
							value={newProduct.type}
							onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
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
							className={`drop-zone p-4 flex flex-col items-center justify-center gap-2 cursor-pointer min-h-[120px] ${dragOver ? "drag-over" : ""}`}
							onClick={() => fileInputRef.current?.click()}
							onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
							onDragLeave={() => setDragOver(false)}
							onDrop={handleDrop}
						>
							{newProduct.image ? (
								<div className="flex items-center gap-4 w-full">
									<img src={newProduct.image} alt="Preview" className="h-16 w-16 object-cover rounded-lg border border-luxury-gold/30 flex-shrink-0" />
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-gray-700 dark:text-gray-300">áº¢nh Ä‘Ă£ chá»n</p>
										<p className="text-xs text-gray-400 mt-0.5">Click Ä‘á»ƒ thay Ä‘á»•i</p>
									</div>
								</div>
							) : (
								<>
									<ImagePlus className="w-8 h-8 text-gray-400" />
									<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
										KĂ©o tháº£ áº£nh vĂ o Ä‘Ă¢y hoáº·c <span className="text-luxury-gold font-medium">chá»n file</span>
									</p>
									<p className="text-xs text-gray-400">PNG, JPG, WEBP â€“ tá»‘i Ä‘a 5MB</p>
								</>
							)}
						</div>
						<input
							ref={fileInputRef}
							type="file" accept="image/*" className="hidden"
							onChange={handleImageChange}
						/>
					</div>
				</div>
			</div>

			{/* â”€â”€ Description full width â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div>
				<div className="flex items-center justify-between mb-1.5">
					<label htmlFor="description" className={labelCls + " mb-0"}>MĂ´ táº£ sáº£n pháº©m *</label>
					<span className={`text-xs ${descLen >= 200 ? "text-green-500" : "text-gray-400"}`}>
						{descLen} / 200+ kĂ½ tá»±
					</span>
				</div>
				<textarea
					id="description" required rows="4"
					value={newProduct.description}
					onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
					className={inputCls + " resize-none"}
					placeholder="Chi tiáº¿t sáº£n pháº©m: cháº¥t liá»‡u, tĂ­nh nÄƒng, Ä‘á»™ sĂ¢u chá»‘ng nÆ°á»›c..."
				/>
				{descLen > 0 && descLen < 80 && (
					<p className="text-xs text-amber-500 mt-1">NĂªn thĂªm Ă­t nháº¥t 80 kĂ½ tá»± cho mĂ´ táº£ háº¥p dáº«n hÆ¡n.</p>
				)}
			</div>

			{/* â”€â”€ Submit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
			<div className="flex justify-end pt-4 border-t border-gray-100 dark:border-luxury-border">
				<button
					type="submit" disabled={loading}
					className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-luxury-gold/20 text-luxury-dark bg-luxury-gold hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition disabled:opacity-50 min-w-[160px]"
				>
					{loading ? (
						<><Loader className="h-4 w-4 animate-spin" /> Äang lÆ°u...</>
					) : (
						<><PlusCircle className="h-4 w-4" /> HoĂ n táº¥t táº¡o</>
					)}
				</button>
			</div>
		</form>
	);
};

export default CreateProductForm;

