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
import StartupLoader from "../components/StartupLoader";

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

interface StepBannerProps {
  hotelChosen: boolean;
  competitorsChosen: boolean;
}

function StepBanner({ hotelChosen, competitorsChosen }: StepBannerProps) {
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

  function Arrow() {
    return <span className="text-gray-300 text-sm mx-1 sm:mx-2">→</span>;
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-center gap-1 shrink-0">
      <Chip n={1} label="Scegli il tuo hotel"     state={s1} />
      <Arrow />
      <Chip n={2} label="Seleziona i competitor"  state={s2} />
      <Arrow />
      <Chip n={3} label="Inizia la demo"           state={s3} />
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoMap() {
  const { loginDemo } = useAuth();
  const navigate      = useNavigate();

  const [selected, setSelected]                           = useState<ItalyHotel | null>(null);
  const [selectedCompetitorIds, setSelectedCompetitorIds] = useState<Set<string>>(new Set());
  const [mobileView, setMobileView]                       = useState<"map" | "list">("map");
  const [loadingSteps, setLoadingSteps]                   = useState<string[]>([]);
  const [loadingStep, setLoadingStep]                     = useState<number>(-1);

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
    setMobileView("list"); // auto-switch to list on mobile after selecting
  };

  const handleStart = () => {
    if (!selected) return;
    const compsToShow = checkedCompetitors.slice(0, 8);
    const steps = [
      `Ricerca slug Booking.com: ${selected.name}`,
      ...compsToShow.map((c) => `Ricerca slug: ${c.name}`),
      "Raccolta prezzi in tempo reale",
      "Preparazione dashboard",
    ];
    setLoadingSteps(steps);
    setLoadingStep(0);
    let accumulated = 0;
    steps.forEach((_, i) => {
      accumulated += 800 + Math.random() * 600;
      if (i < steps.length - 1) {
        const delay = accumulated;
        setTimeout(() => setLoadingStep(i + 1), delay);
      } else {
        const delay = accumulated;
        setTimeout(() => {
          setLoadingStep(steps.length);
          setTimeout(() => {
            loginDemo(selected, checkedCompetitors);
            navigate("/dashboard");
          }, 700);
        }, delay);
      }
    });
  };

  const allChecked = allCompetitors.length > 0 && selectedCompetitorIds.size === allCompetitors.length;

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-gray-50">
      {loadingStep >= 0 && (
        <StartupLoader steps={loadingSteps} currentIndex={loadingStep} />
      )}

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

      {/* Step progress banner */}
      <StepBanner
        hotelChosen={!!selected}
        competitorsChosen={!!selected && checkedCompetitors.length > 0}
      />

      {/* Mobile tab bar — only on <lg */}
      <div className="lg:hidden flex shrink-0 bg-white border-b border-gray-200">
        <button
          onClick={() => setMobileView("map")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileView === "map"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🗺 Mappa
        </button>
        <button
          onClick={() => setMobileView("list")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            mobileView === "list"
              ? "text-teal-600 border-b-2 border-teal-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ☰ Lista{selected ? ` · ${checkedCompetitors.length} sel.` : ""}
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">

        {/* MAP */}
        <div className={`flex-1 min-h-0 relative ${mobileView === "list" ? "hidden lg:block" : "block"}`}
             style={{ minHeight: mobileView === "map" ? "calc(100vh - 140px)" : undefined }}>
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

            <MarkerClusterGroup
              chunkedLoading
              showCoverageOnHover={false}
              maxClusterRadius={40}
            >
              {ITALY_HOTELS.map((hotel) => {
                const isMyHotel  = selected?.id === hotel.id;
                const isInRange  = !isMyHotel && allCompetitors.some((c) => c.id === hotel.id);
                const isChecked  = isInRange && selectedCompetitorIds.has(hotel.id);
                const icon = isMyHotel  ? ICONS.selected
                           : isChecked  ? ICONS.competitor_checked
                           : isInRange  ? ICONS.competitor_unchecked
                           :              ICONS.default;
                return (
                  <Marker
                    key={hotel.id}
                    position={[hotel.lat, hotel.lng]}
                    icon={icon}
                    eventHandlers={{
                      click: () => {
                        if (!isInRange) handleSelectHotel(hotel);
                        else toggleCompetitor(hotel.id);
                      },
                    }}
                  >
                    <Tooltip sticky offset={[10, 0]}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{hotel.name}</span>
                      <br />
                      <span style={{ fontSize: 11, color: "#6B7280" }}>
                        {hotel.city} · {"★".repeat(hotel.stars)}
                      </span>
                    </Tooltip>
                    <Popup>
                      <div style={{ minWidth: 170 }}>
                        <p style={{ fontWeight: 700, fontSize: 13 }}>{hotel.name}</p>
                        <p style={{ fontSize: 11, color: "#6B7280" }}>{hotel.city}</p>
                        <p style={{ fontSize: 11, color: "#F59E0B" }}>{"★".repeat(hotel.stars)}</p>
                        {!isInRange ? (
                          <button
                            onClick={() => handleSelectHotel(hotel)}
                            style={{ marginTop: 6, width: "100%", background: "#0D9488", color: "white", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                          >
                            Usa come mio hotel
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleCompetitor(hotel.id)}
                            style={{ marginTop: 6, width: "100%", background: isChecked ? "#F59E0B" : "#E5E7EB", color: isChecked ? "white" : "#374151", border: "none", borderRadius: 6, padding: "5px 8px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}
                          >
                            {isChecked ? "✓ Incluso nel confronto" : "+ Aggiungi al confronto"}
                          </button>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {/* SIDE PANEL */}
        <aside className={`w-full lg:w-[420px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col overflow-hidden ${mobileView === "map" ? "hidden lg:flex" : "flex"}`}>

          {/* Search bar */}
          <div className="p-3 border-b border-gray-100 shrink-0">
            <HotelSearchBox onSelect={handleSelectHotel} />
          </div>

          {!selected ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center flex-1 py-12 px-6 text-center overflow-y-auto">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Scegli il tuo hotel</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Cerca per nome o città, oppure clicca sulla mappa.{" "}
                <strong>{ITALY_HOTELS.length} hotel</strong> nelle province di Modena, Bologna, Ferrara e Ravenna.
              </p>
              <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400 text-left">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-teal-500 shrink-0"></span>Il tuo hotel</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-amber-400 shrink-0"></span>Competitor selezionato</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-amber-400 bg-gray-200 shrink-0"></span>Competitor non incluso</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-full bg-gray-400 shrink-0"></span>Altri hotel</div>
              </div>
            </div>
          ) : (
            /* Hotel selected — scrollable content + sticky CTA */
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pb-24">

                {/* ── Mio hotel ── */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 shrink-0">
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
                    <button onClick={() => { setSelected(null); setMobileView("map"); }} className="text-gray-400 hover:text-gray-600 text-lg leading-none shrink-0 mt-0.5">✕</button>
                  </div>
                </div>

                {/* ── Lista competitor con checkbox ── */}
                <div className="shrink-0">
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
                    <>
                      <ul className="space-y-1.5 max-h-[260px] overflow-y-auto pr-0.5">
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
                              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                checked ? "bg-amber-400 border-amber-400" : "border-gray-300 bg-white"
                              }`}>
                                {checked && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
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

              </div>{/* end scrollable area */}

              {/* ── CTA sticky al fondo ── */}
              <div className="shrink-0 px-4 pt-3 pb-4 border-t border-gray-100 bg-white">
                <button
                  onClick={handleStart}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm"
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
