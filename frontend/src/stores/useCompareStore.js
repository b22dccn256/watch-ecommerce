import { create } from "zustand";
import { toast } from "react-hot-toast";

export const useCompareStore = create((set, get) => ({
	compareItems: JSON.parse(localStorage.getItem("watch_compare_items")) || [],
	isOpen: false,
	setIsOpen: (isOpen) => set({ isOpen }),

	addToCompare: (product) => {
		const { compareItems } = get();
		if (compareItems.length >= 3) {
			toast.error("Bạn chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc.");
			return;
		}

		if (compareItems.some((item) => item._id === product._id)) {
			toast.error("Sản phẩm đã có trong danh sách so sánh.");
			return;
		}

		const updatedItems = [...compareItems, product];
		localStorage.setItem("watch_compare_items", JSON.stringify(updatedItems));
		set({ compareItems: updatedItems, isOpen: true });
		toast.success("Đã thêm vào danh sách so sánh.");
	},

	removeFromCompare: (productId) => {
		const { compareItems } = get();
		const updatedItems = compareItems.filter((item) => item._id !== productId);
		localStorage.setItem("watch_compare_items", JSON.stringify(updatedItems));
		set({ compareItems: updatedItems });
	},

	clearCompare: () => {
		localStorage.removeItem("watch_compare_items");
		set({ compareItems: [] });
	},
	resetStore: () => {
		localStorage.removeItem("watch_compare_items");
		set({ compareItems: [], isOpen: false });
	},
}));
