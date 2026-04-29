import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useCouponStore = create((set, get) => ({
	coupons: [],
	loading: false,

	fetchCoupons: async () => {
		set({ loading: true });
		try {
			const res = await axios.get("/coupons");
			set({ coupons: res.data.coupons || res.data || [], loading: false });
		} catch (error) {
			console.error("Lỗi khi tải coupons:", error);
			// Mock data if backend is not ready to avoid empty screen
			if (error.response?.status === 404) {
				set({ 
					coupons: [
						{ _id: "1", code: "WELCOME10", type: "percent", discountValue: 10, minOrderAmount: 0, usedCount: 15, maxUses: 100, expirationDate: new Date(Date.now() + 864000000).toISOString(), isActive: true },
						{ _id: "2", code: "TET2026", type: "fixed", discountValue: 500000, minOrderAmount: 2000000, usedCount: 200, maxUses: 200, expirationDate: new Date(Date.now() - 864000000).toISOString(), isActive: false },
					],
					loading: false 
				});
				toast.error("Backend chưa có endpoint GET /coupons. Đang hiển thị dữ liệu mẫu.");
			} else {
				set({ loading: false });
				toast.error(error.response?.data?.message || "Không thể tải danh sách coupon");
			}
		}
	},

	createCoupon: async (couponData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/coupons", couponData);
			set((state) => ({
				coupons: [...state.coupons, res.data.coupon || res.data],
				loading: false,
			}));
			toast.success("Tạo mã giảm giá thành công!");
			return true;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Lỗi khi tạo mã giảm giá");
			return false;
		}
	},

	deleteCoupon: async (id) => {
		set({ loading: true });
		try {
			await axios.delete(`/coupons/${id}`);
			set((state) => ({
				coupons: state.coupons.filter((c) => c._id !== id),
				loading: false,
			}));
			toast.success("Đã xóa mã giảm giá");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Lỗi khi xóa mã");
		}
	},

	toggleCoupon: async (id) => {
		try {
			// Optimistic UI update
			set((state) => ({
				coupons: state.coupons.map((c) => 
					c._id === id ? { ...c, isActive: !c.isActive } : c
				)
			}));
			await axios.patch(`/coupons/${id}/toggle`);
		} catch (error) {
			// Rollback on error
			set((state) => ({
				coupons: state.coupons.map((c) => 
					c._id === id ? { ...c, isActive: !c.isActive } : c
				)
			}));
			toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái");
		}
	}
}));
