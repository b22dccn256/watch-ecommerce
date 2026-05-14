import { useState } from "react";
import PolicyPageLayout from "../components/PolicyPageLayout";
import { Search, Package, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import Input from "../components/ui/Input";

const OrderLookupPage = () => {
	const [orderNumber, setOrderNumber] = useState("");
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleLookup = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await axios.post("/orders/lookup", { orderNumber, email });
			const { trackingToken } = res.data;
			toast.success("ÄĂ£ tĂ¬m tháº¥y Ä‘Æ¡n hĂ ng!");
			navigate(`/order-tracking/${trackingToken}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "KhĂ´ng tĂ¬m tháº¥y Ä‘Æ¡n hĂ ng khá»›p vá»›i thĂ´ng tin cung cáº¥p.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<PolicyPageLayout 
			title="Tra cá»©u Ä‘Æ¡n hĂ ng" 
			description="Nháº­p mĂ£ Ä‘Æ¡n hĂ ng vĂ  email Ä‘á»ƒ xem tráº¡ng thĂ¡i hiá»‡n táº¡i, hĂ nh trĂ¬nh váº­n chuyá»ƒn vĂ  thĂ´ng tin xĂ¡c nháº­n."
			activeId="order-lookup"
		>
			<div className="max-w-3xl py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
					<div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
						<div className="flex items-center gap-3 mb-2">
							<Package className="w-5 h-5 text-luxury-gold" />
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Tra cá»©u nhanh</p>
						</div>
						<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Xem tráº¡ng thĂ¡i Ä‘Æ¡n, khĂ´ng cáº§n vĂ o tĂ i khoáº£n.</p>
					</div>
					<div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
						<div className="flex items-center gap-3 mb-2">
							<CheckCircle2 className="w-5 h-5 text-luxury-gold" />
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Theo dĂµi Ä‘Æ¡n</p>
						</div>
						<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">MĂ£ theo dĂµi sáº½ xuáº¥t hiá»‡n sau khi thanh toĂ¡n thĂ nh cĂ´ng.</p>
					</div>
					<div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
						<div className="flex items-center gap-3 mb-2">
							<AlertCircle className="w-5 h-5 text-luxury-gold" />
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Há»— trá»£ nhanh</p>
						</div>
						<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Náº¿u sai email, há»‡ thá»‘ng sáº½ khĂ´ng tĂ¬m tháº¥y Ä‘Æ¡n.</p>
					</div>
				</div>

				<form onSubmit={handleLookup} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-luxury-border p-5 md:p-6 rounded-2xl shadow-sm space-y-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="relative">
							<Input
								label="MĂ£ Ä‘Æ¡n hĂ ng *"
								type="text"
								required
								value={orderNumber}
								onChange={(e) => setOrderNumber(e.target.value)}
								placeholder="VĂ­ dá»¥: ORD-123456"
								className="pl-12"
							/>
							<Search className="absolute left-4 top-[2.35rem] text-gray-400 w-4 h-4" />
						</div>

						<Input
							label="Email nháº­n hĂ ng *"
							type="email"
							required
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="example@gmail.com"
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="btn-base btn-primary h-11 w-full"
					>
						{loading ? "ÄANG TĂŒM KIáº¾M..." : (
							<>
								TRA Cá»¨U NGAY
								<ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>

					<div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-luxury-dark/60 border border-gray-200 dark:border-luxury-border rounded-xl">
						<AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
						<p className="text-xs text-gray-600 dark:text-luxury-text-muted leading-relaxed">
							MĂ£ Ä‘Æ¡n hĂ ng Ä‘Ă£ Ä‘Æ°á»£c gá»­i vĂ o email cá»§a báº¡n ngay sau khi Ä‘áº·t hĂ ng thĂ nh cĂ´ng. Náº¿u khĂ´ng tĂ¬m tháº¥y, vui lĂ²ng kiá»ƒm tra há»™p thÆ° Spam hoáº·c liĂªn há»‡ Hotline 1900 8888.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
						<Link
							to="/profile"
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-luxury-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
						>
							Xem lá»‹ch sá»­ Ä‘Æ¡n
						</Link>
						<Link
							to="/contact"
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-luxury-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
						>
							LiĂªn há»‡ há»— trá»£
						</Link>
					</div>
				</form>
			</div>
		</PolicyPageLayout>
	);
};

export default OrderLookupPage;

