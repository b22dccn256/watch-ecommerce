import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useThemeStore } from "../stores/useThemeStore";

const HeroBanner = ({ slogan }) => {
	const { theme } = useThemeStore();
	const isDark = theme === "dark";

	const overlayClass = isDark
		? "bg-gradient-to-b from-black/70 via-black/40 to-black/80"
		: "bg-gradient-to-b from-white/40 via-transparent to-white/60";

	const titleClass = isDark
		? "text-white drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]"
		: "text-gray-950 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]";

	const secondaryButtonClass = isDark
		? "border-white text-white hover:bg-white/10"
		: "border-gray-900 text-gray-900 hover:bg-gray-900/10";

	const blendClass = isDark
		? "bg-gradient-to-t from-luxury-dark to-transparent"
		: "bg-gradient-to-t from-white to-transparent";

	return (
		<div className="relative h-screen flex items-center justify-center overflow-hidden transition-colors duration-500">
			<img
				src="/banner-2.jpg"
				alt="Luxury Watch"
				className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${isDark ? 'brightness-75' : 'brightness-100'}`}
			/>
			
			{/* Adaptive Overlay */}
			<div className={`absolute inset-0 transition-all duration-500 ${overlayClass}`} />

			{/* Content */}
			<div className="relative z-10 text-center px-6 max-w-4xl">
				<motion.p
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					className="text-luxury-gold text-sm md:text-base tracking-[0.3em] mb-6 font-bold uppercase drop-shadow-md"
				>
					NEW COLLECTION 2026
				</motion.p>

				<motion.h1
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.2 }}
					className={`text-5xl lg:text-7xl font-luxury leading-[1.1] mb-8 transition-all duration-500 capitalize tracking-tight ${titleClass}`}
				>
					<span dangerouslySetInnerHTML={{ __html: (slogan || "Tuyệt tác thời<br />gian tuyệt đỉnh").replace('\n', '<br/>') }} />
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.4 }}
					className={`text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed transition-colors duration-500 font-medium ${isDark ? 'text-luxury-text-light drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-gray-900 drop-shadow-sm'}`}
				>
					Khám phá bộ sưu tập đồng hồ cơ tinh xảo từ những thương hiệu hàng đầu thế giới
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.6 }}
					className="flex flex-col sm:flex-row gap-4 justify-center"
				>
					<Link
						to="/catalog"
						className="inline-block bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
					>
						Khám phá ngay
					</Link>

					<Link
						to="/catalog"
						className={`inline-block border-2 font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 ${secondaryButtonClass}`}
					>
						Thương hiệu
					</Link>
				</motion.div>
			</div>

			{/* Blend Bottom */}
			<div className={`absolute bottom-0 left-0 right-0 h-32 transition-all duration-500 ${blendClass}`} />

			{/* Scroll Indicator */}
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.2 }}
				className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
			>
				<div className={`w-6 h-10 border-2 rounded-full flex justify-center transition-colors duration-500 ${isDark ? 'border-luxury-gold' : 'border-gray-400'}`}>
					<motion.div
						animate={{ y: [0, 12, 0] }}
						transition={{ duration: 1.5, repeat: Infinity }}
						className={`w-1 h-3 rounded-full mt-2 ${isDark ? 'bg-luxury-gold' : 'bg-gray-400'}`}
					/>
				</div>
			</motion.div>
		</div>
	);
};

export default HeroBanner;