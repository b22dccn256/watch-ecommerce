import { useState } from "react";
import PolicyPageLayout from "../components/PolicyPageLayout";
import { Search, Package, ArrowRight, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";

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
			toast.success("Đã tìm thấy đơn hàng!");
			navigate(`/order-tracking/${trackingToken}`);
		} catch (error) {
			toast.error(error.response?.data?.message || "Không tìm thấy đơn hàng khớp với thông tin cung cấp.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<PolicyPageLayout 
			title="Tra cứu đơn hàng" 
			description="Kiểm tra trạng thái và hành trình đơn hàng của bạn một cách nhanh chóng và bảo mật."
			activeId="order-lookup"
		>
			<div className="max-w-2xl mx-auto py-10">
				<div className="text-center mb-12">
					<div className="inline-flex items-center justify-center w-20 h-20 bg-luxury-gold/10 rounded-full mb-6 text-luxury-gold">
						<Package className="w-10 h-10" />
					</div>
					<h2 className="text-3xl font-bold mb-4">Theo dõi hành trình tuyệt tác</h2>
					<p className="text-luxury-text-muted">
						Vui lòng nhập Mã đơn hàng và Email đặt hàng để kiểm tra trạng thái vận chuyển thời gian thực.
					</p>
				</div>

				<form onSubmit={handleLookup} className="bg-gray-50 dark:bg-white/5 border border-luxury-border p-8 rounded-3xl shadow-xl space-y-6">
					<div className="space-y-4">
						<div className="space-y-1">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã đơn hàng *</label>
							<div className="relative">
								<input
									type="text"
									required
									value={orderNumber}
									onChange={(e) => setOrderNumber(e.target.value)}
									placeholder="Ví dụ: ORD-123456"
									className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl pl-12 pr-4 py-4 text-sm focus:border-luxury-gold outline-none transition"
								/>
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email nhận hàng *</label>
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="example@gmail.com"
								className="w-full bg-white dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-4 text-sm focus:border-luxury-gold outline-none transition"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-luxury-gold text-luxury-dark font-bold py-5 rounded-xl hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
					>
						{loading ? "ĐANG TÌM KIẾM..." : (
							<>
								TRA CỨU NGAY
								<ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>

					<div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
						<AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
						<p className="text-xs text-blue-300 leading-relaxed">
							Mã đơn hàng đã được gửi vào email của bạn ngay sau khi đặt hàng thành công. Nếu không tìm thấy, vui lòng kiểm tra hộp thư Spam hoặc liên hệ Hotline 1900 8888.
						</p>
					</div>
				</form>
			</div>
		</PolicyPageLayout>
	);
};

export default OrderLookupPage;
