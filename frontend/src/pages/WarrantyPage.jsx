import PolicyPageLayout from "../components/PolicyPageLayout";
import { ShieldCheck, RotateCcw, PenTool, CheckCircle } from "lucide-react";

const WarrantyPage = () => {
	const steps = [
		{ title: "LiĂªn há»‡", desc: "Gá»i Hotline hoáº·c gá»­i yĂªu cáº§u online.", icon: ShieldCheck },
		{ title: "Gá»­i hĂ ng", desc: "Äá»™i váº­n chuyá»ƒn Ä‘áº¿n láº¥y hĂ ng táº­n nÆ¡i miá»…n phĂ­.", icon: RotateCcw },
		{ title: "Kiá»ƒm tra", desc: "Ká»¹ thuáº­t viĂªn kiá»ƒm tra báº±ng mĂ¡y Ä‘o chuyĂªn dá»¥ng.", icon: PenTool },
		{ title: "HoĂ n táº¥t", desc: "Sá»­a chá»¯a hoáº·c Ä‘á»•i má»›i sáº£n pháº©m cho khĂ¡ch.", icon: CheckCircle },
	];

	return (
		<PolicyPageLayout 
			title="Äá»•i tráº£ & Báº£o hĂ nh" 
			description="ChĂ­nh sĂ¡ch báº£o hĂ nh 5 nÄƒm tiĂªu chuáº©n toĂ n cáº§u vĂ  quy trĂ¬nh Ä‘á»•i tráº£ linh hoáº¡t cá»§a Luxury Watch Store."
			activeId="warranty"
		>
			<section className="space-y-10">
				<div className="bg-luxury-gold/10 p-7 rounded-[2rem] border border-luxury-gold/20 shadow-sm max-w-3xl">
					<p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-3">Coverage</p>
					<h2 className="hero-title text-2xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
						<ShieldCheck className="w-8 h-8" />
						Äáº·c quyá»n Báº£o hĂ nh 5 NÄƒm
					</h2>
					<p className="text-gray-600 dark:text-luxury-text-muted leading-relaxed">
						Má»i chiáº¿c Ä‘á»“ng há»“ Ä‘Æ°á»£c bĂ¡n ra táº¡i Luxury Watch Store Ä‘á»u Ä‘i kĂ¨m gĂ³i <span className="font-bold">Báº£o hĂ nh VĂ ng 5 nÄƒm</span>. GĂ³i báº£o hĂ nh nĂ y bao gá»“m cáº£ cĂ¡c lá»—i do ngÆ°á»i dĂ¹ng (nhÆ° rÆ¡i vá»¡, vĂ o nÆ°á»›c) trong nÄƒm Ä‘áº§u tiĂªn sá»­ dá»¥ng.
					</p>
				</div>

				<div className="border-l border-black/10 dark:border-white/10 pl-5 md:pl-8">
					<h3 className="hero-title text-xl font-semibold mb-6 text-gray-900 dark:text-white">Quy trĂ¬nh Äá»•i tráº£ & Báº£o hĂ nh</h3>
					<div className="relative flex flex-col md:flex-row justify-between items-start gap-8">
						{steps.map((step, index) => (
							<div key={index} className="flex-1 flex flex-col items-center text-center group">
								<div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4 transition-all duration-300 group-hover:bg-luxury-gold group-hover:text-luxury-dark border border-luxury-border shadow-sm">
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
					<h3 className="hero-title text-xl font-semibold text-gray-900 dark:text-white">ChĂ­nh sĂ¡ch Äá»•i tráº£</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="p-4 border border-luxury-border rounded-2xl bg-white/60 dark:bg-white/5">
							<p className="font-semibold text-gray-900 dark:text-white mb-1">Äá»•i má»›i 30 ngĂ y</p>
							<p className="text-sm text-gray-600 dark:text-gray-400">Náº¿u lá»—i phĂ¡t sinh tá»« nhĂ  sáº£n xuáº¥t, khĂ¡ch hĂ ng Ä‘Æ°á»£c Ä‘á»•i sáº£n pháº©m má»›i cĂ¹ng model.</p>
						</div>
						<div className="p-4 border border-luxury-border rounded-2xl bg-white/60 dark:bg-white/5">
							<p className="font-semibold text-gray-900 dark:text-white mb-1">HoĂ n tiá»n 100%</p>
							<p className="text-sm text-gray-600 dark:text-gray-400">Trong vĂ²ng 7 ngĂ y Ä‘áº§u náº¿u quĂ½ khĂ¡ch khĂ´ng hĂ i lĂ²ng vá» tráº£i nghiá»‡m (sáº£n pháº©m pháº£i cĂ²n seal).</p>
						</div>
					</div>
				</div>

				<div className="border-t border-luxury-border pt-8">
					<p className="text-sm text-luxury-text-muted italic">
						* LÆ°u Ă½: ChĂ­nh sĂ¡ch nĂ y khĂ´ng Ă¡p dá»¥ng cho cĂ¡c sáº£n pháº©m trong chÆ°Æ¡ng trĂ¬nh thanh lĂ½ hoáº·c cĂ³ ghi chĂº riĂªng biá»‡t táº¡i thá»i Ä‘iá»ƒm mua hĂ ng.
					</p>
				</div>
			</section>
		</PolicyPageLayout>
	);
};

export default WarrantyPage;

