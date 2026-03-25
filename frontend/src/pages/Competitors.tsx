import { useEffect, useState, useCallback } from "react";
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

  const [hotelName, setHotelName] = useState("");
  const [hotelKey, setHotelKey] = useState("");
  const [city, setCity] = useState("");
  const [stars, setStars] = useState<number | "">(3);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(true);

  const [compName, setCompName] = useState("");
  const [compKey, setCompKey] = useState("");
  const [compStars, setCompStars] = useState<number | "">(3);
  const [addingComp, setAddingComp] = useState(false);

  const [editingCompId, setEditingCompId] = useState<string | null>(null);
  const [editingSlug, setEditingSlug] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingSuggestionKey, setAddingSuggestionKey] = useState<string | null>(null);
  const [savedSlugId, setSavedSlugId] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<HotelSearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (isDemoMode) return;
    setLoadingSuggestions(true);
    try {
      const { data } = await hotelsApi.getSuggestions();
      setSuggestions(data);
    } catch {
      // suggestions are best-effort
    } finally {
      setLoadingSuggestions(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      setHotel(DEMO_HOTEL);
      setHotelName(DEMO_HOTEL.name);
      setHotelKey(DEMO_HOTEL.booking_key);
      setCity(DEMO_HOTEL.city);
      setStars(DEMO_HOTEL.stars ?? "");
      setIsLoading(false);
      return;
    }
    hotelsApi.getMine()
      .then(({ data }) => {
        setHotel(data);
        setHotelName(data.name);
        setHotelKey(data.booking_key);
        setCity(data.city);
        setStars(data.stars ?? "");
        setIsEditing(false);
        fetchSuggestions();
      })
      .catch(() => { setHotel(null); setIsEditing(true); })
      .finally(() => setIsLoading(false));
  }, [isDemoMode, fetchSuggestions]);

  const handleSaveHotel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemoMode) {
      setHotel((prev) =>
        prev
          ? { ...prev, name: hotelName, booking_key: hotelKey, city, stars: stars !== "" ? stars : null }
          : prev
      );
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const { data } = await hotelsApi.createOrUpdate({
        name: hotelName,
        booking_key: hotelKey,
        city,
        stars: stars !== "" ? stars : null,
      });
      setHotel(data);
      setIsEditing(false);
    } catch {
      setError("Errore nel salvataggio dell'hotel.");
    } finally {
      setSaving(false);
    }
  };

  const handleDemoHotelSelect = (h: ItalyHotel) => {
    setHotelName(h.name);
    setHotelKey(h.bookingKey);
    setCity(h.city);
    setStars(h.stars);
    setHotel((prev) =>
      prev
        ? { ...prev, name: h.name, booking_key: h.bookingKey, city: h.city, stars: h.stars }
        : prev
    );
  };

  const handleLiveHotelSelect = (r: HotelSearchResult) => {
    setHotelName(r.name);
    setHotelKey(r.hotel_key);
    if (r.city) setCity(r.city);
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
          competitor_booking_key: compKey,
          competitor_stars: compStars !== "" ? compStars : null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setHotel((prev) => prev ? { ...prev, competitors: [...prev.competitors, fakeComp] } : prev);
      } else {
        const { data: comp } = await hotelsApi.addCompetitor({
          competitor_name: compName,
          competitor_booking_key: compKey,
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

  const handleUpdateCompetitorSlug = async (comp: Competitor) => {
    const newSlug = editingSlug.trim();
    if (!newSlug || newSlug === comp.competitor_booking_key) {
      setEditingCompId(null);
      return;
    }
    if (isDemoMode) {
      setHotel((prev) =>
        prev
          ? {
              ...prev,
              competitors: prev.competitors.map((c) =>
                c.id === comp.id ? { ...c, competitor_booking_key: newSlug } : c
              ),
            }
          : prev
      );
      setEditingCompId(null);
      return;
    }
    try {
      const { data: updated } = await hotelsApi.updateCompetitor(comp.id, {
        competitor_booking_key: newSlug,
      });
      setHotel((prev) =>
        prev
          ? {
              ...prev,
              competitors: prev.competitors.map((c) =>
                c.id === comp.id ? updated : c
              ),
            }
          : prev
      );
      setSavedSlugId(comp.id);
      setTimeout(() => setSavedSlugId(null), 2000);
    } catch {
      setError("Errore nel salvataggio dello slug.");
    } finally {
      setEditingCompId(null);
    }
  };

  const handleAddSuggestion = async (s: HotelSearchResult) => {
    if (!hotel || addingSuggestionKey) return;
    setAddingSuggestionKey(s.hotel_key);
    try {
      const { data: comp } = await hotelsApi.addCompetitor({
        competitor_name: s.name,
        competitor_booking_key: s.hotel_key,
      });
      setHotel((prev) => prev ? { ...prev, competitors: [...prev.competitors, comp] } : prev);
      setSuggestions((prev) => prev.filter((x) => x.hotel_key !== s.hotel_key));
    } catch {
      setError("Errore nell'aggiunta del competitor.");
    } finally {
      setAddingSuggestionKey(null);
    }
  };

  const handleRemoveCompetitor = async (comp: Competitor) => {
    if (removingId) return;
    if (isDemoMode) {
      setHotel((prev) =>
        prev ? { ...prev, competitors: prev.competitors.filter((c) => c.id !== comp.id) } : prev
      );
      return;
    }
    setRemovingId(comp.id);
    try {
      await hotelsApi.removeCompetitor(comp.id);
    } catch {
      setError("Errore nella rimozione del competitor.");
      setRemovingId(null);
      return;
    }
    setRemovingId(null);
    setHotel((prev) =>
      prev ? { ...prev, competitors: prev.competitors.filter((c) => c.id !== comp.id) } : prev
    );
  };

  if (isLoading) {
    return <div className="text-center py-16 text-gray-400 dark:text-slate-500">Caricamento...</div>;
  }

  const inputClass = "w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 dark:disabled:bg-slate-800 disabled:text-gray-600 dark:disabled:text-slate-500 disabled:cursor-default";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1";

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Il tuo hotel</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">Configura il tuo hotel e i competitor da monitorare.</p>
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Hotel form */}
      <form onSubmit={handleSaveHotel} className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200">Impostazioni hotel</h2>
          {!isEditing && !isDemoMode && (
            <span className="text-xs bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-700 px-2 py-0.5 rounded-full font-medium">
              Configurato
            </span>
          )}
        </div>

        {isEditing && (
          <div>
            <label className={labelClass}>Cerca il tuo hotel su Booking.com</label>
            {isDemoMode ? (
              <DemoHotelSearch onSelect={handleDemoHotelSelect} placeholder="Es. Hotel Bellavista Roma..." />
            ) : (
              <HotelSearch onSelect={handleLiveHotelSelect} placeholder="Es. Emma Hotel Bologna Fiera..." />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              value={hotelName}
              onChange={(e) => setHotelName(e.target.value)}
              required
              disabled={!isEditing}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Città</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              disabled={!isEditing}
              className={inputClass}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
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
              disabled={!isEditing || isDemoMode}
              placeholder="es. baglioni-bologna"
              className={`${inputClass} font-mono`}
            />
            {isEditing && (
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                {isDemoMode
                  ? "Slug demo — non modificabile"
                  : "Auto-compilato dalla ricerca, oppure inserisci manualmente la parte tra /hotel/it/ e .html"}
              </p>
            )}
          </div>
          <div>
            <label className={labelClass}>Stelle</label>
            <input
              type="number"
              value={stars}
              onChange={(e) => setStars(e.target.value ? Number(e.target.value) : "")}
              min={1}
              max={5}
              disabled={!isEditing}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Modifica
            </button>
          ) : (
            <>
              <button
                type="submit"
                disabled={saving}
                className="bg-teal-600 hover:bg-teal-700 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors disabled:opacity-60"
              >
                {saving ? "Salvataggio..." : "Salva hotel"}
              </button>
              {hotel && (
                <button
                  type="button"
                  onClick={() => {
                    setHotelName(hotel.name);
                    setHotelKey(hotel.booking_key);
                    setCity(hotel.city);
                    setStars(hotel.stars ?? "");
                    setIsEditing(false);
                  }}
                  className="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 px-4 py-2 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Annulla
                </button>
              )}
            </>
          )}
        </div>
      </form>

      {/* Suggestions */}
      {!isDemoMode && hotel && suggestions.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-teal-200 dark:border-teal-800 p-6 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 dark:text-slate-200">Competitor suggeriti</h2>
            {loadingSuggestions && (
              <span className="text-xs text-gray-400 dark:text-slate-500">Caricamento...</span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Hotel nella tua stessa città che non stai ancora monitorando.
          </p>
          <ul className="space-y-2">
            {suggestions.map((s) => (
              <li
                key={s.hotel_key}
                className="flex items-center justify-between gap-3 bg-gray-50 dark:bg-slate-700/40 rounded-lg px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">{s.name}</p>
                  {s.address && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{s.address}</p>
                  )}
                </div>
                <button
                  onClick={() => handleAddSuggestion(s)}
                  disabled={addingSuggestionKey === s.hotel_key}
                  className="shrink-0 text-xs font-medium text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-700 hover:bg-teal-50 dark:hover:bg-teal-900/20 px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                >
                  {addingSuggestionKey === s.hotel_key ? "..." : "+ Aggiungi"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Competitors */}
      {hotel && (
        <div className="bg-white dark:bg-slate-800 rounded-[14px] border border-gray-200 dark:border-slate-700 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-slate-200">Competitor monitorati</h2>

          {hotel.competitors.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-slate-700">
              {hotel.competitors.map((comp) => (
                <li key={comp.id} className="flex items-center justify-between py-3 gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{comp.competitor_name}</p>
                    {editingCompId === comp.id ? (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          autoFocus
                          value={editingSlug}
                          onChange={(e) => setEditingSlug(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateCompetitorSlug(comp);
                            if (e.key === "Escape") setEditingCompId(null);
                          }}
                          className="w-full border border-teal-300 dark:border-teal-600 rounded px-2 py-0.5 text-xs font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400"
                        />
                        <button
                          onClick={() => handleUpdateCompetitorSlug(comp)}
                          className="text-xs text-teal-600 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 font-medium px-1.5 py-0.5 shrink-0"
                        >
                          Salva
                        </button>
                        <button
                          onClick={() => setEditingCompId(null)}
                          className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 px-1 py-0.5 shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setEditingCompId(comp.id); setEditingSlug(comp.competitor_booking_key); }}
                          className="text-xs font-mono text-gray-400 dark:text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:underline text-left"
                          title="Clicca per modificare lo slug"
                        >
                          {comp.competitor_booking_key || <span className="italic">slug non impostato</span>}
                        </button>
                        {savedSlugId === comp.id && (
                          <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">✓ Salvato</span>
                        )}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveCompetitor(comp)}
                    disabled={removingId === comp.id}
                    className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 px-2 py-1 shrink-0 disabled:opacity-50"
                  >
                    {removingId === comp.id ? "..." : "Rimuovi"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 py-4">
              <svg className="w-7 h-7 text-gray-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Nessun competitor aggiunto</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">Usa il form qui sotto per aggiungere i tuoi competitor.</p>
            </div>
          )}

          <form onSubmit={handleAddCompetitor} className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">Aggiungi competitor</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Cerca competitor</label>
              {isDemoMode ? (
                <DemoHotelSearch
                  onSelect={(h) => { setCompName(h.name); setCompKey(h.bookingKey); setCompStars(h.stars); }}
                  placeholder="Cerca hotel competitor..."
                />
              ) : (
                <HotelSearch onSelect={handleCompSelect} placeholder="Cerca hotel competitor..." />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Nome</label>
                <input
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  required
                  placeholder={isDemoMode ? "Es. Hotel Roma Palace" : ""}
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1">Booking.com Slug</label>
                <input
                  value={compKey}
                  onChange={(e) => setCompKey(e.target.value)}
                  required
                  placeholder={isDemoMode ? "Es. grand-hotel-milan" : "es. baglioni-bologna"}
                  className="w-full border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-mono bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={addingComp}
              className="bg-gray-800 dark:bg-slate-600 hover:bg-gray-900 dark:hover:bg-slate-500 text-white font-medium px-4 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-60"
            >
              {addingComp ? "Aggiunta..." : "Aggiungi"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
