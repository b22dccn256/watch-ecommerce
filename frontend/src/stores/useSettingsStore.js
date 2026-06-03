import { createWithEqualityFn } from "zustand/traditional";

const defaultLang = localStorage.getItem("lang") || "vi";
const defaultCurrency = localStorage.getItem("currency") || "vnd";

export const useSettingsStore = createWithEqualityFn((set) => ({
  lang: defaultLang,
  currency: defaultCurrency,
  setLang: (lang) => {
    localStorage.setItem("lang", lang);
    set({ lang });
  },
  setCurrency: (currency) => {
    localStorage.setItem("currency", currency);
    set({ currency });
  },
}));
