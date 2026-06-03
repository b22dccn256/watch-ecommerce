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
      toast.error("Mật khẩu xác nhận không khớp");
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
      toast.success(
        res.data.message ||
          "Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.",
      );
      return { success: true, email: normalizedEmail };
    } catch (error) {
      set({ loading: false });
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi khi đăng ký");
      return { success: false };
    }
  },

  resendVerificationEmail: async (email) => {
    if (!email) {
      toast.error("Email không hợp lệ");
      return false;
    }

    try {
      const res = await axios.post("/auth/resend-verification", { email });
      toast.success(res.data.message || "Email xác minh đã được gửi lại");
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Không thể gửi lại email xác minh",
      );
      return false;
    }
  },
  login: async (email, password) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });

      if (res.data.requiresOTP) {
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
      toast.error(error.response?.data?.message || "Đã xảy ra lỗi");
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

  clearAuth: () => {
    set({ user: null, checkingAuth: false });
    localStorage.removeItem("pendingVerifyEmail");
    useCartStore.getState().resetStore();
    useWishlistStore.getState().resetStore();
    useCompareStore.getState().resetStore();
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      get().clearAuth();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout",
      );
    }
  },

  checkAuth: async () => {
    // Chỉ hiện loading spinner ở lần tải trang đầu tiên (khi checkingAuth đang là true)
    // Tránh set checkingAuth thành true ở các lần check chạy ngầm (khi chuyển tab) để không làm unmount ứng dụng và mất dữ liệu form
    if (get().checkingAuth) {
      set({ checkingAuth: true });
    }
    try {
      const response = await axios.get("/auth/profile", { skipRefresh: true });
      set({ user: response.data, checkingAuth: false });
    } catch (error) {
      // 401 = not logged in — completely expected, not an error
      if (error.response?.status !== 401) {
        console.error("checkAuth error:", error.message);
      }
      if (get().user) {
        get().clearAuth();
      } else {
        set({ checkingAuth: false });
      }
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
