import { useState } from "react";
import PolicyPageLayout from "../components/PolicyPageLayout";
import { Search, Package, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
			description="Nhập mã đơn hàng và email để xem trạng thái hiện tại, hành trình vận chuyển và thông tin xác nhận."
			activeId="order-lookup"
		>
			<div className="max-w-2xl py-8">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
					<div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
						<div className="flex items-center gap-3 mb-2">
							<Package className="w-5 h-5 text-luxury-gold" />
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Tra cứu nhanh</p>
						</div>
						<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Xem trạng thái đơn, không cần vào tài khoản.</p>
					</div>
					<div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
						<div className="flex items-center gap-3 mb-2">
							<CheckCircle2 className="w-5 h-5 text-luxury-gold" />
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Theo dõi đơn</p>
						</div>
						<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Mã theo dõi sẽ xuất hiện sau khi thanh toán thành công.</p>
					</div>
					<div className="rounded-xl border border-gray-200 dark:border-luxury-border bg-white dark:bg-white/5 p-4">
						<div className="flex items-center gap-3 mb-2">
							<AlertCircle className="w-5 h-5 text-luxury-gold" />
							<p className="text-sm font-semibold text-gray-900 dark:text-white">Hỗ trợ nhanh</p>
						</div>
						<p className="text-xs text-gray-500 dark:text-luxury-text-muted leading-relaxed">Nếu sai email, hệ thống sẽ không tìm thấy đơn.</p>
					</div>
				</div>

				<form onSubmit={handleLookup} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-luxury-border p-5 md:p-6 rounded-2xl shadow-sm space-y-5">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Mã đơn hàng *</label>
							<div className="relative">
								<input
									type="text"
									required
									value={orderNumber}
									onChange={(e) => setOrderNumber(e.target.value)}
									placeholder="Ví dụ: ORD-123456"
									className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl pl-12 pr-4 py-4 text-sm focus:border-luxury-gold outline-none transition"
								/>
								<Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email nhận hàng *</label>
							<input
								type="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder="example@gmail.com"
								className="w-full bg-gray-50 dark:bg-luxury-dark border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-4 text-sm focus:border-luxury-gold outline-none transition"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-luxury-gold text-luxury-dark font-bold py-4 rounded-xl hover:bg-luxury-gold-light transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
					>
						{loading ? "ĐANG TÌM KIẾM..." : (
							<>
								TRA CỨU NGAY
								<ArrowRight className="w-5 h-5" />
							</>
						)}
					</button>

					<div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-luxury-dark/60 border border-gray-200 dark:border-luxury-border rounded-xl">
						<AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
						<p className="text-xs text-gray-600 dark:text-luxury-text-muted leading-relaxed">
							Mã đơn hàng đã được gửi vào email của bạn ngay sau khi đặt hàng thành công. Nếu không tìm thấy, vui lòng kiểm tra hộp thư Spam hoặc liên hệ Hotline 1900 8888.
						</p>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
						<Link
							to="/profile"
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-luxury-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
						>
							Xem lịch sử đơn
						</Link>
						<Link
							to="/contact"
							className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-luxury-border px-4 py-3 text-sm font-medium text-gray-700 dark:text-luxury-text-muted hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
						>
							Liên hệ hỗ trợ
						</Link>
					</div>
				</form>
			</div>
		</PolicyPageLayout>
	);
};

export default OrderLookupPage;
