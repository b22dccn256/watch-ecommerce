import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useProductStore } from "../stores/useProductStore";
import { useCartStore } from "../stores/useCartStore";
import { useWishlistStore } from "../stores/useWishlistStore";
import { useCompareStore } from "../stores/useCompareStore";
import { useUserStore } from "../stores/useUserStore";
import { Heart, ShoppingCart, Star, ShieldCheck, Truck, Scale, Share2, PlayCircle, ArrowLeftRight, Bell, CreditCard, CheckCircle2, ChevronRight, Info, Palette, Tag } from "lucide-react";
import toast from "react-hot-toast";
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';
import axios from "../lib/axios";
import ProductCard from "../components/ProductCard";

// Sub-components
const SpecsTab = ({ specs }) => {
	if (!specs) return <div className="text-gray-500 py-8">Chưa có thông số chi tiết.</div>;

	const translateMovementType = (value) => {
		const mapping = {
			Automatic: "Cơ tự động",
			Mechanical: "Cơ lên cót",
			Quartz: "Bộ máy pin",
			Solar: "Năng lượng ánh sáng",
			Digital: "Điện tử",
			Smartwatch: "Đồng hồ thông minh",
		};
		return mapping[value] || value;
	};

	const translateMaterial = (value) => {
		const mapping = {
			"Stainless steel": "Thép không gỉ",
			Steel: "Thép",
			Titanium: "Titanium",
			Ceramic: "Gốm sứ",
			Leather: "Da",
			Sapphire: "Kính sapphire",
			Mineral: "Kính khoáng",
			Hardlex: "Kính Hardlex",
		};
		return mapping[value] || value;
	};

	const translateClasp = (value) => {
		const mapping = {
			"Folding clasp": "Khóa gập",
			"Deployant clasp": "Khóa bướm",
			"Butterfly clasp": "Khóa bướm",
			"Pin buckle": "Khóa cài",
		};
		return mapping[value] || value;
	};
	
	const renderRow = (label, value) => (
		value && <div className="flex border-b border-gray-100 dark:border-gray-800 py-3">
			<span className="w-1/3 text-gray-500 font-medium">{label}</span>
			<span className="w-2/3 text-gray-900 dark:text-gray-200">{value}</span>
		</div>
	);

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-sm mt-4">
			<div>
				<h4 className="font-bold text-lg mb-3 text-emerald-600 dark:text-yellow-400">Bộ máy</h4>
				{renderRow("Loại máy", translateMovementType(specs.movement?.type))}
				{renderRow("Mã máy", specs.movement?.caliber)}
				{renderRow("Dự trữ cót", specs.movement?.powerReserve)}
			</div>
			<div>
				<h4 className="font-bold text-lg mb-3 text-emerald-600 dark:text-yellow-400">Vỏ</h4>
				{renderRow("Đường kính", specs.case?.diameter)}
				{renderRow("Độ dày", specs.case?.thickness)}
				{renderRow("Lug-to-lug", specs.case?.lugToLug)}
				{renderRow("Chất liệu", translateMaterial(specs.case?.material))}
			</div>
			<div className="mt-6">
				<h4 className="font-bold text-lg mb-3 text-emerald-600 dark:text-yellow-400">Dây đeo</h4>
				{renderRow("Chất liệu dây", translateMaterial(specs.strap?.material))}
				{renderRow("Loại khóa", translateClasp(specs.strap?.claspType))}
			</div>
			<div className="mt-6">
				<h4 className="font-bold text-lg mb-3 text-emerald-600 dark:text-yellow-400">Khác</h4>
				{renderRow("Chống nước", specs.waterResistance)}
				{renderRow("Mặt kính", translateMaterial(specs.glass))}
				{renderRow("Khối lượng", specs.weight)}
			</div>
		</div>
	);
};

const PoliciesTab = () => (
	<div className="space-y-6 mt-4">
		<div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
			<h4 className="font-bold text-lg flex items-center gap-2 mb-3"><Truck className="text-emerald-500" /> Giao hàng & Vận chuyển</h4>
			<ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300 text-sm">
				<li>Miễn phí vận chuyển toàn quốc cho mọi đơn hàng.</li>
				<li>Thời gian giao hàng: 1-2 ngày tại TP Hà Nội / TP HCM, 3-5 ngày đối với các tỉnh thành khác.</li>
				<li>Vận chuyển hỏa tốc bằng chuyên cơ với đối tác DHL Express bảo hiểm 100% giá trị hàng.</li>
			</ul>
		</div>
		<div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
			<h4 className="font-bold text-lg flex items-center gap-2 mb-3"><ArrowLeftRight className="text-blue-500" /> Chính sách đổi trả</h4>
			<ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300 text-sm">
				<li>Đổi/trả miễn phí trong vòng 7 - 30 ngày nếu phát hiện lỗi từ nhà sản xuất.</li>
				<li>Sản phẩm đổi trả phải còn nguyên tem mác, hộp, và phụ kiện đi kèm.</li>
			</ul>
		</div>
		<div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-100 dark:border-gray-800">
			<h4 className="font-bold text-lg flex items-center gap-2 mb-3"><ShieldCheck className="text-yellow-500" /> Bảo hành quốc tế</h4>
			<ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300 text-sm">
				<li>Bảo hành quốc tế chính hãng 5 năm cho mọi sản phẩm.</li>
				<li>Hỗ trợ thẻ bảo hành điện tử song song với thẻ cứng.</li>
				<li><Link to="/warranty-registration" className="text-yellow-500 underline">Đăng ký bảo hành điện tử ngay</Link></li>
			</ul>
		</div>
	</div>
);

const ReviewsTab = ({ productId }) => {
	const [reviews, setReviews] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		axios.get(`/reviews/product/${productId}`).then(res => {
			setReviews(res.data);
			setLoading(false);
		}).catch(() => setLoading(false));
	}, [productId]);

	return (
		<div className="mt-4">
			{loading ? (
				<div className="animate-pulse space-y-4">
					<div className="h-20 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
					<div className="h-20 bg-gray-200 dark:bg-gray-800 rounded w-full"></div>
				</div>
			) : reviews.length === 0 ? (
				<div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
					<Star className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
					<h3 className="text-xl font-bold mb-2">Chưa có đánh giá nào</h3>
					<p className="text-gray-500 mb-6">Hãy là người đầu tiên đánh giá sản phẩm này sau khi mua hàng!</p>
					<button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg transition font-medium">
						Viết đánh giá
					</button>
				</div>
			) : (
				<div className="space-y-6">
					{reviews.map(r => (
						<div key={r._id} className="border-b border-gray-100 dark:border-gray-800 pb-6">
							<div className="flex items-center gap-3 mb-2">
								<div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center font-bold">
									{r.user?.name?.[0] || 'U'}
								</div>
								<div>
									<div className="font-semibold">{r.user?.name || 'Thành viên'}</div>
									<div className="flex text-yellow-400 text-xs">
										{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
									</div>
								</div>
								{r.verifiedPurchase && (
									<span className="ml-auto text-xs flex items-center gap-1 text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full">
										<CheckCircle2 className="w-3 h-3" /> Đã mua hàng
									</span>
								)}
							</div>
							<p className="text-gray-700 dark:text-gray-300 text-sm mt-3">{r.comment}</p>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

const ProductDetailPage = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { currentProduct, fetchProductById } = useProductStore();
	const { addToCart } = useCartStore();
	const { wishlist, toggleWishlist } = useWishlistStore();
	const { addToCompare } = useCompareStore();
	const { user } = useUserStore();
	
	const [selectedMedia, setSelectedMedia] = useState({ type: 'image', index: 0 });
	const [isInWishlist, setIsInWishlist] = useState(false);
	const [relatedProducts, setRelatedProducts] = useState([]);
	const [activeTab, setActiveTab] = useState('specs');
	const [wristSize, setWristSize] = useState(""); // Input text for free sizing
	const [selectedSizeOption, setSelectedSizeOption] = useState(null); // Selected predefined size
	const [selectedColor, setSelectedColor] = useState(null);
	const [selectedSize, setSelectedSize] = useState(null);

	const images = currentProduct?.images?.length ? currentProduct.images : (currentProduct?.image ? [currentProduct.image] : []);
	const hasVideo = !!currentProduct?.videoUrl;

	useEffect(() => {
		fetchProductById(id);
		window.scrollTo(0, 0);
	}, [id, fetchProductById]);

	useEffect(() => {
		if (currentProduct) {
			const inWish = wishlist.some((item) => item._id === currentProduct._id);
			setIsInWishlist(inWish);
			setSelectedMedia({ type: 'image', index: 0 });
			
			// Default select first available size if options exist
			if (currentProduct.wristSizeOptions?.length > 0) {
				const firstAvailable = currentProduct.wristSizeOptions.find(o => o.stock > 0);
				if (firstAvailable) setSelectedSizeOption(firstAvailable.size);
				else setSelectedSizeOption(currentProduct.wristSizeOptions[0]?.size);
			} else {
				setSelectedSizeOption(null);
			}

			setSelectedColor(currentProduct.colors?.[0] || null);
			setSelectedSize(currentProduct.sizes?.[0] || null);

			// Cập nhật SEO Meta tags
			document.title = `${currentProduct.name} | Luxury Watch`;
			let metaDesc = document.querySelector('meta[name="description"]');
			if (!metaDesc) {
				metaDesc = document.createElement('meta');
				metaDesc.name = "description";
				document.head.appendChild(metaDesc);
			}
			metaDesc.content = currentProduct.description || "Khám phá đồng hồ cao cấp chính hãng.";

			// Fetch related
			axios.get(`/products?category=${encodeURIComponent(currentProduct.category || '')}&limit=5`)
				.then(res => {
					const filtered = (res.data.products || []).filter(p => p._id !== currentProduct._id).slice(0, 4);
					setRelatedProducts(filtered);
				})
				.catch(() => { });
		}
	}, [currentProduct, wishlist]);

	const handleAddToCart = () => {
		if (!currentProduct) return;
		
		if (currentProduct.wristSizeOptions?.length > 0) {
			if (!selectedSizeOption) {
				toast.error("Vui lòng chọn kích cỡ/phân loại.");
				return;
			}
			const option = currentProduct.wristSizeOptions.find(o => o.size === selectedSizeOption);
			if (!option || option.stock < 1) return;
			addToCart({ ...currentProduct, wristSize: selectedSizeOption, selectedColor, selectedSize });
		} else {
			if (currentProduct.stock < 1) return;
			// Backward compatibility: free sizing for metal straps
			const payloadWrist = wristSize ? wristSize.toString() : null;
			addToCart({ ...currentProduct, wristSize: payloadWrist, selectedColor, selectedSize });
		}
	};

	const handleShare = () => {
		navigator.clipboard.writeText(window.location.href);
		toast.success("Đã copy link sản phẩm!");
	};

	if (!currentProduct) return (
		<div className="min-h-screen pt-32 pb-16 flex items-center justify-center">
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
		</div>
	);

	const discount = currentProduct.originalPrice
		? Math.round(((currentProduct.originalPrice - currentProduct.price) / currentProduct.originalPrice) * 100)
		: 0;
	const breadcrumbBrand = typeof currentProduct.brand === 'object' ? currentProduct.brand?.name : currentProduct.brand;
	const breadcrumbCategory = currentProduct.categoryId?.name || currentProduct.category || "Collection";
	const breadcrumbLabel = breadcrumbBrand || breadcrumbCategory;
	const breadcrumbHref = breadcrumbBrand
		? `/catalog?brand=${encodeURIComponent(breadcrumbBrand)}`
		: breadcrumbCategory !== "Collection"
			? `/category/${encodeURIComponent(breadcrumbCategory)}`
			: "/catalog";

	const isMetalStrap = currentProduct.specs?.strap?.material?.toLowerCase().match(/steel|metal|titanium|thép|kim loại/);
	const hasSizeOptions = currentProduct.wristSizeOptions?.length > 0;
	const hasColorOptions = currentProduct.colors?.length > 0;
	const hasSimpleSizes = currentProduct.sizes?.length > 0;
	const hasCustomAttributes = currentProduct.customAttributes?.length > 0;
	
	let activeStock = currentProduct.stock;
	if (hasSizeOptions && selectedSizeOption) {
		const opt = currentProduct.wristSizeOptions.find(o => o.size === selectedSizeOption);
		if (opt) activeStock = opt.stock;
	}

	return (
		<div className="min-h-screen bg-white dark:bg-[#0f0c08] text-gray-900 dark:text-white pt-20 pb-12 transition-colors duration-300">
			<div className="max-w-7xl mx-auto px-4 md:px-6">
				
				{/* Breadcrumb */}
				<div className="text-[11px] md:text-xs font-semibold tracking-wider uppercase text-gray-400 mb-5 flex items-center gap-2">
					<Link to="/" className="hover:text-gray-900 dark:hover:text-white transition">Home</Link>
					<ChevronRight className="w-3 h-3" />
					<Link to={breadcrumbHref} className="hover:text-gray-900 dark:hover:text-white transition">{breadcrumbLabel}</Link>
					<ChevronRight className="w-3 h-3" />
					<span className="text-emerald-600 dark:text-yellow-400">Chi tiết</span>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
					
					{/* ==================== MEDIA GALLERY ==================== */}
					<div className="lg:col-span-6">
						<div className="sticky top-24">
							<motion.div
								className="relative bg-gray-50 dark:bg-black/50 rounded-2xl md:rounded-[2rem] overflow-hidden aspect-square border border-gray-100 dark:border-white/5 flex items-center justify-center"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
							>
								{selectedMedia.type === 'video' ? (
									<div className="w-full h-full flex flex-col items-center justify-center bg-gray-900">
										{/* Fallback for video if url is placeholder or missing, but user clicked video thumbnail */}
										<PlayCircle className="w-16 h-16 text-white/50 mb-4" />
										<p className="text-white font-medium">Video 360° Sắp ra mắt</p>
										<button className="mt-4 text-xs font-bold uppercase tracking-widest text-yellow-400 hover:text-white transition border border-yellow-400 px-4 py-2 rounded-full">Đăng ký nhận thông báo</button>
									</div>
								) : (
									<Zoom classDialog="custom-zoom-overlay">
										<img
											src={images[selectedMedia.index]}
											alt={currentProduct.name}
											className="w-full h-full object-contain p-3 md:p-8 hover:scale-105 transition-transform duration-700"
										/>
									</Zoom>
								)}
								
								{/* Badges */}
								<div className="absolute top-4 left-4 flex flex-col gap-2">
									{discount > 0 && <span className="bg-red-500 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Sale {discount}%</span>}
									{activeStock === 0 && <span className="bg-gray-800 text-white text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Hết hàng</span>}
								</div>
							</motion.div>

							{/* Thumbnails */}
							<div className="flex gap-4 mt-6 overflow-x-auto pb-4 hide-scrollbar">
								{images.map((img, idx) => (
									<button
										key={idx}
										onClick={() => setSelectedMedia({ type: 'image', index: idx })}
										className={`w-20 h-20 shrink-0 lg:w-24 lg:h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${selectedMedia.type === 'image' && selectedMedia.index === idx ? "border-emerald-500 dark:border-yellow-400 shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100 bg-gray-50 dark:bg-gray-900"}`}
									>
										<img src={img} className="w-full h-full object-cover" />
									</button>
								))}
								{/* Video thumbnail fallback */}
								<button
									onClick={() => setSelectedMedia({ type: 'video', index: 0 })}
									className={`w-20 h-20 shrink-0 lg:w-24 lg:h-24 rounded-2xl overflow-hidden border-2 flex items-center justify-center bg-gray-100 dark:bg-gray-900 transition-all duration-300 cursor-pointer ${selectedMedia.type === 'video' ? "border-emerald-500 dark:border-yellow-400 shadow-lg scale-105" : "border-transparent opacity-60 hover:opacity-100"}`}
								>
									<PlayCircle className="w-8 h-8 text-gray-400" />
								</button>
							</div>
						</div>
					</div>

					{/* ==================== PRODUCT INFO ==================== */}
					<div className="lg:col-span-6">
						<div className="flex items-center justify-between mb-3">
							<span className="font-bold tracking-widest uppercase text-emerald-600 dark:text-yellow-400 text-[11px] md:text-sm">
								{typeof currentProduct.brand === 'object' ? currentProduct.brand?.name : (currentProduct.brand || 'Luxury Watch')}
							</span>
							<div className="flex items-center gap-1.5 text-yellow-400 text-sm">
								<Star className="w-4 h-4 fill-current" />
								<span className="font-bold text-gray-900 dark:text-white">{currentProduct.averageRating?.toFixed(1) || '5.0'}</span>
								<span className="text-gray-400 text-xs md:text-sm font-normal">({currentProduct.reviewsCount || 0})</span>
							</div>
						</div>

						<h1 className="font-luxury text-3xl md:text-4xl font-bold mt-1 leading-tight tracking-tight mb-4 text-gray-900 dark:text-white">{currentProduct.name}</h1>

						{/* Giá */}
						<div className="mb-6">
							<div className="flex items-baseline gap-4">
								<span className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-yellow-400 dark:to-[#D4AF37]">
									{currentProduct.price.toLocaleString("vi-VN")} ₫
								</span>
								{discount > 0 && (
									<span className="text-lg md:text-xl line-through text-gray-400">
										{currentProduct.originalPrice?.toLocaleString("vi-VN")} ₫
									</span>
								)}
							</div>
							<p className="text-xs md:text-sm text-gray-500 mt-2 font-medium">Đã bao gồm VAT. Bảo hành quốc tế 5 năm.</p>
						</div>

						{/* Thuộc tính chọn nhanh */}
						<div className="mb-6 space-y-4 rounded-2xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/5 p-4 md:p-4.5">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								{hasColorOptions && (
									<div>
										<div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800 dark:text-white">
											<Palette className="w-4 h-4 text-emerald-500" /> Màu sắc
										</div>
										<div className="flex flex-wrap gap-2">
											{currentProduct.colors.map((color) => (
												<button
													key={color}
													onClick={() => setSelectedColor(color)}
													className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${selectedColor === color ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] ring-2 ring-[#D4AF37]/20 dark:border-[#D4AF37] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37]'}`}
												>
													{color}
												</button>
											))}
										</div>
									</div>
								)}

								{hasSimpleSizes && (
									<div>
										<div className="flex items-center gap-2 mb-3 text-sm font-semibold text-gray-800 dark:text-white">
											<Tag className="w-4 h-4 text-emerald-500" /> Kích cỡ
										</div>
										<div className="flex flex-wrap gap-2">
											{currentProduct.sizes.map((size) => (
												<button
													key={size}
													onClick={() => setSelectedSize(size)}
													className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${selectedSize === size ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] ring-2 ring-[#D4AF37]/20 dark:border-[#D4AF37] dark:bg-[#D4AF37]/10 dark:text-[#D4AF37]' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-[#D4AF37]'}`}
												>
													{size}
												</button>
											))}
										</div>
									</div>
								)}
							</div>

							{hasCustomAttributes && (
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
									{currentProduct.customAttributes.map((attr) => (
										<div key={attr.name} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/20 px-3 py-2.5 text-sm">
											<span className="text-gray-500 dark:text-gray-400">{attr.name}</span>
											<span className="font-medium text-gray-900 dark:text-white text-right">{attr.value}</span>
										</div>
									))}
								</div>
							)}
						</div>

						<p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8 text-sm md:text-base border-t border-b border-gray-100 dark:border-white/5 py-5 md:py-6">
							{currentProduct.description}
						</p>

						{/* Cắt dây miễn phí (Dynamic rendering based on specs) */}
						{!hasSizeOptions && isMetalStrap && (
							<div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
								<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
									<Scale className="w-4 h-4 text-emerald-500" /> Yêu cầu cắt mắt dây miễn phí
								</h4>
								<div className="flex items-center gap-3">
									<input 
										type="number" 
										placeholder="Nhập chu vi cổ tay (mm)" 
										value={wristSize}
										onChange={(e) => setWristSize(e.target.value)}
										className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
									/>
									<div className="text-xs text-gray-500 group relative cursor-help">
										<Info className="w-5 h-5" />
										<div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-xl text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
											Đo chu vi cổ tay của bạn bằng thước dây. Chúng tôi sẽ cắt dây vừa vặn trước khi giao.
										</div>
									</div>
								</div>
							</div>
						)}

						{/* Variants (Wrist Size Options) */}
						{hasSizeOptions && (
							<div className="mb-6">
								<h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
									<Scale className="w-4 h-4 text-emerald-500" /> Chọn kích cỡ/phân loại
								</h4>
								<div className="flex flex-wrap gap-3">
									{currentProduct.wristSizeOptions.map(opt => {
										const isSelected = selectedSizeOption === opt.size;
										const isOut = opt.stock === 0;
										return (
											<button
												key={opt.size}
												onClick={() => !isOut && setSelectedSizeOption(opt.size)}
												disabled={isOut}
												className={`
													px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all relative
													${isSelected ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-yellow-400 dark:bg-yellow-400/10 dark:text-yellow-400 ring-1 ring-emerald-500 dark:ring-yellow-400' : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'}
													${isOut ? 'opacity-50 cursor-not-allowed border-dashed bg-gray-50 dark:bg-gray-900/50' : ''}
												`}
											>
												{opt.size}
												{isOut && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Hết</span>}
												{!isOut && opt.stock <= 5 && <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">Còn {opt.stock}</span>}
											</button>
										);
									})}
								</div>
							</div>
						)}

						{/* Nút hành động */}
						<div className="flex flex-col gap-3 mb-6">
							{activeStock > 0 ? (
								<button
									onClick={handleAddToCart}
									className="w-full bg-emerald-600 hover:bg-emerald-700 dark:bg-yellow-400 dark:hover:bg-yellow-500 text-white dark:text-black font-bold uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors duration-300 shadow-lg shadow-emerald-600/20 dark:shadow-yellow-400/20 text-sm md:text-base"
								>
									<ShoppingCart className="w-5 h-5" /> THÊM VÀO GIỎ HÀNG
								</button>
							) : (
								<button
									className="w-full bg-gray-900 dark:bg-gray-800 text-white font-bold uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-3 transition-colors duration-300 border border-transparent hover:border-gray-700 text-sm md:text-base"
								>
									<Bell className="w-5 h-5 text-yellow-400" /> THÔNG BÁO KHI CÓ HÀNG
								</button>
							)}

							<div className="flex items-center gap-4">
								<button
									onClick={() => toggleWishlist(currentProduct, !!user)}
									className={`flex-1 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition hover:bg-gray-50 dark:hover:bg-gray-900 ${isInWishlist ? "border-red-500 text-red-500" : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300"}`}
								>
									<Heart className={`w-4 h-4 ${isInWishlist ? "fill-red-500" : ""}`} /> 
									{isInWishlist ? 'ĐÃ LƯU' : 'YÊU THÍCH'}
								</button>
								<button
									onClick={() => addToCompare(currentProduct)}
									className="flex-[1.5] py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold flex items-center justify-center gap-2 transition hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
								>
									<ArrowLeftRight className="w-4 h-4" /> SO SÁNH
								</button>
								<button
									onClick={handleShare}
									className="w-12 shrink-0 py-3 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-300"
								>
									<Share2 className="w-4 h-4" />
								</button>
							</div>
						</div>
						
						{/* Trust Badges */}
						<div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-gray-100 dark:border-white/5 pt-6">
							<div className="flex flex-col items-center gap-2 text-center text-gray-500 rounded-xl bg-gray-50/70 dark:bg-white/5 py-3">
								<ShieldCheck className="w-6 h-6 text-emerald-500" />
								<span className="text-xs font-medium">Bảo hành 5 năm</span>
							</div>
							<div className="flex flex-col items-center gap-2 text-center text-gray-500 rounded-xl bg-gray-50/70 dark:bg-white/5 py-3">
								<Truck className="w-6 h-6 text-emerald-500" />
								<span className="text-xs font-medium">Freeship DHL</span>
							</div>
							<div className="flex flex-col items-center gap-2 text-center text-gray-500 rounded-xl bg-gray-50/70 dark:bg-white/5 py-3">
								<ArrowLeftRight className="w-6 h-6 text-emerald-500" />
								<span className="text-xs font-medium">Đổi trả 30 ngày</span>
							</div>
							<div className="flex flex-col items-center gap-2 text-center text-gray-500 rounded-xl bg-gray-50/70 dark:bg-white/5 py-3">
								<CreditCard className="w-6 h-6 text-emerald-500" />
								<span className="text-xs font-medium">Trả góp 0%</span>
							</div>
						</div>
					</div>
				</div>

				{/* ==================== TABS HỖ TRỢ (TÓM TẮT DƯỚI) ==================== */}
					<div className="mt-20 max-w-5xl mx-auto">
						<div className="flex overflow-x-auto hide-scrollbar gap-6 border-b border-gray-200 dark:border-gray-800 mb-6 pb-3">
						{['specs', 'policies', 'reviews', 'qa'].map(tab => (
							<button 
								key={tab}
								onClick={() => setActiveTab(tab)}
								className={`whitespace-nowrap font-bold text-sm md:text-base transition-colors relative ${activeTab === tab ? 'text-emerald-600 dark:text-yellow-400' : 'text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
							>
								{tab === 'specs' && 'THÔNG SỐ'}
								{tab === 'policies' && 'BẢO HÀNH'}
								{tab === 'reviews' && 'ĐÁNH GIÁ'}
								{tab === 'qa' && 'HỎI ĐÁP'}
								
								{activeTab === tab && (
									<motion.div layoutId="activeTabIndicator" className="absolute -bottom-[18px] left-0 right-0 h-0.5 bg-emerald-600 dark:bg-yellow-400"></motion.div>
								)}
							</button>
						))}
					</div>

					<div className="min-h-[280px]">
						<AnimatePresence mode="wait">
							<motion.div
								key={activeTab}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: -10 }}
								transition={{ duration: 0.2 }}
							>
								{activeTab === 'specs' && <SpecsTab specs={currentProduct.specs} />}
								{activeTab === 'policies' && <PoliciesTab />}
								{activeTab === 'reviews' && <ReviewsTab productId={currentProduct._id} />}
								{activeTab === 'qa' && (
									<div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-gray-500 mt-4">
										Chưa có câu hỏi nào. Bạn có thắc mắc? Liên hệ ngay hoặc tải lên câu hỏi của bạn.
									</div>
								)}
							</motion.div>
						</AnimatePresence>
					</div>
				</div>

				{/* SẢN PHẨM TƯƠNG TỰ */}
				<div className="mt-16 max-w-6xl mx-auto">
					<div className="flex justify-between items-end mb-6 border-b border-gray-200 dark:border-gray-800 pb-3">
						<h2 className="text-xl md:text-2xl font-bold font-sans">Khám Phá Thêm</h2>
						<Link to="/catalog" className="text-xs md:text-sm font-bold uppercase tracking-widest text-emerald-600 dark:text-yellow-400 hover:underline">Xem tất cả</Link>
					</div>
					{relatedProducts.length > 0 ? (
						<div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
							{relatedProducts.map(p => (
								<ProductCard key={p._id} product={p} />
							))}
						</div>
					) : (
						<p className="text-gray-500 text-center py-8">Không có sản phẩm nào.</p>
					)}
				</div>
			</div>
		</div>
	);
};

import PeopleAlsoBought from "../components/PeopleAlsoBought";

export default function EnhancedProductDetailPage(props) {
	const Page = ProductDetailPage;
	return <>
		<Page {...props} />
		{/* AI Recommendation Section */}
		<div className="max-w-6xl mx-auto px-4 md:px-8">
			<PeopleAlsoBought />
		</div>
	</>;
}