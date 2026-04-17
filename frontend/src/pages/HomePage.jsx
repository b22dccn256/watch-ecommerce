import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { useProductStore } from "../stores/useProductStore";
import { useCampaignStore } from "../stores/useCampaignStore";
import { useStorefrontStore } from "../stores/useStorefrontStore";
import HeroBanner from "../components/HeroBanner";
import ProductCard from "../components/ProductCard";
import FlashSaleSection from "../components/FlashSaleSection";
import ChatBot from "../components/ChatBot";
import { SkeletonProductCard } from "../components/SkeletonLoaders";

const HomePage = () => {
  const { fetchFeaturedProducts, products, loading } = useProductStore();
  const { campaigns, fetchActiveCampaigns } = useCampaignStore();
  const { config, fetchConfig } = useStorefrontStore();

  useEffect(() => {
    fetchFeaturedProducts();
    fetchActiveCampaigns();
    fetchConfig();
  }, [fetchFeaturedProducts, fetchActiveCampaigns, fetchConfig]);

  const activeCampaign = useMemo(
    () => (campaigns || []).find((campaign) => campaign.status === "Active") || null,
    [campaigns]
  );

  const showInitialSkeleton = !config || (loading && products.length === 0);

  const featured = products.slice(0, 4);

  if (showInitialSkeleton) {
    return (
      <div className="min-h-screen pb-16 pt-4 sm:pt-8">
        <div className="mx-auto max-w-screen-2xl space-y-8 px-4 sm:px-6 lg:px-8">
          <div className="h-[70vh] animate-pulse rounded-[1.8rem] border border-black/10 bg-surface" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonProductCard key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-hidden pb-16 pt-4 sm:pt-8">
      <div className="mx-auto max-w-screen-2xl space-y-14 px-4 sm:px-6 lg:px-8">
        <HeroBanner slogan={config.heroSlogan} />

        <section className="grid gap-5 py-2 sm:py-4 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            className="premium-surface overflow-hidden rounded-[1.6rem] p-6 sm:p-8"
          >
            <p className="hero-kicker text-[color:var(--color-gold)]">Editorial story</p>
            <h2 className="heading-section mt-4 text-[1.9rem] sm:text-[2.4rem]">Nhịp điệu sống cùng cơ khí chính xác</h2>
            <p className="mt-4 max-w-xl text-sm text-secondary sm:text-base">
              Bộ sưu tập được tuyển theo ngôn ngữ tinh gọn: tỷ lệ mặt số, hoàn thiện vỏ, độ mượt dây đeo
              và cảm giác đeo trong từng ngữ cảnh đời sống.
            </p>
            <Link to="/catalog" className="btn-base btn-outline mt-7 h-11 px-6">
              Xem tất cả sản phẩm
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ delay: 0.08 }}
            className="relative overflow-hidden rounded-[1.6rem] border border-black/10 bg-black"
          >
            <img
              src="https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=1400&auto=format&fit=crop"
              alt="Luxury watch lifestyle"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/70">Quiet luxury</p>
              <p className="hero-title mt-2 text-2xl leading-tight sm:text-3xl">For Formal, For Daily, For Legacy</p>
            </div>
          </motion.div>
        </section>

        <section className="py-2 sm:py-4">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="hero-kicker text-[color:var(--color-gold)]">Featured pieces</p>
              <h2 className="heading-section mt-2">Bộ sưu tập chọn lọc</h2>
            </div>
            <Link to="/catalog" className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary transition hover:text-[color:var(--color-gold)]">
              Xem thêm
            </Link>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            className="product-grid-4"
          >
            {featured.map((product) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {activeCampaign && (
          <section className="pt-2 sm:pt-4">
            <FlashSaleSection
              title={config.flashSaleTitle}
              gridCols={config.gridColumns}
              products={products.slice(0, config?.gridColumns || 4)}
              timeLeft={{ days: 0, hours: 0, minutes: 0, seconds: 0 }}
              campaignName={activeCampaign.name}
            />
          </section>
        )}
      </div>

      {config.showChatBot && <ChatBot />}
    </div>
  );
};

export default HomePage;
