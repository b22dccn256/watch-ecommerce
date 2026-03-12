import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useOrderStore = create((set) => ({
	orders: [],
	loading: false,

	fetchMyOrders: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/orders/my-orders");
			set({ orders: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Lỗi khi tải đơn hàng");
		}
	},
}));
