import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useProductStore = create((set, get) => ({
	products: [],
	loading: false,

	setProducts: (products) => set({ products }),
	createProduct: async (productData) => {
		set({ loading: true });
		try {
			const res = await axios.post("/products", productData);
			set((prevState) => ({
				products: [...prevState.products, res.data],
				loading: false,
			}));
			toast.success("Product created successfully");
		} catch (error) {
			toast.error(error.response.data.error);
			set({ loading: false });
		}
	},
	fetchAllProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products");
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		}
	},
	fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const response = await axios.get(`/products/category/${category}`);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		}
	},
	deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.filter((product) => product._id !== productId),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to delete product");
		}
	},
	toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`/products/${productId}`);
			// this will update the isFeatured prop of the product
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to update product");
		}
	},
	fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get("/products/featured");
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			console.log("Error fetching featured products:", error);
		}
	},
	searchTerm: "",
	filters: {
		brands: [],
		minPrice: 0,
		maxPrice: 1000000000,
		machineType: [],
		strapMaterial: [],
		colors: [],
		sizes: [],
		minRating: 0,
	},
	sort: "newest",
	currentPage: 1,
	totalPages: 1,
	suggestions: [],

	setSearchTerm: (term) => set({ searchTerm: term }),
	setFilters: (newFilters) => set((state) => {
		const updatedFilters = { ...state.filters, ...newFilters };
		return { filters: updatedFilters, currentPage: 1 }; // Reset page when filters change
	}),
	setSort: (newSort) => set({ sort: newSort, currentPage: 1 }), // Reset page when sort changes
	setPage: (page) => set({ currentPage: page }),

	// Fetch sản phẩm có lọc + phân trang + sắp xếp
	fetchFilteredProducts: async (extraParams = {}) => {
		set({ loading: true });
		const { searchTerm, filters, currentPage, sort } = get();

		const queryParams = {
			q: searchTerm || undefined,
			page: currentPage,
			limit: 12,
			sort: sort,
			category: extraParams.category,
			brands: filters.brands.join(","),
			minPrice: filters.minPrice,
			maxPrice: filters.maxPrice,
			machineType: filters.machineType.map(t => t.toLowerCase()).join(","),
			strapMaterial: filters.strapMaterial.join(","),
			colors: filters.colors.join(","),
			sizes: filters.sizes.join(","),
			minRating: filters.minRating || undefined,
		};

		const queryString = new URLSearchParams(
			Object.fromEntries(Object.entries(queryParams).filter(([_, v]) => v))
		).toString();

		try {
			const res = await axios.get(`/products?${queryString}`);
			set({
				products: res.data.products,
				totalPages: res.data.totalPages || 1,
				loading: false,
			});
		} catch (error) {
			toast.error("Lỗi tải sản phẩm");
			set({ loading: false });
		}
	},

	// Auto-suggest (gợi ý khi gõ)
	getSuggestions: async (query) => {
		if (!query || query.length < 2) {
			set({ suggestions: [] });
			return;
		}
		try {
			const res = await axios.get(`/products/suggestions?q=${query}`);
			set({ suggestions: res.data });
		} catch {
			set({ suggestions: [] });
		}
	},

	// Chi tiết sản phẩm
	currentProduct: null,

	fetchProductById: async (id) => {
		set({ loading: true });
		try {
			const res = await axios.get(`/products/${id}`);
			set({ currentProduct: res.data, loading: false });
		} catch (error) {
			toast.error("Không tìm thấy sản phẩm");
			set({ loading: false });
		}
	},
}));
