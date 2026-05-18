import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, RefreshCw, ShieldCheck, Sparkles, Truck } from "lucide-react";

import { useProductStore } from "../stores/useProductStore";
import { useCampaignStore } from "../stores/useCampaignStore";
import { useStorefrontStore } from "../stores/useStorefrontStore";
import HeroBanner from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";
import FlashSaleSection from "../components/FlashSaleSection";
import BestSellersSection from "../components/BestSellerSection";
import ChatBot from "../components/ChatBot";
import { SkeletonProductCard } from "../components/SkeletonLoaders";

const TRUST_CARDS = [
  {
    label: "Bộ sưu tập",
    value: "500+ mẫu",
    sub: "Tuyển chọn tinh gọn theo quiet luxury",
    icon: Sparkles,
  },
  {
    label: "Bảo hành",
    value: "5 năm",
    sub: "Hậu mãi toàn diện cho từng chiếc đồng hồ",
    icon: ShieldCheck,
  },
  {
    label: "Đổi trả",
    value: "30 ngày",
    sub: "Quy trình rõ ràng, hỗ trợ nhanh",
    icon: RefreshCw,
  },
  {
    label: "Giao hàng",
    value: "2h nội thành",
    sub: "Áp dụng khu vực trung tâm phù hợp",
    icon: Truck,
  },
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
          <div className="pt-2 sm:pt-4">
            <HeroBanner slogan={config.heroSlogan} />
          </div>
        )}

        {/* ── Featured Products — Compact ── */}
        <section className="py-10 sm:py-14">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-end justify-between"
          >
            <div>
              <p className="hero-kicker text-[color:var(--color-gold)]">Featured pieces</p>
              <h2 className="hero-title text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-2">Tuyển chọn tinh hoa</h2>
            </div>
            <Link
              to="/catalog"
              className="group hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted transition-colors duration-200 hover:text-[color:var(--color-gold)] sm:inline-flex"
            >
              Xem tất cả
              <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          {/* Product grid — staggered */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.05 }}
            variants={containerVariants}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {featured.map((product) => (
              <motion.div key={String(product._id)} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* Mobile CTA */}
          <div className="mt-6 flex justify-center sm:hidden">
            <Link to="/catalog" className="btn-base btn-outline h-10 px-6 text-sm">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* ── Trust Band — Compact ── */}
        <section className="py-6 sm:py-8">
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {TRUST_CARDS.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="card-premium flex items-start gap-3 p-3.5 sm:p-4"
              >
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[color:var(--color-gold)]/20 bg-[color:var(--color-gold)]/8 text-[color:var(--color-gold)]">
                  <card.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted">{card.label}</p>
                  <p className="mt-0.5 text-base font-semibold text-primary">{card.value}</p>
                  <p className="mt-0.5 text-xs leading-snug text-secondary">{card.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── Editorial Story — Compact Asymmetric ── */}
        <section className="grid gap-4 py-10 sm:py-14 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="premium-surface flex flex-col justify-between overflow-hidden rounded-2xl p-6 sm:p-8"
          >
            <div>
              <p className="hero-kicker text-[color:var(--color-gold)]">Editorial story</p>
              <h2 className="heading-section mt-3 max-w-md text-[1.5rem] sm:text-[1.8rem]">
                Nhịp điệu sống cùng<br />cơ khí chính xác
              </h2>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-secondary sm:text-base">
                Bộ sưu tập được tuyển theo ngôn ngữ tinh gọn: tỷ lệ mặt số, hoàn thiện vỏ, độ mượt dây đeo
                và cảm giác đeo trong từng ngữ cảnh đời sống.
              </p>
            </div>
            <Link to="/catalog" className="btn-base btn-outline mt-6 h-10 w-fit px-6 text-sm">
              Khám phá bộ sưu tập
            </Link>
          </motion.div>

          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-black/6 bg-black"
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
