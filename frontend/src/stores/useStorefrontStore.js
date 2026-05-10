import { createWithEqualityFn } from "zustand/traditional";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const FETCH_TTL_MS = 60000;
const fetchState = { promise: null, lastFetched: 0 };

export const useStorefrontStore = createWithEqualityFn((set, get) => ({
	config: null,
	loading: false,

	fetchConfig: async (force = false) => {
		const now = Date.now();
		if (!force && get().config && now - fetchState.lastFetched < FETCH_TTL_MS) {
			return get().config;
		}
		if (fetchState.promise) return fetchState.promise;
		set({ loading: true });
		fetchState.promise = axios
			.get("/settings")
			.then((res) => {
				set({ config: res.data, loading: false });
				fetchState.lastFetched = Date.now();
				return res.data;
			})
			.catch((error) => {
				set({ error: error.response?.data?.message || "Lỗi tải cấu hình", loading: false });
				return get().config;
			})
			.finally(() => {
				fetchState.promise = null;
			});
		return fetchState.promise;
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
