import { create } from "zustand";
import axios from "../lib/axios";
import toast from "react-hot-toast";

export const useInventoryStore = create((set) => ({
    lowStockProducts: [],
    inventoryLogs: [],
    loading: false,

    fetchLowStockProducts: async () => {
        set({ loading: true });
        try {
            const res = await axios.get("/inventory/low-stock");
            set({ lowStockProducts: res.data, loading: false });
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to fetch low stock products");
        }
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
            toast.success("Điều chỉnh tồn kho thành công");
            set({ loading: false });
            return res.data.product; // Return updated product
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Lỗi điều chỉnh tồn kho");
            throw error;
        }
    }
}));
