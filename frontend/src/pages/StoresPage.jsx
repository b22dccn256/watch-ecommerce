import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Phone, Clock, Mail, ChevronRight } from "lucide-react";

const STORES = [
  {
    id: "hn-1",
    city: "Hà Nội",
    name: "Luxury Watch Gallery - Tràng Tiền Plaza",
    address: "Tầng 1, Tràng Tiền Plaza, 24 Hai Bà Trưng, Q. Hoàn Kiếm, Hà Nội",
    phone: "0911046801 - Ext 1",
    email: "trangtien@luxurywatch.vn",
    hours: "09:00 - 21:30 (Thứ 2 - Chủ Nhật)",
    image:
      "https://images.unsplash.com/photo-1549439602-43ebca2327af?q=80&w=1200",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.1614742517653!2d105.85044431533206!3d21.026225985999715!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab94eb5a58ad%3A0x24e0da1a0e1cb301!2zVHLDoG5nIFRp4buBbiBQbGF6YQ!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s",
  },
  {
    id: "hcm-1",
    city: "TP. Hồ Chí Minh",
    name: "Luxury Watch Gallery - Saigon Centre",
    address: "Tầng L1, Saigon Centre, 65 Lê Lợi, Q. 1, TP. HCM",
    phone: "0911046801 - Ext 2",
    email: "saigoncentre@luxurywatch.vn",
    hours: "09:30 - 22:00 (Thứ 2 - Chủ Nhật)",
    image:
      "https://images.unsplash.com/photo-1584813539806-2538b8d918c6?q=80&w=1200",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.4946681029277!2d106.69972301526027!3d10.773374292323382!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f40a3b3b15f%3A0x1288b4db8bd40244!2sSaigon%20Centre!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s",
  },
  {
    id: "dn-1",
    city: "Đà Nẵng",
    name: "Luxury Watch Gallery - Vincom Đà Nẵng",
    address: "Tầng trệt, Vincom Center, 910A Ngô Quyền, Sơn Trà, Đà Nẵng",
    phone: "0911046801 - Ext 3",
    email: "danang@luxurywatch.vn",
    hours: "09:00 - 22:00 (Thứ 2 - Chủ Nhật)",
    image:
      "https://images.unsplash.com/photo-1581457173163-f938f22e8ec5?q=80&w=1200",
    mapUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.020556108169!2d108.23070741528652!3d16.06440628888426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31421820b4111dd9%3A0x6b107b1d4cb8dcbe!2sVincom%20Center%20Da%20Nang!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s",
  },
];

const StoresPage = () => {
  const [activeStore, setActiveStore] = useState(STORES[0]);

  return (
    <div className="animate-fade-in min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[400px] w-full bg-black flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1495856458515-0637185db551?q=80&w=2000"
            alt="Showroom Banner"
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        </div>
        <div className="relative z-10 text-center px-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white font-luxury uppercase tracking-wider mb-4"
          >
            Hệ Thống Showroom
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-gray-300 max-w-2xl mx-auto text-lg"
          >
            Trải nghiệm không gian mua sắm đồng hồ đẳng cấp, với dịch vụ tư vấn
            chuyên nghiệp tại các cửa hàng của Luxury Watch Gallery trên toàn quốc.
          </motion.p>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Store List */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-2xl font-bold font-luxury text-[color:var(--color-primary)] mb-6 uppercase tracking-wider">
              Danh sách chi nhánh
            </h2>
            <div className="space-y-4">
              {STORES.map((store) => (
                <div
                  key={store.id}
                  onClick={() => setActiveStore(store)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    activeStore.id === store.id
                      ? "bg-[color:var(--color-gold)]/10 border-[color:var(--color-gold)] shadow-lg shadow-[color:var(--color-gold)]/5"
                      : "bg-[color:var(--color-surface)] border-black/5 dark:border-white/5 hover:border-[color:var(--color-gold)]/50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--color-gold)] mb-2 inline-block">
                        {store.city}
                      </span>
                      <h3 className="text-lg font-bold text-[color:var(--color-primary)] mb-3">
                        {store.name}
                      </h3>
                      <div className="space-y-2 text-sm text-[color:var(--color-secondary)]">
                        <p className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-gold)]" />
                          <span className="leading-relaxed">
                            {store.address}
                          </span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Phone className="w-4 h-4 shrink-0 text-[color:var(--color-gold)]" />
                          <span>{store.phone}</span>
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0 text-[color:var(--color-gold)]" />
                          <span>{store.hours}</span>
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-6 h-6 transition-transform ${activeStore.id === store.id ? "text-[color:var(--color-gold)] translate-x-1" : "text-gray-400"}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-6 bg-[color:var(--color-surface)] border border-black/5 dark:border-white/5 rounded-2xl text-center">
              <h4 className="font-bold text-[color:var(--color-primary)] mb-2">
                Trợ giúp & Đặt lịch
              </h4>
              <p className="text-sm text-[color:var(--color-secondary)] mb-4">
                Quý khách có thể đặt lịch trước để được chuyên viên chuẩn bị sẵn
                mẫu đồng hồ yêu thích.
              </p>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-[color:var(--color-gold)] text-black font-bold uppercase tracking-widest text-xs rounded-xl hover:opacity-90 transition-opacity w-full"
              >
                Liên hệ đặt lịch
              </a>
            </div>
          </div>

          {/* Active Store Detail & Map */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStore.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-[color:var(--color-surface)] border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-2xl"
              >
                <div className="h-[300px] w-full relative">
                  <img
                    src={activeStore.image}
                    alt={activeStore.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {activeStore.name}
                    </h3>
                    <p className="text-gray-200 text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {activeStore.email}
                    </p>
                  </div>
                </div>
                <div className="p-2 h-[450px]">
                  <iframe
                    src={activeStore.mapUrl}
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: "1rem" }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>
    </div>
  );
};

export default StoresPage;
