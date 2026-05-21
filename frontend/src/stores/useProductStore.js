import { createWithEqualityFn } from "zustand/traditional";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const FETCH_TTL_MS = 60000;
const fetchState = {
	brands: { promise: null, lastFetched: 0 },
	categories: { promise: null, lastFetched: 0 },
	allProducts: { promise: null, lastFetched: 0 },
	featured: { promise: null, lastFetched: 0 },
	adminPage: { promise: null, lastKey: "", lastFetched: 0 },
};

export const useProductStore = createWithEqualityFn((set, get) => ({
	products: [],
	allProducts: [],
	brands: [],
	categories: [],
	loading: false,

	fetchBrands: async (force = false) => {
		const now = Date.now();
		if (!force && get().brands.length > 0 && now - fetchState.brands.lastFetched < FETCH_TTL_MS) {
			return get().brands;
		}
		if (fetchState.brands.promise) return fetchState.brands.promise;
		fetchState.brands.promise = axios
			.get("/brands")
			.then((res) => {
				set({ brands: res.data });
				fetchState.brands.lastFetched = Date.now();
				return res.data;
			})
			.catch((error) => {
				console.error("Error fetching brands", error);
				return get().brands;
			})
			.finally(() => {
				fetchState.brands.promise = null;
			});
		return fetchState.brands.promise;
	},

	fetchCategories: async (force = false) => {
		const now = Date.now();
		if (!force && get().categories.length > 0 && now - fetchState.categories.lastFetched < FETCH_TTL_MS) {
			return get().categories;
		}
		if (fetchState.categories.promise) return fetchState.categories.promise;
		fetchState.categories.promise = axios
			.get("/categories?tree=false")
			.then((res) => {
				set({ categories: res.data });
				fetchState.categories.lastFetched = Date.now();
				return res.data;
			})
			.catch((error) => {
				console.error("Error fetching categories", error);
				return get().categories;
			})
			.finally(() => {
				fetchState.categories.promise = null;
			});
		return fetchState.categories.promise;
	},

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
	updateProduct: async (productId, productData) => {
		set({ loading: true });
		try {
			const res = await axios.put(`/products/${productId}`, productData);
			set((prevState) => ({
				products: prevState.products.map((p) =>
					p._id === productId ? { ...p, ...res.data } : p
				),
				loading: false,
			}));
			toast.success("Cập nhật sản phẩm thành công");
		} catch (error) {
			toast.error(error.response?.data?.error || "Lỗi khi cập nhật sản phẩm");
			set({ loading: false });
		}
	},
	fetchAllProducts: async (force = false) => {
		const now = Date.now();
		if (!force && get().allProducts.length > 0 && now - fetchState.allProducts.lastFetched < FETCH_TTL_MS) {
			return get().allProducts;
		}
		if (fetchState.allProducts.promise) return fetchState.allProducts.promise;
		set({ loading: true });
		fetchState.allProducts.promise = axios
			.get("/products")
			.then((response) => {
				const nextProducts = response.data.products || response.data;
				set({ allProducts: nextProducts, loading: false });
				fetchState.allProducts.lastFetched = Date.now();
				return nextProducts;
			})
			.catch((error) => {
				set({ error: "Failed to fetch products", loading: false });
				toast.error(error.response?.data?.error || "Failed to fetch products");
				return get().allProducts;
			})
			.finally(() => {
				fetchState.allProducts.promise = null;
			});
		return fetchState.allProducts.promise;
	},
	fetchProductsAdminPaginated: async ({ page = 1, limit = 12, search = "", category = "", sort = "" }) => {
		const key = `${page}|${limit}|${search}|${category}|${sort}`;
		const now = Date.now();
		if (fetchState.adminPage.promise && fetchState.adminPage.lastKey === key) return;
		if (fetchState.adminPage.lastKey === key && now - fetchState.adminPage.lastFetched < 1000) return;

		set({ loading: true });
		fetchState.adminPage.lastKey = key;
		fetchState.adminPage.promise = (async () => {
		try {
			let url = `/products?page=${page}&limit=${limit}`;
			if (search) url += `&q=${encodeURIComponent(search)}`;
			if (category) url += `&category=${encodeURIComponent(category)}`;
			if (sort) url += `&sort=${encodeURIComponent(sort)}`;

			const response = await axios.get(url);
			set({ 
				products: response.data.products, 
				totalPages: response.data.totalPages || 1,
				currentPage: response.data.currentPage || page,
				totalCount: response.data.totalCount ?? response.data.total ?? (response.data.products?.length || 0),
				loading: false 
			});
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.error || "Lỗi khi lấy danh sách sản phẩm.");
		} finally {
			fetchState.adminPage.lastFetched = Date.now();
			fetchState.adminPage.promise = null;
		}
		})();
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
	fetchFeaturedProducts: async (force = false) => {
		const now = Date.now();
		if (!force && now - fetchState.featured.lastFetched < FETCH_TTL_MS) {
			return get().products;
		}
		if (fetchState.featured.promise) return fetchState.featured.promise;
		set({ loading: true });
		fetchState.featured.promise = axios
			.get("/products/featured")
			.then((response) => {
				set({ products: response.data, loading: false });
				fetchState.featured.lastFetched = Date.now();
				return response.data;
			})
			.catch((error) => {
				set({ error: "Failed to fetch products", loading: false });
				console.error("Error fetching featured products:", error);
				return get().products;
			})
			.finally(() => {
				fetchState.featured.promise = null;
			});
		return fetchState.featured.promise;
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
	totalCount: 0,
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

		// Only send price filters when user has explicitly set them (differ from defaults)
		const effectiveMinPrice = filters.minPrice > 0 ? filters.minPrice : undefined;
		const effectiveMaxPrice = filters.maxPrice < 1_000_000_000 ? filters.maxPrice : undefined;

		const queryParams = {
			q: searchTerm || undefined,
			page: currentPage,
			limit: 12,
			sort: sort,
			category: extraParams.category,
			brands: filters.brands.join(","),
			minPrice: effectiveMinPrice,
			maxPrice: effectiveMaxPrice,
			machineType: filters.machineType.map(t => t.toLowerCase()).join(","),
			strapMaterial: filters.strapMaterial.join(","),
			colors: filters.colors.join(","),
			sizes: filters.sizes.join(","),
			minRating: filters.minRating || undefined,
		};

		const queryString = new URLSearchParams(
			Object.fromEntries(Object.entries(queryParams).filter(([, v]) => v))
		).toString();

		try {
			const res = await axios.get(`/products?${queryString}`);
			set({
				products: res.data.products,
				totalPages: res.data.totalPages || 1,
				totalCount: res.data.totalCount ?? res.data.total ?? (res.data.products?.length || 0),
				loading: false,
			});
		} catch {
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
		} catch {
			toast.error("Không tìm thấy sản phẩm");
			set({ loading: false });
		}
	},
}));
