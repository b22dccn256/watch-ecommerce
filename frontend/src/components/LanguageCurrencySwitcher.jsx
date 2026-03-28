import React from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useThemeStore } from '../stores/useThemeStore';
import { Sun, Moon } from 'lucide-react';

const LanguageCurrencySwitcher = () => {
  const { lang, setLang, currency, setCurrency } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="flex gap-3 items-center">
      {/* Theme Toggle */}
      <button 
          onClick={toggleTheme} 
          className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#18181b] text-gray-500 hover:text-luxury-gold dark:text-gray-400 dark:hover:text-luxury-gold transition-colors border border-gray-200 dark:border-luxury-border"
          title="Chuyển đổi giao diện"
      >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <div className="flex gap-2 items-center">
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="bg-transparent border border-gray-300 dark:border-luxury-border text-gray-700 dark:text-luxury-text-light rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-luxury-gold transition-colors cursor-pointer appearance-none text-center"
        >
          <option value="vi" className="text-black dark:text-white bg-white dark:bg-luxury-darker">VN</option>
          <option value="en" className="text-black dark:text-white bg-white dark:bg-luxury-darker">EN</option>
        </select>
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          className="bg-transparent border border-gray-300 dark:border-luxury-border text-gray-700 dark:text-luxury-text-light rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-luxury-gold transition-colors cursor-pointer appearance-none text-center"
        >
          <option value="vnd" className="text-black dark:text-white bg-white dark:bg-luxury-darker">₫</option>
          <option value="usd" className="text-black dark:text-white bg-white dark:bg-luxury-darker">$</option>
        </select>
      </div>
    </div>
  );
};

export default LanguageCurrencySwitcher;
