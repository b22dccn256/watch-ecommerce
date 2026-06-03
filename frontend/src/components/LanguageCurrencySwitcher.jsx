import { useState } from "react";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useThemeStore } from "../stores/useThemeStore";
import { Sun, Moon, ChevronDown } from "lucide-react";

const LanguageCurrencySwitcher = () => {
  const { lang, setLang, currency, setCurrency } = useSettingsStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);

  const flags = {
    en: "https://flagcdn.com/w40/us.png",
    vi: "https://flagcdn.com/w40/vn.png",
  };

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleLangChange = (newLang) => {
    setLang(newLang);
    setIsOpen(false);
  };

  return (
    <div className="flex gap-3 items-center relative">
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="p-1.5 rounded-lg bg-gray-100 dark:bg-[#18181b] text-gray-500 hover:text-luxury-gold dark:text-gray-400 dark:hover:text-luxury-gold transition-colors border border-gray-200 dark:border-luxury-border"
        title="Chuyển đổi giao diện"
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Language Custom Dropdown */}
      <div className="relative">
        <button
          onClick={toggleDropdown}
          className="flex items-center gap-1.5 bg-transparent border border-gray-300 dark:border-luxury-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-luxury-gold transition-colors cursor-pointer"
        >
          <img
            src={flags[lang]}
            alt={lang}
            className="w-5 h-5 rounded-full object-cover"
          />
          <ChevronDown
            size={14}
            className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-1 w-24 bg-white dark:bg-luxury-darker border border-gray-200 dark:border-luxury-border rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => handleLangChange("en")}
                className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-luxury-dark transition-colors ${lang === "en" ? "bg-gray-50 dark:bg-luxury-dark font-semibold" : ""}`}
              >
                <img
                  src={flags.en}
                  alt="EN"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-gray-700 dark:text-luxury-text-light">
                  EN
                </span>
              </button>
              <button
                onClick={() => handleLangChange("vi")}
                className={`flex items-center justify-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-luxury-dark transition-colors ${lang === "vi" ? "bg-gray-50 dark:bg-luxury-dark font-semibold" : ""}`}
              >
                <img
                  src={flags.vi}
                  alt="VN"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span className="text-gray-700 dark:text-luxury-text-light">
                  VN
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Currency Selector */}
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        className="bg-transparent border border-gray-300 dark:border-luxury-border text-gray-700 dark:text-luxury-text-light rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-luxury-gold transition-colors cursor-pointer appearance-none text-center"
      >
        <option
          value="vnd"
          className="text-black dark:text-white bg-white dark:bg-luxury-darker"
        >
          ₫
        </option>
        <option
          value="usd"
          className="text-black dark:text-white bg-white dark:bg-luxury-darker"
        >
          $
        </option>
      </select>
    </div>
  );
};

export default LanguageCurrencySwitcher;
