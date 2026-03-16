import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import { useState, useEffect, useMemo } from "react";
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
  default: makeIcon("#9CA3AF", "#ffffff", "H"),
  selected: makeIcon("#0D9488", "#ffffff", "★"),
  competitor: makeIcon("#F59E0B", "#ffffff", "C"),
};

// ─── Fly-to helper ────────────────────────────────────────────────────────────

function FlyTo({ hotel }: { hotel: ItalyHotel | null }) {
  const map = useMap();
  useEffect(() => {
    if (hotel) map.flyTo([hotel.lat, hotel.lng], 12, { duration: 1.2 });
  }, [hotel, map]);
  return null;
}

// ─── Stars renderer ──────────────────────────────────────────────────────────

function Stars({ n }: { n: number }) {
  return (
    <span className="text-amber-400 text-xs">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

// ─── Price comparison mini-table ─────────────────────────────────────────────

function ComparisonTable({ selected, competitors }: { selected: ItalyHotel; competitors: ItalyHotel[] }) {
  const rows = useMemo(
    () => generateDemoComparisonForHotel(selected, competitors),
    [selected, competitors]
  );
  const otas = ["booking", "expedia", "hotels_com", "agoda"];
  const otaLabels: Record<string, string> = {
    booking: "Booking",
    expedia: "Expedia",
    hotels_com: "Hotels.com",
    agoda: "Agoda",
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
            <tr
              key={row.hotel_key}
              className={row.is_own_hotel ? "bg-teal-50" : "hover:bg-gray-50"}
            >
              <td className="px-2 py-1.5 border-b border-gray-100 max-w-[120px]">
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
                <span
                  className={`inline-block w-5 h-5 rounded-full text-white text-[10px] font-bold leading-5 ${
                    row.rank === 1 ? "bg-teal-500" : row.rank <= 3 ? "bg-amber-400" : "bg-gray-300"
                  }`}
                >
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
  const navigate = useNavigate();
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

      {/* Instruction banner */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800 shrink-0">
        <strong>Scegli il tuo hotel</strong> sulla mappa per vedere i competitor nel raggio di 20 km e confrontare i prezzi OTA
      </div>

      {/* Body: map + panel */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* MAP */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0">
          <MapContainer
            center={[44.6, 11.5]}
            zoom={9}
            style={{ height: "100%", width: "100%", minHeight: "400px" }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo hotel={selected} />

            {/* 20km radius circle */}
            {selected && (
              <Circle
                center={[selected.lat, selected.lng]}
                radius={20000}
                pathOptions={{ color: "#0D9488", fillColor: "#0D9488", fillOpacity: 0.06, weight: 1.5 }}
              />
            )}

            {/* All markers */}
            {ITALY_HOTELS.map((hotel) => {
              const isSelected = selected?.id === hotel.id;
              const isComp = !isSelected && competitors.some((c) => c.id === hotel.id);
              const icon = isSelected ? ICONS.selected : isComp ? ICONS.competitor : ICONS.default;

              return (
                <Marker
                  key={hotel.id}
                  position={[hotel.lat, hotel.lng]}
                  icon={icon}
                  eventHandlers={{ click: () => setSelected(hotel) }}
                >
                  <Popup>
                    <div className="text-sm min-w-[160px]">
                      <p className="font-semibold text-gray-800">{hotel.name}</p>
                      <p className="text-gray-500 text-xs">{hotel.city}, {hotel.region}</p>
                      <Stars n={hotel.stars} />
                      <p className="mt-1 text-teal-700 font-medium">da €{hotel.basePrice}/notte</p>
                      <button
                        onClick={() => setSelected(hotel)}
                        className="mt-2 w-full bg-teal-600 text-white text-xs rounded px-2 py-1 hover:bg-teal-700"
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
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
              <div className="text-5xl mb-4">🗺️</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Scegli il tuo hotel</h2>
              <p className="text-sm text-gray-500 max-w-xs">
                Clicca su uno qualsiasi degli <strong>{ITALY_HOTELS.length} hotel</strong> nelle province di <strong>Modena, Bologna, Ferrara e Ravenna</strong> per vedere i competitor entro 20 km e confrontare i prezzi in tempo reale.
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
              {/* Selected hotel card */}
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
                    title="Deseleziona"
                  >
                    ✕
                  </button>
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
