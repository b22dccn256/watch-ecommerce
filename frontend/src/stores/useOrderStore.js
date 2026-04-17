import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useOrderStore = create((set) => ({
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
			set({ loading: false });
			toast.error(error.response?.data?.message || "Lỗi khi tải đơn hàng");
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
				error: error.response?.data?.message || "Không tìm thấy thông tin đơn hàng"
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
			toast.success("Đã hủy đơn hàng thành công!");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Không thể hủy đơn hàng này");
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
			toast.success("Đã gửi yêu cầu trả hàng!");
			return true;
		} catch (error) {
			toast.error(error.response?.data?.message || "Không thể gửi yêu cầu trả hàng");
			return false;
		}
	},
}));
