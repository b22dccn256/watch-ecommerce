import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

const HeroBanner = ({ config, slogan }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = useMemo(() => {
    if (config?.heroSlides && config.heroSlides.length > 0) {
      return config.heroSlides.filter((s) => s.active !== false);
    }
    return [
      {
        image:
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600",
        mobileImage: "",
        title: "Kiệt tác Thời gian",
        subtitle:
          slogan ||
          "Tuyển chọn đồng hồ cao cấp với trải nghiệm tinh gọn, rõ ràng và sang trọng.",
        link: "/catalog?reset=true",
      },
    ];
  }, [config, slogan]);

  useEffect(() => {
    if (slides.length < 2) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const activeSlide = useMemo(
    () => slides[currentIndex] || {},
    [slides, currentIndex],
  );

  const next = () => {
    if (!slides.length) return;
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prev = () => {
    if (!slides.length) return;
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-black/10 dark:border-white/5 h-[360px] sm:h-[440px] lg:h-[500px] shadow-[var(--shadow-card)] animate-fade-in group/banner bg-black">
      {/* Background Slide Image with Cross-fade transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.01 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          <img
            src={
              activeSlide.image ||
              "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600"
            }
            alt={activeSlide.title || "Luxury watch campaign"}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600";
            }}
          />
          {/* Rich Gradient Overlay for premium feel and text legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent dark:from-black/90 dark:via-black/50 dark:to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Floating Content Wrapper - Left Aligned */}
      <div className="absolute inset-0 flex items-center z-10 px-6 sm:px-12 lg:px-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={`content-${currentIndex}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-2xl space-y-4 sm:space-y-5 text-left text-white"
          >
            <p className="inline-flex items-center gap-2 text-[10px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--color-gold)]">
              <Sparkles className="h-3.5 w-3.5 animate-pulse text-[color:var(--color-gold)]" />
              Fine Timepieces · Global Maisons
            </p>

            <h1 className="font-display font-bold text-2xl sm:text-4xl lg:text-5xl leading-[1.1] tracking-tight text-white drop-shadow-md whitespace-pre-line">
              {activeSlide.title || "Kiệt tác Thời gian"}
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-white/70 max-w-lg leading-relaxed font-light drop-shadow-sm">
              {activeSlide.subtitle ||
                "Tuyển chọn đồng hồ cao cấp với trải nghiệm tinh gọn, rõ ràng và sang trọng."}
            </p>

            <div className="flex flex-wrap gap-3 pt-2 sm:pt-4">
              <Link
                to={activeSlide.link || "/catalog?reset=true"}
                className="btn-base bg-[color:var(--color-gold)] text-black hover:bg-[color:var(--color-gold-light)] h-10 sm:h-11 px-5 sm:px-6 text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 shadow-[0_4px_20px_rgba(var(--color-gold-rgb),0.3)] transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Khám phá bộ sưu tập
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/brands"
                className="btn-base border border-white/20 text-white hover:bg-white/10 h-10 sm:h-11 px-5 sm:px-6 text-xs sm:text-sm font-semibold rounded-xl flex items-center transition-all duration-200"
              >
                Xem thương hiệu
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Modern Arrow Controls (emerges on hover) */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-white/15 bg-black/15 text-white hover:bg-black/50 hover:border-white/30 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/banner:opacity-100 transition-all duration-300 transform -translate-x-2 group-hover/banner:translate-x-0"
            aria-label="Slide trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-9 w-9 sm:h-11 sm:w-11 rounded-full border border-white/15 bg-black/15 text-white hover:bg-black/50 hover:border-white/30 flex items-center justify-center backdrop-blur-sm opacity-0 group-hover/banner:opacity-100 transition-all duration-300 transform translate-x-2 group-hover/banner:translate-x-0"
            aria-label="Slide sau"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}

      {/* Dot Indicators at the bottom */}
      {slides.length > 1 && (
        <div className="absolute bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Chọn slide ${index + 1}`}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-6 bg-[color:var(--color-gold)]"
                  : "w-1.5 bg-white/30 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
