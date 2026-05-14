import { useState } from "react";
import { useProductStore } from "../stores/useProductStore";
import { useNavigate } from "react-router-dom";

const SearchBarWithSuggestions = () => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { searchTerm, setSearchTerm, suggestions, getSuggestions } = useProductStore();
    const navigate = useNavigate();

    const handleChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        getSuggestions(value);
        setShowSuggestions(true);
    };

    const handleSelect = (suggestion) => {
        setSearchTerm(suggestion.name);
        setShowSuggestions(false);
        navigate(`/catalog?q=${suggestion.name}`);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            setShowSuggestions(false);
            navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    const handleSearchClick = () => {
        if (searchTerm.trim()) {
            setShowSuggestions(false);
            navigate(`/catalog?q=${encodeURIComponent(searchTerm.trim())}`);
        }
    };

    return (
        <div className="relative max-w-3xl mx-auto">
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Tìm kiếm đồng hồ... (ví dụ: Rolex Daytona)"
                    className="w-full bg-gray-100 dark:bg-zinc-900 border border-gray-200 dark:border-yellow-900 focus:border-yellow-400 text-gray-900 dark:text-white pl-6 pr-12 py-5 rounded-2xl text-lg placeholder-gray-400"
                />
                <button onClick={handleSearchClick} className="absolute right-6 top-1/2 -translate-y-1/2 text-yellow-400">🔎</button>
            </div>

            {/* Dropdown gợi ý */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-yellow-900 rounded-2xl overflow-hidden shadow-2xl z-50">
                    {suggestions.slice(0, 5).map((item) => (
                        <div
                            key={item._id}
                            onClick={() => handleSelect(item)}
                            className="flex items-center gap-4 px-6 py-4 hover:bg-gray-100 dark:hover:bg-zinc-800 cursor-pointer border-b border-gray-100 dark:border-zinc-800 last:border-none"
                        >
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                            <div className="flex-1">
                                <div className="font-medium text-gray-900 dark:text-white">{item.name}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {typeof item.brand === 'object' ? item.brand?.name : item.brand}
                                </div>
                            </div>
                            <div className="text-yellow-400 font-semibold">
                                {item.price.toLocaleString("vi-VN")}đ
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchBarWithSuggestions;