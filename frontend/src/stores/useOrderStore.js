import { createWithEqualityFn } from "zustand/traditional";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useOrderStore = createWithEqualityFn((set) => ({
	orders: [],
	loading: false,
	currentOrder: null,
	error: null,

	fetchMyOrders: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/orders/my-orders");
			set({ orders: res.data, loading: false });
		} catch (error) {
			set({ loading: false, orders: [] });
			const status = error.response?.status;
			if (status === 401) {
				toast.error("Vui lĂ²ng Ä‘Äƒng nháº­p láº¡i Ä‘á»ƒ xem Ä‘Æ¡n hĂ ng cá»§a báº¡n");
				return;
			}
			toast.error(error.response?.data?.message || "Lá»—i khi táº£i Ä‘Æ¡n hĂ ng");
		}
	},

	fetchOrderTracking: async (trackingToken) => {
		set({ loading: true, error: null });
		try {
			const res = await axios.get(`/orders/track/${trackingToken}`);
			set({ currentOrder: res.data, loading: false });
		} catch (error) {
			set({
				loading: false,
				error: error.response?.data?.message || "KhĂ´ng tĂ¬m tháº¥y thĂ´ng tin Ä‘Æ¡n hĂ ng"
			});
		}
	},

	cancelOrder: async (orderId) => {
		try {
			await axios.patch(`/orders/${orderId}/cancel`);
			set(state => ({
				orders: state.orders.map(o =>
					o._id === orderId ? { ...o, status: 'cancelled' } : o
				)
			}));
			toast.success("ÄĂ£ há»§y Ä‘Æ¡n hĂ ng thĂ nh cĂ´ng!");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ há»§y Ä‘Æ¡n hĂ ng nĂ y");
			return false;
		}
	},
	requestReturnOrder: async (orderId) => {
		try {
			await axios.patch(`/orders/${orderId}/request-return`);
			set(state => ({
				orders: state.orders.map(o =>
					o._id === orderId ? { ...o, status: 'return_requested' } : o
				)
			}));
			toast.success("ÄĂ£ gá»­i yĂªu cáº§u tráº£ hĂ ng!");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ gá»­i yĂªu cáº§u tráº£ hĂ ng");
			return false;
		}
	},
}));

