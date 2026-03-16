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
  default:              makeIcon("#9CA3AF", "#ffffff", "H"),
  selected:             makeIcon("#0D9488", "#ffffff", "★"),
  competitor_checked:   makeIcon("#F59E0B", "#ffffff", "C"),
  competitor_unchecked: makeIcon("#D1D5DB", "#F59E0B", "C"),
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

// ─── Search box ───────────────────────────────────────────────────────────────

function HotelSearchBox({ onSelect }: { onSelect: (h: ItalyHotel) => void }) {
  const [query, setQuery]   = useState("");
  const [open, setOpen]     = useState(false);
  const [cursor, setCursor] = useState(-1);
  const inputRef   = useRef<HTMLInputElement>(null);
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

  const pick = useCallback((h: ItalyHotel) => {
    setQuery(h.name);
    setOpen(false);
    setCursor(-1);
    onSelect(h);
  }, [onSelect]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && cursor >= 0) { e.preventDefault(); pick(suggestions[cursor]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#9CA3AF", fontSize: 15, pointerEvents: "none" }}>🔍</span>
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
          }}
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
            style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9CA3AF", fontSize: 16 }}
          >×</button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul
          onMouseDown={(e) => e.preventDefault()}
          style={{
            position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50,
            margin: 0, padding: 0, listStyle: "none", background: "white",
            border: "1px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 300, overflowY: "auto",
          }}
        >
          {suggestions.map((h, i) => (
            <li key={h.id} onClick={() => { clearTimeout(closeTimer.current!); pick(h); }} onMouseEnter={() => setCursor(i)}
              style={{ padding: "8px 12px", cursor: "pointer", background: cursor === i ? "#F0FDFA" : "white", borderTop: i > 0 ? "1px solid #F9FAFB" : "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.name}</div>
                <div style={{ fontSize: 11, color: "#6B7280" }}>{h.city} · {h.region}</div>
              </div>
              <div style={{ fontSize: 11, color: "#F59E0B", whiteSpace: "nowrap", flexShrink: 0 }}>{"★".repeat(h.stars)}</div>
            </li>
          ))}
        </ul>
      )}
      {open && query.trim() && suggestions.length === 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 50, background: "white", border: "1px solid #E5E7EB", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "10px 14px", fontSize: 13, color: "#9CA3AF" }}>
          Nessun hotel trovato
        </div>
      )}
    </div>
  );
}

// ─── Price comparison mini-table ──────────────────────────────────────────────

function ComparisonTable({ selected, competitors }: { selected: ItalyHotel; competitors: ItalyHotel[] }) {
  const rows = useMemo(() => generateDemoComparisonForHotel(selected, competitors), [selected, competitors]);
  const otas = ["booking", "expedia", "hotels_com", "agoda"];
  const otaLabels: Record<string, string> = { booking: "Booking", expedia: "Expedia", hotels_com: "Hotels.com", agoda: "Agoda" };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left px-2 py-1.5 text-gray-600 font-medium border-b border-gray-200">Hotel</th>
            {otas.map((ota) => (
              <th key={ota} className="text-right px-2 py-1.5 text-gray-600 font-medium border-b border-gray-200 whitespace-nowrap">{otaLabels[ota]}</th>
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
                  {row.is_own_hotel
                    ? <span className="inline-flex items-center gap-1"><span className="bg-teal-600 text-white text-[10px] px-1 py-0.5 rounded font-bold">Tu</span>{row.hotel_name}</span>
                    : row.hotel_name}
                </span>
              </td>
              {otas.map((ota) => (
                <td key={ota} className="text-right px-2 py-1.5 border-b border-gray-100 text-gray-700">
                  {row.ota_prices[ota] != null ? `€${row.ota_prices[ota]}` : "—"}
                </td>
              ))}
              <td className="text-right px-2 py-1.5 border-b border-gray-100 font-semibold text-gray-900">€{row.min_price}</td>
              <td className="text-center px-2 py-1.5 border-b border-gray-100">
                <span className={`inline-block w-5 h-5 rounded-full text-white text-[10px] font-bold leading-5 ${row.rank === 1 ? "bg-teal-500" : row.rank <= 3 ? "bg-amber-400" : "bg-gray-300"}`}>
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

  const [selected, setSelected]                     = useState<ItalyHotel | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<Set<string>>(new Set());

  // All hotels within 20km of the chosen hotel
  const allCompetitors = useMemo(
    () => (selected ? getCompetitorsWithin20km(selected) : []),
    [selected]
  );

  // Pre-select all competitors when hotel changes
  useEffect(() => {
    if (!selected) { setSelectedCompetitorIds(new Set()); return; }
    const comps = getCompetitorsWithin20km(selected);
    setSelectedCompetitorIds(new Set(comps.map((c) => c.id)));
  }, [selected]);

  // Only the competitors the user has checked
  const checkedCompetitors = useMemo(
    () => allCompetitors.filter((c) => selectedCompetitorIds.has(c.id)),
    [allCompetitors, selectedCompetitorIds]
  );

  const toggleCompetitor = (id: string) => {
    setSelectedCompetitorIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedCompetitorIds.size === allCompetitors.length) {
      setSelectedCompetitorIds(new Set());
    } else {
      setSelectedCompetitorIds(new Set(allCompetitors.map((c) => c.id)));
    }
  };

  const handleStart = () => {
    if (!selected) return;
    loginDemo(selected, checkedCompetitors);
    navigate("/dashboard");
  };

  const allChecked = allCompetitors.length > 0 && selectedCompetitorIds.size === allCompetitors.length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-teal-600">RateScope</span>
          <span className="hidden sm:block text-sm text-gray-400">|</span>
          <span className="hidden sm:block text-sm text-gray-500">Demo interattiva</span>
        </div>
        <button onClick={() => navigate("/login")} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Torna al login
        </button>
      </header>

      {/* Banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800 shrink-0">
        <strong>1. Scegli il tuo hotel</strong> &nbsp;→&nbsp; <strong>2. Seleziona i competitor</strong> &nbsp;→&nbsp; <strong>3. Inizia la demo</strong>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* MAP */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 relative">
          <MapContainer center={[44.55, 11.42]} zoom={10} style={{ height: "100%", width: "100%", minHeight: "400px" }}>
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
              const isMyHotel  = selected?.id === hotel.id;
              const isInRange  = !isMyHotel && allCompetitors.some((c) => c.id === hotel.id);
              const isChecked  = isInRange && selectedCompetitorIds.has(hotel.id);
              const icon = isMyHotel  ? ICONS.selected
                         : isChecked  ? ICONS.competitor_checked
                         : isInRange  ? ICONS.competitor_unchecked
                         :              ICONS.default;
              return (
                <Marker key={hotel.id} position={[hotel.lat, hotel.lng]} icon={icon}
                  eventHandlers={{ click: () => { if (!isInRange) setSelected(hotel); else toggleCompetitor(hotel.id); } }}>
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <p style={{ fontWeight: 700, fontSize: 13 }}>{hotel.name}</p>
                      <p style={{ fontSize: 11, color: "#6B7280" }}>{hotel.city}</p>
                      <p style={{ fontSize: 11, color: "#F59E0B" }}>{"★".repeat(hotel.stars)}</p>
                      <p style={{ fontSize: 12, color: "#0D9488", fontWeight: 600 }}>da €{hotel.basePrice}/notte</p>
                      {!isInRange && (
                        <button
                          onClick={() => setSelected(hotel)}
                          style={{ marginTop: 6, width: "100%", background: "#0D9488", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                        >
                          Usa come mio hotel
                        </button>
                      )}
                      {isInRange && (
                        <button
                          onClick={() => toggleCompetitor(hotel.id)}
                          style={{ marginTop: 6, width: "100%", background: isChecked ? "#F59E0B" : "#E5E7EB", color: isChecked ? "white" : "#374151", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer" }}
                        >
                          {isChecked ? "✓ Incluso nel confronto" : "+ Aggiungi al confronto"}
                        </button>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

        {/* SIDE PANEL */}
        <aside className="w-full lg:w-[420px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col overflow-y-auto">

          {/* Search bar */}
          <div className="p-3 border-b border-gray-100">
            <HotelSearchBox onSelect={setSelected} />
          </div>

          {!selected ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Scegli il tuo hotel</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Cerca per nome o città, oppure clicca sulla mappa.{" "}
                <strong>{ITALY_HOTELS.length} hotel</strong> nelle province di Modena, Bologna, Ferrara e Ravenna.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400 text-left">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-teal-500 shrink-0"></span>Il tuo hotel</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-amber-400 shrink-0"></span>Competitor selezionato</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-amber-400 bg-gray-200 shrink-0"></span>Competitor non selezionato</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-gray-400 shrink-0"></span>Altri hotel</div>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-4">

              {/* ── Mio hotel ── */}
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
                  <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0">✕</button>
                </div>
                <p className="mt-2 text-sm text-teal-700 font-semibold">Prezzo base: €{selected.basePrice}/notte</p>
              </div>

              {/* ── Competitor con checkbox ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Competitor entro 20 km
                    <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                      {allCompetitors.length}
                    </span>
                  </h3>
                  {allCompetitors.length > 0 && (
                    <button onClick={toggleAll} className="text-xs text-teal-600 hover:underline">
                      {allChecked ? "Deseleziona tutti" : "Seleziona tutti"}
                    </button>
                  )}
                </div>

                {allCompetitors.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Nessun competitor nel raggio di 20 km.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {allCompetitors.map((c) => {
                      const checked = selectedCompetitorIds.has(c.id);
                      return (
                        <li
                          key={c.id}
                          onClick={() => toggleCompetitor(c.id)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer border transition-colors ${
                            checked
                              ? "bg-amber-50 border-amber-200 hover:bg-amber-100"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          {/* Checkbox */}
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked ? "bg-amber-400 border-amber-400" : "border-gray-300 bg-white"
                          }`}>
                            {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                          </div>
                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium truncate ${checked ? "text-gray-800" : "text-gray-400"}`}>{c.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Stars n={c.stars} />
                              <span className="text-[10px] text-gray-400">
                                {distanceKm(selected.lat, selected.lng, c.lat, c.lng).toFixed(1)} km
                              </span>
                            </div>
                          </div>
                          <span className={`text-xs font-semibold shrink-0 ${checked ? "text-gray-700" : "text-gray-300"}`}>
                            €{c.basePrice}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {allCompetitors.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400 text-right">
                    {selectedCompetitorIds.size} di {allCompetitors.length} selezionati
                  </p>
                )}
              </div>

              {/* ── Anteprima confronto ── */}
              {checkedCompetitors.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-0.5">
                    Anteprima confronto prezzi
                  </h3>
                  <p className="text-xs text-gray-400 mb-2">Prezzi stimati per domani notte</p>
                  <ComparisonTable selected={selected} competitors={checkedCompetitors} />
                </div>
              )}

              {/* ── CTA ── */}
              <div className="sticky bottom-0 bg-white pt-2 pb-1 border-t border-gray-100 mt-auto">
                <button
                  onClick={handleStart}
                  disabled={!selected}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
                >
                  Inizia demo con {checkedCompetitors.length} competitor →
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
