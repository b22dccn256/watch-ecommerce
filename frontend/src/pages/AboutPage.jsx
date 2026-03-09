import { motion } from "framer-motion";
import { ShieldCheck, Clock, Award } from "lucide-react";

const AboutPage = () => {
    return (
        <div className="min-h-screen bg-[#0f0c08] text-white pt-24 pb-20">
            {/* HERO SECTION */}
            <section className="relative w-full h-[60vh] flex items-center justify-center overflow-hidden mb-20">
                <div className="absolute inset-0 z-0">
                    <img
                        src="https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=2574&auto=format&fit=crop"
                        alt="Watchmaking Workshop"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0c08] via-transparent to-transparent"></div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="relative z-10 text-center px-4 max-w-3xl"
                >
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-white">
                        Di Sản Của <span className="text-[#D4AF37]">Thời Gian</span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
                        Hơn cả một cỗ máy đong đếm giờ giấc, mỗi chiếc đồng hồ tại Luxury Watch là một tác phẩm nghệ thuật, một minh chứng cho sự thành đạt và đẳng cấp vĩnh cửu của người sở hữu.
                    </p>
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
                        <h2 className="text-3xl font-bold mb-6 text-[#D4AF37]">Câu Chuyện Của Chúng Tôi</h2>
                        <p className="text-gray-400 leading-loose mb-6">
                            Được thành lập từ niềm đam mê mãnh liệt với các cỗ máy cơ khí vi mô, Luxury Watch bắt đầu hành trình của mình như một boutique nhỏ bé dành cho những nhà sưu tầm tại Hà Nội.
                        </p>
                        <p className="text-gray-400 leading-loose">
                            Trải qua một thập kỷ phát triển, chúng tôi tự hào trở thành điểm đến định danh uy tín hàng đầu, quy tụ những tuyệt tác thời gian từ Thụy Sĩ, Đức và Nhật Bản. Chúng tôi không chỉ bán đồng hồ, chúng tôi trao gửi những giá trị truyền đời.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex-1"
                    >
                        <div className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/30 shadow-2xl">
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
            <section className="bg-zinc-900/50 py-24 border-y border-zinc-900">
                <div className="max-w-screen-xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-white mb-4">Giá Trị Cốt Lõi</h2>
                        <p className="text-gray-500">Những cam kết tạo nên uy tín của Luxury Watch</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {/* Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center hover:border-[#D4AF37]/50 transition duration-300"
                        >
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Award className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">100% Chính Hãng</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Mọi sản phẩm bán ra đều đi kèm hộp sổ thẻ nguyên bản, giấy tờ hải quan và đầy đủ tem kiểm định quốc tế từ thương hiệu.
                            </p>
                        </motion.div>

                        {/* Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center hover:border-[#D4AF37]/50 transition duration-300"
                        >
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <ShieldCheck className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Bảo Hành Vượt Trội</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Cam kết bảo hành kỹ thuật lên tới 5 năm tại trung tâm của chúng tôi, hỗ trợ lau dầu bảo dưỡng miễn phí lần đầu.
                            </p>
                        </motion.div>

                        {/* Card 3 */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl text-center hover:border-[#D4AF37]/50 transition duration-300"
                        >
                            <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Clock className="w-8 h-8 text-[#D4AF37]" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-4">Thẩm Định Chuyên Gia</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
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
