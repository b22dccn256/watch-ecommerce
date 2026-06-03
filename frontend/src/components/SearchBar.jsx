import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { useProductStore } from "../stores/useProductStore";

const SearchBar = ({ placeholder = "Tìm đồng hồ, thương hiệu, mã..." }) => {
  const [q, setQ] = useState("");
  const { suggestions, getSuggestions, setSearchTerm } = useProductStore();
  const navigate = useNavigate();

  useEffect(() => {
    const id = setTimeout(() => {
      if (q && q.length >= 2) getSuggestions(q);
    }, 250);
    return () => clearTimeout(id);
  }, [q, getSuggestions]);

  const onSubmit = (e) => {
    e && e.preventDefault();
    setSearchTerm(q);
    navigate(`/catalog?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm shadow-sm focus:outline-none focus:border-[color:var(--color-gold)]"
        />
      </div>
      {suggestions?.length > 0 && q.length >= 2 && (
        <div className="mt-2 rounded-md border bg-white">
          {suggestions.slice(0, 6).map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => {
                setQ(s.name);
                onSubmit();
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </form>
  );
};

export default SearchBar;
