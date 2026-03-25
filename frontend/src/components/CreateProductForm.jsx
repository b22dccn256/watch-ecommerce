import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PlusCircle, Upload, Loader } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const categories = ["Digital", "Quartz", "Automatic", "Eco-Drive", "Smartwatch"];
const machineTypes = ["Mechanical", "Quartz", "Automatic", "Digital", "Smartwatch"];

const CreateProductForm = ({ onSuccess }) => {
	const [newProduct, setNewProduct] = useState({
		name: "",
		description: "",
		price: "",
		category: "",
		image: "",
		stock: "",
		brand: "",
		type: "",
	});

	const { createProduct, loading, brands, fetchBrands } = useProductStore();

	useEffect(() => {
		fetchBrands();
	}, [fetchBrands]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			await createProduct({ ...newProduct, stock: Number(newProduct.stock), price: Number(newProduct.price) });
			setNewProduct({ name: "", description: "", price: "", category: "", image: "", stock: "", brand: "", type: "" });
			if (onSuccess) onSuccess();
		} catch {
			console.log("error creating a product");
		}
	};

	const handleImageChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			const reader = new FileReader();

			reader.onloadend = () => {
				setNewProduct({ ...newProduct, image: reader.result });
			};

			reader.readAsDataURL(file); // base64
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Column 1 */}
				<div className="space-y-4">
					<div>
						<label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Tên Sản Phẩm
						</label>
						<input
							type="text" id="name" name="name" required
							value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
							className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
							placeholder="VD: Rolex Ouster Perpetual..."
						/>
					</div>
					<div>
						<label htmlFor="brand" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thương hiệu</label>
						<select
							id="brand" name="brand" required
							value={newProduct.brand} onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
							className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
						>
							<option value="">Lựa chọn thương hiệu</option>
							{Array.isArray(brands) && brands.map((b) => (
								<option key={b._id} value={b._id}>{b.name}</option>
							))}
						</select>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Giá bán (₫)</label>
							<input
								type="number" id="price" name="price" required min="0"
								value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
							/>
						</div>
						<div>
							<label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kho khởi tạo</label>
							<input
								type="number" id="stock" name="stock" required min="0"
								value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
							/>
						</div>
					</div>
				</div>

				{/* Column 2 */}
				<div className="space-y-4">
					<div>
						<label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Danh mục</label>
						<select
							id="category" name="category" required
							value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
							className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
						>
							<option value="">Chọn một danh mục</option>
							{categories.map((c) => <option key={c} value={c}>{c}</option>)}
						</select>
					</div>
					<div>
						<label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại bộ máy (Movement)</label>
						<select
							id="type" name="type" required
							value={newProduct.type} onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
							className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition"
						>
							<option value="">Cơ chế máy</option>
							{machineTypes.map((t) => <option key={t} value={t}>{t}</option>)}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ảnh đại diện</label>
						<div className="mt-1 flex items-center gap-4">
							<input type="file" id="image" className="sr-only" accept="image/*" onChange={handleImageChange} />
							<label
								htmlFor="image"
								className="cursor-pointer bg-gray-50 dark:bg-luxury-dark border border-dashed border-gray-300 dark:border-luxury-border hover:border-luxury-gold hover:bg-gray-100 dark:hover:bg-luxury-darker rounded-lg px-4 py-2 flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 transition w-full h-[42px]"
							>
								<Upload className="h-4 w-4 mr-2" /> {newProduct.image ? "Thay đổi ảnh" : "Tải lên Ảnh"}
							</label>
							{newProduct.image && (
								<img src={newProduct.image} alt="Preview" className="h-10 w-10 object-cover rounded-md border border-gray-200 dark:border-luxury-border flex-shrink-0" />
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Full width row */}
			<div>
				<label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mô tả sản phẩm</label>
				<textarea
					id="description" name="description" required rows="4"
					value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
					className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:border-luxury-gold focus:ring-1 focus:ring-luxury-gold transition resize-none"
					placeholder="Chi tiết sản phẩm..."
				/>
			</div>

			<div className="flex justify-end pt-4 border-t border-gray-100 dark:border-luxury-border">
				<button
					type="submit" disabled={loading}
					className="flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-luxury-gold/20 text-luxury-dark bg-luxury-gold hover:bg-yellow-500 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-luxury-gold transition disabled:opacity-50 min-w-[150px]"
				>
					{loading ? (
						<><Loader className="mr-2 h-4 w-4 animate-spin" /> Đang lưu...</>
					) : (
						<><PlusCircle className="mr-2 h-4 w-4" /> Hoàn tất tạo</>
					)}
				</button>
			</div>
		</form>
	);
};
export default CreateProductForm;
