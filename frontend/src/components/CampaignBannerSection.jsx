import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Megaphone, ArrowRight } from "lucide-react";
import axios from "../lib/axios";

const CampaignBannerSection = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchBanners = async () => {
      try {
        const res = await axios.get("/banners");
        const active = (res.data || [])
          .filter((b) => b.status === "ACTIVE" && b.imageUrl)
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
        if (mounted) setBanners(active);
      } catch {
        if (mounted) setBanners([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchBanners();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading || banners.length === 0) return null;

  return (
    <section className="py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--color-gold)]/15 text-[color:var(--color-gold)]">
          <Megaphone className="h-4 w-4" />
        </div>
        <h2 className="text-lg sm:text-xl font-semibold text-primary">
          Chiến dịch & Khuyến mãi
        </h2>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {banners.map((banner, i) => (
          <motion.div
            key={banner._id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-2xl border border-black/10 dark:border-white/10 bg-black"
          >
            {/* Banner Image */}
            <Link
              to={banner.link || "/catalog?reset=true"}
              className="block aspect-[16/10] sm:aspect-[4/3] overflow-hidden"
            >
              <img
                src={banner.imageUrl}
                alt={banner.title || "Chiến dịch khuyến mãi"}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </Link>

            {/* Content overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
              <h3 className="text-white font-semibold text-sm sm:text-base truncate">
                {banner.title}
              </h3>
              {banner.link && (
                <Link
                  to={banner.link}
                  className="mt-2 inline-flex items-center gap-1.5 text-[color:var(--color-gold)] text-xs font-medium hover:underline"
                >
                  Khám phá ngay
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>

            {/* Badge */}
            <div className="absolute top-3 left-3">
              <span className="rounded-full bg-[color:var(--color-gold)] px-2.5 py-1 text-[10px] font-bold text-black uppercase tracking-wider">
                Khuyến mãi
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default CampaignBannerSection;
