import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from "../lib/axios";
import { useThemeStore } from "../stores/useThemeStore";

const HeroBanner = ({ slogan }) => {
	const { theme } = useThemeStore();
	const isDark = theme === "dark";
	const [heroBanners, setHeroBanners] = useState([]);
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		let isMounted = true;

		const fetchHeroBanner = async () => {
			try {
				const res = await axios.get("/banners");
				const activeBanners = (res.data || [])
					.filter((banner) => banner.status === "ACTIVE" && banner.imageUrl)
					.sort((a, b) => new Date(b.createdAt || b.uploadedAt || 0) - new Date(a.createdAt || a.uploadedAt || 0));
				if (isMounted) {
					setHeroBanners(activeBanners);
					setCurrentIndex(0);
				}
			} catch (error) {
				if (isMounted) {
					setHeroBanners([]);
					setCurrentIndex(0);
				}
			}
		};

		fetchHeroBanner();

		return () => {
			isMounted = false;
		};
	}, []);

	useEffect(() => {
		if (heroBanners.length <= 1) return;

		const timer = setInterval(() => {
			setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
		}, 5000);

		return () => clearInterval(timer);
	}, [heroBanners.length]);

	const nextSlide = () => {
		if (heroBanners.length === 0) return;
		setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
	};

	const prevSlide = () => {
		if (heroBanners.length === 0) return;
		setCurrentIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
	};

	const activeBanner = heroBanners[currentIndex] || null;

	const overlayClass = isDark
		? "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.18)_0%,rgba(0,0,0,0.42)_55%,rgba(0,0,0,0.75)_100%)]"
		: "bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.38)_55%,rgba(0,0,0,0.68)_100%)]";

	const titleClass = "text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.85)]";

	const secondaryButtonClass = "border-white/70 text-white hover:bg-white/10";

	const blendClass = "bg-gradient-to-t from-black/70 via-black/30 to-transparent";

	return (
		<div className="relative h-screen flex items-center justify-center overflow-hidden transition-colors duration-500">
			<img
				src={activeBanner?.imageUrl || "/banner-2.jpg"}
				alt={activeBanner?.title || "Luxury Watch"}
				className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isDark ? 'brightness-80' : 'brightness-90'}`}
			/>
			{activeBanner?.link && (
				<Link
					to={activeBanner.link}
					className="absolute inset-0 z-[1]"
					aria-label={activeBanner.title || "Xem banner"}
				/>
			)}
			
			{/* Adaptive Overlay */}
			<div className={`absolute inset-0 transition-all duration-500 ${overlayClass} z-[2]`} />

			{/* Content */}
			<div className="relative z-[3] text-center px-6 max-w-5xl">
				{heroBanners.length > 1 && (
					<>
						<button
							onClick={prevSlide}
							aria-label="Banner trước"
							className="absolute left-4 top-1/2 -translate-y-1/2 z-[4] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
						>
							<ChevronLeft className="h-5 w-5" />
						</button>
						<button
							onClick={nextSlide}
							aria-label="Banner sau"
							className="absolute right-4 top-1/2 -translate-y-1/2 z-[4] hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
						>
							<ChevronRight className="h-5 w-5" />
						</button>
					</>
				)}

				<div className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-black/28 px-5 py-8 backdrop-blur-md shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:px-10 md:py-10">
					<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						className="text-luxury-gold text-sm md:text-base tracking-[0.3em] mb-5 font-bold uppercase drop-shadow-md"
					>
						NEW COLLECTION 2026
					</motion.p>

					<motion.h1
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className={`text-4xl md:text-5xl lg:text-7xl font-sans leading-[1.05] mb-6 transition-all duration-500 normal-case tracking-tight text-balance break-normal ${titleClass}`}
						style={{ wordBreak: 'normal', overflowWrap: 'normal', hyphens: 'none' }}
					>
						<span dangerouslySetInnerHTML={{ __html: (slogan || "Tuyệt tác thời<br />gian tuyệt đỉnh").replace('\n', '<br/>') }} />
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="text-base md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed transition-colors duration-500 font-medium text-white/90 drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]"
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
							to="/brands"
							className={`inline-block border-2 font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 ${secondaryButtonClass}`}
						>
							Thương hiệu
						</Link>
					</motion.div>
				</div>
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

				{heroBanners.length > 1 && (
					<div className="absolute bottom-24 left-1/2 z-[4] flex -translate-x-1/2 items-center gap-2">
						{heroBanners.map((banner, index) => (
							<button
								key={banner._id || index}
								onClick={() => setCurrentIndex(index)}
								aria-label={`Chuyển đến banner ${index + 1}`}
								className={`h-2.5 rounded-full transition-all duration-300 ${index === currentIndex ? "w-8 bg-luxury-gold" : "w-2.5 bg-white/50 hover:bg-white/80"}`}
							/>
						))}
					</div>
				)}
		</div>
	);
};

export default HeroBanner;
