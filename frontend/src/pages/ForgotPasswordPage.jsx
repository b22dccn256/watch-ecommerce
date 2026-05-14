import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

import axios from "../lib/axios";
import Input from "../components/ui/Input";

const ForgotPasswordPage = () => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		try {
			const res = await axios.post("/auth/forgot-password", { email });
			setSent(true);
			toast.success(res.data.message || "Náº¿u email tá»“n táº¡i, báº¡n sáº½ nháº­n Ä‘Æ°á»£c liĂªn káº¿t Ä‘áº·t láº¡i máº­t kháº©u.");
		} catch (error) {
			toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ gá»­i email Ä‘áº·t láº¡i máº­t kháº©u");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12)_0%,rgba(255,255,255,1)_42%,rgba(248,245,240,1)_100%)] px-4 pt-28 pb-16 dark:bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1)_0%,rgba(15,12,8,1)_42%,rgba(10,10,10,1)_100%)]">
			<motion.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				className="mx-auto max-w-xl rounded-[1.8rem] border border-black/10 bg-surface p-8 shadow-[0_30px_100px_-50px_rgba(0,0,0,0.5)] dark:border-white/10"
			>
				<p className="hero-kicker text-[color:var(--color-gold)]">Account recovery</p>
				<h1 className="hero-title mt-3 text-3xl text-primary">QuĂªn máº­t kháº©u</h1>
				<p className="mt-2 text-sm text-secondary">Nháº­p email cá»§a báº¡n Ä‘á»ƒ nháº­n liĂªn káº¿t Ä‘áº·t láº¡i máº­t kháº©u, cĂ³ hiá»‡u lá»±c trong 15 phĂºt.</p>

				<form className="mt-8 space-y-4" onSubmit={handleSubmit}>
					<Input
						label="Email"
						type="email"
						required
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						placeholder="you@example.com"
					/>
					<button type="submit" disabled={loading} className="btn-base btn-primary h-11 w-full">
						{loading ? "Äang gá»­i..." : (
							<>
								Gá»­i liĂªn káº¿t Ä‘áº·t láº¡i
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</button>
				</form>

				{sent && (
					<div className="mt-6 rounded-xl border border-[color:var(--color-gold)]/20 bg-[color:var(--color-gold)]/10 p-4 text-sm text-secondary">
						Náº¿u email tá»“n táº¡i, báº¡n sáº½ nháº­n Ä‘Æ°á»£c liĂªn káº¿t Ä‘áº·t láº¡i máº­t kháº©u.
					</div>
				)}

				<div className="mt-6 flex items-center justify-between text-sm">
					<Link to="/login" className="text-[color:var(--color-gold)] hover:underline">
						Quay láº¡i Ä‘Äƒng nháº­p
					</Link>
					<Link to="/signup" className="text-secondary hover:text-primary">
						Táº¡o tĂ i khoáº£n má»›i
					</Link>
				</div>
			</motion.div>
		</div>
	);
};

export default ForgotPasswordPage;

