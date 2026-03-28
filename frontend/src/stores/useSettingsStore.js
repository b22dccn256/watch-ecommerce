import { create } from 'zustand';

const defaultLang = localStorage.getItem('lang') || 'vi';
const defaultCurrency = localStorage.getItem('currency') || 'vnd';

export const useSettingsStore = create((set) => ({
  lang: defaultLang,
  currency: defaultCurrency,
  setLang: (lang) => {
    localStorage.setItem('lang', lang);
    set({ lang });
  },
  setCurrency: (currency) => {
    localStorage.setItem('currency', currency);
    set({ currency });
  },
}));
