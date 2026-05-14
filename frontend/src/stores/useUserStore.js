import { createWithEqualityFn } from "zustand/traditional";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useCartStore } from "./useCartStore";
import { useWishlistStore } from "./useWishlistStore";
import { useCompareStore } from "./useCompareStore";

export const useUserStore = createWithEqualityFn((set, get) => ({
	user: null,
	loading: false,
	checkingAuth: true,

	signup: async ({ name, email, phone, password, confirmPassword }) => {
		set({ loading: true });
		const normalizedName = name?.trim();
		const normalizedEmail = email?.toLowerCase().trim();
		const normalizedPhone = phone?.trim();

		if (password !== confirmPassword) {
			set({ loading: false });
			toast.error("Máº­t kháº©u xĂ¡c nháº­n khĂ´ng khá»›p");
			return { success: false };
		}

		try {
			const res = await axios.post("/auth/signup", {
				name: normalizedName,
				email: normalizedEmail,
				phone: normalizedPhone,
				password,
				confirmPassword,
			});
			set({ loading: false });
			localStorage.setItem("pendingVerifyEmail", normalizedEmail);
			toast.success(res.data.message || "ÄÄƒng kĂ½ thĂ nh cĂ´ng! Vui lĂ²ng xĂ¡c thá»±c email.");
			return { success: true, email: normalizedEmail };
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "ÄĂ£ xáº£y ra lá»—i khi Ä‘Äƒng kĂ½");
			return { success: false };
		}
	},

	resendVerificationEmail: async (email) => {
		if (!email) {
			toast.error("Email khĂ´ng há»£p lá»‡");
			return false;
		}

		try {
			const res = await axios.post("/auth/resend-verification", { email });
			toast.success(res.data.message || "Email xĂ¡c thá»±c Ä‘Ă£ Ä‘Æ°á»£c gá»­i láº¡i");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ gá»­i láº¡i email xĂ¡c thá»±c");
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
			toast.success("ÄÄƒng nháº­p thĂ nh cĂ´ng!");

			// Sync guest cart to server
			await useCartStore.getState().syncLocalCartToServer();
			// Fetch the updated cart
			await useCartStore.getState().getCartItems();

		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "ÄĂ£ xáº£y ra lá»—i");
			throw error;
		}
	},

	verifyOTP: async (email, otp) => {
		set({ loading: true });
		try {
			const res = await axios.post("/auth/verify-otp", { email, otp });
			set({ user: res.data, loading: false });
			toast.success("XĂ¡c thá»±c 2FA thĂ nh cĂ´ng!");

			await useCartStore.getState().syncLocalCartToServer();
			await useCartStore.getState().getCartItems();
			return true;
		} catch (error) {
			set({ loading: false });
			const message = error.response?.data?.message || "MĂ£ OTP khĂ´ng chĂ­nh xĂ¡c";
			toast.error(message);
			throw error;
		}
	},

	resendOTP: async (email) => {
		try {
			const res = await axios.post("/auth/resend-otp", { email });
			toast.success(res.data.message || "ÄĂ£ gá»­i láº¡i mĂ£ OTP");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ gá»­i láº¡i mĂ£ OTP");
			return false;
		}
	},

	logout: async () => {
		try {
			await axios.post("/auth/logout");
			set({ user: null });
			useCartStore.getState().resetStore();
			useWishlistStore.getState().resetStore();
			useCompareStore.getState().resetStore();
			toast.success("Logged out successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true });
		try {
			const response = await axios.get("/auth/profile", { skipRefresh: true });
			set({ user: response.data, checkingAuth: false });
		} catch (error) {
			console.error(error.message);
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



