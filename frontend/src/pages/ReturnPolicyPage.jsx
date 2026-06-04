import PolicyPageLayout from "../components/PolicyPageLayout";
import { RotateCcw, AlertTriangle, CheckCircle, Package } from "lucide-react";

const ReturnPolicyPage = () => {
  return (
    <PolicyPageLayout
      title="Chính sách đổi trả"
      description="Tìm hiểu chi tiết về quy định và quy trình đổi trả sản phẩm tại Luxury Watch Store để đảm bảo quyền lợi của bạn."
      activeId="return"
    >
      <section className="space-y-10">
        <div className="bg-luxury-gold/10 p-7 rounded-[2rem] border border-luxury-gold/20 shadow-sm max-w-3xl">
          <p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-3">
            Returns & Exchanges
          </p>
          <h2 className="hero-title text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
            <RotateCcw className="w-8 h-8" />
            Đổi trả linh hoạt trong 30 ngày
          </h2>
          <p className="text-gray-600 dark:text-luxury-text-muted leading-relaxed">
            Chúng tôi cam kết mang lại trải nghiệm mua sắm tuyệt vời nhất. Nếu có bất kỳ vấn đề gì về sản phẩm do lỗi nhà sản xuất, quý khách có quyền đổi trả trong vòng 30 ngày kể từ ngày nhận hàng.
          </p>
        </div>

        <div className="space-y-6">
          <h3 className="hero-title text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-luxury-gold" />
            Điều kiện đổi trả
          </h3>
          <ul className="space-y-4 text-gray-600 dark:text-luxury-text-muted">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Sản phẩm còn nguyên vẹn, không bị trầy xước, móp méo hay có dấu hiệu đã qua sử dụng.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Đầy đủ hộp, sách hướng dẫn, thẻ bảo hành và các phụ kiện đi kèm (nếu có).</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Tem niêm phong, tem bảo hành còn nguyên vẹn, không bị rách nát.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Cung cấp hóa đơn mua hàng hoặc thông tin đơn hàng hợp lệ.</span>
            </li>
          </ul>
        </div>

        <div className="border-l border-black/10 dark:border-white/10 pl-5 md:pl-8">
          <h3 className="hero-title text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            Quy trình thực hiện
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 border border-luxury-border rounded-2xl bg-white/60 dark:bg-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-luxury-gold/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <p className="font-bold text-luxury-gold mb-2 text-lg">Bước 1</p>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Liên hệ</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Gọi Hotline hoặc gửi yêu cầu qua email/form liên hệ để thông báo tình trạng.
              </p>
            </div>
            <div className="p-5 border border-luxury-border rounded-2xl bg-white/60 dark:bg-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-luxury-gold/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <p className="font-bold text-luxury-gold mb-2 text-lg">Bước 2</p>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Gửi sản phẩm</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Đóng gói cẩn thận và gửi về trung tâm bảo hành của Luxury Watch Store.
              </p>
            </div>
            <div className="p-5 border border-luxury-border rounded-2xl bg-white/60 dark:bg-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-luxury-gold/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
              <p className="font-bold text-luxury-gold mb-2 text-lg">Bước 3</p>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Xử lý</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Chúng tôi kiểm tra và tiến hành đổi sản phẩm mới hoặc hoàn tiền theo quy định.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border flex items-start gap-4">
          <Package className="w-8 h-8 text-gray-400 shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">Lưu ý về phí vận chuyển</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Trong trường hợp đổi trả do lỗi từ phía Luxury Watch Store (giao sai hàng, hàng lỗi), chúng tôi sẽ chịu toàn bộ chi phí vận chuyển 2 chiều. Nếu đổi trả theo nhu cầu (đổi mẫu khác), quý khách vui lòng thanh toán phí vận chuyển.
            </p>
          </div>
        </div>
      </section>
    </PolicyPageLayout>
  );
};

export default ReturnPolicyPage;
