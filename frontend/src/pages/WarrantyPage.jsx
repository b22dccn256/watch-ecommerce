import PolicyPageLayout from "../components/PolicyPageLayout";
import { ShieldCheck, RotateCcw, PenTool, CheckCircle, ArrowRight } from "lucide-react";

const WarrantyPage = () => {
	const steps = [
		{ title: "Liên hệ", desc: "Gọi Hotline hoặc gửi yêu cầu online.", icon: ShieldCheck },
		{ title: "Gửi hàng", desc: "Đội vận chuyển đến lấy hàng tận nơi miễn phí.", icon: RotateCcw },
		{ title: "Kiểm tra", desc: "Kỹ thuật viên kiểm tra bằng máy đo chuyên dụng.", icon: PenTool },
		{ title: "Hoàn tất", desc: "Sửa chữa hoặc đổi mới sản phẩm cho khách.", icon: CheckCircle },
	];

	return (
		<PolicyPageLayout 
			title="Đổi trả & Bảo hành" 
			description="Chính sách bảo hành 5 năm tiêu chuẩn toàn cầu và quy trình đổi trả linh hoạt của Luxury Watch Store."
			activeId="warranty"
		>
			<section className="space-y-10">
				<div className="bg-luxury-gold/10 p-8 rounded-3xl border border-luxury-gold/20">
					<h2 className="text-2xl font-bold text-luxury-gold mb-4 flex items-center gap-3">
						<ShieldCheck className="w-8 h-8" />
						Đặc quyền Bảo hành 5 Năm
					</h2>
					<p className="text-gray-600 dark:text-luxury-text-muted leading-relaxed">
						Mọi chiếc đồng hồ được bán ra tại Luxury Watch Store đều đi kèm gói <span className="font-bold">Bảo hành Vàng 5 năm</span>. Gói bảo hành này bao gồm cả các lỗi do người dùng (như rơi vỡ, vào nước) trong năm đầu tiên sử dụng.
					</p>
				</div>

				<div>
					<h3 className="text-xl font-bold mb-6">Quy trình Đổi trả & Bảo hành</h3>
					<div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
						{steps.map((step, index) => (
							<div key={index} className="flex-1 flex flex-col items-center text-center group">
								<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-luxury-gold group-hover:text-luxury-dark border border-luxury-border">
									<step.icon className="w-8 h-8" />
								</div>
								<h4 className="font-bold mb-2">{step.title}</h4>
								<p className="text-xs text-gray-400 leading-relaxed px-4">{step.desc}</p>
								{index < steps.length - 1 && (
									<div className="hidden md:block absolute top-8 left-[calc(25%*${index+1}-2rem)] w-[calc(25%-4rem)] h-[1px] bg-luxury-border" />
								)}
							</div>
						))}
					</div>
				</div>

				<div className="space-y-6">
					<h3 className="text-xl font-bold">Chính sách Đổi trả</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 border border-luxury-border rounded-xl">
							<p className="font-bold text-luxury-gold mb-1">Đổi mới 30 ngày</p>
							<p className="text-sm text-gray-400">Nếu lỗi phát sinh từ nhà sản xuất, khách hàng được đổi sản phẩm mới cùng model.</p>
						</div>
						<div className="p-4 border border-luxury-border rounded-xl">
							<p className="font-bold text-luxury-gold mb-1">Hoàn tiền 100%</p>
							<p className="text-sm text-gray-400">Trong vòng 7 ngày đầu nếu quý khách không hài lòng về trải nghiệm (sản phẩm phải còn seal).</p>
						</div>
					</div>
				</div>

				<div className="border-t border-luxury-border pt-8">
					<p className="text-sm text-luxury-text-muted italic">
						* Lưu ý: Chính sách này không áp dụng cho các sản phẩm trong chương trình thanh lý hoặc có ghi chú riêng biệt tại thời điểm mua hàng.
					</p>
				</div>
			</section>
		</PolicyPageLayout>
	);
};

export default WarrantyPage;
