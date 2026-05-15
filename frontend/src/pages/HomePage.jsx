import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { useProductStore } from "../stores/useProductStore";
import { useCampaignStore } from "../stores/useCampaignStore";
import { useStorefrontStore } from "../stores/useStorefrontStore";
import HeroBanner from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";
import FlashSaleSection from "../components/FlashSaleSection";
import BestSellersSection from "../components/BestSellerSection";
import ChatBot from "../components/ChatBot";
import { SkeletonProductCard } from "../components/SkeletonLoaders";

// Brand pillars
const PILLARS = [
  { label: "Bảo hành quốc tế", sub: "5 năm toàn diện" },
  { label: "Giao hàng miễn phí", sub: "Từ 2.000.000 ₫" },
  { label: "Đổi trả 30 ngày", sub: "Không điều kiện" },
];

// Stagger variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const HomePage = () => {
  const { fetchFeaturedProducts, products, loading } = useProductStore();
  const { fetchActiveCampaigns, campaigns } = useCampaignStore();
  const { config, fetchConfig } = useStorefrontStore();
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    fetchFeaturedProducts();
    fetchActiveCampaigns();
    fetchConfig();
  }, [fetchFeaturedProducts, fetchActiveCampaigns, fetchConfig]);

  // B-02: tinh timeLeft cho Flash Sale campaign dau tien
  const flashCampaign = campaigns?.find(c => c.isActive && c.endDate);
  useEffect(() => {
    if (!flashCampaign) return;
    const tick = () => {
      const diff = Math.max(0, new Date(flashCampaign.endDate) - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft({ hours: h, minutes: m, seconds: s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [flashCampaign]);

  const showSkeleton = !config || (loading && products.length === 0);
  const gridCols = Number(config?.gridColumns) || 4;
  const featured = products.slice(0, config?.featuredCount || 4);
  // B-02 + B-03: products cho Flash Sale va Best Sellers
  const flashProducts = flashCampaign?.products?.slice(0, gridCols) || [];
  const bestSellers = products
    .filter(p => (p.salesCount || 0) > 0)
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, gridCols);

  if (showSkeleton) {
    return (
      <div className="min-h-screen pb-16 pt-4 sm:pt-8">
        <div className="mx-auto max-w-screen-2xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="h-[70vh] animate-pulse rounded-[1.8rem] border border-black/10 bg-surface" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonProductCard key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  // A3: render section theo thu tu homeLayout
  const renderSections = () => {
    const layout = config?.homeLayout || ["hero", "flashSale", "bestSeller"];
    return layout.map(sectionKey => {
      switch (sectionKey) {
        case "flashSale":
          return flashProducts.length > 0 ? (
            <FlashSaleSection
              key="flashSale"
              products={flashProducts}
              timeLeft={timeLeft}
              campaignName={flashCampaign?.name}
              title={config?.flashSaleTitle || "Uu Dai Dac Biet"}
              gridCols={gridCols}
            />
          ) : null;
        case "bestSeller":
          return bestSellers.length > 0 ? (
            <BestSellersSection
              key="bestSeller"
              products={bestSellers}
              title={config?.bestSellerTitle || "San pham Ban chay"}
              gridCols={gridCols}
            />
          ) : null;
        case "newsletter":
          return null; // placeholder for future newsletter component
        default:
          return null;
      }
    });
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">

        {/* A3: Hero - chi hien neu co trong homeLayout */}
        {(config?.homeLayout || ["hero"]).includes("hero") && (
          <div className="pt-4 sm:pt-8">
            <HeroBanner slogan={config.heroSlogan} />
          </div>
        )}

        {/* ── Featured Products — Editorial ── */}
        <section className="py-24 sm:py-32">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mb-12 flex items-end justify-between"
          >
            <div>
              <p className="hero-kicker text-[color:var(--color-gold)]">Featured pieces</p>
              <h2 className="hero-title text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mt-3">Tuyển chọn tinh hoa</h2>
            </div>
            <Link
              to="/catalog"
              className="group hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition-colors duration-300 hover:text-[color:var(--color-gold)] sm:inline-flex"
            >
              Xem tất cả
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Product grid — staggered */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={containerVariants}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {featured.map((product) => (
              <motion.div key={product._id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile CTA */}
          <div className="mt-10 flex justify-center sm:hidden">
            <Link to="/catalog" className="btn-base btn-outline h-11 px-8">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ── Brand Pillars ── */}
        <section className="border-y border-[color:var(--color-border)] py-12">
          <div className="grid gap-10 sm:grid-cols-3">
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.09 }}
                className="text-center"
              >
                <p className="text-sm font-semibold tracking-[0.06em] text-primary">{p.label}</p>
                <p className="mt-1 text-sm text-muted">{p.sub}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Editorial Story — Asymmetric ── */}
        <section className="grid gap-6 py-24 sm:py-32 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="premium-surface flex flex-col justify-between overflow-hidden rounded-[1.6rem] p-8 sm:p-12"
          >
            <div>
              <p className="hero-kicker text-[color:var(--color-gold)]">Editorial story</p>
              <h2 className="heading-section mt-5 max-w-md text-[1.75rem] sm:text-[2.2rem]">
                Nhịp điệu sống cùng<br />cơ khí chính xác
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-secondary sm:text-base">
                Bộ sưu tập được tuyển theo ngôn ngữ tinh gọn: tỷ lệ mặt số, hoàn thiện vỏ, độ mượt dây đeo
                và cảm giác đeo trong từng ngữ cảnh đời sống.
              </p>
            </div>
            <Link to="/catalog" className="btn-base btn-outline mt-10 h-11 w-fit px-7">
              Khám phá bộ sưu tập
            </Link>
          </motion.div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-[1.6rem] border border-black/10 bg-black"
          >
            <img
              src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1400&auto=format&fit=crop"
              alt="Luxury watch lifestyle"
              className="h-full min-h-[380px] w-full object-cover opacity-90 transition-transform duration-[800ms] ease-out group-hover:scale-[1.04]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-8">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/60">Quiet luxury</p>
              <p className="hero-title mt-2 text-2xl leading-tight text-white sm:text-[1.7rem]">
                For Formal, For Daily,<br />For Legacy
              </p>
            </div>
          </motion.div>
        </section>

        {/* ── Vision Statement — Full Width ── */}
        <section className="pb-28 sm:pb-36">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="lux-divider mx-auto mb-10 w-16" />
            <p className="font-serif text-[clamp(1.55rem,3.2vw,2.6rem)] font-medium leading-[1.28] text-primary">
              &quot;Một chiếc đồng hồ không chỉ đo thời gian —<br className="hidden sm:block" />
              nó kể câu chuyện về người đeo nó.&quot;
            </p>
            <div className="lux-divider mx-auto mt-10 w-16" />
            <p className="mt-7 text-xs uppercase tracking-[0.22em] text-muted">
              Luxury Watch Gallery · Hà Nội, Việt Nam
            </p>
          </motion.div>
        </section>

      </div>

      {/* A3: Render sections theo thu tu homeLayout */}
      {renderSections()}

      {config.showChatBot && <ChatBot />}
    </div>
  );
};

export default HomePage;
