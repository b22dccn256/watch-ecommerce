import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useThemeStore } from "../stores/useThemeStore";
import { ArrowRight, Star, Shield, Award } from "lucide-react";

const HeroBanner = () => {
	const { theme } = useThemeStore();
	const isDark = theme === "dark";

	// Overlay: luôn đủ tối để chữ đọc được ở cả 2 chế độ
	// Dark: overlay đen đậm bên trái, mờ sang phải
	// Light: overlay xám/đen vừa phải đủ tương phản
	const overlayGradient = isDark
		? "bg-gradient-to-r from-black/85 via-black/60 to-black/20"
		: "bg-gradient-to-r from-black/70 via-black/50 to-black/10";

	const blendClass = isDark
		? "bg-gradient-to-t from-luxury-dark via-luxury-dark/60 to-transparent"
		: "bg-gradient-to-t from-gray-50 via-gray-50/50 to-transparent";

	const stats = [
		{ label: "Thương hiệu", value: "50+" },
		{ label: "Sản phẩm", value: "2.000+" },
		{ label: "Khách hàng", value: "10K+" },
	];

	return (
		<div className="relative h-screen flex items-center overflow-hidden">
			{/* Background Image */}
			<img
				src="/banner-2.jpg"
				alt="Luxury Watch Collection"
				className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isDark ? "brightness-65" : "brightness-90"}`}
			/>

			{/* Strong Overlay — đảm bảo contrast chữ ở mọi theme */}
			<div className={`absolute inset-0 transition-all duration-500 ${overlayGradient}`} />

			{/* Thêm một lớp vignette cục bộ xung quanh vùng text để tăng contrast */}
			<div
				className="absolute inset-0"
				style={{
					background: "radial-gradient(ellipse 70% 80% at 25% 50%, rgba(0,0,0,0.45) 0%, transparent 70%)",
				}}
			/>

			{/* Content — 2-column layout: Text Left | Watch Right */}
			<div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 flex items-center">

				{/* Left Column — Text Content (chiếm ~55%) */}
				<div className="w-full md:w-[55%] flex flex-col items-start text-left">

					{/* Badge: NEW COLLECTION 2026 */}
					<motion.div
						initial={{ opacity: 0, x: -30 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.6 }}
						className="flex items-center gap-2 mb-6"
					>
						<div className="h-px w-8 bg-luxury-gold" />
						<span className="text-luxury-gold text-xs md:text-sm tracking-[0.25em] font-semibold uppercase">
							New Collection 2026
						</span>
					</motion.div>

					{/* Headline */}
					<motion.h1
						initial={{ opacity: 0, y: 40 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.15, duration: 0.7 }}
						className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 drop-shadow-2xl"
					>
						Tuyệt tác{" "}
						<span className="text-luxury-gold">thời gian</span>
						<br />
						tuyệt đỉnh{" "}
						<span className="text-white">công nghệ</span>
					</motion.h1>

					{/* Subheadline */}
					<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.3, duration: 0.6 }}
						className="text-white/85 text-base md:text-lg leading-relaxed mb-10 max-w-md drop-shadow-lg"
					>
						Khám phá bộ sưu tập đồng hồ cơ tinh xảo từ những thương hiệu hàng đầu thế giới — Rolex, Omega, Patek Philippe và nhiều hơn nữa.
					</motion.p>

					{/* CTA Buttons */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.45, duration: 0.6 }}
						className="flex flex-col sm:flex-row gap-4 mb-12"
					>
						{/* Primary CTA */}
						<Link
							to="/catalog"
							className="group inline-flex items-center gap-2 bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 transform hover:scale-105 shadow-[0_4px_20px_rgba(212,175,55,0.4)] hover:shadow-[0_6px_28px_rgba(212,175,55,0.6)]"
						>
							Khám phá ngay
							<ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
						</Link>

						{/* Secondary CTA — viền trắng (luôn rõ trên nền tối) */}
						<Link
							to="/catalog"
							className="inline-flex items-center gap-2 border-2 border-white/80 text-white font-semibold px-8 py-4 rounded-full text-base transition-all duration-300 transform hover:scale-105 hover:bg-white/10 hover:border-white backdrop-blur-sm"
						>
							<Award size={18} className="text-luxury-gold" />
							Thương hiệu
						</Link>
					</motion.div>

					{/* Trust Stats */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6, duration: 0.6 }}
						className="flex items-center gap-8"
					>
						{stats.map((stat, i) => (
							<div key={i} className="text-center">
								<div className="text-xl md:text-2xl font-bold text-luxury-gold drop-shadow-lg">
									{stat.value}
								</div>
								<div className="text-white/70 text-xs md:text-sm mt-0.5">{stat.label}</div>
							</div>
						))}

						{/* Divider */}
						<div className="h-10 w-px bg-white/20 mx-2 hidden sm:block" />

						{/* Rating badge */}
						<div className="hidden sm:flex items-center gap-1.5">
							{[...Array(5)].map((_, i) => (
								<Star key={i} size={14} className="fill-luxury-gold text-luxury-gold" />
							))}
							<span className="text-white/70 text-xs ml-1">4.9/5</span>
						</div>
					</motion.div>
				</div>

				{/* Right Column — tạo khoảng trống để ảnh nền tự nổi bật (không overlay phải) (~45%) */}
				<div className="hidden md:block w-[45%]" />
			</div>

			{/* Badges nổi — góc phải dưới */}
			<motion.div
				initial={{ opacity: 0, scale: 0.8 }}
				animate={{ opacity: 1, scale: 1 }}
				transition={{ delay: 0.9, duration: 0.5 }}
				className="absolute bottom-24 right-8 md:right-16 hidden md:flex flex-col gap-3"
			>
				<div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
					<Shield size={16} className="text-luxury-gold" />
					<span className="text-white text-xs font-medium">Bảo hành chính hãng</span>
				</div>
				<div className="flex items-center gap-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
					<Award size={16} className="text-luxury-gold" />
					<span className="text-white text-xs font-medium">100% đồng hồ thật</span>
				</div>
			</motion.div>

			{/* Blend Bottom */}
			<div className={`absolute bottom-0 left-0 right-0 h-40 transition-all duration-500 ${blendClass}`} />

			{/* Scroll Indicator */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.2 }}
				className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:flex flex-col items-center gap-1"
			>
				<span className="text-white/40 text-[10px] tracking-widest uppercase">Cuộn xuống</span>
				<div className="w-5 h-8 border border-white/30 rounded-full flex justify-center mt-1">
					<motion.div
						animate={{ y: [0, 10, 0] }}
						transition={{ duration: 1.5, repeat: Infinity }}
						className="w-0.5 h-2 bg-luxury-gold rounded-full mt-1.5"
					/>
				</div>
			</motion.div>
		</div>
	);
};

export default HeroBanner;
