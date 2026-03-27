import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useCartStore } from "./useCartStore";

export const useUserStore = create((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, phone, password, confirmPassword }) => {
		set({ loading: true });
		try {
			await axios.post("/auth/signup", { name, email, phone, password, confirmPassword });
			set({ loading: false });
			// Save email to localStorage for resend flow on EmailVerificationPage
			localStorage.setItem("pendingVerifyEmail", email.toLowerCase().trim());
			return true; // signals success — FE will show "check your email" screen
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi đăng ký");
			return false;
		}
	},
	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axios.post("/auth/login", { email, password });

			if (res.data.message === "OTP_REQUIRED") {
				set({ loading: false });
				return "OTP_REQUIRED";
			}

			set({ user: res.data, loading: false });
			toast.success("Đăng nhập thành công!");

			// Sync guest cart to server
			await useCartStore.getState().syncLocalCartToServer();
			// Fetch the updated cart
			await useCartStore.getState().getCartItems();

		} catch (error) {
			set({ loading: false });
			const data = error.response?.data;
			// If account is unverified, propagate the structured error so LoginPage can handle it
			if (data?.unverified) {
				toast.error(data.message || "Tài khoản chưa được xác minh");
				throw { unverified: true, email: data.email || email };
			}
			toast.error(data?.message || "Đã xảy ra lỗi");
			throw error;
		}
	},

	verifyOTP: async (email, otp) => {
		set({ loading: true });
		try {
			const res = await axios.post("/auth/verify-otp", { email, otp });
			set({ user: res.data, loading: false });
			toast.success("Xác thực 2FA thành công!");

			await useCartStore.getState().syncLocalCartToServer();
			await useCartStore.getState().getCartItems();
			return true;
		} catch (error) {
			set({ loading: false });
			const message = error.response?.data?.message || "Mã OTP không chính xác";
			toast.error(message);
			throw error;
		}
	},

	resendOTP: async (email) => {
		try {
			const res = await axios.post("/auth/resend-otp", { email });
			toast.success(res.data.message || "Đã gửi lại mã OTP");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Không thể gửi lại mã OTP");
			return false;
		}
	},

	resendVerificationEmail: async (email) => {
		try {
			const res = await axios.post("/auth/resend-verification", { email });
			toast.success(res.data.message || "Đã gửi lại email xác minh");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Không thể gửi lại email xác minh");
			return false;
		}
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null });
			toast.success("Logged out successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile");
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axios.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
	updateProfile: async (data) => {
		set({ loading: true });
		try {
			const res = await axios.patch("/auth/profile", data);
			set({ user: res.data.user, loading: false });
			toast.success(res.data.message || "Profile updated successfully!");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	changePassword: async (data) => {
		set({ loading: true });
		try {
			const res = await axios.patch("/auth/change-password", data);
			set({ loading: false });
			toast.success(res.data.message || "Password changed successfully!");
			return true;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "An error occurred");
			return false;
		}
	},
}));

// TODO: Implement the axios interceptors for refreshing access token

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axios(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);
