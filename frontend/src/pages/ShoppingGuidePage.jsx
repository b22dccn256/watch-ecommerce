import PolicyPageLayout from "../components/PolicyPageLayout";
import { ShoppingBag, Search, CreditCard, Box } from "lucide-react";

const ShoppingGuidePage = () => {
  return (
    <PolicyPageLayout
      title="Hướng dẫn mua hàng"
      description="Các bước đơn giản để sở hữu chiếc đồng hồ mơ ước tại Luxury Watch Store."
      activeId="guide"
    >
      <section className="space-y-10">
        <div className="bg-luxury-gold/10 p-7 rounded-[2rem] border border-luxury-gold/20 shadow-sm max-w-3xl">
          <p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-3">
            Shopping Guide
          </p>
          <h2 className="hero-title text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <ShoppingBag className="w-8 h-8" />
            Mua sắm dễ dàng, tiện lợi
          </h2>
          <p className="text-gray-600 dark:text-luxury-text-muted leading-relaxed">
            Hệ thống website của chúng tôi được thiết kế để mang đến trải nghiệm mua sắm trực tuyến mượt mà và an toàn nhất. Chỉ với vài thao tác cơ bản, chiếc đồng hồ đẳng cấp sẽ được giao đến tận tay bạn.
          </p>
        </div>

        <div className="relative">
          {/* Vertical line for desktop timeline */}
          <div className="hidden md:block absolute left-8 top-8 bottom-8 w-0.5 bg-luxury-border"></div>
          
          <div className="space-y-12">
            {/* Step 1 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-luxury-darker border-2 border-luxury-gold flex items-center justify-center shrink-0 z-10 shadow-md">
                <Search className="w-6 h-6 text-luxury-gold" />
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">1. Tìm kiếm và Lựa chọn sản phẩm</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                  Sử dụng thanh tìm kiếm hoặc duyệt qua các danh mục (Thương hiệu, Bộ sưu tập) để tìm chiếc đồng hồ ưng ý. Bạn có thể sử dụng bộ lọc để thu hẹp kết quả theo mức giá, kích thước hoặc tính năng.
                </p>
                <div className="p-3 bg-white dark:bg-luxury-darker rounded-xl text-sm border border-black/5 dark:border-white/5 text-gray-500">
                  <span className="font-semibold text-luxury-gold">Mẹo:</span> Hãy sử dụng tính năng so sánh để đối chiếu các thông số giữa nhiều mẫu đồng hồ.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-luxury-darker border-2 border-luxury-gold flex items-center justify-center shrink-0 z-10 shadow-md">
                <ShoppingBag className="w-6 h-6 text-luxury-gold" />
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">2. Thêm vào giỏ hàng</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                  Khi đã chọn được sản phẩm, nhấp vào nút "Thêm vào giỏ hàng". Bạn có thể tiếp tục mua sắm hoặc tiến hành thanh toán ngay. Kiểm tra lại giỏ hàng để đảm bảo đúng số lượng và sản phẩm.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-luxury-darker border-2 border-luxury-gold flex items-center justify-center shrink-0 z-10 shadow-md">
                <CreditCard className="w-6 h-6 text-luxury-gold" />
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">3. Thanh toán</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm leading-relaxed">
                  Điền đầy đủ thông tin giao hàng và chọn phương thức thanh toán phù hợp. Chúng tôi hỗ trợ thanh toán qua thẻ tín dụng/ghi nợ, cổng thanh toán VNPay, PayPal hoặc thanh toán khi nhận hàng (COD).
                </p>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-white dark:bg-luxury-darker text-xs font-semibold rounded-lg border border-luxury-border text-gray-600 dark:text-gray-300">Thẻ tín dụng</span>
                  <span className="px-3 py-1 bg-white dark:bg-luxury-darker text-xs font-semibold rounded-lg border border-luxury-border text-gray-600 dark:text-gray-300">VNPay</span>
                  <span className="px-3 py-1 bg-white dark:bg-luxury-darker text-xs font-semibold rounded-lg border border-luxury-border text-gray-600 dark:text-gray-300">COD</span>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col md:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-white dark:bg-luxury-darker border-2 border-luxury-gold flex items-center justify-center shrink-0 z-10 shadow-md">
                <Box className="w-6 h-6 text-luxury-gold" />
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border flex-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">4. Nhận hàng</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  Sau khi đặt hàng thành công, bạn sẽ nhận được email xác nhận. Bạn có thể sử dụng mã đơn hàng để theo dõi tiến trình giao hàng tại trang "Tra cứu đơn hàng".
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PolicyPageLayout>
  );
};

export default ShoppingGuidePage;
