import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";

export const useWishlistStore = create((set, get) => ({
	wishlist: [],
	loading: false,

	// Lấy danh sách yêu thích từ server hoặc LocalStorage
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

	// Thêm/Xóa sản phẩm (Toggle)
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
			toast.success(isExisting ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích");
			return;
		}

		try {
			if (isExisting) {
				await axios.delete(`/wishlist/${product._id}`);
			} else {
				await axios.post("/wishlist", { productId: product._id });
			}
			toast.success(isExisting ? "Đã xóa khỏi yêu thích" : "Đã thêm vào yêu thích");
		} catch (error) {
			// Rollback if server fails
			set({ wishlist: wishlist });
			toast.error("Có lỗi xảy ra, vui lòng thử lại sau");
		}
	},

	// Hợp nhất Guest Wishlist sau khi đăng nhập
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

	// Đồng bộ giữa các tab
	syncFromLocalStorage: () => {
		const saved = localStorage.getItem("wishlist");
		set({ wishlist: saved ? JSON.parse(saved) : [] });
	},
}));
