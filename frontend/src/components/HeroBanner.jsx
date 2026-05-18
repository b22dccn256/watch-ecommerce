import { useEffect, useMemo, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

import axios from "../lib/axios";

const HeroBanner = ({ slogan }) => {
  const [heroBanners, setHeroBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    let mounted = true;

    const fetchHeroBanner = async () => {
      try {
        const res = await axios.get("/banners");
        const active = (res.data || [])
          .filter((banner) => banner.status === "ACTIVE" && banner.imageUrl)
          .sort((a, b) => new Date(b.createdAt || b.uploadedAt || 0) - new Date(a.createdAt || a.uploadedAt || 0));

        if (mounted) {
          setHeroBanners(active);
          setCurrentIndex(0);
        }
      } catch {
        if (mounted) {
          setHeroBanners([]);
          setCurrentIndex(0);
        }
      }
    };

    fetchHeroBanner();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (heroBanners.length < 2) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
    }, 5600);

    return () => clearInterval(timer);
  }, [heroBanners.length]);

  const activeBanner = useMemo(() => heroBanners[currentIndex] || null, [heroBanners, currentIndex]);

  const next = () => {
    if (!heroBanners.length) return;
    setCurrentIndex((prev) => (prev + 1) % heroBanners.length);
  };

  const prev = () => {
    if (!heroBanners.length) return;
    setCurrentIndex((prev) => (prev - 1 + heroBanners.length) % heroBanners.length);
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-black/6 bg-[color:var(--color-surface)] px-4 pb-4 pt-4 shadow-[var(--shadow-card)] sm:px-6 sm:pt-6 lg:min-h-[52vh] lg:px-8 lg:pt-8">
      {/* Subtle single gradient — less visual noise */}
      <div className="pointer-events-none absolute -right-16 -top-8 h-48 w-48 rounded-full bg-[color:var(--color-gold)]/8 blur-3xl" />

      <div className="relative z-10 grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4"
        >
          <p className="hero-kicker inline-flex items-center gap-2 text-[color:var(--color-gold)]">
            <Sparkles className="h-3 w-3" />
            Fine Timepieces · Global Maisons
          </p>

          <h1 className="text-[clamp(1.8rem,1.2rem+2.2vw,3.2rem)] font-display font-bold leading-[1.08] text-primary">
            {(slogan || "A Quiet Theater\nfor Great Timepieces")
              .split("\n")
              .map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
          </h1>

          <p className="max-w-lg text-sm text-secondary sm:text-base">
            Tuyển chọn đồng hồ cao cấp với trải nghiệm tinh gọn, rõ ràng và sang trọng.
          </p>

          <div className="flex flex-wrap gap-2.5">
            <Link to="/catalog" className="btn-base btn-primary h-10 px-5 text-sm">
              Khám phá bộ sưu tập
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link to="/brands" className="btn-base btn-outline h-10 px-5 text-sm">
              Xem thương hiệu
            </Link>
          </div>

          {heroBanners.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={prev} className="btn-base btn-secondary h-8 w-8 rounded-full p-0" aria-label="Banner trước">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={next} className="btn-base btn-secondary h-8 w-8 rounded-full p-0" aria-label="Banner sau">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08 }}
          className="relative"
        >
          <div className="relative mx-auto max-w-[460px] lg:mr-0">
            <div className="group relative overflow-hidden rounded-2xl border border-black/8 bg-black shadow-[var(--shadow-elevated)]">
              <img
                src={activeBanner?.imageUrl || "/banner-2.jpg"}
                alt={activeBanner?.title || "Luxury watch campaign"}
                className="h-[280px] w-full object-cover transition-transform duration-[700ms] ease-out group-hover:scale-[1.03] sm:h-[340px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-5">
                <p className="text-[8px] uppercase tracking-[0.28em] text-white/55">Limited capsule</p>
                <p className="font-display mt-1.5 text-xl text-white sm:text-[1.5rem]">Permanence in Motion</p>
              </div>
            </div>

            {activeBanner?.link && (
              <Link to={activeBanner.link} aria-label={activeBanner.title || "Xem banner"} className="absolute inset-0" />
            )}
          </div>
        </motion.div>
      </div>

      {heroBanners.length > 1 && (
        <div className="relative z-10 mt-4 flex items-center justify-center gap-1.5">
          {heroBanners.map((banner, index) => (
            <button
              key={banner._id || index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Chọn banner ${index + 1}`}
              className={`h-1.5 rounded-full transition-all ${index === currentIndex ? "w-6 bg-[color:var(--color-gold)]" : "w-1.5 bg-black/15 hover:bg-black/30 dark:bg-white/20"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
