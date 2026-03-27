import { useState, useCallback, useRef } from "react";
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
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await hotelsApi.search(q);
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setCursor(-1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => search(q), 400);
  };

  const handleSelect = (result: HotelSearchResult) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    onSelect(result);
    setQuery(result.name);
    setResults([]);
    setOpen(false);
    setCursor(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Always prevent Enter from bubbling to a parent <form> and submitting it
    if (e.key === "Enter") e.preventDefault();
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      handleSelect(results[cursor]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          onBlur={() => { closeTimer.current = setTimeout(() => setOpen(false), 150); }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`w-full border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${
            open && results.length > 0 ? "rounded-b-none" : ""
          }`}
        />
        {isLoading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-label="Ricerca in corso">
            <svg className="animate-spin h-4 w-4 text-teal-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </span>
        )}
        {query && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {results.map((r, i) => (
            <li
              key={r.hotel_key}
              onClick={() => handleSelect(r)}
              onMouseEnter={() => setCursor(i)}
              className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer ${
                i > 0 ? "border-t border-gray-50" : ""
              } ${cursor === i ? "bg-teal-50" : "hover:bg-gray-50"}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.name}</p>
                {(r.city || r.address) && (
                  <p className="text-xs text-gray-500">{r.city ?? r.address}</p>
                )}
                <p className="text-[10px] text-gray-300 font-mono">{r.hotel_key}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 border-t-0 rounded-b-lg px-3 py-2.5 text-sm text-gray-400">
          Nessun hotel trovato
        </div>
      )}
    </div>
  );
}
