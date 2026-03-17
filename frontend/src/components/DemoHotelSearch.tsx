import { useState, useMemo, useRef, useCallback } from "react";
import { ITALY_HOTELS, type ItalyHotel } from "../demo/italyHotels";

interface DemoHotelSearchProps {
  onSelect: (hotel: ItalyHotel) => void;
  placeholder?: string;
}

export default function DemoHotelSearch({
  onSelect,
  placeholder = "Cerca hotel o città...",
}: DemoHotelSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return ITALY_HOTELS.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.region.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  const pick = useCallback(
    (h: ItalyHotel) => {
      setQuery(h.name);
      setOpen(false);
      setCursor(-1);
      onSelect(h);
    },
    [onSelect]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && cursor >= 0) {
      e.preventDefault();
      pick(suggestions[cursor]);
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
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setCursor(-1);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true);
          }}
          onBlur={() => {
            closeTimer.current = setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
          className={`w-full border border-gray-200 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white ${
            open && suggestions.length > 0 ? "rounded-b-none" : ""
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 border-t-0 rounded-b-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((h, i) => (
            <li
              key={h.id}
              onClick={() => {
                if (closeTimer.current) clearTimeout(closeTimer.current);
                pick(h);
              }}
              onMouseEnter={() => setCursor(i)}
              className={`flex items-center justify-between gap-2 px-3 py-2 cursor-pointer ${
                i > 0 ? "border-t border-gray-50" : ""
              } ${cursor === i ? "bg-teal-50" : "hover:bg-gray-50"}`}
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">{h.name}</div>
                <div className="text-xs text-gray-500">
                  {h.city} · {h.region}
                </div>
              </div>
              <div className="text-xs text-amber-400 shrink-0">{"★".repeat(h.stars)}</div>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 border-t-0 rounded-b-lg px-3 py-2.5 text-sm text-gray-400">
          Nessun hotel trovato
        </div>
      )}
    </div>
  );
}
