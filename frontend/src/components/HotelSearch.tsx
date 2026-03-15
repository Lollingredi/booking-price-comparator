import { useState, useCallback } from "react";
import { hotelsApi } from "../api/hotels";
import type { HotelSearchResult } from "../types";

interface HotelSearchProps {
  onSelect: (result: HotelSearchResult) => void;
  placeholder?: string;
}

export default function HotelSearch({
  onSelect,
  placeholder = "Cerca hotel per nome...",
}: HotelSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HotelSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await hotelsApi.search(q);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    const t = setTimeout(() => search(q), 400);
    return () => clearTimeout(t);
  };

  const handleSelect = (result: HotelSearchResult) => {
    onSelect(result);
    setQuery(result.name);
    setResults([]);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
      />
      {isLoading && (
        <span className="absolute right-3 top-2.5 text-gray-400 text-xs">...</span>
      )}
      {results.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-xl shadow-lg mt-1 max-h-60 overflow-y-auto">
          {results.map((r) => (
            <li
              key={r.hotel_key}
              onClick={() => handleSelect(r)}
              className="px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
            >
              <p className="text-sm font-medium text-gray-800">{r.name}</p>
              {(r.city || r.address) && (
                <p className="text-xs text-gray-400">{r.city ?? r.address}</p>
              )}
              <p className="text-[10px] text-gray-300 font-mono">{r.hotel_key}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
