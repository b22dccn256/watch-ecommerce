import { create } from "zustand";
import axios from "../lib/axios";
import { toast } from "react-hot-toast";
import { useUserStore } from "./useUserStore";

export const useCartStore = create((set, get) => ({
	cart: [],
	selectedItems: JSON.parse(localStorage.getItem("watch_selected_items") || "[]"), // stores unique cartItemIds
	coupon: null,
	total: 0,
	subtotal: 0,
	shippingFee: 0,
	isCouponApplied: false,
	
	// Helper to generate unique cart item ID
	getUniqueId: (item) => `${item._id}_${item.wristSize || 'default'}`,

	setSelectedItems: (items) => {
		localStorage.setItem("watch_selected_items", JSON.stringify(items));
		set({ selectedItems: items });
		get().calculateTotals();
	},
	toggleSelectItem: (product) => {
		const { selectedItems } = get();
		const uniqueId = get().getUniqueId(product);
		if (selectedItems.includes(uniqueId)) {
			get().setSelectedItems(selectedItems.filter((id) => id !== uniqueId));
		} else {
			get().setSelectedItems([...selectedItems, uniqueId]);
		}
	},
	selectAllItems: (isSelected, products) => {
		if (isSelected) {
			get().setSelectedItems(products.map(p => get().getUniqueId(p)));
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
		const { cart, selectedItems, user, getUniqueId } = get();
		const newCart = cart.filter((item) => !selectedItems.includes(getUniqueId(item)));
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
			try {
				// Xóa giỏ hàng trên server (không cần productId = xóa toàn bộ)
				await axios.delete("/cart", { data: {} });
			} catch (error) {
				console.error("clearCart server error:", error.message);
			}
		}
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
	},
	addToCart: async (product) => {
		const { user } = useUserStore.getState();
		const prevState = get();
		const uniqueId = prevState.getUniqueId(product);
		
		const existingItem = prevState.cart.find((item) => prevState.getUniqueId(item) === uniqueId);
		const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

		if (product.stock < newQuantity) {
			return toast.error(`Sản phẩm này chỉ còn ${product.stock} cái trong kho`);
		}

		if (!user) {
			// Guest Add
			const newCart = existingItem
				? prevState.cart.map((item) =>
					prevState.getUniqueId(item) === uniqueId ? { ...item, quantity: item.quantity + 1 } : item
				)
				: [...prevState.cart, { ...product, quantity: 1, wristSize: product.wristSize || null }];

			localStorage.setItem("watch_cart", JSON.stringify(newCart));
			set({ cart: newCart });
			
			// Auto-select when adding
			if (!get().selectedItems.includes(uniqueId)) {
				get().setSelectedItems([...get().selectedItems, uniqueId]);
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
				const existingItem = prevState.cart.find((item) => prevState.getUniqueId(item) === uniqueId);
				const newCart = existingItem
					? prevState.cart.map((item) =>
						prevState.getUniqueId(item) === uniqueId ? { ...item, quantity: item.quantity + 1 } : item
					)
					: [...prevState.cart, { ...product, quantity: 1, wristSize: product.wristSize || null }];
				return { cart: newCart };
			});

			// Auto-select when adding
			if (!get().selectedItems.includes(uniqueId)) {
				get().setSelectedItems([...get().selectedItems, uniqueId]);
			} else {
				get().calculateTotals();
			}
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	removeFromCart: async (productId, wristSize) => {
		const { user } = useUserStore.getState();
		const uniqueId = get().getUniqueId({ _id: productId, wristSize });

		// Update selected items if removing
		if (get().selectedItems.includes(uniqueId)) {
			get().setSelectedItems(get().selectedItems.filter(id => id !== uniqueId));
		}

		if (!user) {
			const newCart = get().cart.filter((item) => get().getUniqueId(item) !== uniqueId);
			localStorage.setItem("watch_cart", JSON.stringify(newCart));
			set({ cart: newCart });
			get().calculateTotals();
			toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
			return;
		}

		try {
			await axios.delete(`/cart`, { data: { productId, wristSize } });
			set((prevState) => ({ cart: prevState.cart.filter((item) => prevState.getUniqueId(item) !== uniqueId) }));
			get().calculateTotals();
			toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
		} catch (error) {
			toast.error(error.response?.data?.message || "Không thể xóa sản phẩm khỏi giỏ hàng");
		}
	},
	updateQuantity: async (productId, quantity, maxStock, wristSize) => {
		if (quantity === 0) {
			get().removeFromCart(productId, wristSize);
			return;
		}

		if (maxStock !== undefined && quantity > maxStock) {
			toast.error(`Sản phẩm này chỉ còn ${maxStock} cái trong kho`);
			return;
		}

		const { user } = useUserStore.getState();
		const uniqueId = get().getUniqueId({ _id: productId, wristSize });

		if (!user) {
			const newCart = get().cart.map((item) => (get().getUniqueId(item) === uniqueId ? { ...item, quantity } : item));
			localStorage.setItem("watch_cart", JSON.stringify(newCart));
			set({ cart: newCart });
			get().calculateTotals();
			return;
		}

		try {
			await axios.put(`/cart/${productId}`, { quantity, wristSize });
			set((prevState) => ({
				cart: prevState.cart.map((item) => (prevState.getUniqueId(item) === uniqueId ? { ...item, quantity } : item)),
			}));
			get().calculateTotals();
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred");
		}
	},
	calculateTotals: (city = "") => {
		const { cart, coupon, selectedItems, getUniqueId } = get();
		const selectedCart = cart.filter(item => selectedItems.includes(getUniqueId(item)));
		const subtotal = selectedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
		let total = subtotal;

		if (coupon) {
			const discount = subtotal * (coupon.discountPercentage / 100);
			total = subtotal - discount;
		}

		// --- Phí vận chuyển động theo Tỉnh / Thành phố ---
		const FREE_SHIP_THRESHOLD = 5_000_000; // Miễn phí ship nếu đơn > 5tr
		const BIG_CITY_FEE = 30_000; // Hà Nội và TP.HCM
		const OTHER_PROVINCE_FEE = 50_000; // Tỉnh khác

		const BIG_CITIES = [
			"hà nội", "ha noi", "hn",
			"hồ chí minh", "ho chi minh", "hcm", "tp.hcm", "tp hcm", "sài gòn", "sai gon"
		];

		const hasPhysicalItems = selectedCart.length > 0;
		let shippingFee = 0;

		if (hasPhysicalItems) {
			if (total >= FREE_SHIP_THRESHOLD) {
				shippingFee = 0; // Miễn phí
			} else if (!city || BIG_CITIES.includes(city.toLowerCase().trim())) {
				shippingFee = BIG_CITY_FEE; // Hà Nội / HCM (hoặc chưa nhập)
			} else {
				shippingFee = OTHER_PROVINCE_FEE; // Tỉnh khác
			}
		}

		total += shippingFee;
		set({ subtotal, total, shippingFee });
	},
}));
