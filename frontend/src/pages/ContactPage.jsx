import { useState } from "react";
import PolicyPageLayout from "../components/PolicyPageLayout";
import { Mail, Phone, MapPin, Send } from "lucide-react";
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
			toast.error(error.response?.data?.message || "CĂ³ lá»—i xáº£y ra, vui lĂ²ng thá»­ láº¡i sau.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<PolicyPageLayout 
			title="LiĂªn há»‡ chĂºng tĂ´i" 
			description="Káº¿t ná»‘i vá»›i Ä‘á»™i ngÅ© chuyĂªn gia cá»§a Luxury Watch Store Ä‘á»ƒ Ä‘Æ°á»£c tÆ° váº¥n vĂ  há»— trá»£ táº­n tĂ¢m nháº¥t."
			activeId="contact"
		>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
				{/* Contact Form */}
				<div className="space-y-8 rounded-[2rem] border border-black/5 dark:border-white/5 bg-white/85 dark:bg-white/5 p-6 md:p-8 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.35)]">
					<div className="space-y-4">
						<p className="hero-kicker text-xs font-semibold text-luxury-gold">Concierge</p>
						<h2 className="hero-title text-2xl font-bold text-gray-900 dark:text-white">Gá»­i lá»i nháº¯n cho chĂºng tĂ´i</h2>
						<p className="text-luxury-text-muted text-sm leading-relaxed">
							ChĂºng tĂ´i luĂ´n sáºµn lĂ²ng láº¯ng nghe vĂ  giáº£i Ä‘Ă¡p má»i tháº¯c máº¯c cá»§a quĂ½ khĂ¡ch. Pháº£n há»“i sáº½ Ä‘Æ°á»£c gá»­i qua email cá»§a báº¡n trong vĂ²ng 24 giá» lĂ m viá»‡c.
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
								<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Há» vĂ  tĂªn *</label>
								<input
									type="text"
									required
									value={formData.name}
									onChange={(e) => setFormData({...formData, name: e.target.value})}
									className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-2xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition"
									placeholder="Nguyá»…n VÄƒn A"
								/>
							</div>
							<div className="space-y-1">
								<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Email *</label>
								<input
									type="email"
									required
									value={formData.email}
									onChange={(e) => setFormData({...formData, email: e.target.value})}
									className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-2xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition"
									placeholder="example@gmail.com"
								/>
							</div>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Chá»§ Ä‘á»</label>
							<select
								value={formData.subject}
								onChange={(e) => setFormData({...formData, subject: e.target.value})}
								className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-2xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition"
							>
								<option value="">Chá»n chá»§ Ä‘á»...</option>
								<option value="TÆ° váº¥n sáº£n pháº©m">TÆ° váº¥n sáº£n pháº©m</option>
								<option value="Há»— trá»£ Ä‘Æ¡n hĂ ng">Há»— trá»£ Ä‘Æ¡n hĂ ng</option>
								<option value="Báº£o hĂ nh & Äá»•i tráº£">Báº£o hĂ nh & Äá»•i tráº£</option>
								<option value="GĂ³p Ă½ dá»‹ch vá»¥">GĂ³p Ă½ dá»‹ch vá»¥</option>
							</select>
						</div>

						<div className="space-y-1">
							<label className="text-xs font-bold uppercase tracking-wider text-gray-500">Lá»i nháº¯n *</label>
							<textarea
								required
								rows={5}
								value={formData.message}
								onChange={(e) => setFormData({...formData, message: e.target.value})}
								className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-luxury-border rounded-2xl px-4 py-3 text-sm focus:border-luxury-gold outline-none transition resize-none"
								placeholder="Báº¡n cáº§n chĂºng tĂ´i há»— trá»£ Ä‘iá»u gĂ¬?"
							></textarea>
						</div>

						<button
							type="submit"
							disabled={loading}
							className="w-full bg-luxury-gold text-luxury-dark font-bold py-4 rounded-2xl hover:bg-white hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
						>
							{loading ? "ÄANG Gá»¬I..." : (
								<>
									Gá»¬I TIN NHáº®N 
									<Send className="w-4 h-4" />
								</>
							)}
						</button>
					</form>
				</div>

				{/* Contact Information */}
				<div className="space-y-12 lg:pl-10">
					<div className="space-y-8">
						<p className="hero-kicker text-xs font-semibold text-luxury-gold">Direct access</p>
						<h2 className="hero-title text-2xl font-bold text-gray-900 dark:text-white">ThĂ´ng tin liĂªn láº¡c</h2>
						
						<div className="flex items-start gap-6 group">
							<div className="bg-luxury-gold/10 p-4 rounded-2xl text-luxury-gold transition group-hover:bg-luxury-gold group-hover:text-luxury-dark">
								<Phone className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase text-luxury-gold mb-1">Hotline 24/7</p>
								<p className="text-lg font-bold">1900 8888</p>
								<p className="text-xs text-gray-400 mt-1">Há»— trá»£ ká»¹ thuáº­t: 1900 9999</p>
							</div>
						</div>

						<div className="flex items-start gap-6 group">
							<div className="bg-luxury-gold/10 p-4 rounded-2xl text-luxury-gold transition group-hover:bg-luxury-gold group-hover:text-luxury-dark">
								<Mail className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase text-luxury-gold mb-1">Email Pháº£n Há»“i</p>
								<p className="text-lg font-bold">support@watchstore.com</p>
								<p className="text-xs text-gray-400 mt-1">Há»£p tĂ¡c: business@watchstore.com</p>
							</div>
						</div>

						<div className="flex items-start gap-6 group">
							<div className="bg-luxury-gold/10 p-4 rounded-2xl text-luxury-gold transition group-hover:bg-luxury-gold group-hover:text-luxury-dark">
								<MapPin className="w-6 h-6" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase text-luxury-gold mb-1">Trung TĂ¢m TrÆ°ng BĂ y</p>
								<p className="text-lg font-bold">123 Luxury Tower, Q1, TP. HCM</p>
								<p className="text-xs text-gray-400 mt-1">Chi nhĂ¡nh HN: 456 Watch Plaza, Cáº§u Giáº¥y</p>
							</div>
						</div>
					</div>

					<div className="rounded-[2rem] overflow-hidden border border-luxury-border h-64 grayscale hover:grayscale-0 transition-all duration-700 shadow-[0_24px_80px_-40px_rgba(0,0,0,0.4)]">
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

