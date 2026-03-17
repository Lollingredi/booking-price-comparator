import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from "react-leaflet";
import MarkerClusterGroup from "@changey/react-leaflet-markercluster";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ITALY_HOTELS, distanceKm, getCompetitorsWithin20km } from "../demo/italyHotels";
import type { ItalyHotel } from "../demo/italyHotels";
import { generateDemoComparisonForHotel } from "../demo/demoData";
import { hotelsApi } from "../api/hotels";

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
    if (hotel) map.flyTo([hotel.lat, hotel.lng], 14, { duration: 1.2 });
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

// ─── Step progress banner ─────────────────────────────────────────────────────

type StepState = "future" | "active" | "done";

function StepBanner({ hotelChosen, competitorsChosen }: { hotelChosen: boolean; competitorsChosen: boolean }) {
  const s1: StepState = hotelChosen ? "done" : "active";
  const s2: StepState = !hotelChosen ? "future" : competitorsChosen ? "done" : "active";
  const s3: StepState = competitorsChosen ? "active" : "future";

  function Chip({ n, label, state }: { n: number; label: string; state: StepState }) {
    const circle =
      state === "done"   ? "bg-teal-600 border-teal-600 text-white" :
      state === "active" ? "bg-teal-600 border-teal-600 text-white ring-4 ring-teal-100" :
                           "bg-white border-gray-300 text-gray-400";
    const text =
      state === "future" ? "text-gray-400" :
      state === "active" ? "text-teal-700 font-semibold" : "text-teal-600";
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 transition-all ${circle}`}>
          {state === "done" ? "✓" : n}
        </div>
        <span className={`text-xs hidden sm:inline transition-colors ${text}`}>{label}</span>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-center gap-1 shrink-0">
      <Chip n={1} label="Scegli il tuo hotel"    state={s1} />
      <span className="text-gray-300 text-sm mx-1 sm:mx-2">→</span>
      <Chip n={2} label="Seleziona i competitor" state={s2} />
      <span className="text-gray-300 text-sm mx-1 sm:mx-2">→</span>
      <Chip n={3} label="Avvia RateScope"        state={s3} />
    </div>
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
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", maxHeight: 280, overflowY: "auto",
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
    <div className="overflow-auto max-h-[220px]">
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0">
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
              <td className="px-2 py-1.5 border-b border-gray-100 max-w-[120px]">
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

export default function OnboardingMap() {
  const { completeOnboarding, logout } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected]                           = useState<ItalyHotel | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<Set<string>>(new Set());
  const [mobileView, setMobileView]                       = useState<"map" | "list">("map");
  const [isSaving, setIsSaving]                           = useState(false);
  const [saveError, setSaveError]                         = useState<string | null>(null);

  const allCompetitors = useMemo(
    () => (selected ? getCompetitorsWithin20km(selected) : []),
    [selected]
  );

  useEffect(() => {
    if (!selected) { setSelectedCompetitorIds(new Set()); return; }
    const comps = getCompetitorsWithin20km(selected);
    setSelectedCompetitorIds(new Set(comps.map((c) => c.id)));
  }, [selected]);

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

  const handleSelectHotel = (hotel: ItalyHotel) => {
    setSelected(hotel);
    setMobileView("list");
  };

  const handleStart = async () => {
    if (!selected) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      await hotelsApi.createOrUpdate({
        name: selected.name,
        xotelo_hotel_key: selected.xoteloKey,
        city: selected.city,
        stars: selected.stars,
      });
      for (const comp of checkedCompetitors) {
        await hotelsApi.addCompetitor({
          competitor_name: comp.name,
          competitor_xotelo_key: comp.xoteloKey,
          competitor_stars: comp.stars,
        });
      }
      completeOnboarding();
      navigate("/dashboard");
    } catch {
      setSaveError("Errore durante il salvataggio. Riprova.");
    } finally {
      setIsSaving(false);
    }
  };

  const allChecked = allCompetitors.length > 0 && selectedCompetitorIds.size === allCompetitors.length;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-teal-600">RateScope</span>
          <span className="hidden sm:block text-sm text-gray-400">|</span>
          <span className="hidden sm:block text-sm text-gray-500">Configura il tuo account</span>
        </div>
        <button
          onClick={() => { logout(); navigate("/login"); }}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Esci
        </button>
      </header>

      {/* Step progress banner */}
      <StepBanner
        hotelChosen={!!selected}
        competitorsChosen={!!selected && checkedCompetitors.length > 0}
      />

      {/* Mobile tab bar */}
      <div className="lg:hidden flex shrink-0 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mobileView === "map" ? "text-teal-600 border-b-2 border-teal-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          🗺 Mappa
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${mobileView === "list" ? "text-teal-600 border-b-2 border-teal-600" : "text-gray-500 hover:text-gray-700"}`}
        >
          ☰ Lista{selected ? ` · ${checkedCompetitors.length} sel.` : ""}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* MAP */}
        <div
          className={`flex-1 min-h-0 relative ${mobileView === "list" ? "hidden lg:block" : "block"}`}
          style={{ minHeight: mobileView === "map" ? "calc(100vh - 140px)" : undefined }}
        >
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
                pathOptions={{ color: "#0D9488", fillColor: "#0D9488", fillOpacity: 0.05, weight: 1.5, dashArray: "6 4" }}
              />
            )}

            <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} maxClusterRadius={40}>
              {ITALY_HOTELS.map((hotel) => {
                const isSelected = selected?.id === hotel.id;
                const isCompetitor = selected && allCompetitors.some((c) => c.id === hotel.id);
                const isChecked = selectedCompetitorIds.has(hotel.id);

                const icon = isSelected
                  ? ICONS.selected
                  : isCompetitor
                  ? isChecked ? ICONS.competitor_checked : ICONS.competitor_unchecked
                  : ICONS.default;

                return (
                  <Marker
                    key={hotel.id}
                    position={[hotel.lat, hotel.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        if (!isSelected) handleSelectHotel(hotel);
                        else if (isCompetitor) toggleCompetitor(hotel.id);
                      },
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -18]} opacity={0.95}>
                      <div style={{ fontSize: 12, lineHeight: 1.4 }}>
                        <strong>{hotel.name}</strong><br />
                        {hotel.city} · {"★".repeat(hotel.stars)}<br />
                        {isSelected && <span style={{ color: "#0D9488", fontWeight: 700 }}>Il tuo hotel</span>}
                        {isCompetitor && !isSelected && (
                          <span style={{ color: isChecked ? "#D97706" : "#9CA3AF" }}>
                            {isChecked ? "Competitor ✓" : "Competitor (escluso)"}
                          </span>
                        )}
                        {!isSelected && !isCompetitor && (
                          <span style={{ color: "#6B7280" }}>
                            {selected
                              ? `${distanceKm(selected.lat, selected.lng, hotel.lat, hotel.lng).toFixed(1)} km · Clicca per selezionare`
                              : "Clicca per selezionare"}
                          </span>
                        )}
                      </div>
                    </Tooltip>
                    {isSelected && (
                      <Popup>
                        <strong>{hotel.name}</strong><br />
                        {hotel.city}<br />
                        {"★".repeat(hotel.stars)}
                      </Popup>
                    )}
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>

          {/* Search overlay */}
          <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "min(380px, calc(100% - 32px))" }}>
            <HotelSearchBox onSelect={handleSelectHotel} />
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className={`w-full lg:w-[360px] shrink-0 flex flex-col bg-white border-l border-gray-200 overflow-hidden ${mobileView === "map" ? "hidden lg:flex" : "flex"}`}>

          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="text-5xl">🏨</div>
              <div>
                <p className="font-semibold text-gray-800 text-base">Cerca il tuo hotel</p>
                <p className="text-sm text-gray-500 mt-1">
                  Usa la barra di ricerca sulla mappa oppure clicca direttamente sul tuo hotel.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto flex flex-col gap-4 p-4">

              {/* Selected hotel info */}
              <div className="shrink-0 bg-teal-50 border border-teal-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-teal-800">{selected.name}</p>
                    <p className="text-xs text-teal-600 mt-0.5">{selected.city} · {selected.region}</p>
                    <Stars n={selected.stars} />
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-teal-400 hover:text-teal-600 text-lg leading-none shrink-0"
                  >×</button>
                </div>
              </div>

              {/* Competitor list */}
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex items-center justify-between mb-2 shrink-0">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Competitor nel raggio di 20 km
                  </h3>
                  {allCompetitors.length > 0 && (
                    <button onClick={toggleAll} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                      {allChecked ? "Deseleziona tutti" : "Seleziona tutti"}
                    </button>
                  )}
                </div>
                {allCompetitors.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center text-xs text-gray-400 italic">
                    Nessun competitor trovato nel raggio di 20 km
                  </div>
                ) : (
                  <>
                    <ul className="space-y-1 overflow-y-auto flex-1">
                      {allCompetitors.map((c) => {
                        const checked = selectedCompetitorIds.has(c.id);
                        return (
                          <li
                            key={c.id}
                            onClick={() => toggleCompetitor(c.id)}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer border transition-colors ${checked ? "bg-amber-50 border-amber-100" : "bg-white border-gray-100 opacity-60"}`}
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? "bg-amber-400 border-amber-400" : "border-gray-300"}`}>
                              {checked && <span className="text-white text-[10px] leading-none">✓</span>}
                            </div>
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
                    <p className="mt-1.5 text-xs text-gray-400 text-right">
                      {selectedCompetitorIds.size} di {allCompetitors.length} selezionati
                    </p>
                  </>
                )}
              </div>

              {/* Price preview */}
              <div className="shrink-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-0.5">Anteprima confronto prezzi</h3>
                <p className="text-xs text-gray-400 mb-2">Prezzi stimati per domani notte</p>
                {checkedCompetitors.length === 0 ? (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-center text-xs text-gray-400 italic">
                    Seleziona almeno un competitor per vedere l'anteprima
                  </div>
                ) : (
                  <ComparisonTable selected={selected} competitors={checkedCompetitors} />
                )}
              </div>

            </div>
          )}

          {/* CTA sticky */}
          <div className="shrink-0 px-4 pt-3 pb-4 border-t border-gray-100 bg-white">
            {saveError && (
              <p className="text-xs text-red-500 mb-2 text-center">{saveError}</p>
            )}
            <button
              onClick={handleStart}
              disabled={!selected || isSaving}
              className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
            >
              {isSaving
                ? "Salvataggio in corso..."
                : selected
                ? `Avvia RateScope con ${checkedCompetitors.length} competitor →`
                : "Seleziona il tuo hotel per continuare"}
            </button>
            <p className="text-center text-xs text-gray-400 mt-1.5">
              Potrai modificare hotel e competitor in qualsiasi momento
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
