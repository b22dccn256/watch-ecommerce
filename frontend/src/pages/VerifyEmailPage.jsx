import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const VerifyEmailPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const params = useParams();
	const [status, setStatus] = useState("loading");
	const [message, setMessage] = useState("Äang xĂ¡c thá»±c email...");
	const [verifying, setVerifying] = useState(true);
	const pendingEmail = localStorage.getItem("pendingVerifyEmail") || "";

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const token = params.token || queryParams.get("token");

		if (!token) {
			setStatus("error");
			setMessage("Token xĂ¡c thá»±c khĂ´ng Ä‘Æ°á»£c cung cáº¥p.");
			return;
		}

		setVerifying(true);
		axios.post("/auth/verify-email", { token })
			.then(async (res) => {
				setStatus("success");
				setMessage(res.data.message || "Email Ä‘Ă£ Ä‘Æ°á»£c xĂ¡c thá»±c.");
				await useUserStore.getState().checkAuth();
				localStorage.removeItem("pendingVerifyEmail");
				toast.success("XĂ¡c thá»±c email thĂ nh cĂ´ng!");
				setTimeout(() => navigate("/"), 3000); // redirect sau 3 giĂ¢y
			})
			.catch((error) => {
				setStatus("error");
				const errMsg = error?.response?.data?.message || "Lá»—i khi xĂ¡c thá»±c email.";
				setMessage(errMsg);
				toast.error(errMsg);
			})
			.finally(() => setVerifying(false));
	}, [location.search, navigate, params.token]);

	const handleResend = async () => {
		if (!pendingEmail) {
			toast.error("KhĂ´ng tĂ¬m tháº¥y email cáº§n gá»­i láº¡i xĂ¡c thá»±c");
			return;
		}

		const ok = await useUserStore.getState().resendVerificationEmail(pendingEmail);
		if (ok) {
			toast.success("ÄĂ£ gá»­i láº¡i email xĂ¡c thá»±c");
		}
	};

	return (
		<div className="max-w-xl mx-auto mt-24 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
			<h1 className="text-2xl font-bold mb-4">XĂ¡c thá»±c Email</h1>
			{verifying ? (
				<p className="text-blue-600 dark:text-blue-300 mb-4">Äang xá»­ lĂ½ xĂ¡c thá»±c, vui lĂ²ng chá»...</p>
			) : (
				<p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
			)}

			{status === "success" && !verifying && (
				<button className="btn-base btn-primary h-10 px-6" onClick={() => navigate("/")}>
					Trá»Ÿ vá» trang chá»§
				</button>
			)}

			{status === "error" && !verifying && (
				<div className="flex flex-wrap items-center justify-center gap-3">
					<button className="btn-base btn-outline h-10 px-6" onClick={() => navigate("/login")}>
						ÄÄƒng nháº­p láº¡i
					</button>
					{pendingEmail && (
						<button className="btn-base btn-primary h-10 px-6" onClick={handleResend}>
							Gá»­i láº¡i email xĂ¡c thá»±c
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default VerifyEmailPage;

