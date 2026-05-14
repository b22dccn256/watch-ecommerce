import PolicyPageLayout from "../components/PolicyPageLayout";

const PrivacyPolicyPage = () => {
	return (
		<PolicyPageLayout 
			title="ChĂ­nh sĂ¡ch báº£o máº­t" 
			description="Cam káº¿t báº£o máº­t thĂ´ng tin cĂ¡ nhĂ¢n khĂ¡ch hĂ ng táº¡i Luxury Watch Store theo tiĂªu chuáº©n quá»‘c táº¿."
			activeId="privacy"
		>
			<div className="space-y-8 text-gray-600 dark:text-luxury-text-muted">
				<div className="rounded-2xl border border-black/5 dark:border-white/5 bg-white/80 dark:bg-white/5 p-5 shadow-sm">
					<p className="hero-kicker text-[10px] font-semibold text-luxury-gold mb-2">Last update</p>
					<p className="italic">Cáº­p nháº­t láº§n cuá»‘i: 16 thĂ¡ng 03, 2026</p>
				</div>
				
				<section className="space-y-4 border-l border-black/10 dark:border-white/10 pl-5 md:pl-7">
					<h3 className="hero-title text-xl font-bold text-black dark:text-white">1. Má»¥c Ä‘Ă­ch thu tháº­p thĂ´ng tin</h3>
					<p>ChĂºng tĂ´i thu tháº­p thĂ´ng tin cĂ¡ nhĂ¢n cá»§a báº¡n Ä‘á»ƒ há»— trá»£ quĂ¡ trĂ¬nh Ä‘áº·t hĂ ng, giao hĂ ng vĂ  chÄƒm sĂ³c khĂ¡ch hĂ ng tá»‘t hÆ¡n. CĂ¡c thĂ´ng tin bao gá»“m: Há» tĂªn, Email, Sá»‘ Ä‘iá»‡n thoáº¡i, Äá»‹a chá»‰ giao hĂ ng.</p>
				</section>

				<section className="space-y-4 md:ml-8">
					<h3 className="hero-title text-xl font-bold text-black dark:text-white">2. Pháº¡m vi sá»­ dá»¥ng thĂ´ng tin</h3>
					<p>ThĂ´ng tin cá»§a báº¡n sáº½ Ä‘Æ°á»£c sá»­ dá»¥ng ná»™i bá»™ cho cĂ¡c má»¥c Ä‘Ă­ch:</p>
					<ul className="list-disc pl-6 space-y-2">
						<li>XĂ¡c nháº­n Ä‘Æ¡n hĂ ng vĂ  liĂªn há»‡ giao nháº­n.</li>
						<li>Gá»­i thĂ´ng bĂ¡o vá» cĂ¡c chÆ°Æ¡ng trĂ¬nh khuyáº¿n mĂ£i (náº¿u báº¡n Ä‘Äƒng kĂ½).</li>
						<li>NĂ¢ng cao cháº¥t lÆ°á»£ng dá»‹ch vá»¥ vĂ  cĂ¡ nhĂ¢n hĂ³a tráº£i nghiá»‡m ngÆ°á»i dĂ¹ng.</li>
					</ul>
				</section>

				<section className="space-y-4 border-l border-black/10 dark:border-white/10 pl-5 md:pl-7">
					<h3 className="hero-title text-xl font-bold text-black dark:text-white">3. Cam káº¿t báº£o máº­t</h3>
					<p>Luxury Watch Store cam káº¿t khĂ´ng bĂ¡n, chia sáº» hay trao Ä‘á»•i thĂ´ng tin cĂ¡ nhĂ¢n cá»§a khĂ¡ch hĂ ng cho báº¥t ká»³ bĂªn thá»© ba nĂ o khi chÆ°a cĂ³ sá»± Ä‘á»“ng Ă½ cá»§a quĂ½ khĂ¡ch, ngoáº¡i trá»« cĂ¡c Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn Ä‘á»‘i tĂ¡c.</p>
					<p>ChĂºng tĂ´i sá»­ dá»¥ng cĂ¡c cĂ´ng nghá»‡ mĂ£ hĂ³a SSL tiĂªu chuáº©n Ä‘á»ƒ báº£o vá»‡ dá»¯ liá»‡u truyá»n táº£i trĂªn há»‡ thá»‘ng.</p>
				</section>

				<section className="space-y-4 md:ml-8">
					<h3 className="hero-title text-xl font-bold text-black dark:text-white">4. Quyá»n lá»£i cá»§a khĂ¡ch hĂ ng</h3>
					<p>QuĂ½ khĂ¡ch cĂ³ quyá»n yĂªu cáº§u truy cáº­p, chá»‰nh sá»­a hoáº·c xĂ³a thĂ´ng tin cĂ¡ nhĂ¢n cá»§a mĂ¬nh báº¥t ká»³ lĂºc nĂ o báº±ng cĂ¡ch Ä‘Äƒng nháº­p vĂ o tĂ i khoáº£n hoáº·c liĂªn há»‡ trá»±c tiáº¿p vá»›i chĂºng tĂ´i qua Hotline.</p>
				</section>
			</div>
		</PolicyPageLayout>
	);
};

export default PrivacyPolicyPage;

