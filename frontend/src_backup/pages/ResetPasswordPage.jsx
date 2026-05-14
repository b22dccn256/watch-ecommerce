import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import toast from "react-hot-toast";

import axios from "../lib/axios";
import Input from "../components/ui/Input";

const ResetPasswordPage = () => {
	const { token: tokenParam } = useParams();
	const navigate = useNavigate();
	const [token, setToken] = useState(tokenParam || "");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (tokenParam) {
			setToken(tokenParam);
		}
	}, [tokenParam]);

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		try {
			const res = await axios.post("/auth/reset-password", {
				token,
				newPassword,
				confirmPassword,
			});
			toast.success(res.data.message || "Mật khẩu đã được đặt lại thành công");
			navigate("/login");
		} catch (error) {
			toast.error(error.response?.data?.message || "Không thể đặt lại mật khẩu");
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
				<h1 className="hero-title mt-3 text-3xl text-primary">Đặt lại mật khẩu</h1>
				<p className="mt-2 text-sm text-secondary">Tạo mật khẩu mới cho tài khoản của bạn.</p>

				<form className="mt-8 space-y-4" onSubmit={handleSubmit}>
					<Input
						label="Mã đặt lại"
						type="text"
						required
						value={token}
						onChange={(e) => setToken(e.target.value)}
						placeholder="Token từ email"
					/>
					<Input
						label="Mật khẩu mới"
						type="password"
						required
						value={newPassword}
						onChange={(e) => setNewPassword(e.target.value)}
						placeholder="••••••••"
					/>
					<Input
						label="Xác nhận mật khẩu"
						type="password"
						required
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						placeholder="••••••••"
					/>
					<button type="submit" disabled={loading} className="btn-base btn-primary h-11 w-full">
						{loading ? "Đang cập nhật..." : (
							<>
								Đặt lại mật khẩu
								<ArrowRight className="h-4 w-4" />
							</>
						)}
					</button>
				</form>

				<div className="mt-6 text-sm">
					<Link to="/login" className="text-[color:var(--color-gold)] hover:underline">
						Quay lại đăng nhập
					</Link>
				</div>
			</motion.div>
		</div>
	);
};

export default ResetPasswordPage;
