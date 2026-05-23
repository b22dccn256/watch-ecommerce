import PolicyPageLayout from "../components/PolicyPageLayout";
import { Truck, Clock, Shield, Globe } from "lucide-react";

const DeliveryPolicyPage = () => {
	const shippingMethods = [
		{
			title: "Giao hàng Hỏa tốc",
			time: "2 - 4 giờ làm việc",
			price: "50.000đ (Miễn phí cho đơn > 10tr)",
			desc: "Áp dụng cho khu vực nội thành Hà Nội và TP. HCM.",
			icon: Clock
		},
		{
			title: "Giao hàng Tiêu chuẩn",
			time: "2 - 5 ngày làm việc",
			price: "Miễn phí toàn quốc",
			desc: "Áp dụng cho mọi tỉnh thành trên toàn lãnh thổ Việt Nam.",
			icon: Truck
		},
		{
			title: "Giao hàng Quốc tế",
			time: "7 - 14 ngày làm việc",
			price: "Tính theo biểu phí FedEx/DHL",
			desc: "Hỗ trợ vận chuyển đến hơn 200 quốc gia và vùng lãnh thổ.",
			icon: Globe
		}
	];

	return (
		<PolicyPageLayout 
			title="Chính sách giao hàng" 
			description="Thông tin chi tiết về phí vận chuyển, thời gian giao hàng và bảo hiểm hàng hóa tại Luxury Watch Store."
			activeId="delivery"
		>
			<section className="space-y-10">
				<p className="max-w-3xl text-lg text-gray-600 dark:text-luxury-text-muted leading-relaxed">
					Tại <span className="text-luxury-gold font-bold">Luxury Watch Store</span>, chúng tôi hiểu rằng việc nhận được chiếc đồng hồ yêu thích một cách an toàn và nhanh chóng là ưu tiên hàng đầu của quý khách. Chúng tôi hợp tác với các đơn vị vận chuyển hàng đầu để đảm bảo mọi kiện hàng đều được nâng niu.
				</p>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					{shippingMethods.map((method, index) => (
						<div key={index} className="p-5 rounded-2xl border border-black/8 dark:border-luxury-border bg-gray-50/70 dark:bg-white/5">
							<method.icon className="w-10 h-10 text-luxury-gold mb-4" />
							<h3 className="hero-title text-lg font-semibold mb-2 text-gray-900 dark:text-white">{method.title}</h3>
							<p className="text-luxury-gold font-semibold text-sm mb-2">{method.time}</p>
							<p className="text-xs text-gray-500 dark:text-luxury-text-muted mb-4">{method.price}</p>
							<p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{method.desc}</p>
						</div>
					))}
				</div>

				<div className="space-y-6 border-l border-black/10 dark:border-white/10 pl-5 md:pl-8">
					<h2 className="hero-title text-2xl font-semibold flex items-center gap-3 text-gray-900 dark:text-white">
						<Shield className="w-6 h-6 text-luxury-gold" />
						Bảo hiểm và Kiểm tra hàng hóa
					</h2>
					<ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-luxury-text-muted">
						<li><strong>100% Bảo hiểm:</strong> Mọi đơn hàng đều được mua bảo hiểm trách nhiệm 100% giá trị sản phẩm trong suốt quá trình vận chuyển.</li>
						<li><strong>Đồng kiểm:</strong> Quý khách hoàn toàn có quyền mở gói hàng và kiểm tra hình thức sản phẩm trước khi thanh toán và nhận hàng.</li>
						<li><strong>Đóng gói tiêu chuẩn:</strong> Sản phẩm được đặt trong hộp chống sốc chuyên dụng, dán tem niêm phong Luxury Watch để đảm bảo tính nguyên bản.</li>
					</ul>
				</div>
			</section>
		</PolicyPageLayout>
	);
};

export default DeliveryPolicyPage;
