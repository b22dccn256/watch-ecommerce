import { ArrowRight, Crown, Gem, Globe2, ShieldCheck, Star } from "lucide-react";
import { Link } from "react-router-dom";

const BRAND_HOUSES = [
	{
		name: "Rolex Heritage",
		tagline: "Biểu tượng của độ chính xác, địa vị và di sản.",
		description: "Những thiết kế mang tính biểu tượng, được tuyển chọn cho khách hàng yêu sự chuẩn mực và giá trị bền vững.",
		accent: "from-[color:var(--color-gold)]/25 to-black/5",
		link: "/catalog?brand=Rolex",
	},
	{
		name: "Omega Atelier",
		tagline: "Tinh thần thể thao, công nghệ và độ tin cậy hiện đại.",
		description: "Dành cho người dùng cần một chiếc đồng hồ cân bằng giữa hiệu năng, lịch sử và tính ứng dụng hàng ngày.",
		accent: "from-gray-500/20 to-black/5",
		link: "/catalog?brand=Omega",
	},
	{
		name: "Patek Philippe House",
		tagline: "Sự tinh xảo dành cho giới sưu tầm.",
		description: "Một lựa chọn giàu tính sưu tầm, phù hợp với khách hàng tìm kiếm sự tinh vi và tính biểu tượng rất cao.",
		accent: "from-gray-600/20 to-black/5",
		link: "/catalog?brand=Patek+Philippe",
	},
	{
		name: "Audemars Piguet Studio",
		tagline: "Ngôn ngữ thiết kế táo bạo, hiện đại và có cá tính.",
		description: "Phù hợp với khách hàng muốn một tuyên ngôn phong cách rõ ràng mà vẫn giữ được chất haute horlogerie.",
		accent: "from-[color:var(--color-gold)]/18 to-black/5",
		link: "/catalog?brand=Audemars+Piguet",
	},
];

const FEATURE_POINTS = [
	{ icon: Crown, title: "Tuyển chọn chuẩn boutique", desc: "Chỉ hiển thị các thương hiệu và bộ sưu tập phù hợp với định vị của cửa hàng." },
	{ icon: Gem, title: "Phong cách sang trọng", desc: "Mỗi thương hiệu được giới thiệu theo ngôn ngữ của một maison cao cấp." },
	{ icon: ShieldCheck, title: "Chính hãng & bảo hành", desc: "Tập trung vào độ tin cậy, dịch vụ và bảo hành dài hạn." },
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
							Những thương hiệu được tuyển chọn theo chuẩn sang trọng.
						</h1>
						<p className="text-base md:text-lg text-gray-600 dark:text-luxury-text-muted leading-relaxed max-w-2xl">
							Đây là không gian riêng để giới thiệu tinh thần từng maison, giúp khách hàng hiểu nhanh thương hiệu nào hợp với phong cách, ngân sách và mục đích sử dụng của mình.
						</p>
						<div className="mt-8 flex flex-col sm:flex-row gap-3">
							<Link to="/catalog" className="inline-flex items-center justify-center gap-2 rounded-full bg-luxury-gold px-6 py-3 font-semibold text-luxury-dark hover:bg-luxury-gold-light transition-colors">
								Xem toàn bộ sản phẩm <ArrowRight className="w-4 h-4" />
							</Link>
							<Link to="/order-lookup" className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 dark:border-white/15 px-6 py-3 font-semibold text-gray-700 dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-colors">
								Tra cứu đơn hàng
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
							<p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-luxury-text-muted font-bold mb-2">Thương hiệu nổi bật</p>
							<h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Bốn maison tiêu biểu để bắt đầu khám phá</h2>
						</div>
						<p className="text-sm text-gray-500 dark:text-luxury-text-muted max-w-xl">
							Nhấn vào từng thương hiệu để đi thẳng tới bộ lọc sản phẩm tương ứng.
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
										Khám phá thương hiệu <ArrowRight className="w-4 h-4" />
									</span>
								</div>
							</Link>
						))}
					</div>
				</section>

				<section className="rounded-[2rem] border border-black/5 dark:border-white/10 bg-white/85 dark:bg-white/5 p-6 md:p-8 shadow-sm">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
						<div>
							<p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 dark:text-luxury-text-muted font-bold mb-2">Lời khuyên chọn thương hiệu</p>
							<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chọn theo phong cách, không chỉ theo tên</h2>
							<p className="text-sm text-gray-600 dark:text-luxury-text-muted max-w-2xl leading-relaxed">
								Nếu bạn muốn một trang “thương hiệu” thật sự riêng biệt, đây là nơi để kể câu chuyện, định vị và dẫn khách hàng sang bộ sưu tập phù hợp thay vì ném thẳng về catalog.
							</p>
						</div>
						<div className="flex items-center gap-3 text-sm text-gray-600 dark:text-luxury-text-muted">
							<Globe2 className="w-5 h-5 text-luxury-gold" />
							<div>
								<p className="font-semibold text-gray-900 dark:text-white">Luxury Watch House</p>
								<p>Chọn thương hiệu như chọn một phong cách sống.</p>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
};

export default BrandsPage;