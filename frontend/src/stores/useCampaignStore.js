import { createWithEqualityFn } from "zustand/traditional";
import toast from "react-hot-toast";
import axios from "../lib/axios";

const FETCH_TTL_MS = 60000;
const fetchState = {
    campaigns: { promise: null, lastFetched: 0 },
    active: { promise: null, lastFetched: 0 },
};

export const useCampaignStore = createWithEqualityFn((set, get) => ({
    campaigns: [],
    loading: false,

    fetchCampaigns: async (force = false) => {
        const now = Date.now();
        if (!force && get().campaigns.length > 0 && now - fetchState.campaigns.lastFetched < FETCH_TTL_MS) {
            return get().campaigns;
        }
        if (fetchState.campaigns.promise) return fetchState.campaigns.promise;
        set({ loading: true });
        fetchState.campaigns.promise = axios
            .get("/campaigns")
            .then((res) => {
                set({ campaigns: res.data, loading: false });
                fetchState.campaigns.lastFetched = Date.now();
                return res.data;
            })
            .catch((error) => {
                set({ error: error.response?.data?.message || "Lá»—i khi láº¥y danh sĂ¡ch chiáº¿n dá»‹ch", loading: false });
                toast.error(error.response?.data?.message || "Lá»—i khi láº¥y danh sĂ¡ch chiáº¿n dá»‹ch");
                return get().campaigns;
            })
            .finally(() => {
                fetchState.campaigns.promise = null;
            });
        return fetchState.campaigns.promise;
    },

    fetchActiveCampaigns: async (force = false) => {
        const now = Date.now();
        if (!force && get().campaigns.length > 0 && now - fetchState.active.lastFetched < FETCH_TTL_MS) {
            return get().campaigns;
        }
        if (fetchState.active.promise) return fetchState.active.promise;
        fetchState.active.promise = axios
            .get("/campaigns/active")
            .then((res) => {
                set({ campaigns: res.data });
                fetchState.active.lastFetched = Date.now();
                return res.data;
            })
            .catch((error) => {
                console.error("Lá»—i khi láº¥y danh sĂ¡ch chiáº¿n dá»‹ch Ä‘ang cháº¡y:", error);
                return get().campaigns;
            })
            .finally(() => {
                fetchState.active.promise = null;
            });
        return fetchState.active.promise;
    },

    createCampaign: async (campaignData) => {
        set({ loading: true });
        try {
            const res = await axios.post("/campaigns", campaignData);
            set((prevState) => ({
                campaigns: [res.data, ...prevState.campaigns],
                loading: false,
            }));
            toast.success("Táº¡o chiáº¿n dá»‹ch thĂ nh cĂ´ng");
            return { success: true };
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Lá»—i táº¡o chiáº¿n dá»‹ch");
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
            toast.success("ÄĂ£ cáº­p nháº­t tráº¡ng thĂ¡i");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lá»—i cáº­p nháº­t chiáº¿n dá»‹ch");
        }
    },

    deleteCampaign: async (campaignId) => {
        try {
            await axios.delete(`/campaigns/${campaignId}`);
            set((prevState) => ({
                campaigns: prevState.campaigns.filter((camp) => camp._id !== campaignId),
            }));
            toast.success("ÄĂ£ xoĂ¡ chiáº¿n dá»‹ch");
        } catch (error) {
            toast.error(error.response?.data?.message || "Lá»—i xoĂ¡ chiáº¿n dá»‹ch");
        }
    },
}));

