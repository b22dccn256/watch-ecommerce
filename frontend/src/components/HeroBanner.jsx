import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
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
			} catch {
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
		? "bg-[radial-gradient(circle_at_22%_28%,rgba(201,166,107,0.22)_0%,rgba(0,0,0,0.12)_35%,rgba(0,0,0,0.86)_100%)]"
		: "bg-[radial-gradient(circle_at_22%_28%,rgba(201,166,107,0.18)_0%,rgba(0,0,0,0.06)_35%,rgba(0,0,0,0.78)_100%)]";

	const secondaryButtonClass = "border-white/55 text-white hover:bg-white/10";

	return (
		<section className="relative min-h-[84vh] md:min-h-screen overflow-hidden transition-colors duration-500">
			<img
				src={activeBanner?.imageUrl || "/banner-2.jpg"}
				alt={activeBanner?.title || "Luxury Watch"}
				className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${isDark ? "brightness-[0.72]" : "brightness-[0.82]"}`}
			/>
			{activeBanner?.link && (
				<Link
					to={activeBanner.link}
					className="absolute inset-0 z-[1]"
					aria-label={activeBanner.title || "Xem banner"}
				/>
			)}

			<div className={`absolute inset-0 transition-all duration-500 ${overlayClass} z-[2]`} />
			<div className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.12)_36%,rgba(0,0,0,0.74)_100%)]" />
			<div className="absolute -left-20 top-16 z-[2] h-72 w-72 rounded-full bg-[var(--color-accent)]/20 blur-3xl" />
			<div className="absolute -right-10 bottom-20 z-[2] h-56 w-56 rounded-full bg-white/10 blur-3xl" />

			<div className="relative z-[3] mx-auto flex min-h-[84vh] w-full max-w-screen-2xl items-center px-4 py-12 sm:px-6 lg:px-10 xl:px-16">
				{heroBanners.length > 1 && (
					<>
						<button
							onClick={prevSlide}
							aria-label="Banner trước"
							className="absolute left-3 top-1/2 z-[5] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/55 md:flex"
						>
							<ChevronLeft className="h-5 w-5" />
						</button>
						<button
							onClick={nextSlide}
							aria-label="Banner sau"
							className="absolute right-3 top-1/2 z-[5] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/55 md:flex"
						>
							<ChevronRight className="h-5 w-5" />
						</button>
					</>
				)}

				<div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
					<div className="relative max-w-4xl">
						<motion.div
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.45 }}
							className="rounded-[2rem] border border-white/12 bg-black/34 px-5 py-8 backdrop-blur-md shadow-[0_30px_90px_-30px_rgba(0,0,0,0.65)] md:px-10 md:py-12"
						>
						<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						className="hero-kicker text-luxury-gold text-sm md:text-base mb-5 font-bold drop-shadow-md"
					>
						<Sparkles className="inline-block h-4 w-4 -mt-1 mr-2" />
						NEW COLLECTION 2026
					</motion.p>

						<motion.h1
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.2 }}
						className="heading-display hero-title mb-6 text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
						style={{ wordBreak: "normal", overflowWrap: "normal", hyphens: "none" }}
					>
						<span dangerouslySetInnerHTML={{ __html: (slogan || "Tuyệt tác thời<br />gian tuyệt đỉnh").replace("\n", "<br/>") }} />
					</motion.h1>

						<motion.p
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.4 }}
						className="text-body text-base md:text-xl max-w-2xl mb-8 leading-relaxed transition-colors duration-500 font-medium text-white/[0.88] drop-shadow-[0_4px_18px_rgba(0,0,0,0.75)]"
					>
						Khám phá bộ sưu tập đồng hồ cơ được tuyển chọn với ngôn ngữ thị giác điện ảnh, tạo nhịp điệu cao cấp ngay từ điểm chạm đầu tiên.
					</motion.p>

						<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.6 }}
						className="flex flex-col sm:flex-row gap-4"
					>
						<Link
							to="/catalog"
							className="btn-primary inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-[1.03]"
						>
							Khám phá ngay
							<ArrowRight className="h-4 w-4" />
						</Link>

						<Link
							to="/brands"
							className={`inline-flex items-center justify-center border-2 font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 ${secondaryButtonClass}`}
						>
							Thương hiệu
						</Link>
					</motion.div>
						</motion.div>

						<div className="absolute -bottom-6 left-6 hidden md:flex items-center gap-4 rounded-2xl border border-white/12 bg-black/45 px-5 py-4 backdrop-blur-md">
							<p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Edition</p>
							<p className="hero-title text-2xl text-[var(--color-accent)]">2026</p>
						</div>
					</div>

					<div className="relative flex justify-center lg:justify-end lg:pb-14">
						<motion.div
							initial={{ opacity: 0, x: 24, rotate: 1.5 }}
							animate={{ opacity: 1, x: 0, rotate: 1.5 }}
							transition={{ delay: 0.25, duration: 0.5 }}
							className="pointer-events-none hidden lg:block absolute right-4 top-8 h-[72%] w-[78%] rounded-[2rem] border border-white/12 bg-black/26 backdrop-blur-md"
						/>

						<motion.div
							initial={{ opacity: 0, y: 24, rotate: -2.5 }}
							animate={{ opacity: 1, y: 0, rotate: -2.5 }}
							transition={{ delay: 0.32, duration: 0.55 }}
							className="relative w-full max-w-[340px] sm:max-w-[400px] lg:max-w-[460px] overflow-hidden rounded-[2rem] border border-white/15 bg-black/24 backdrop-blur-sm shadow-[0_32px_100px_-35px_rgba(0,0,0,0.85)]"
						>
							<img
								src={activeBanner?.imageUrl || "/banner-2.jpg"}
								alt={activeBanner?.title || "Luxury Watch Closeup"}
								className="h-[420px] w-full object-cover scale-[1.12]"
							/>
							<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_8%,rgba(0,0,0,0.18)_45%,rgba(0,0,0,0.72)_100%)]" />
							<div className="absolute bottom-0 left-0 right-0 px-6 py-6">
								<p className="text-[10px] uppercase tracking-[0.32em] text-white/70">Quiet Luxury</p>
								<p className="hero-title mt-2 text-2xl text-white leading-tight">Cinematic Wrist Presence</p>
							</div>
						</motion.div>
					</div>
				</div>
			</div>

			<div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black via-black/60 to-transparent" />

			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ delay: 1.2 }}
				className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
			>
				<div className={`w-6 h-10 border-2 rounded-full flex justify-center transition-colors duration-500 ${isDark ? "border-luxury-gold" : "border-gray-400"}`}>
					<motion.div
						animate={{ y: [0, 12, 0] }}
						transition={{ duration: 1.5, repeat: Infinity }}
						className={`w-1 h-3 rounded-full mt-2 ${isDark ? "bg-luxury-gold" : "bg-gray-400"}`}
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
		</section>
	);
};

export default HeroBanner;
