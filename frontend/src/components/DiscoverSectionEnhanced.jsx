import { motion } from 'framer-motion';

const DiscoverSectionEnhanced = ({ products }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <section className=\"pt-12 pb-12 border-t border-black/8 dark:border-white/8\">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, margin: '-100px' }}
        className=\"mb-10\"
      >
        <p className=\"text-[11px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-gold)] mb-3\">
          Cùng kỳ vọng
        </p>
        <h2 className=\"text-4xl font-serif font-light text-primary mb-4\">
          Bộ sưu tập kỳ tiếp
        </h2>
        <p className=\"text-base leading-relaxed text-secondary max-w-2xl\">
          Khám phá những chiếc đồng hồ cao cấp khác trong bộ sưu tập của chúng tôi. 
          Mỗi mẫu được curation để đáp ứng nhu cầu của những nhà sưu tập đồng hồ 
          được yêu cầu nhất, từ những mẫu kinh điển vĩnh hằng đến những tác phẩm 
          contemporary contemporary độc quyền.
        </p>
      </motion.div>

      <motion.div 
        className=\"product-grid-4\"
        variants={containerVariants}
        initial=\"hidden\"
        whileInView=\"visible\"
        viewport={{ once: true, margin: '-100px' }}
      >
        {products.map((product) => (
          <motion.div key={product._id} variants={itemVariants}>
            {/* ProductCard component goes here */}
            <div className=\"text-sm text-muted\">Product Card: {product.name}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
};

export default DiscoverSectionEnhanced;
