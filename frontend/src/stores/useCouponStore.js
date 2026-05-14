import { createWithEqualityFn } from "zustand/traditional";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const FETCH_TTL_MS = 60000;
const fetchState = { promise: null, lastFetched: 0 };

export const useCouponStore = createWithEqualityFn((set, get) => ({
	coupons: [],
	loading: false,

	fetchCoupons: async (force = false) => {
		const now = Date.now();
		if (!force && get().coupons.length > 0 && now - fetchState.lastFetched < FETCH_TTL_MS) {
			return get().coupons;
		}
		if (fetchState.promise) return fetchState.promise;
		set({ loading: true });
		fetchState.promise = axios
			.get("/coupons")
			.then((res) => {
				const nextCoupons = res.data.coupons || res.data || [];
				set({ coupons: nextCoupons, loading: false });
				fetchState.lastFetched = Date.now();
				return nextCoupons;
			})
			.catch((error) => {
				console.error("Lá»—i khi táº£i coupons:", error);
				// Mock data if backend is not ready to avoid empty screen
				if (error.response?.status === 404) {
					const fallback = [
						{ _id: "1", code: "WELCOME10", type: "percent", discountValue: 10, minOrderAmount: 0, usedCount: 15, maxUses: 100, expirationDate: new Date(Date.now() + 864000000).toISOString(), isActive: true },
						{ _id: "2", code: "TET2026", type: "fixed", discountValue: 500000, minOrderAmount: 2000000, usedCount: 200, maxUses: 200, expirationDate: new Date(Date.now() - 864000000).toISOString(), isActive: false },
					];
					set({ coupons: fallback, loading: false });
					toast.error("Backend chÆ°a cĂ³ endpoint GET /coupons. Äang hiá»ƒn thá»‹ dá»¯ liá»‡u máº«u.");
					return fallback;
				}
				set({ loading: false });
				toast.error(error.response?.data?.message || "KhĂ´ng thá»ƒ táº£i danh sĂ¡ch coupon");
				return get().coupons;
			})
			.finally(() => {
				fetchState.promise = null;
			});
		return fetchState.promise;
	},

	createCoupon: async (couponData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/coupons", couponData);
			set((state) => ({
				coupons: [...state.coupons, res.data.coupon || res.data],
				loading: false,
			}));
			toast.success("Táº¡o mĂ£ giáº£m giĂ¡ thĂ nh cĂ´ng!");
			return true;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Lá»—i khi táº¡o mĂ£ giáº£m giĂ¡");
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
			toast.success("ÄĂ£ xĂ³a mĂ£ giáº£m giĂ¡");
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Lá»—i khi xĂ³a mĂ£");
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
			toast.error(error.response?.data?.message || "Lá»—i khi cáº­p nháº­t tráº¡ng thĂ¡i");
		}
	}
}));

