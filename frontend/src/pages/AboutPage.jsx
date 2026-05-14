import { motion } from "framer-motion";
import { ShieldCheck, Clock, Award } from "lucide-react";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#f8f5f0_0%,#ffffff_100%)] text-gray-900 dark:text-white pt-24 pb-20">
            {/* HERO SECTION */}
            <section className="relative w-full min-h-[70vh] flex items-center justify-center overflow-hidden mb-20">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=2574&auto=format&fit=crop"
                        alt="Watchmaking Workshop"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(183,146,90,0.18),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.82)_58%,rgba(255,255,255,0.95)_100%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.15),transparent_35%),linear-gradient(180deg,rgba(15,12,8,0.15)_0%,rgba(15,12,8,0.7)_60%,rgba(15,12,8,0.98)_100%)]"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-4 max-w-4xl"
                >
                    <p className="hero-kicker text-xs md:text-sm font-semibold text-luxury-gold mb-4">Brand story</p>
                    <h1 className="hero-title text-5xl md:text-7xl font-bold tracking-tight mb-6 text-gray-900 dark:text-white">
                        Di Sáº£n Cá»§a <span className="text-[color:var(--color-gold)]">Thá»i Gian</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                        HÆ¡n cáº£ má»™t cá»— mĂ¡y Ä‘ong Ä‘áº¿m giá» giáº¥c, má»—i chiáº¿c Ä‘á»“ng há»“ táº¡i Luxury Watch lĂ  má»™t tĂ¡c pháº©m nghá»‡ thuáº­t, má»™t minh chá»©ng cho sá»± thĂ nh Ä‘áº¡t vĂ  Ä‘áº³ng cáº¥p vÄ©nh cá»­u cá»§a ngÆ°á»i sá»Ÿ há»¯u.
                    </p>
                    <p className="mt-5 text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        ChĂºng tĂ´i tuyá»ƒn chá»n Ä‘á»“ng há»“ theo tiĂªu chĂ­ ráº¥t rĂµ rĂ ng: chĂ­nh hĂ£ng, chuáº©n tháº©m má»¹, cĂ³ giĂ¡ trá»‹ sá»­ dá»¥ng lĂ¢u dĂ i vĂ  Ä‘á»§ tinh táº¿ Ä‘á»ƒ trá»Ÿ thĂ nh má»™t pháº§n phong cĂ¡ch sá»‘ng cá»§a báº¡n, thay vĂ¬ chá»‰ lĂ  má»™t mĂ³n phá»¥ kiá»‡n.
                    </p>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md px-4 py-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.25)]">
                            <p className="text-3xl font-bold text-[color:var(--color-gold)] mb-1">10+</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">NÄƒm Ä‘á»‹nh hĂ¬nh phong cĂ¡ch Ä‘á»“ng há»“ cao cáº¥p</p>
                        </div>
                        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md px-4 py-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.25)]">
                            <p className="text-3xl font-bold text-[color:var(--color-gold)] mb-1">100%</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">ChĂ­nh hĂ£ng, kiá»ƒm Ä‘á»‹nh vĂ  minh báº¡ch nguá»“n gá»‘c</p>
                        </div>
                        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md px-4 py-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.25)]">
                            <p className="text-3xl font-bold text-[color:var(--color-gold)] mb-1">5â˜…</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">TÆ° váº¥n, báº£o hĂ nh vĂ  chÄƒm sĂ³c sau bĂ¡n hĂ ng</p>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* OUR STORY */}
            <section className="max-w-screen-xl mx-auto px-6 mb-24">
                <div className="flex flex-col md:flex-row items-center gap-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1"
                    >
                        <p className="hero-kicker text-xs font-semibold text-luxury-gold mb-3">The atelier</p>
                        <h2 className="hero-title text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">CĂ¢u Chuyá»‡n Cá»§a ChĂºng TĂ´i</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-loose mb-6">
                            ÄÆ°á»£c thĂ nh láº­p tá»« niá»m Ä‘am mĂª mĂ£nh liá»‡t vá»›i cĂ¡c cá»— mĂ¡y cÆ¡ khĂ­ vi mĂ´, Luxury Watch báº¯t Ä‘áº§u hĂ nh trĂ¬nh cá»§a mĂ¬nh nhÆ° má»™t boutique nhá» bĂ© dĂ nh cho nhá»¯ng nhĂ  sÆ°u táº§m táº¡i HĂ  Ná»™i.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 leading-loose">
                            Tráº£i qua má»™t tháº­p ká»· phĂ¡t triá»ƒn, chĂºng tĂ´i tá»± hĂ o trá»Ÿ thĂ nh Ä‘iá»ƒm Ä‘áº¿n Ä‘á»‹nh danh uy tĂ­n hĂ ng Ä‘áº§u, quy tá»¥ nhá»¯ng tuyá»‡t tĂ¡c thá»i gian tá»« Thá»¥y SÄ©, Äá»©c vĂ  Nháº­t Báº£n. ChĂºng tĂ´i khĂ´ng chá»‰ bĂ¡n Ä‘á»“ng há»“, chĂºng tĂ´i trao gá»­i nhá»¯ng giĂ¡ trá»‹ truyá»n Ä‘á»i.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 leading-loose mt-6">
                            Má»—i sáº£n pháº©m khi Ä‘áº¿n tay khĂ¡ch hĂ ng Ä‘á»u Ä‘Æ°á»£c kiá»ƒm tra láº¡i vá» ngoáº¡i hĂ¬nh, thĂ´ng sá»‘ ká»¹ thuáº­t vĂ  tráº£i nghiá»‡m Ä‘eo thá»±c táº¿. ChĂºng tĂ´i muá»‘n khĂ¡ch hĂ ng cáº£m nháº­n Ä‘Æ°á»£c sá»± an tĂ¢m ngay tá»« láº§n Ä‘áº§u cháº¡m vĂ o há»™p Ä‘á»“ng há»“, chá»© khĂ´ng chá»‰ á»Ÿ khoáº£nh kháº¯c thanh toĂ¡n.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1"
                    >
                        <div className="relative rounded-[2rem] overflow-hidden border border-[#D4AF37]/30 shadow-2xl">
                            <img
                                src="https://images.unsplash.com/photo-1508004680771-708b02aabdc0?q=80&w=2070&auto=format&fit=crop"
                                alt="Watch Craftsmanship"
                                className="w-full h-auto object-cover transform hover:scale-105 transition duration-700"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* WHY US (3 PILLARS) */}
            <section className="editorial-surface py-24 border-y border-black/10 dark:border-zinc-900">
                <div className="max-w-screen-xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="hero-kicker text-xs font-semibold text-luxury-gold mb-3">Why us</p>
                        <h2 className="hero-title text-3xl font-bold text-gray-900 dark:text-white mb-4">GiĂ¡ Trá»‹ Cá»‘t LĂµi</h2>
                        <p className="text-gray-600 dark:text-gray-500">Nhá»¯ng cam káº¿t táº¡o nĂªn uy tĂ­n cá»§a Luxury Watch</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-white/90 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 p-8 rounded-2xl text-center hover:border-[color:var(--color-gold)]/50 transition duration-300"
                        >
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Award className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">100% ChĂ­nh HĂ£ng</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Má»i sáº£n pháº©m bĂ¡n ra Ä‘á»u Ä‘i kĂ¨m há»™p sá»• tháº» nguyĂªn báº£n, giáº¥y tá» háº£i quan vĂ  Ä‘áº§y Ä‘á»§ tem kiá»ƒm Ä‘á»‹nh quá»‘c táº¿ tá»« thÆ°Æ¡ng hiá»‡u.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-white/90 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 p-8 rounded-2xl text-center hover:border-[color:var(--color-gold)]/50 transition duration-300"
                        >
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Báº£o HĂ nh VÆ°á»£t Trá»™i</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Cam káº¿t báº£o hĂ nh ká»¹ thuáº­t lĂªn tá»›i 5 nÄƒm táº¡i trung tĂ¢m cá»§a chĂºng tĂ´i, há»— trá»£ lau dáº§u báº£o dÆ°á»¡ng miá»…n phĂ­ láº§n Ä‘áº§u.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-white/90 dark:bg-zinc-900 border border-black/10 dark:border-zinc-800 p-8 rounded-2xl text-center hover:border-[color:var(--color-gold)]/50 transition duration-300"
                        >
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tháº©m Äá»‹nh ChuyĂªn Gia</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Äá»™i ngÅ© ká»¹ thuáº­t viĂªn tu nghiá»‡p táº¡i Thá»¥y SÄ© sáº½ trá»±c tiáº¿p kiá»ƒm tra 12 bÆ°á»›c nghiĂªm ngáº·t trÆ°á»›c khi sáº£n pháº©m trao tay khĂ¡ch hĂ ng.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;

