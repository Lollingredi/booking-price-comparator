import { useEffect, useState } from "react";
import HotelSearch from "../components/HotelSearch";
import DemoHotelSearch from "../components/DemoHotelSearch";
import { hotelsApi } from "../api/hotels";
import type { Competitor, Hotel, HotelSearchResult } from "../types";
import type { ItalyHotel } from "../demo/italyHotels";
import { useAuth } from "../contexts/AuthContext";
import { DEMO_HOTEL } from "../demo/demoData";

export default function Competitors() {
  const { isDemoMode } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hotel setup form
  const [hotelName, setHotelName] = useState("");
  const [hotelKey, setHotelKey] = useState("");
  const [city, setCity] = useState("");
  const [stars, setStars] = useState<number | "">(3);
  const [saving, setSaving] = useState(false);

  // Competitor form
  const [compName, setCompName] = useState("");
  const [compKey, setCompKey] = useState("");
  const [compStars, setCompStars] = useState<number | "">(3);
  const [addingComp, setAddingComp] = useState(false);

  useEffect(() => {
    if (isDemoMode) {
      setHotel(DEMO_HOTEL);
      setHotelName(DEMO_HOTEL.name);
      setHotelKey(DEMO_HOTEL.xotelo_hotel_key);
      setCity(DEMO_HOTEL.city);
      setStars(DEMO_HOTEL.stars ?? "");
      setIsLoading(false);
      return;
    }
    hotelsApi.getMine()
      .then(({ data }) => {
        setHotel(data);
        setHotelName(data.name);
        setHotelKey(data.xotelo_hotel_key);
        setCity(data.city);
        setStars(data.stars ?? "");
      })
      .catch(() => setHotel(null))
      .finally(() => setIsLoading(false));
  }, [isDemoMode]);

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      // In demo mode, update state locally only
      setHotel((prev) =>
        prev
          ? { ...prev, name: hotelName, xotelo_hotel_key: hotelKey, city, stars: stars !== "" ? stars : null }
          : prev
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await hotelsApi.createOrUpdate({
        name: hotelName,
        xotelo_hotel_key: hotelKey,
        city,
        stars: stars !== "" ? stars : null,
      });
      setHotel(data);
    } catch {
      setError("Errore nel salvataggio dell'hotel.");
    } finally {
      setSaving(false);
    }
  };

  const handleDemoHotelSelect = (h: ItalyHotel) => {
    setHotelName(h.name);
    setHotelKey(h.xoteloKey);
    setCity(h.city);
    setStars(h.stars);
    setHotel((prev) =>
      prev
        ? { ...prev, name: h.name, xotelo_hotel_key: h.xoteloKey, city: h.city, stars: h.stars }
        : prev
    );
  };

  const handleCompSelect = (r: HotelSearchResult) => {
    setCompName(r.name);
    setCompKey(r.hotel_key);
  };

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotel) return;
    setAddingComp(true);
    try {
      if (isDemoMode) {
        const fakeComp: Competitor = {
          id: `demo-comp-${Date.now()}`,
          hotel_id: hotel.id,
          competitor_name: compName,
          competitor_xotelo_key: compKey,
          competitor_stars: compStars !== "" ? compStars : null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setHotel((prev) => prev ? { ...prev, competitors: [...prev.competitors, fakeComp] } : prev);
      } else {
        const { data: comp } = await hotelsApi.addCompetitor({
          competitor_name: compName,
          competitor_xotelo_key: compKey,
          competitor_stars: compStars !== "" ? compStars : null,
        });
        setHotel((prev) => prev ? { ...prev, competitors: [...prev.competitors, comp] } : prev);
      }
      setCompName("");
      setCompKey("");
      setCompStars(3);
    } catch {
      setError("Errore nell'aggiunta del competitor.");
    } finally {
      setAddingComp(false);
    }
  };

  const handleRemoveCompetitor = async (comp: Competitor) => {
    if (isDemoMode) {
      setHotel((prev) =>
        prev ? { ...prev, competitors: prev.competitors.filter((c) => c.id !== comp.id) } : prev
      );
      return;
    }
    await hotelsApi.removeCompetitor(comp.id);
    setHotel((prev) =>
      prev ? { ...prev, competitors: prev.competitors.filter((c) => c.id !== comp.id) } : prev
    );
  };

  if (isLoading) {
    return <div className="text-center py-16 text-gray-400">Caricamento...</div>;
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Il tuo hotel</h1>
        <p className="text-gray-500 text-sm mt-1">Configura il tuo hotel e i competitor da monitorare.</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Hotel form */}
      <form onSubmit={handleSaveHotel} className="bg-white rounded-[14px] border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">Impostazioni hotel</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cerca il tuo hotel</label>
          <DemoHotelSearch onSelect={handleDemoHotelSelect} placeholder="Es. Hotel Bellavista Roma..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <input
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Città</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Booking.com Slug
              <a
                href="https://www.booking.com"
                target="_blank"
                rel="noopener noreferrer"
                title="Come trovarlo: apri il tuo hotel su Booking.com → copia la parte tra /hotel/it/ e .html nell'URL"
                className="ml-1.5 text-gray-400 hover:text-teal-600 text-xs font-normal"
              >(?)</a>
            </label>
            <input
              value={hotelKey}
              onChange={(e) => setHotelKey(e.target.value)}
              required
              disabled={isDemoMode}
              placeholder="es. baglioni-bologna"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-500"
            />
            {!isDemoMode && (
              <p className="text-xs text-gray-400 mt-1">
                Apri il tuo hotel su Booking.com → copia la parte tra <code className="bg-gray-100 px-1 rounded">/hotel/it/</code> e <code className="bg-gray-100 px-1 rounded">.html</code> nell'URL
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stelle</label>
            <input
              type="number"
              value={stars}
              onChange={(e) => setStars(e.target.value ? Number(e.target.value) : "")}
              min={1}
              max={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
        >
          {saving ? "Salvataggio..." : "Salva hotel"}
        </button>
      </form>

      {/* Competitors */}
      {hotel && (
        <div className="bg-white rounded-[14px] border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800">Competitor monitorati</h2>

          {hotel.competitors.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {hotel.competitors.map((comp) => (
                <li key={comp.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{comp.competitor_name}</p>
                    <p className="text-xs font-mono text-gray-400">{comp.competitor_xotelo_key}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveCompetitor(comp)}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1"
                  >
                    Rimuovi
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">Nessun competitor aggiunto.</p>
          )}

          <form onSubmit={handleAddCompetitor} className="border-t border-gray-100 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Aggiungi competitor</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cerca competitor</label>
              {isDemoMode ? (
                <DemoHotelSearch
                  onSelect={(h) => { setCompName(h.name); setCompKey(h.xoteloKey); setCompStars(h.stars); }}
                  placeholder="Cerca hotel competitor..."
                />
              ) : (
                <HotelSearch onSelect={handleCompSelect} placeholder="Cerca hotel competitor..." />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nome</label>
                <input
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  required
                  placeholder={isDemoMode ? "Es. Hotel Roma Palace" : ""}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Booking.com Slug</label>
                <input
                  value={compKey}
                  onChange={(e) => setCompKey(e.target.value)}
                  required
                  placeholder={isDemoMode ? "Es. grand-hotel-milan" : "es. baglioni-bologna"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addingComp}
              className="bg-gray-800 hover:bg-gray-900 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {addingComp ? "Aggiunta..." : "Aggiungi"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
