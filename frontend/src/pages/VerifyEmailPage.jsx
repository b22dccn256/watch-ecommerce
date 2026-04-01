import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../lib/axios";
import toast from "react-hot-toast";
import { useUserStore } from "../stores/useUserStore";

const VerifyEmailPage = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [status, setStatus] = useState("loading");
	const [message, setMessage] = useState("Đang xác thực email...");
	const [verifying, setVerifying] = useState(true);

	useEffect(() => {
		const params = new URLSearchParams(location.search);
		const token = params.get("token");

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
	}, [location.search, navigate]);

	return (
		<div className="max-w-xl mx-auto mt-24 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg">
			<h1 className="text-2xl font-bold mb-4">Xác thực Email</h1>
			{verifying ? (
				<p className="text-blue-600 dark:text-blue-300 mb-4">Đang xử lý xác thực, vui lòng chờ...</p>
			) : (
				<p className="text-gray-600 dark:text-gray-300 mb-4">{message}</p>
			)}

			{status === "success" && !verifying && (
				<button className="px-6 py-2 bg-emerald-500 text-white rounded-lg" onClick={() => navigate("/")}>
					Trở về trang chủ
				</button>
			)}

			{status === "error" && !verifying && (
				<button className="px-6 py-2 bg-blue-500 text-white rounded-lg" onClick={() => navigate("/login")}>
					Đăng nhập lại
				</button>
			)}
		</div>
	);
};

export default VerifyEmailPage;
