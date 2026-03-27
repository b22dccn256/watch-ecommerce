import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader, ImagePlus, Tag, DollarSign } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = [
	"Cơ Tự Động (Automatic)",
	"Cơ Lên Cót Tay (Hand-wound)",
	"Bộ Máy Pin (Quartz)",
	"Năng Lượng Ánh Sáng (Solar)",
	"Đồng Hồ Điện Tử (Digital)",
	"Đồng Hồ Thông Minh (Smartwatch)",
];

const machineTypes = ["Mechanical", "Quartz", "Automatic", "Solar", "Digital", "Smartwatch"];

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
	});

	const [dragOver, setDragOver] = useState(false);
	const fileInputRef = useRef(null);

	const { createProduct, loading, brands, fetchBrands } = useProductStore();

	useEffect(() => {
		fetchBrands();
	}, [fetchBrands]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await createProduct({
				...newProduct,
				stock: Number(newProduct.stock),
				price: Number(newProduct.price),
				originalPrice: newProduct.originalPrice ? Number(newProduct.originalPrice) : undefined,
			});
			setNewProduct({ name: "", description: "", price: "", originalPrice: "", category: "", image: "", stock: "", brand: "", type: "" });
			if (onSuccess) onSuccess();
		} catch {
			console.log("error creating a product");
		}
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

				{/* ── Column 1 ───────────────────────── */}
				<div className="space-y-4">
					{/* Tên sản phẩm */}
					<div>
						<label htmlFor="name" className={labelCls}>Tên Sản Phẩm *</label>
						<input
							type="text" id="name" required
							value={newProduct.name}
							onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
							className={inputCls}
							placeholder="VD: Rolex Oyster Perpetual 41mm..."
						/>
					</div>

					{/* Thương hiệu */}
					<div>
						<label htmlFor="brand" className={labelCls}>Thương hiệu *</label>
						<select
							id="brand" required
							value={newProduct.brand}
							onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
							className={inputCls}
						>
							<option value="">Chọn thương hiệu</option>
							{Array.isArray(brands) && brands.map((b) => (
								<option key={b._id} value={b._id}>{b.name}</option>
							))}
						</select>
					</div>

					{/* Price + Original Price */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="price" className={labelCls}>Giá bán (₫) *</label>
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
								Giá gốc (₫)
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
									placeholder="Để trống nếu không giảm"
								/>
							</div>
						</div>
					</div>

					{/* Stock */}
					<div>
						<label htmlFor="stock" className={labelCls}>Tồn kho khởi tạo *</label>
						<input
							type="number" id="stock" required min="0"
							value={newProduct.stock}
							onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
							className={inputCls}
							placeholder="VD: 50"
						/>
					</div>
				</div>

				{/* ── Column 2 ───────────────────────── */}
				<div className="space-y-4">
					{/* Danh mục */}
					<div>
						<label htmlFor="category" className={labelCls}>Danh mục *</label>
						<select
							id="category" required
							value={newProduct.category}
							onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
							className={inputCls}
						>
							<option value="">Chọn danh mục</option>
							{categories.map((c) => <option key={c} value={c}>{c}</option>)}
						</select>
					</div>

					{/* Bộ máy */}
					<div>
						<label htmlFor="type" className={labelCls}>Loại bộ máy (Movement) *</label>
						<select
							id="type" required
							value={newProduct.type}
							onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
							className={inputCls}
						>
							<option value="">Chọn bộ máy</option>
							{machineTypes.map((t) => <option key={t} value={t}>{t}</option>)}
						</select>
					</div>

					{/* Image drag-and-drop */}
					<div>
						<label className={labelCls}>Ảnh đại diện</label>
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
										<p className="text-sm font-medium text-gray-700 dark:text-gray-300">Ảnh đã chọn</p>
										<p className="text-xs text-gray-400 mt-0.5">Click để thay đổi</p>
									</div>
								</div>
							) : (
								<>
									<ImagePlus className="w-8 h-8 text-gray-400" />
									<p className="text-sm text-gray-500 dark:text-gray-400 text-center">
										Kéo thả ảnh vào đây hoặc <span className="text-luxury-gold font-medium">chọn file</span>
									</p>
									<p className="text-xs text-gray-400">PNG, JPG, WEBP – tối đa 5MB</p>
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

			{/* ── Description full width ───────────── */}
			<div>
				<div className="flex items-center justify-between mb-1.5">
					<label htmlFor="description" className={labelCls + " mb-0"}>Mô tả sản phẩm *</label>
					<span className={`text-xs ${descLen >= 200 ? "text-green-500" : "text-gray-400"}`}>
						{descLen} / 200+ ký tự
					</span>
				</div>
				<textarea
					id="description" required rows="4"
					value={newProduct.description}
					onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
					className={inputCls + " resize-none"}
					placeholder="Chi tiết sản phẩm: chất liệu, tính năng, độ sâu chống nước..."
				/>
				{descLen > 0 && descLen < 80 && (
					<p className="text-xs text-amber-500 mt-1">Nên thêm ít nhất 80 ký tự cho mô tả hấp dẫn hơn.</p>
				)}
			</div>

			{/* ── Submit ───────────────────────────── */}
			<div className="flex justify-end pt-4 border-t border-gray-100 dark:border-luxury-border">
				<button
					type="submit" disabled={loading}
					className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-luxury-gold/20 text-luxury-dark bg-luxury-gold hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition disabled:opacity-50 min-w-[160px]"
				>
					{loading ? (
						<><Loader className="h-4 w-4 animate-spin" /> Đang lưu...</>
					) : (
						<><PlusCircle className="h-4 w-4" /> Hoàn tất tạo</>
					)}
				</button>
			</div>
		</form>
	);
};

export default CreateProductForm;
