import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useStorefrontStore = create((set) => ({
	config: null,
	loading: false,

	fetchConfig: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/settings");
			set({ config: res.data, loading: false });
		} catch (error) {
			set({ error: error.response?.data?.message || "Lỗi tải cấu hình", loading: false });
		}
	},

	updateConfig: async (newConfig) => {
		set({ loading: true });
		try {
			const res = await axios.put("/settings", newConfig);
			set({ config: res.data, loading: false });
			toast.success("Cập nhật giao diện thành công!");
		} catch (error) {
			toast.error(error.response?.data?.message || "Lỗi cập nhật cấu hình");
			set({ loading: false });
		}
	},
}));
