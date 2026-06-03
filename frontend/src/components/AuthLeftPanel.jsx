import { motion } from "framer-motion";
import { Percent, Truck, Gift, RefreshCcw, Star, Crown } from "lucide-react";

const EDITORIAL_IMAGE =
  "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=1600&auto=format&fit=crop";

const BENEFITS = [
  {
    icon: Percent,
    title: "Chiết khấu 5%",
    desc: "Khi mua các sản phẩm tại Luxury Watch Gallery",
  },
  {
    icon: Truck,
    title: "Miễn phí giao hàng",
    desc: "Cho thành viên VIP và đơn hàng từ 10 triệu",
  },
  {
    icon: Gift,
    title: "Voucher sinh nhật",
    desc: "Tặng voucher đến 500.000đ cho thành viên",
  },
  {
    icon: RefreshCcw,
    title: "Trợ giá thu cũ lên đời",
    desc: "Thu cũ đổi mới, trợ giá đến 5 triệu",
  },
  {
    icon: Star,
    title: "Thăng hạng nhận voucher",
    desc: "Nhận voucher đến 300.000đ khi lên hạng",
  },
  {
    icon: Crown,
    title: "Đặc quyền VIP",
    desc: "Ưu đãi thêm đến 10% cho khách hàng thân thiết",
  },
];

const AuthLeftPanel = () => {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col relative overflow-hidden bg-[#0a0908]">
      {/* Background Image & Overlay */}
      <img
        src={EDITORIAL_IMAGE}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover opacity-[0.25] mix-blend-luminosity"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/80" />

      {/* Content Container */}
      <div className="relative flex-1 flex flex-col items-center justify-center p-12 w-full max-w-[700px] mx-auto">
        {/* Header section */}
        <div className="text-center mb-10 w-full">
          <div className="inline-block px-4 py-1.5 rounded-full border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10 text-[10px] font-bold text-[color:var(--color-gold)] uppercase tracking-[0.15em] mb-6 shadow-sm">
            SMEMBER
          </div>
          <h2 className="text-3xl xl:text-4xl font-serif text-white leading-tight mb-4 tracking-wide">
            Nhập hội khách hàng
            <br />
            thành viên SMEMBER
          </h2>
          <p className="text-sm text-white/60">
            Để không bỏ lỡ các ưu đãi hấp dẫn
          </p>
        </div>

        {/* Grid section */}
        <div className="grid grid-cols-3 gap-0 border border-white/10 rounded-2xl overflow-hidden bg-black/20 backdrop-blur-sm w-full">
          {BENEFITS.map((item, i) => {
            const Icon = item.icon;
            // Determine border classes based on grid position (3 cols)
            const isRightEdge = (i + 1) % 3 === 0;
            const isBottomEdge = i >= 3;

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className={`flex flex-col items-center text-center p-6 sm:p-8 hover:bg-white/5 transition-colors
                  ${!isRightEdge ? "border-r border-white/10" : ""}
                  ${!isBottomEdge ? "border-b border-white/10" : ""}
                `}
              >
                <div className="mb-4">
                  <Icon className="w-8 h-8 text-[color:var(--color-gold)] stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-white mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-[11px] text-white/50 leading-relaxed max-w-[160px]">
                  {item.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AuthLeftPanel;
