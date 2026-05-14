import { ArrowRight, Crown, Gem, Globe2, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";

const BRAND_HOUSES = [
	{
		name: "Rolex Heritage",
		tagline: "Biá»ƒu tÆ°á»£ng cá»§a Ä‘á»™ chĂ­nh xĂ¡c, Ä‘á»‹a vá»‹ vĂ  di sáº£n.",
		description: "Nhá»¯ng thiáº¿t káº¿ mang tĂ­nh biá»ƒu tÆ°á»£ng, Ä‘Æ°á»£c tuyá»ƒn chá»n cho khĂ¡ch hĂ ng yĂªu sá»± chuáº©n má»±c vĂ  giĂ¡ trá»‹ bá»n vá»¯ng.",
		accent: "from-[color:var(--color-gold)]/25 to-black/5",
		link: "/catalog?brand=Rolex",
	},
	{
		name: "Omega Atelier",
		tagline: "Tinh tháº§n thá»ƒ thao, cĂ´ng nghá»‡ vĂ  Ä‘á»™ tin cáº­y hiá»‡n Ä‘áº¡i.",
		description: "DĂ nh cho ngÆ°á»i dĂ¹ng cáº§n má»™t chiáº¿c Ä‘á»“ng há»“ cĂ¢n báº±ng giá»¯a hiá»‡u nÄƒng, lá»‹ch sá»­ vĂ  tĂ­nh á»©ng dá»¥ng hĂ ng ngĂ y.",
		accent: "from-gray-500/20 to-black/5",
		link: "/catalog?brand=Omega",
	},
	{
		name: "Patek Philippe House",
		tagline: "Sá»± tinh xáº£o dĂ nh cho giá»›i sÆ°u táº§m.",
		description: "Má»™t lá»±a chá»n giĂ u tĂ­nh sÆ°u táº§m, phĂ¹ há»£p vá»›i khĂ¡ch hĂ ng tĂ¬m kiáº¿m sá»± tinh vi vĂ  tĂ­nh biá»ƒu tÆ°á»£ng ráº¥t cao.",
		accent: "from-gray-600/20 to-black/5",
		link: "/catalog?brand=Patek+Philippe",
	},
	{
		name: "Audemars Piguet Studio",
		tagline: "NgĂ´n ngá»¯ thiáº¿t káº¿ tĂ¡o báº¡o, hiá»‡n Ä‘áº¡i vĂ  cĂ³ cĂ¡ tĂ­nh.",
		description: "PhĂ¹ há»£p vá»›i khĂ¡ch hĂ ng muá»‘n má»™t tuyĂªn ngĂ´n phong cĂ¡ch rĂµ rĂ ng mĂ  váº«n giá»¯ Ä‘Æ°á»£c cháº¥t haute horlogerie.",
		accent: "from-[color:var(--color-gold)]/18 to-black/5",
		link: "/catalog?brand=Audemars+Piguet",
	},
];

const FEATURE_POINTS = [
	{ icon: Crown, title: "Tuyá»ƒn chá»n chuáº©n boutique", desc: "Chá»‰ hiá»ƒn thá»‹ cĂ¡c thÆ°Æ¡ng hiá»‡u vĂ  bá»™ sÆ°u táº­p phĂ¹ há»£p vá»›i Ä‘á»‹nh vá»‹ cá»§a cá»­a hĂ ng." },
	{ icon: Gem, title: "Phong cĂ¡ch sang trá»ng", desc: "Má»—i thÆ°Æ¡ng hiá»‡u Ä‘Æ°á»£c giá»›i thiá»‡u theo ngĂ´n ngá»¯ cá»§a má»™t maison cao cáº¥p." },
	{ icon: ShieldCheck, title: "ChĂ­nh hĂ£ng & báº£o hĂ nh", desc: "Táº­p trung vĂ o Ä‘á»™ tin cáº­y, dá»‹ch vá»¥ vĂ  báº£o hĂ nh dĂ i háº¡n." },
];

const BrandsPage = () => {
	return (
		<div className="min-h-screen bg-[#f6f2ea] dark:bg-[#0f0c08] text-gray-900 dark:text-white pt-28 pb-20">
			<div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
				<section className="relative overflow-hidden rounded-[2rem] border border-black/5 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl shadow-xl p-8 md:p-12">
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.55),transparent_30%)] pointer-events-none" />
					<div className="relative max-w-3xl">
						<p className="text-[11px] uppercase tracking-[0.35em] text-luxury-gold font-bold mb-4">Brand House</p>
						<h1 className="text-4xl md:text-6xl font-bold leading-[1.02] tracking-tight mb-5 text-gray-900 dark:text-white">
							Nhá»¯ng thÆ°Æ¡ng hiá»‡u Ä‘Æ°á»£c tuyá»ƒn chá»n theo chuáº©n sang trá»ng.
						</h1>
						<p className="text-base md:text-lg text-gray-600 dark:text-luxury-text-muted leading-relaxed max-w-2xl">
							ÄĂ¢y lĂ  khĂ´ng gian riĂªng Ä‘á»ƒ giá»›i thiá»‡u tinh tháº§n tá»«ng maison, giĂºp khĂ¡ch hĂ ng hiá»ƒu nhanh thÆ°Æ¡ng hiá»‡u nĂ o há»£p vá»›i phong cĂ¡ch, ngĂ¢n sĂ¡ch vĂ  má»¥c Ä‘Ă­ch sá»­ dá»¥ng cá»§a mĂ¬nh.
						</p>
						<div className="mt-8 flex flex-col sm:flex-row gap-3">
							<Link to="/catalog" className="inline-flex items-center justify-center gap-2 rounded-full bg-luxury-gold px-6 py-3 font-semibold text-luxury-dark hover:bg-luxury-gold-light transition-colors">
								Xem toĂ n bá»™ sáº£n pháº©m <ArrowRight className="w-4 h-4" />
							</Link>
							<Link to="/order-lookup" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-white/15 px-6 py-3 font-semibold text-gray-700 dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
								Tra cá»©u Ä‘Æ¡n hĂ ng
							</Link>
						</div>
					</div>
				</section>

				<section className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{FEATURE_POINTS.map((item) => {
						const Icon = item.icon;
						return (
							<div key={item.title} className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/85 dark:bg-white/5 p-6 shadow-sm">
								<Icon className="w-6 h-6 text-luxury-gold mb-4" />
								<h2 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">{item.title}</h2>
								<p className="text-sm text-gray-600 dark:text-luxury-text-muted leading-relaxed">{item.desc}</p>
							</div>
						);
					})}
				</section>

				<section className="space-y-5">
					<div className="flex items-end justify-between gap-4 flex-wrap">
						<div>
							<p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-luxury-text-muted font-bold mb-2">ThÆ°Æ¡ng hiá»‡u ná»•i báº­t</p>
							<h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bá»‘n maison tiĂªu biá»ƒu Ä‘á»ƒ báº¯t Ä‘áº§u khĂ¡m phĂ¡</h2>
						</div>
						<p className="text-sm text-gray-500 dark:text-luxury-text-muted max-w-xl">
							Nháº¥n vĂ o tá»«ng thÆ°Æ¡ng hiá»‡u Ä‘á»ƒ Ä‘i tháº³ng tá»›i bá»™ lá»c sáº£n pháº©m tÆ°Æ¡ng á»©ng.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
						{BRAND_HOUSES.map((brand) => (
							<Link
								key={brand.name}
								to={brand.link}
								className="group relative overflow-hidden rounded-[1.75rem] border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 p-6 md:p-7 shadow-sm transition-transform hover:-translate-y-1"
							>
								<div className={`absolute inset-0 bg-gradient-to-br ${brand.accent} opacity-100`} />
								<div className="relative z-10">
									<div className="flex items-center justify-between gap-3 mb-4">
										<div className="inline-flex items-center gap-2 rounded-full border border-luxury-gold/20 bg-luxury-gold/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-luxury-gold">
											<Star className="w-3.5 h-3.5" />
											Maison
										</div>
										<Crown className="w-5 h-5 text-gray-400 group-hover:text-luxury-gold transition-colors" />
									</div>
									<h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{brand.name}</h3>
									<p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">{brand.tagline}</p>
									<p className="text-sm text-gray-600 dark:text-luxury-text-muted leading-relaxed mb-5">{brand.description}</p>
									<span className="inline-flex items-center gap-2 rounded-full bg-black/90 dark:bg-white/10 px-4 py-2 text-sm font-semibold text-white dark:text-white">
										KhĂ¡m phĂ¡ thÆ°Æ¡ng hiá»‡u <ArrowRight className="w-4 h-4" />
									</span>
								</div>
							</Link>
						))}
					</div>
				</section>

				<section className="rounded-[2rem] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-white/5 p-6 md:p-8 shadow-sm">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-luxury-text-muted font-bold mb-2">Lá»i khuyĂªn chá»n thÆ°Æ¡ng hiá»‡u</p>
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chá»n theo phong cĂ¡ch, khĂ´ng chá»‰ theo tĂªn</h2>
							<p className="text-sm text-gray-600 dark:text-luxury-text-muted max-w-2xl leading-relaxed">
								Náº¿u báº¡n muá»‘n má»™t trang â€œthÆ°Æ¡ng hiá»‡uâ€ tháº­t sá»± riĂªng biá»‡t, Ä‘Ă¢y lĂ  nÆ¡i Ä‘á»ƒ ká»ƒ cĂ¢u chuyá»‡n, Ä‘á»‹nh vá»‹ vĂ  dáº«n khĂ¡ch hĂ ng sang bá»™ sÆ°u táº­p phĂ¹ há»£p thay vĂ¬ nĂ©m tháº³ng vá» catalog.
							</p>
						</div>
						<div className="flex items-center gap-3 text-sm text-gray-600 dark:text-luxury-text-muted">
							<Globe2 className="w-5 h-5 text-luxury-gold" />
							<div>
								<p className="font-semibold text-gray-900 dark:text-white">Luxury Watch House</p>
								<p>Chá»n thÆ°Æ¡ng hiá»‡u nhÆ° chá»n má»™t phong cĂ¡ch sá»‘ng.</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default BrandsPage;
