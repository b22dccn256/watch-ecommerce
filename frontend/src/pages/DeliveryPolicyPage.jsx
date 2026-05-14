import PolicyPageLayout from "../components/PolicyPageLayout";
import { Truck, Clock, Shield, Globe } from "lucide-react";

const DeliveryPolicyPage = () => {
	const shippingMethods = [
		{
			title: "Giao hĂ ng Há»a tá»‘c",
			time: "2 - 4 giá» lĂ m viá»‡c",
			price: "50.000Ä‘ (Miá»…n phĂ­ cho Ä‘Æ¡n > 10tr)",
			desc: "Ăp dá»¥ng cho khu vá»±c ná»™i thĂ nh HĂ  Ná»™i vĂ  TP. HCM.",
			icon: Clock
		},
		{
			title: "Giao hĂ ng TiĂªu chuáº©n",
			time: "2 - 5 ngĂ y lĂ m viá»‡c",
			price: "Miá»…n phĂ­ toĂ n quá»‘c",
			desc: "Ăp dá»¥ng cho má»i tá»‰nh thĂ nh trĂªn toĂ n lĂ£nh thá»• Viá»‡t Nam.",
			icon: Truck
		},
		{
			title: "Giao hĂ ng Quá»‘c táº¿",
			time: "7 - 14 ngĂ y lĂ m viá»‡c",
			price: "TĂ­nh theo biá»ƒu phĂ­ FedEx/DHL",
			desc: "Há»— trá»£ váº­n chuyá»ƒn Ä‘áº¿n hÆ¡n 200 quá»‘c gia vĂ  vĂ¹ng lĂ£nh thá»•.",
			icon: Globe
		}
	];

	return (
		<PolicyPageLayout 
			title="ChĂ­nh sĂ¡ch giao hĂ ng" 
			description="ThĂ´ng tin chi tiáº¿t vá» phĂ­ váº­n chuyá»ƒn, thá»i gian giao hĂ ng vĂ  báº£o hiá»ƒm hĂ ng hĂ³a táº¡i Luxury Watch Store."
			activeId="delivery"
		>
			<section className="space-y-10">
				<p className="max-w-3xl text-lg text-gray-600 dark:text-luxury-text-muted leading-relaxed">
					Táº¡i <span className="text-luxury-gold font-bold">Luxury Watch Store</span>, chĂºng tĂ´i hiá»ƒu ráº±ng viá»‡c nháº­n Ä‘Æ°á»£c chiáº¿c Ä‘á»“ng há»“ yĂªu thĂ­ch má»™t cĂ¡ch an toĂ n vĂ  nhanh chĂ³ng lĂ  Æ°u tiĂªn hĂ ng Ä‘áº§u cá»§a quĂ½ khĂ¡ch. ChĂºng tĂ´i há»£p tĂ¡c vá»›i cĂ¡c Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn hĂ ng Ä‘áº§u Ä‘á»ƒ Ä‘áº£m báº£o má»i kiá»‡n hĂ ng Ä‘á»u Ä‘Æ°á»£c nĂ¢ng niu.
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
						Báº£o hiá»ƒm vĂ  Kiá»ƒm tra hĂ ng hĂ³a
					</h2>
					<ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-luxury-text-muted">
						<li><strong>100% Báº£o hiá»ƒm:</strong> Má»i Ä‘Æ¡n hĂ ng Ä‘á»u Ä‘Æ°á»£c mua báº£o hiá»ƒm trĂ¡ch nhiá»‡m 100% giĂ¡ trá»‹ sáº£n pháº©m trong suá»‘t quĂ¡ trĂ¬nh váº­n chuyá»ƒn.</li>
						<li><strong>Äá»“ng kiá»ƒm:</strong> QuĂ½ khĂ¡ch hoĂ n toĂ n cĂ³ quyá»n má»Ÿ gĂ³i hĂ ng vĂ  kiá»ƒm tra hĂ¬nh thá»©c sáº£n pháº©m trÆ°á»›c khi thanh toĂ¡n vĂ  nháº­n hĂ ng.</li>
						<li><strong>ÄĂ³ng gĂ³i tiĂªu chuáº©n:</strong> Sáº£n pháº©m Ä‘Æ°á»£c Ä‘áº·t trong há»™p chá»‘ng sá»‘c chuyĂªn dá»¥ng, dĂ¡n tem niĂªm phong Luxury Watch Ä‘á»ƒ Ä‘áº£m báº£o tĂ­nh nguyĂªn báº£n.</li>
					</ul>
				</div>
			</section>
		</PolicyPageLayout>
	);
};

export default DeliveryPolicyPage;

