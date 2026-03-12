import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const HeroBanner = () => {
    return (
        <div className="relative h-screen flex items-center justify-center overflow-hidden">
            <img
                src="/public/banner-2.jpg"
                alt="Luxury Watch"
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-luxury-dark/80 via-luxury-dark/60 to-luxury-dark/90" />

            <div className="relative z-10 text-center px-6 max-w-4xl">
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-luxury-gold text-sm tracking-wider-luxury mb-6 font-medium"
                >
                    NEW COLLECTION 2026
                </motion.p>

                <motion.h1
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-display font-luxury leading-tight mb-8 text-white"
                >
                    Tuyệt tác thời<br />gian tuyệt đỉnh
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl text-luxury-text-light max-w-2xl mx-auto mb-10 leading-relaxed"
                >
                    Khám phá bộ sưu tập đồng hồ cơ tinh xảo từ những thương hiệu hàng đầu thế giới
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link
                        to="/catalog"
                        className="inline-block bg-luxury-gold hover:bg-luxury-gold-light text-luxury-dark font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        Khám phá ngay
                    </Link>

                    <Link
                        to="/catalog"
                        className="inline-block border-2 border-luxury-gold text-luxury-gold hover:bg-luxury-gold hover:text-luxury-dark font-semibold px-10 py-4 rounded-full text-lg transition-all duration-300 transform hover:scale-105"
                    >
                        Thương hiệu
                    </Link>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
                <div className="w-6 h-10 border-2 border-luxury-gold rounded-full flex justify-center">
                    <motion.div
                        animate={{ y: [0, 12, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-1 h-3 bg-luxury-gold rounded-full mt-2"
                    />
                </div>
            </motion.div>
        </div>
    );
};

export default HeroBanner;