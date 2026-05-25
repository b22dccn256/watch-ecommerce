import PolicyPageLayout from "../components/PolicyPageLayout";
import OrderLookupForm from "../components/OrderLookupForm";

const OrderLookupPage = () => {
  return (
	<PolicyPageLayout
	  title="Tra cứu đơn hàng"
	  description="Nhập mã đơn hàng và email để xem trạng thái hiện tại, hành trình vận chuyển và thông tin xác nhận."
	  activeId="order-lookup"
	>
	  <div className="max-w-3xl py-8">
		<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
		  <div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
			<div className="flex items-center gap-3 mb-2">
			  <p className="text-sm font-semibold text-gray-900 dark:text-white">Tra cứu nhanh</p>
			</div>
			<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Xem trạng thái đơn, không cần vào tài khoản.</p>
		  </div>
		  <div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
			<div className="flex items-center gap-3 mb-2">
			  <p className="text-sm font-semibold text-gray-900 dark:text-white">Theo dõi đơn</p>
			</div>
			<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Mã theo dõi sẽ xuất hiện sau khi thanh toán thành công.</p>
		  </div>
		  <div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
			<div className="flex items-center gap-3 mb-2">
			  <p className="text-sm font-semibold text-gray-900 dark:text-white">Hỗ trợ nhanh</p>
			</div>
			<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Nếu sai email, hệ thống sẽ không tìm thấy đơn.</p>
		  </div>
		</div>

		<OrderLookupForm />
	  </div>
	</PolicyPageLayout>
  );
};

export default OrderLookupPage;
