import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles } from "lucide-react";

import axios from "../lib/axios";

const HeroBanner = ({ slogan }) => {
  const [heroBanners, setHeroBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
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
    <section className="relative overflow-hidden rounded-[1.8rem] border border-black/10 bg-[color:var(--color-surface)] px-4 pb-8 pt-10 shadow-[0_28px_88px_-42px_rgba(0,0,0,0.55)] sm:px-8 sm:pt-12 lg:min-h-[82vh] lg:px-10 lg:pt-14">
      <div className="pointer-events-none absolute -left-16 -top-12 h-56 w-56 rounded-full bg-[color:var(--color-gold)]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-6 h-72 w-72 rounded-full bg-black/10 blur-3xl dark:bg-[color:var(--color-gold)]/10" />

      <div className="relative z-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="space-y-6"
        >
          <p className="hero-kicker inline-flex items-center gap-2 text-[color:var(--color-gold)]">
            <Sparkles className="h-3.5 w-3.5" />
            Curated watch house
          </p>

          <h1 className="heading-display max-w-2xl text-primary">
            <span dangerouslySetInnerHTML={{ __html: (slogan || "A Quiet Theater<br />for Great Timepieces").replace("\n", "<br/>") }} />
          </h1>

          <p className="max-w-xl text-base text-secondary sm:text-lg">
            Tuyển chọn đồng hồ cao cấp với trải nghiệm tinh gọn, rõ ràng và sang trọng.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link to="/catalog" className="btn-base btn-primary h-11 px-6">
              Khám phá bộ sưu tập
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/brands" className="btn-base btn-outline h-11 px-6">
              Xem thương hiệu
            </Link>
          </div>

          {heroBanners.length > 1 && (
            <div className="flex items-center gap-2 pt-1">
              <button type="button" onClick={prev} className="btn-base btn-secondary h-9 w-9 rounded-full p-0" aria-label="Banner trước">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={next} className="btn-base btn-secondary h-9 w-9 rounded-full p-0" aria-label="Banner sau">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="relative"
        >
          <div className="relative mx-auto max-w-[500px] lg:mr-0">
            <div className="relative overflow-hidden rounded-[1.9rem] border border-black/10 bg-black shadow-[0_30px_100px_-38px_rgba(0,0,0,0.8)]">
              <img
                src={activeBanner?.imageUrl || "/banner-2.jpg"}
                alt={activeBanner?.title || "Luxury watch campaign"}
                className="h-[440px] w-full object-cover sm:h-[510px]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-7">
                <p className="text-[10px] uppercase tracking-[0.3em] text-white/75">Limited capsule</p>
                <p className="hero-title mt-2 text-2xl text-white sm:text-3xl">Precision in Motion</p>
              </div>
            </div>

            {activeBanner?.link && (
              <Link to={activeBanner.link} aria-label={activeBanner.title || "Xem banner"} className="absolute inset-0" />
            )}
          </div>
        </motion.div>
      </div>

      {heroBanners.length > 1 && (
        <div className="relative z-10 mt-6 flex items-center justify-center gap-2">
          {heroBanners.map((banner, index) => (
            <button
              key={banner._id || index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Chọn banner ${index + 1}`}
              className={`h-2 rounded-full transition-all ${index === currentIndex ? "w-8 bg-[color:var(--color-gold)]" : "w-2 bg-black/20 hover:bg-black/40 dark:bg-white/30"}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default HeroBanner;
