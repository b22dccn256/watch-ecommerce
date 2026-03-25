import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "./useUserStore";

export const useCartStore = create((set, get) => ({
	cart: [],
	selectedItems: JSON.parse(localStorage.getItem("watch_selected_items") || "[]"),
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	setSelectedItems: (items) => {
		localStorage.setItem("watch_selected_items", JSON.stringify(items));
		set({ selectedItems: items });
		get().calculateTotals();
	},
	toggleSelectItem: (productId) => {
		const { selectedItems } = get();
		if (selectedItems.includes(productId)) {
			get().setSelectedItems(selectedItems.filter((id) => id !== productId));
		} else {
			get().setSelectedItems([...selectedItems, productId]);
		}
	},
	selectAllItems: (isSelected, productIds) => {
		if (isSelected) {
			get().setSelectedItems(productIds);
		} else {
			get().setSelectedItems([]);
		}
	},

	syncLocalCartToServer: async () => {
		const localCart = JSON.parse(localStorage.getItem("watch_cart") || "[]");
		if (localCart.length > 0) {
			try {
				await axios.post("/cart/merge", { guestCartItems: localCart });
				localStorage.removeItem("watch_cart");
				// The newly merged cart will be handled by getCartItems which is called after login
			} catch (error) {
				console.error("Failed to sync guest cart:", error);
			}
		}
	},

	getMyCoupon: async () => {
		try {
			const response = await axios.get("/coupons");
			set({ coupon: response.data });
		} catch (error) {
			console.error("Error fetching coupon:", error);
		}
	},
	applyCoupon: async (code) => {
		try {
			const response = await axios.post("/coupons/validate", { code });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
			toast.success("Coupon applied successfully");
		} catch (error) {
			toast.error(error.response?.data?.message || "Failed to apply coupon");
		}
	},
	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
		toast.success("Coupon removed");
	},

	getCartItems: async () => {
		const { user } = useUserStore.getState();
		if (!user) {
			// Guest Flow
			const localCart = JSON.parse(localStorage.getItem("watch_cart") || "[]");
			set({ cart: localCart });
			get().calculateTotals();
			return;
		}

		try {
			const res = await axios.get("/cart");
			set({ cart: res.data });
			get().calculateTotals();
		} catch (error) {
			set({ cart: [] });
			toast.error(error.response?.data?.message || "An error occurred fetching cart");
		}
	},
	clearSelectedCart: () => {
		const { cart, selectedItems, user } = get();
		const newCart = cart.filter((item) => !selectedItems.includes(item._id));
		if (!user) {
			localStorage.setItem("watch_cart", JSON.stringify(newCart));
		}
		localStorage.setItem("watch_selected_items", JSON.stringify([]));
		set({ cart: newCart, selectedItems: [], coupon: null, total: 0, subtotal: 0, isCouponApplied: false });
	},
	clearCart: async () => {
		const { user } = useUserStore.getState();
		if (!user) {
			localStorage.removeItem("watch_cart");
		} else {
			// Optional: call clear server endpoint if you have one
		}
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
	addToCart: async (product) => {
		const { user } = useUserStore.getState();
		const prevState = get();
		const existingItem = prevState.cart.find((item) => item._id === product._id);
		const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

		if (product.stock < newQuantity) {
			return toast.error(`Sản phẩm này chỉ còn ${product.stock} cái trong kho`);
		}

		if (!user) {
			// Guest Add
			const newCart = existingItem
				? prevState.cart.map((item) =>
					item._id === product._id ? { ...item, quantity: item.quantity + 1, wristSize: product.wristSize || item.wristSize } : item
				)
				: [...prevState.cart, { ...product, quantity: 1, wristSize: product.wristSize || null }];

			localStorage.setItem("watch_cart", JSON.stringify(newCart));
			set({ cart: newCart });
			
			// Auto-select when adding
			if (!get().selectedItems.includes(product._id)) {
				get().setSelectedItems([...get().selectedItems, product._id]);
			} else {
				get().calculateTotals();
			}
			
			toast.success("Đã thêm vào giỏ hàng!");
			return;
		}

		try {
			await axios.post("/cart", { productId: product._id, wristSize: product.wristSize });
			toast.success("Đã thêm vào giỏ hàng!");

			set((prevState) => {
				const existingItem = prevState.cart.find((item) => item._id === product._id);
				const newCart = existingItem
					? prevState.cart.map((item) =>
						item._id === product._id ? { ...item, quantity: item.quantity + 1, wristSize: product.wristSize || item.wristSize } : item
					)
					: [...prevState.cart, { ...product, quantity: 1, wristSize: product.wristSize || null }];
				return { cart: newCart };
			});

			// Auto-select when adding
			if (!get().selectedItems.includes(product._id)) {
				get().setSelectedItems([...get().selectedItems, product._id]);
			} else {
				get().calculateTotals();
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	removeFromCart: async (productId) => {
		const { user, selectedItems } = useUserStore.getState();

		// Update selected items if removing
		if (get().selectedItems.includes(productId)) {
			get().setSelectedItems(get().selectedItems.filter(id => id !== productId));
		}

		if (!user) {
			const newCart = get().cart.filter((item) => item._id !== productId);
			localStorage.setItem("watch_cart", JSON.stringify(newCart));
			set({ cart: newCart });
			get().calculateTotals();
			return;
		}

		await axios.delete(`/cart`, { data: { productId } });
		set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
		get().calculateTotals();
	},
	updateQuantity: async (productId, quantity, maxStock) => {
		if (quantity === 0) {
			get().removeFromCart(productId);
			return;
		}

		if (maxStock !== undefined && quantity > maxStock) {
			toast.error(`Sản phẩm này chỉ còn ${maxStock} cái trong kho`);
			return;
		}

		const { user } = useUserStore.getState();

		if (!user) {
			const newCart = get().cart.map((item) => (item._id === productId ? { ...item, quantity } : item));
			localStorage.setItem("watch_cart", JSON.stringify(newCart));
			set({ cart: newCart });
			get().calculateTotals();
			return;
		}

		try {
			await axios.put(`/cart/${productId}`, { quantity });
			set((prevState) => ({
				cart: prevState.cart.map((item) => (item._id === productId ? { ...item, quantity } : item)),
			}));
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	calculateTotals: () => {
		const { cart, coupon, selectedItems } = get();
		const selectedCart = cart.filter(item => selectedItems.includes(item._id));
		const subtotal = selectedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		set({ subtotal, total });
	},
}));
