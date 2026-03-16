import { useState } from "react";
import PolicyPageLayout from "../components/PolicyPageLayout";
import { Ruler, Watch, Info, CheckCircle2 } from "lucide-react";

const SizeGuidePage = () => {
	const [wristSize, setWristSize] = useState("");
	const [recommendation, setRecommendation] = useState(null);

	const calculateSize = (size) => {
		const val = parseFloat(size);
		if (isNaN(val)) return;

		if (val < 14) {
			setRecommendation({ dial: "28mm - 33mm", style: "Elegant / Petit", tip: "Cổ tay mảnh, các mẫu mặt nhỏ sẽ tạo sự thanh thoát tối ưu." });
		} else if (val >= 14 && val < 16) {
			setRecommendation({ dial: "34mm - 38mm", style: "Classic / Unisex", tip: "Kích thước lý tưởng cho sự cân bằng và tinh tế." });
		} else if (val >= 16 && val < 18) {
			setRecommendation({ dial: "39mm - 42mm", style: "Modern / Versatile", tip: "Kích thước phổ biến nhất, phù hợp với hầu hết các dòng Rolex, Omega." });
		} else {
			setRecommendation({ dial: "43mm - 46mm+", style: "Sport / Bold", tip: "Cổ tay lớn, những mẫu mặt to sẽ tôn lên vẻ mạnh mẽ và đẳng cấp." });
		}
	};

	return (
		<PolicyPageLayout 
			title="Hướng dẫn chọn size" 
			description="Công cụ tính toán size đồng hồ từ chu vi cổ tay và các mẹo chọn đồng hồ phù hợp với vóc dáng."
			activeId="size-guide"
		>
			<section className="space-y-12">
				{/* Interactive Calculator */}
				<div className="bg-gradient-to-br from-luxury-darker to-luxury-dark p-8 md:p-12 rounded-[2rem] border border-luxury-gold/20 shadow-2xl relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
					<div className="relative z-10">
						<h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
							<Ruler className="text-luxury-gold w-8 h-8" />
							Máy tính Size Mặt Đồng Hồ
						</h2>
						<p className="text-luxury-text-muted mb-8 max-w-lg">
							Nhập chu vi cổ tay của bạn (đo sát bằng thước dây) để nhận gợi ý kích thước mặt đồng hồ phù hợp nhất.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 mb-10">
							<div className="relative flex-1">
								<input
									type="number"
									value={wristSize}
									onChange={(e) => setWristSize(e.target.value)}
									placeholder="Chu vi cổ tay (cm)..."
									className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-luxury-gold transition-all"
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold font-bold">cm</span>
							</div>
							<button 
								onClick={() => calculateSize(wristSize)}
								className="bg-luxury-gold text-luxury-dark font-bold px-8 py-4 rounded-xl hover:bg-white transition-all shadow-lg"
							>
								TÍNH TOÁN NGAY
							</button>
						</div>

						{recommendation && (
							<div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-luxury-fade-in">
								<div className="flex items-start gap-4">
									<CheckCircle2 className="text-emerald-500 w-6 h-6 mt-1" />
									<div>
										<p className="text-luxury-gold uppercase text-xs tracking-widest font-bold mb-2">Gợi ý dành cho bạn</p>
										<h3 className="text-3xl font-bold mb-3">Đường kính: {recommendation.dial}</h3>
										<p className="text-luxury-text-muted text-sm leading-relaxed italic mb-1">Phong cách: {recommendation.style}</p>
										<p className="text-white/80 text-sm leading-relaxed">{recommendation.tip}</p>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-10">
					<div className="space-y-6">
						<h3 className="text-xl font-bold flex items-center gap-2">
							<Watch className="text-luxury-gold" />
							Cách đo chu vi cổ tay
						</h3>
						<div className="space-y-4 text-gray-400 text-sm leading-relaxed">
							<p><span className="text-luxury-gold font-bold">Bước 1:</span> Chuẩn bị một sợi thước dây hoặc một dải giấy dài.</p>
							<p><span className="text-luxury-gold font-bold">Bước 2:</span> Quấn sát (không quá chặt) quanh vị trí xương cổ tay nơi bạn thường đeo đồng hồ.</p>
							<p><span className="text-luxury-gold font-bold">Bước 3:</span> Đánh dấu điểm giao nhau và đo chiều dài bằng thước kẻ nếu dùng giấy.</p>
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border shadow-inner">
						<h4 className="font-bold mb-4 flex items-center gap-2">
							<Info className="text-luxury-gold w-4 h-4" />
							Lời khuyên từ chuyên gia
						</h4>
						<p className="text-xs text-luxury-text-muted leading-loose">
							Tỷ lệ vàng là khi đường kính mặt đồng hồ chiếm từ **60% đến 75%** bề mặt cổ tay. Nếu bạn có cổ tay mỏng nhưng thích phong cách mạnh mẽ, có thể chọn các mẫu Sport có độ dày (thickness) thấp dể tránh cảm giác nặng nề.
						</p>
					</div>
				</div>
			</section>
		</PolicyPageLayout>
	);
};

export default SizeGuidePage;
