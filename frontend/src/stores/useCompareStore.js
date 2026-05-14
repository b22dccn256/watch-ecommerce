import { createWithEqualityFn } from "zustand/traditional";
import { toast } from "react-hot-toast";

export const useCompareStore = createWithEqualityFn((set, get) => ({
	compareItems: JSON.parse(localStorage.getItem("watch_compare_items")) || [],
	isOpen: false,
	setIsOpen: (isOpen) => set({ isOpen }),

	addToCompare: (product) => {
		const { compareItems } = get();
		if (compareItems.length >= 3) {
			toast.error("Báº¡n chá»‰ cĂ³ thá»ƒ so sĂ¡nh tá»‘i Ä‘a 3 sáº£n pháº©m cĂ¹ng lĂºc.");
			return;
		}

		if (compareItems.some((item) => item._id === product._id)) {
			toast.error("Sáº£n pháº©m Ä‘Ă£ cĂ³ trong danh sĂ¡ch so sĂ¡nh.");
			return;
		}

		const updatedItems = [...compareItems, product];
		localStorage.setItem("watch_compare_items", JSON.stringify(updatedItems));
		set({ compareItems: updatedItems, isOpen: true });
		toast.success("ÄĂ£ thĂªm vĂ o danh sĂ¡ch so sĂ¡nh.");
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

