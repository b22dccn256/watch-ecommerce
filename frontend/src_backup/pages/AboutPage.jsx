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
                        Di Sản Của <span className="text-[color:var(--color-gold)]">Thời Gian</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
                        Hơn cả một cỗ máy đong đếm giờ giấc, mỗi chiếc đồng hồ tại Luxury Watch là một tác phẩm nghệ thuật, một minh chứng cho sự thành đạt và đẳng cấp vĩnh cửu của người sở hữu.
                    </p>
                    <p className="mt-5 text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        Chúng tôi tuyển chọn đồng hồ theo tiêu chí rất rõ ràng: chính hãng, chuẩn thẩm mỹ, có giá trị sử dụng lâu dài và đủ tinh tế để trở thành một phần phong cách sống của bạn, thay vì chỉ là một món phụ kiện.
                    </p>

                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md px-4 py-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.25)]">
                            <p className="text-3xl font-bold text-[color:var(--color-gold)] mb-1">10+</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Năm định hình phong cách đồng hồ cao cấp</p>
                        </div>
                        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md px-4 py-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.25)]">
                            <p className="text-3xl font-bold text-[color:var(--color-gold)] mb-1">100%</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Chính hãng, kiểm định và minh bạch nguồn gốc</p>
                        </div>
                        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white/80 dark:bg-white/[0.08] backdrop-blur-md px-4 py-5 shadow-[0_16px_50px_-30px_rgba(0,0,0,0.25)]">
                            <p className="text-3xl font-bold text-[color:var(--color-gold)] mb-1">5★</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">Tư vấn, bảo hành và chăm sóc sau bán hàng</p>
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
                        <h2 className="hero-title text-3xl md:text-4xl font-bold mb-6 text-gray-900 dark:text-white">Câu Chuyện Của Chúng Tôi</h2>
                        <p className="text-gray-600 dark:text-gray-400 leading-loose mb-6">
                            Được thành lập từ niềm đam mê mãnh liệt với các cỗ máy cơ khí vi mô, Luxury Watch bắt đầu hành trình của mình như một boutique nhỏ bé dành cho những nhà sưu tầm tại Hà Nội.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 leading-loose">
                            Trải qua một thập kỷ phát triển, chúng tôi tự hào trở thành điểm đến định danh uy tín hàng đầu, quy tụ những tuyệt tác thời gian từ Thụy Sĩ, Đức và Nhật Bản. Chúng tôi không chỉ bán đồng hồ, chúng tôi trao gửi những giá trị truyền đời.
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 leading-loose mt-6">
                            Mỗi sản phẩm khi đến tay khách hàng đều được kiểm tra lại về ngoại hình, thông số kỹ thuật và trải nghiệm đeo thực tế. Chúng tôi muốn khách hàng cảm nhận được sự an tâm ngay từ lần đầu chạm vào hộp đồng hồ, chứ không chỉ ở khoảnh khắc thanh toán.
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
                        <h2 className="hero-title text-3xl font-bold text-gray-900 dark:text-white mb-4">Giá Trị Cốt Lõi</h2>
                        <p className="text-gray-600 dark:text-gray-500">Những cam kết tạo nên uy tín của Luxury Watch</p>
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
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">100% Chính Hãng</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Mọi sản phẩm bán ra đều đi kèm hộp sổ thẻ nguyên bản, giấy tờ hải quan và đầy đủ tem kiểm định quốc tế từ thương hiệu.
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
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bảo Hành Vượt Trội</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Cam kết bảo hành kỹ thuật lên tới 5 năm tại trung tâm của chúng tôi, hỗ trợ lau dầu bảo dưỡng miễn phí lần đầu.
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
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Thẩm Định Chuyên Gia</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                Đội ngũ kỹ thuật viên tu nghiệp tại Thụy Sĩ sẽ trực tiếp kiểm tra 12 bước nghiêm ngặt trước khi sản phẩm trao tay khách hàng.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;
