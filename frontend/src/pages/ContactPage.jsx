import { useState } from "react";
import PolicyPageLayout from "../components/PolicyPageLayout";
import { Mail, Phone, MapPin, Send, MessageSquare } from "lucide-react";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const ContactPage = () => {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		subject: "",
		message: "",
		_honeypot: "" // Anti-spam
	});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (formData._honeypot) return; // Silent fail for bots

		setLoading(true);
		try {
			const res = await axios.post("/contact", formData);
			toast.success(res.data.message);
			setFormData({ name: "", email: "", phone: "", subject: "", message: "", _honeypot: "" });
		} catch (error) {
			toast.error(error.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại sau.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<PolicyPageLayout 
			title="Liên hệ chúng tôi" 
			description="Kết nối với đội ngũ chuyên gia của Luxury Watch Store để được tư vấn và hỗ trợ tận tâm nhất."
			activeId="contact"
		>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
				{/* Contact Form */}
				<div className="space-y-8">
					<div className="space-y-4">
						<h2 className="text-2xl font-bold">Gửi lời nhắn cho chúng tôi</h2>
						<p className="text-luxury-text-muted text-sm leading-relaxed">
							Chúng tôi luôn sẵn lòng lắng nghe và giải đáp mọi thắc mắc của quý khách. Phản hồi sẽ được gửi qua email của bạn trong vòng 24 giờ làm việc.
						</p>
					</div>

					<form onSubmit={handleSubmit} className="space-y-4">
						{/* Honeypot field - Hidden from users */}
						<input 
							type="text" 
							name="_honeypot" 
							value={formData._honeypot} 
							onChange={(e) => setFormData({...formData, _honeypot: e.target.value})} 
							className="hidden" 
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-1">
								<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Họ và tên *</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={(e) => setFormData({...formData, name: e.target.value})}
									className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition"
									placeholder="Nguyễn Văn A"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email *</label>
								<input
									type="email"
									required
									value={formData.email}
									onChange={(e) => setFormData({...formData, email: e.target.value})}
									className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition"
									placeholder="example@gmail.com"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Chủ đề</label>
							<select
								value={formData.subject}
								onChange={(e) => setFormData({...formData, subject: e.target.value})}
								className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition"
							>
								<option value="">Chọn chủ đề...</option>
								<option value="Tư vấn sản phẩm">Tư vấn sản phẩm</option>
								<option value="Hỗ trợ đơn hàng">Hỗ trợ đơn hàng</option>
								<option value="Bảo hành & Đổi trả">Bảo hành & Đổi trả</option>
								<option value="Góp ý dịch vụ">Góp ý dịch vụ</option>
							</select>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Lời nhắn *</label>
							<textarea
								required
								rows={5}
								value={formData.message}
								onChange={(e) => setFormData({...formData, message: e.target.value})}
								className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition resize-none"
								placeholder="Bạn cần chúng tôi hỗ trợ điều gì?"
							></textarea>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-luxury-gold text-luxury-dark font-bold py-4 rounded-xl hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
						>
							{loading ? "ĐANG GỬI..." : (
								<>
									GỬI TIN NHẮN 
									<Send className="w-4 h-4" />
								</>
							)}
						</button>
					</form>
				</div>

				{/* Contact Information */}
				<div className="space-y-12 lg:pl-10">
					<div className="space-y-8">
						<h2 className="text-2xl font-bold">Thông tin liên lạc</h2>
						
						<div className="flex items-start gap-6 group">
							<div className="bg-luxury-gold/10 p-4 rounded-2xl text-luxury-gold transition group-hover:bg-luxury-gold group-hover:text-luxury-dark">
								<Phone className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase text-luxury-gold mb-1">Hotline 24/7</p>
								<p className="text-lg font-bold">1900 8888</p>
								<p className="text-xs text-gray-400 mt-1">Hỗ trợ kỹ thuật: 1900 9999</p>
							</div>
						</div>

						<div className="flex items-start gap-6 group">
							<div className="bg-luxury-gold/10 p-4 rounded-2xl text-luxury-gold transition group-hover:bg-luxury-gold group-hover:text-luxury-dark">
								<Mail className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase text-luxury-gold mb-1">Email Phản Hồi</p>
								<p className="text-lg font-bold">support@watchstore.com</p>
								<p className="text-xs text-gray-400 mt-1">Hợp tác: business@watchstore.com</p>
							</div>
						</div>

						<div className="flex items-start gap-6 group">
							<div className="bg-luxury-gold/10 p-4 rounded-2xl text-luxury-gold transition group-hover:bg-luxury-gold group-hover:text-luxury-dark">
								<MapPin className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase text-luxury-gold mb-1">Trung Tâm Trưng Bày</p>
								<p className="text-lg font-bold">123 Luxury Tower, Q1, TP. HCM</p>
								<p className="text-xs text-gray-400 mt-1">Chi nhánh HN: 456 Watch Plaza, Cầu Giấy</p>
							</div>
						</div>
					</div>

					<div className="rounded-3xl overflow-hidden border border-luxury-border h-64 grayscale hover:grayscale-0 transition-all duration-700">
						<iframe 
							src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3408.0!2d106.70!3d10.77!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTDCsDQ2JzA3LjYiTiAxMDbCsDQyJzAwLjAiRQ!5e0!3m2!1svi!2s!4v1620000000000!5m2!1svi!2s" 
							className="w-full h-full border-0" 
							allowFullScreen="" 
							loading="lazy"
						></iframe>
					</div>
				</div>
			</div>
		</PolicyPageLayout>
	);
};

export default ContactPage;
