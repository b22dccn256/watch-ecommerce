import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle, Search, Mail, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../lib/axios";
import PageShell from "../components/PageShell";

const FAQ_ITEMS = [
  {
    question: "Làm thế nào để đặt hàng trên website?",
    answer: "Bạn có thể duyệt danh mục sản phẩm, chọn đồng hồ yêu thích, thêm vào giỏ hàng và tiến hành thanh toán. Chúng tôi hỗ trợ thanh toán COD (trả tiền khi nhận hàng), chuyển khoản ngân hàng và thanh toán qua VNPAY.",
  },
  {
    question: "Thời gian giao hàng mất bao lâu?",
    answer: "Đối với đơn hàng nội thành Hà Nội và TP.HCM, thời gian giao hàng từ 1-2 ngày làm việc. Các tỉnh thành khác từ 2-5 ngày làm việc. Đơn hàng sẽ được gửi qua đơn vị vận chuyển uy tín như Giao Hàng Nhanh, Giao Hàng Tiết Kiệm hoặc Viettel Post.",
  },
  {
    question: "Chính sách đổi trả như thế nào?",
    answer: "Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ khi nhận hàng nếu sản phẩm còn nguyên vẹn, chưa qua sử dụng và còn đầy đủ hộp, giấy tờ, phụ kiện. Vui lòng xem chi tiết tại trang Chính sách đổi trả.",
  },
  {
    question: "Sản phẩm có được bảo hành không?",
    answer: "Tất cả đồng hồ tại Luxury Watch Gallery đều được bảo hành chính hãng. Thời gian bảo hành từ 12-60 tháng tùy theo thương hiệu. Bảo hành bao gồm các lỗi kỹ thuật từ nhà sản xuất (không bao gồm hao mòn tự nhiên, trầy xước do sử dụng).",
  },
  {
    question: "Làm sao để biết đồng hồ là hàng chính hãng?",
    answer: "Luxury Watch Gallery cam kết 100% sản phẩm chính hãng. Mỗi đồng hồ đều có đầy đủ hộp, sổ bảo hành, thẻ chứng nhận và mã QR truy xuất nguồn gốc. Bạn có thể kiểm tra trực tiếp tại Showroom hoặc mang đến bất kỳ trung tâm kiểm định nào.",
  },
  {
    question: "Có được xem đồng hồ trước khi mua không?",
    answer: "Có! Bạn có thể ghé thăm Showroom của chúng tôi tại Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội (mở cửa 09:00 - 21:00 hàng ngày, kể cả Thứ Bảy & Chủ Nhật) để trực tiếp xem và thử đồng hồ.",
  },
  {
    question: "Website có hỗ trợ mua trả góp không?",
    answer: "Hiện tại chúng tôi chưa hỗ trợ mua trả góp trực tuyến. Tuy nhiên, bạn có thể liên hệ Hotline 1900 6789 để được tư vấn về các chương trình trả góp qua thẻ tín dụng hoặc các đối tác tài chính.",
  },
  {
    question: "Làm sao để theo dõi đơn hàng?",
    answer: "Bạn có thể theo dõi trạng thái đơn hàng bằng cách vào mục Tra cứu đơn hàng và nhập mã đơn hàng được gửi qua email xác nhận. Ngoài ra, bạn cũng có thể đăng nhập tài khoản để xem lịch sử đơn hàng.",
  },
  {
    question: "Tôi quên mật khẩu, phải làm sao?",
    answer: "Bạn có thể nhấn vào 'Quên mật khẩu' tại trang Đăng nhập. Hệ thống sẽ gửi email khôi phục mật khẩu về địa chỉ email đã đăng ký. Vui lòng kiểm tra cả thư mục Spam nếu không thấy email.",
  },
  {
    question: "Phí vận chuyển được tính như thế nào?",
    answer: "Miễn phí vận chuyển toàn quốc cho tất cả đơn hàng đồng hồ cao cấp từ 10 triệu đồng. Đối với đơn hàng dưới 10 triệu, phí vận chuyển sẽ được hiển thị trước khi bạn xác nhận thanh toán.",
  },
  {
    question: "Tôi có thể hủy đơn hàng không?",
    answer: "Bạn có thể hủy đơn hàng trước khi đơn hàng được xác nhận và chuyển đi. Sau khi đơn hàng đã được gửi, vui lòng liên hệ Hotline 1900 6789 để được hỗ trợ.",
  },
  {
    question: "Các phương thức thanh toán được chấp nhận?",
    answer: "Chúng tôi chấp nhận: Thanh toán COD (trả tiền khi nhận hàng), Chuyển khoản ngân hàng (Vietcombank, Techcombank, MB Bank), Ví điện tử VNPAY, và thanh toán trực tiếp tại Showroom.",
  },
];

const FAQPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [openIndex, setOpenIndex] = useState(null);
  const [filteredFAQs, setFilteredFAQs] = useState(FAQ_ITEMS);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredFAQs(FAQ_ITEMS);
      return;
    }
    const q = searchTerm.toLowerCase().trim();
    setFilteredFAQs(
      FAQ_ITEMS.filter(
        (faq) =>
          faq.question.toLowerCase().includes(q) ||
          faq.answer.toLowerCase().includes(q)
      )
    );
  }, [searchTerm]);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PageShell>
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f0c08]">
        {/* Hero */}
        <section className="relative bg-gradient-to-br from-luxury-darker via-luxury-dark to-black py-20 md:py-28 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.08),transparent_50%)]" />
          <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[color:var(--color-gold)]/10 border border-[color:var(--color-gold)]/20 mb-6">
                <HelpCircle className="w-4 h-4 text-[color:var(--color-gold)]" />
                <span className="text-xs font-semibold text-[color:var(--color-gold)] uppercase tracking-widest">
                  Trung tâm Hỗ trợ
                </span>
              </div>
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Câu Hỏi Thường Gặp
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto text-base md:text-lg">
                Giải đáp nhanh những thắc mắc phổ biến về sản phẩm, đặt hàng,
                thanh toán và chính sách của chúng tôi.
              </p>
            </motion.div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="max-w-xl mx-auto mt-10"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm câu hỏi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-[color:var(--color-gold)]/50 focus:ring-1 focus:ring-[color:var(--color-gold)]/30 transition-all"
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ List */}
        <section className="max-w-3xl mx-auto px-4 py-16 -mt-8 relative z-10">
          {filteredFAQs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <HelpCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">
                Không tìm thấy câu hỏi
              </h3>
              <p className="text-secondary">
                Vui lòng thử từ khóa khác hoặc liên hệ trực tiếp với chúng tôi.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {filteredFAQs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-luxury-darker overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left gap-4"
                  >
                    <span className="font-semibold text-primary text-sm md:text-base pr-4">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 text-[color:var(--color-gold)] transition-transform duration-300 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  <AnimatePresence>
                    {openIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-secondary text-sm leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Contact CTA */}
        <section className="max-w-3xl mx-auto px-4 pb-20">
          <div className="rounded-2xl bg-gradient-to-r from-[color:var(--color-gold)]/10 to-[color:var(--color-gold)]/5 border border-[color:var(--color-gold)]/20 p-8 md:p-10 text-center">
            <MessageCircle className="w-10 h-10 text-[color:var(--color-gold)] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-2">
              Không tìm thấy câu trả lời?
            </h3>
            <p className="text-secondary mb-6 max-w-md mx-auto">
              Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giúp đỡ bạn. Gửi câu
              hỏi và chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[color:var(--color-gold)] text-black font-semibold hover:bg-yellow-500 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Gửi câu hỏi
              </Link>
              <a
                href="tel:19006789"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[color:var(--color-gold)] text-[color:var(--color-gold)] font-semibold hover:bg-[color:var(--color-gold)]/10 transition-colors"
              >
                Hotline: 1900 6789
              </a>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
};

export default FAQPage;
