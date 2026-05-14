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
			setRecommendation({ dial: "28mm - 33mm", style: "Elegant / Petit", tip: "Cá»• tay máº£nh, cĂ¡c máº«u máº·t nhá» sáº½ táº¡o sá»± thanh thoĂ¡t tá»‘i Æ°u." });
		} else if (val >= 14 && val < 16) {
			setRecommendation({ dial: "34mm - 38mm", style: "Classic / Unisex", tip: "KĂ­ch thÆ°á»›c lĂ½ tÆ°á»Ÿng cho sá»± cĂ¢n báº±ng vĂ  tinh táº¿." });
		} else if (val >= 16 && val < 18) {
			setRecommendation({ dial: "39mm - 42mm", style: "Modern / Versatile", tip: "KĂ­ch thÆ°á»›c phá»• biáº¿n nháº¥t, phĂ¹ há»£p vá»›i háº§u háº¿t cĂ¡c dĂ²ng Rolex, Omega." });
		} else {
			setRecommendation({ dial: "43mm - 46mm+", style: "Sport / Bold", tip: "Cá»• tay lá»›n, nhá»¯ng máº«u máº·t to sáº½ tĂ´n lĂªn váº» máº¡nh máº½ vĂ  Ä‘áº³ng cáº¥p." });
		}
	};

	return (
		<PolicyPageLayout 
			title="HÆ°á»›ng dáº«n chá»n size" 
			description="CĂ´ng cá»¥ tĂ­nh toĂ¡n size Ä‘á»“ng há»“ tá»« chu vi cá»• tay vĂ  cĂ¡c máº¹o chá»n Ä‘á»“ng há»“ phĂ¹ há»£p vá»›i vĂ³c dĂ¡ng."
			activeId="size-guide"
		>
			<section className="space-y-12 bg-gradient-to-br from-white to-gray-100 p-6 rounded-3xl border border-gray-200 shadow-lg">
				<div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.18),_transparent_45%)] pointer-events-none"></div>
				{/* Interactive Calculator */}
				<div className="bg-white p-8 md:p-12 rounded-[2rem] border border-luxury-border shadow-xl relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-luxury-gold/5 rounded-full -translate-y-16 translate-x-16 blur-3xl"></div>
					<div className="relative z-10">
						<h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
							<Ruler className="text-luxury-gold w-8 h-8" />
							MĂ¡y tĂ­nh Size Máº·t Äá»“ng Há»“
						</h2>
						<p className="text-luxury-text-muted mb-8 max-w-lg">
							Nháº­p chu vi cá»• tay cá»§a báº¡n (Ä‘o sĂ¡t báº±ng thÆ°á»›c dĂ¢y) Ä‘á»ƒ nháº­n gá»£i Ă½ kĂ­ch thÆ°á»›c máº·t Ä‘á»“ng há»“ phĂ¹ há»£p nháº¥t.
						</p>

						<div className="flex flex-col sm:flex-row gap-4 mb-10">
							<div className="relative flex-1">
								<input
									type="number"
									value={wristSize}
									onChange={(e) => setWristSize(e.target.value)}
									placeholder="Chu vi cá»• tay (cm)..."
									className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-12 py-4 text-luxury-dark focus:outline-none focus:border-luxury-gold transition-all"
								/>
								<span className="absolute right-4 top-1/2 -translate-y-1/2 text-luxury-gold font-bold">cm</span>
							</div>
							<button 
								onClick={() => calculateSize(wristSize)}
								className="bg-luxury-gold text-luxury-dark font-bold px-8 py-4 rounded-xl hover:bg-white transition-all shadow-lg"
							>
								TĂNH TOĂN NGAY
							</button>
						</div>

						{recommendation && (
							<div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-luxury-fade-in">
								<div className="flex items-start gap-4">
									<CheckCircle2 className="text-luxury-gold w-6 h-6 mt-1" />
									<div>
										<p className="text-luxury-gold uppercase text-xs tracking-widest font-bold mb-2">Gá»£i Ă½ dĂ nh cho báº¡n</p>
										<h3 className="text-3xl font-bold mb-3">ÄÆ°á»ng kĂ­nh: {recommendation.dial}</h3>
										<p className="text-luxury-text-muted text-sm leading-relaxed italic mb-1">Phong cĂ¡ch: {recommendation.style}</p>
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
							CĂ¡ch Ä‘o chu vi cá»• tay
						</h3>
						<div className="space-y-4 text-gray-400 text-sm leading-relaxed">
							<p><span className="text-luxury-gold font-bold">BÆ°á»›c 1:</span> Chuáº©n bá»‹ má»™t sá»£i thÆ°á»›c dĂ¢y hoáº·c má»™t dáº£i giáº¥y dĂ i.</p>
							<p><span className="text-luxury-gold font-bold">BÆ°á»›c 2:</span> Quáº¥n sĂ¡t (khĂ´ng quĂ¡ cháº·t) quanh vá»‹ trĂ­ xÆ°Æ¡ng cá»• tay nÆ¡i báº¡n thÆ°á»ng Ä‘eo Ä‘á»“ng há»“.</p>
							<p><span className="text-luxury-gold font-bold">BÆ°á»›c 3:</span> ÄĂ¡nh dáº¥u Ä‘iá»ƒm giao nhau vĂ  Ä‘o chiá»u dĂ i báº±ng thÆ°á»›c káº» náº¿u dĂ¹ng giáº¥y.</p>
						</div>
					</div>

					<div className="bg-gray-50 dark:bg-white/5 p-6 rounded-2xl border border-luxury-border shadow-inner">
						<h4 className="font-bold mb-4 flex items-center gap-2">
							<Info className="text-luxury-gold w-4 h-4" />
							Lá»i khuyĂªn tá»« chuyĂªn gia
						</h4>
						<p className="text-xs text-luxury-text-muted leading-loose">
							Tá»· lá»‡ vĂ ng lĂ  khi Ä‘Æ°á»ng kĂ­nh máº·t Ä‘á»“ng há»“ chiáº¿m tá»« **60% Ä‘áº¿n 75%** bá» máº·t cá»• tay. Náº¿u báº¡n cĂ³ cá»• tay má»ng nhÆ°ng thĂ­ch phong cĂ¡ch máº¡nh máº½, cĂ³ thá»ƒ chá»n cĂ¡c máº«u Sport cĂ³ Ä‘á»™ dĂ y (thickness) tháº¥p dá»ƒ trĂ¡nh cáº£m giĂ¡c náº·ng ná».
						</p>
					</div>
				</div>
			</section>
		</PolicyPageLayout>
	);
};

export default SizeGuidePage;

