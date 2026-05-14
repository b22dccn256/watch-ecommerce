import { createWithEqualityFn } from "zustand/traditional";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useWishlistStore = createWithEqualityFn((set, get) => ({
	wishlist: [],
	loading: false,

	// Láº¥y danh sĂ¡ch yĂªu thĂ­ch tá»« server hoáº·c LocalStorage
	fetchWishlist: async (isAuthenticated) => {
		if (!isAuthenticated) {
			const saved = localStorage.getItem("wishlist");
			set({ wishlist: saved ? JSON.parse(saved) : [] });
			return;
		}

		set({ loading: true });
		try {
			const res = await axios.get("/wishlist");
			set({ wishlist: res.data, loading: false });
		} catch (error) {
			set({ loading: false });
			console.error("Error fetching wishlist:", error);
		}
	},

	// ThĂªm/XĂ³a sáº£n pháº©m (Toggle)
	toggleWishlist: async (product, isAuthenticated) => {
		const { wishlist } = get();
		const isExisting = wishlist.some((item) => item._id === product._id);

		// Optimistic Update
		const updatedWishlist = isExisting
			? wishlist.filter((item) => item._id !== product._id)
			: [...wishlist, { ...product, addedAt: new Date() }];

		set({ wishlist: updatedWishlist });

		if (!isAuthenticated) {
			localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
			toast.success(isExisting ? "ÄĂ£ xĂ³a khá»i yĂªu thĂ­ch" : "ÄĂ£ thĂªm vĂ o yĂªu thĂ­ch");
			return;
		}

		try {
			if (isExisting) {
				await axios.delete(`/wishlist/${product._id}`);
			} else {
				await axios.post("/wishlist", { productId: product._id });
			}
			toast.success(isExisting ? "ÄĂ£ xĂ³a khá»i yĂªu thĂ­ch" : "ÄĂ£ thĂªm vĂ o yĂªu thĂ­ch");
		} catch {
			// Rollback if server fails
			set({ wishlist: wishlist });
			toast.error("CĂ³ lá»—i xáº£y ra, vui lĂ²ng thá»­ láº¡i sau");
		}
	},

	// Há»£p nháº¥t Guest Wishlist sau khi Ä‘Äƒng nháº­p
	mergeWishlist: async () => {
		const localWishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
		if (localWishlist.length === 0) return;

		try {
			const itemsToMerge = localWishlist.map((item) => ({
				productId: item._id,
				addedAt: item.addedAt,
			}));

			await axios.post("/wishlist/merge", { items: itemsToMerge });
			localStorage.removeItem("wishlist");
			
			// Refresh wishlist from server
			const res = await axios.get("/wishlist");
			set({ wishlist: res.data });
		} catch (error) {
			console.error("Failed to merge wishlist:", error);
		}
	},

	// Äá»“ng bá»™ giá»¯a cĂ¡c tab
	syncFromLocalStorage: () => {
		const saved = localStorage.getItem("wishlist");
		set({ wishlist: saved ? JSON.parse(saved) : [] });
	},
	resetStore: () => {
		localStorage.removeItem("wishlist");
		set({ wishlist: [], loading: false });
	},
}));

