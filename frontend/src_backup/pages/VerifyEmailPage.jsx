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
	const [message, setMessage] = useState("Đang xác thực email...");
	const [verifying, setVerifying] = useState(true);
	const pendingEmail = localStorage.getItem("pendingVerifyEmail") || "";

	useEffect(() => {
		const queryParams = new URLSearchParams(location.search);
		const token = params.token || queryParams.get("token");

		if (!token) {
			setStatus("error");
			setMessage("Token xác thực không được cung cấp.");
			return;
		}

		setVerifying(true);
		axios.post("/auth/verify-email", { token })
			.then(async (res) => {
				setStatus("success");
				setMessage(res.data.message || "Email đã được xác thực.");
				await useUserStore.getState().checkAuth();
				localStorage.removeItem("pendingVerifyEmail");
				toast.success("Xác thực email thành công!");
				setTimeout(() => navigate("/"), 3000); // redirect sau 3 giây
			})
			.catch((error) => {
				setStatus("error");
				const errMsg = error?.response?.data?.message || "Lỗi khi xác thực email.";
				setMessage(errMsg);
				toast.error(errMsg);
			})
			.finally(() => setVerifying(false));
	}, [location.search, navigate, params.token]);

	const handleResend = async () => {
		if (!pendingEmail) {
			toast.error("Không tìm thấy email cần gửi lại xác thực");
			return;
		}

		const ok = await useUserStore.getState().resendVerificationEmail(pendingEmail);
		if (ok) {
			toast.success("Đã gửi lại email xác thực");
		}
	};

	return (
		<div className="max-w-xl mx-auto mt-24 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
			<h1 className="text-2xl font-bold mb-4">Xác thực Email</h1>
			{verifying ? (
				<p className="text-blue-600 dark:text-blue-300 mb-4">Đang xử lý xác thực, vui lòng chờ...</p>
			) : (
				<p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
			)}

			{status === "success" && !verifying && (
				<button className="btn-base btn-primary h-10 px-6" onClick={() => navigate("/")}>
					Trở về trang chủ
				</button>
			)}

			{status === "error" && !verifying && (
				<div className="flex flex-wrap items-center justify-center gap-3">
					<button className="btn-base btn-outline h-10 px-6" onClick={() => navigate("/login")}>
						Đăng nhập lại
					</button>
					{pendingEmail && (
						<button className="btn-base btn-primary h-10 px-6" onClick={handleResend}>
							Gửi lại email xác thực
						</button>
					)}
				</div>
			)}
		</div>
	);
};

export default VerifyEmailPage;
