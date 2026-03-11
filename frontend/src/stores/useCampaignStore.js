import { create } from "zustand";
import toast from "react-hot-toast";
import axios from "../lib/axios";

export const useCampaignStore = create((set) => ({
    campaigns: [],
    loading: false,

    fetchCampaigns: async () => {
        set({ loading: true });
        try {
            const res = await axios.get("/campaigns");
            set({ campaigns: res.data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || "Lỗi khi lấy danh sách chiến dịch", loading: false });
            toast.error(error.response?.data?.message || "Lỗi khi lấy danh sách chiến dịch");
        }
    },

    createCampaign: async (campaignData) => {
        set({ loading: true });
        try {
            const res = await axios.post("/campaigns", campaignData);
            set((prevState) => ({
                campaigns: [res.data, ...prevState.campaigns],
                loading: false,
            }));
            toast.success("Tạo chiến dịch thành công");
            return { success: true };
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Lỗi tạo chiến dịch");
            return { success: false };
        }
    },

    toggleCampaignStatus: async (campaignId) => {
        try {
            const res = await axios.patch(`/campaigns/${campaignId}`);
            set((prevState) => ({
                campaigns: prevState.campaigns.map((camp) =>
                    camp._id === campaignId ? res.data : camp
                ),
            }));
            toast.success("Đã cập nhật trạng thái");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi cập nhật chiến dịch");
        }
    },

    deleteCampaign: async (campaignId) => {
        try {
            await axios.delete(`/campaigns/${campaignId}`);
            set((prevState) => ({
                campaigns: prevState.campaigns.filter((camp) => camp._id !== campaignId),
            }));
            toast.success("Đã xoá chiến dịch");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi xoá chiến dịch");
        }
    },
}));
