import { createWithEqualityFn } from "zustand/traditional";
import axios from "../lib/axios";
import toast from "react-hot-toast";

const FETCH_TTL_MS = 30000;
const lowStockState = { promise: null, lastFetched: 0 };

export const useInventoryStore = createWithEqualityFn((set, get) => ({
    lowStockProducts: [],
    inventoryLogs: [],
    loading: false,

    fetchLowStockProducts: async (force = false) => {
        const now = Date.now();
        if (!force && get().lowStockProducts.length > 0 && now - lowStockState.lastFetched < FETCH_TTL_MS) {
            return get().lowStockProducts;
        }
        if (lowStockState.promise) return lowStockState.promise;
        set({ loading: true });
        lowStockState.promise = axios
            .get("/inventory/low-stock")
            .then((res) => {
                set({ lowStockProducts: res.data, loading: false });
                lowStockState.lastFetched = Date.now();
                return res.data;
            })
            .catch((error) => {
                set({ loading: false });
                toast.error(error.response?.data?.message || "Failed to fetch low stock products");
                return get().lowStockProducts;
            })
            .finally(() => {
                lowStockState.promise = null;
            });
        return lowStockState.promise;
    },

    fetchProductLogs: async (productId) => {
        set({ loading: true });
        try {
            const res = await axios.get(`/inventory/product/${productId}`);
            set({ inventoryLogs: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to fetch logs");
        }
    },

    adjustStock: async (productId, action, quantity, note) => {
        set({ loading: true });
        try {
            const res = await axios.post("/inventory/adjust", {
                productId,
                action,
                quantity: Number(quantity),
                note
            });
            toast.success("Äiá»u chá»‰nh tá»“n kho thĂ nh cĂ´ng");
            set({ loading: false });
            return res.data.product; // Return updated product
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Lá»—i Ä‘iá»u chá»‰nh tá»“n kho");
            throw error;
        }
    }
}));

