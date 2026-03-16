import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ITALY_HOTELS, distanceKm, getCompetitorsWithin20km } from "../demo/italyHotels";
import type { ItalyHotel } from "../demo/italyHotels";
import { generateDemoComparisonForHotel } from "../demo/demoData";

// ─── Custom marker icons ──────────────────────────────────────────────────────

function makeIcon(bg: string, border: string, label: string) {
  return L.divIcon({
    className: "",
    html: `<div style="
      width:30px;height:30px;border-radius:50%;
      background:${bg};border:3px solid ${border};
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
      font-size:13px;color:white;font-weight:700;line-height:1;
      cursor:pointer;
    ">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

const ICONS = {
  default:    makeIcon("#9CA3AF", "#ffffff", "H"),
  selected:   makeIcon("#0D9488", "#ffffff", "★"),
  competitor: makeIcon("#F59E0B", "#ffffff", "C"),
};

// ─── Fly-to helper ────────────────────────────────────────────────────────────

function FlyTo({ hotel }: { hotel: ItalyHotel | null }) {
  const map = useMap();
  useEffect(() => {
    if (hotel) map.flyTo([hotel.lat, hotel.lng], 13, { duration: 1.2 });
  }, [hotel, map]);
  return null;
}

// ─── Stars renderer ───────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ─── Search box (panel) ───────────────────────────────────────────────────────

function HotelSearchBox({ onSelect }: { onSelect: (h: ItalyHotel) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen]   = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef  = useRef<HTMLInputElement>(null);
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
    <div style={{ position: "relative" }}>
      {/* Input */}
      <div style={{ position: "relative" }}>
        <span style={{
          position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
          color: "#9CA3AF", fontSize: 15, pointerEvents: "none",
        }}>🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Cerca hotel o città..."
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setCursor(-1); }}
          onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
          onBlur={() => { closeTimer.current = setTimeout(() => setOpen(false), 150); }}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%", boxSizing: "border-box",
            paddingLeft: 32, paddingRight: query ? 28 : 10, paddingTop: 9, paddingBottom: 9,
            border: "1px solid #E5E7EB",
            borderRadius: open && suggestions.length ? "8px 8px 0 0" : 8,
            fontSize: 13, outline: "none", background: "white",
            transition: "border-color 0.15s",
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16,
            }}
          >×</button>
        )}
      </div>

      {/* Dropdown — absolute so it overlaps the panel content below */}
      {open && suggestions.length > 0 && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: "absolute", top: "100%", left: 0, right: 0,
            zIndex: 50,
            margin: 0, padding: 0, listStyle: "none",
            background: "white",
            border: "1px solid #E5E7EB", borderTop: "none",
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            maxHeight: 300, overflowY: "auto",
          }}
        >
          {suggestions.map((h, i) => (
            <li
              key={h.id}
              onClick={() => { clearTimeout(closeTimer.current!); pick(h); }}
              onMouseEnter={() => setCursor(i)}
              style={{
                padding: "8px 12px", cursor: "pointer",
                background: cursor === i ? "#F0FDFA" : "white",
                borderTop: i > 0 ? "1px solid #F9FAFB" : "none",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {h.name}
                </div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{h.city} · {h.region}</div>
              </div>
              <div style={{ fontSize: 11, color: "#F59E0B", whiteSpace: "nowrap", flexShrink: 0 }}>
                {"★".repeat(h.stars)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim() && suggestions.length === 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
          background: "white", border: "1px solid #E5E7EB", borderTop: "none",
          borderRadius: "0 0 8px 8px", padding: "10px 14px", fontSize: 13, color: "#9CA3AF",
        }}>
          Nessun hotel trovato
        </div>
      )}
    </div>
  );
}

// ─── Price comparison mini-table ──────────────────────────────────────────────

function ComparisonTable({ selected, competitors }: { selected: ItalyHotel; competitors: ItalyHotel[] }) {
  const rows = useMemo(
    () => generateDemoComparisonForHotel(selected, competitors),
    [selected, competitors]
  );
  const otas = ["booking", "expedia", "hotels_com", "agoda"];
  const otaLabels: Record<string, string> = {
    booking: "Booking", expedia: "Expedia", hotels_com: "Hotels.com", agoda: "Agoda",
  };

  return (
    <div className="overflow-x-auto mt-3">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-2 py-1.5 text-gray-600 font-medium border-b border-gray-200">Hotel</th>
            {otas.map((ota) => (
              <th key={ota} className="text-right px-2 py-1.5 text-gray-600 font-medium border-b border-gray-200 whitespace-nowrap">
                {otaLabels[ota]}
              </th>
            ))}
            <th className="text-right px-2 py-1.5 text-gray-600 font-medium border-b border-gray-200">Min</th>
            <th className="text-center px-2 py-1.5 text-gray-600 font-medium border-b border-gray-200">#</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.hotel_key} className={row.is_own_hotel ? "bg-teal-50" : "hover:bg-gray-50"}>
              <td className="px-2 py-1.5 border-b border-gray-100 max-w-[130px]">
                <span className="truncate block text-gray-800 font-medium">
                  {row.is_own_hotel ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="bg-teal-600 text-white text-[10px] px-1 py-0.5 rounded font-bold">Tu</span>
                      {row.hotel_name}
                    </span>
                  ) : row.hotel_name}
                </span>
              </td>
              {otas.map((ota) => (
                <td key={ota} className="text-right px-2 py-1.5 border-b border-gray-100 text-gray-700">
                  {row.ota_prices[ota] != null ? `€${row.ota_prices[ota]}` : "—"}
                </td>
              ))}
              <td className="text-right px-2 py-1.5 border-b border-gray-100 font-semibold text-gray-900">
                €{row.min_price}
              </td>
              <td className="text-center px-2 py-1.5 border-b border-gray-100">
                <span className={`inline-block w-5 h-5 rounded-full text-white text-[10px] font-bold leading-5 ${
                  row.rank === 1 ? "bg-teal-500" : row.rank <= 3 ? "bg-amber-400" : "bg-gray-300"
                }`}>
                  {row.rank}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoMap() {
  const { loginDemo } = useAuth();
  const navigate      = useNavigate();
  const [selected, setSelected] = useState<ItalyHotel | null>(null);

  const competitors = useMemo(
    () => (selected ? getCompetitorsWithin20km(selected) : []),
    [selected]
  );

  const handleStart = () => {
    if (!selected) return;
    loginDemo(selected);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-teal-600">RateScope</span>
          <span className="hidden sm:block text-sm text-gray-400">|</span>
          <span className="hidden sm:block text-sm text-gray-500">Demo interattiva</span>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Torna al login
        </button>
      </header>

      {/* Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800 shrink-0">
        <strong>Scegli il tuo hotel</strong> sulla mappa — oppure cercalo con la barra di ricerca — per vedere i competitor nel raggio di 20 km
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* MAP */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 relative">
          <MapContainer
            center={[44.55, 11.42]}
            zoom={10}
            style={{ height: "100%", width: "100%", minHeight: "400px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo hotel={selected} />

            {selected && (
              <Circle
                center={[selected.lat, selected.lng]}
                radius={20000}
                pathOptions={{ color: "#0D9488", fillColor: "#0D9488", fillOpacity: 0.06, weight: 1.5 }}
              />
            )}

            {ITALY_HOTELS.map((hotel) => {
              const isSelected = selected?.id === hotel.id;
              const isComp     = !isSelected && competitors.some((c) => c.id === hotel.id);
              const icon       = isSelected ? ICONS.selected : isComp ? ICONS.competitor : ICONS.default;
              return (
                <Marker
                  key={hotel.id}
                  position={[hotel.lat, hotel.lng]}
                  icon={icon}
                  eventHandlers={{ click: () => setSelected(hotel) }}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{hotel.name}</p>
                      <p style={{ fontSize: 11, color: "#6B7280" }}>{hotel.city}</p>
                      <p style={{ fontSize: 11, color: "#F59E0B" }}>{"★".repeat(hotel.stars)}</p>
                      <p style={{ fontSize: 12, color: "#0D9488", fontWeight: 600 }}>da €{hotel.basePrice}/notte</p>
                      <button
                        onClick={() => setSelected(hotel)}
                        style={{ marginTop: 6, width: "100%", background: "#0D9488", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                      >
                        Seleziona
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* SIDE PANEL */}
        <aside className="w-full lg:w-[420px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col overflow-y-auto">

          {/* Search bar — sempre visibile in cima al pannello */}
          <div className="p-3 border-b border-gray-100">
            <HotelSearchBox onSelect={setSelected} />
          </div>

          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Scegli il tuo hotel</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Cerca per nome o città, oppure clicca direttamente sulla mappa.{" "}
                <strong>{ITALY_HOTELS.length} hotel</strong> nelle province di Modena, Bologna, Ferrara e Ravenna.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400 text-left">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-teal-500 shrink-0"></span>
                  Hotel selezionato (il tuo)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-amber-400 shrink-0"></span>
                  Competitor (entro 20 km)
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-gray-400 shrink-0"></span>
                  Altri hotel
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">

              {/* Selected card */}
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium text-teal-600 uppercase tracking-wide mb-0.5">Il tuo hotel</p>
                    <h2 className="text-base font-bold text-gray-900 leading-tight">{selected.name}</h2>
                    <p className="text-sm text-gray-500">{selected.city}, {selected.region}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Stars n={selected.stars} />
                      <span className="text-xs text-gray-400">{selected.stars} stelle</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0"
                  >✕</button>
                </div>
                <p className="mt-2 text-sm text-teal-700 font-semibold">
                  Prezzo base: €{selected.basePrice}/notte
                </p>
              </div>

              {/* Competitors */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Competitor nel raggio di 20 km
                  <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {competitors.length}
                  </span>
                </h3>
                {competitors.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nessun competitor trovato nel raggio di 20 km.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {competitors.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-100 transition-colors"
                        onClick={() => setSelected(c)}
                      >
                        <div>
                          <p className="text-xs font-medium text-gray-800">{c.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Stars n={c.stars} />
                            <span className="text-[10px] text-gray-400">
                              {distanceKm(selected.lat, selected.lng, c.lat, c.lng).toFixed(1)} km
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600">€{c.basePrice}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Price comparison */}
              {competitors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-1">Confronto prezzi OTA</h3>
                  <p className="text-xs text-gray-400 mb-2">Prezzi stimati per domani notte</p>
                  <ComparisonTable selected={selected} competitors={competitors} />
                </div>
              )}

              {/* CTA */}
              <div className="sticky bottom-0 bg-white pt-2 pb-1 border-t border-gray-100 mt-auto">
                <button
                  onClick={handleStart}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
                >
                  Inizia demo con "{selected.name}" →
                </button>
                <p className="text-center text-xs text-gray-400 mt-1.5">
                  Vedrai dashboard, alert e storico prezzi in modalità demo
                </p>
              </div>

            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
