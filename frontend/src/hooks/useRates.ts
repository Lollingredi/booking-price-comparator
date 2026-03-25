import { useCallback, useEffect, useMemo, useState } from "react";
import { ratesApi } from "../api/rates";
import type { CalendarDay, ComparisonRow, HistoryPoint, HotelRates, PriceSuggestion } from "../types";
import { format, addDays } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import {
  DEMO_COMPARISON,
  generateDemoHistory,
  generateDemoHistoryAll,
} from "../demo/demoData";

export function useCurrentRates(checkIn: Date, checkOut: Date) {
  const { isDemoMode } = useAuth();
  const [data, setData] = useState<HotelRates[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (isDemoMode) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: rates } = await ratesApi.getCurrent(
        format(checkIn, "yyyy-MM-dd"),
        format(checkOut, "yyyy-MM-dd")
      );
      setData(rates);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento prezzi");
    } finally {
      setIsLoading(false);
    }
  }, [checkIn, checkOut, isDemoMode]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useComparison(checkIn: Date, checkOut: Date) {
  const { isDemoMode, demoComparison } = useAuth();
  const [data, setData] = useState<ComparisonRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setData(demoComparison.length > 0 ? demoComparison : DEMO_COMPARISON);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: rows } = await ratesApi.getComparison(
        format(checkIn, "yyyy-MM-dd"),
        format(checkOut, "yyyy-MM-dd")
      );
      setData(rows);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento comparazione");
    } finally {
      setIsLoading(false);
    }
  }, [checkIn, checkOut, isDemoMode, demoComparison]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useHistoryAll(days = 30) {
  const { isDemoMode } = useAuth();
  const demoHistory = useMemo(() => generateDemoHistoryAll(), []);
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setData(demoHistory);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: pts } = await ratesApi.getHistoryAll(days);
      setData(pts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento storico");
    } finally {
      setIsLoading(false);
    }
  }, [days, isDemoMode, demoHistory]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useHistory(hotelKey: string, days = 30) {
  const { isDemoMode } = useAuth();
  const demoHistory = useMemo(() => generateDemoHistory(), []);
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setData(demoHistory);
      return;
    }
    if (!hotelKey) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: pts } = await ratesApi.getHistory(hotelKey, days);
      setData(pts);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento storico");
    } finally {
      setIsLoading(false);
    }
  }, [hotelKey, days, isDemoMode, demoHistory]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

function generateDemoCalendar(): CalendarDay[] {
  const days: CalendarDay[] = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const d = addDays(today, i);
    const base = 80 + Math.floor(Math.sin(i * 0.5) * 30 + Math.random() * 20);
    const comp = base + Math.floor(Math.random() * 40 - 15);
    days.push({
      check_in: format(d, "yyyy-MM-dd"),
      own_min: base,
      best_competitor: comp,
      rank: base <= comp ? 1 : 2,
      total_hotels: 4,
    });
  }
  return days;
}

export function useCalendar(days = 30) {
  const { isDemoMode } = useAuth();
  const demoCalendar = useMemo(() => generateDemoCalendar(), []);
  const [data, setData] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setData(demoCalendar);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: cal } = await ratesApi.getCalendar(days);
      setData(cal);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento calendario");
    } finally {
      setIsLoading(false);
    }
  }, [days, isDemoMode, demoCalendar]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

function generateDemoSuggestions(): PriceSuggestion[] {
  const today = new Date();
  const signals: Array<"lower" | "raise" | "ok"> = ["ok", "lower", "ok", "raise", "ok", "ok", "lower", "ok", "raise", "ok", "ok", "ok", "lower", "ok"];
  return signals.map((signal, i) => {
    const d = addDays(today, i + 1);
    const own = 90 + Math.floor(Math.random() * 40);
    const avg = signal === "lower" ? own * 0.82 : signal === "raise" ? own * 1.18 : own * 0.97;
    const diff = ((own - avg) / avg) * 100;
    return {
      check_in: format(d, "yyyy-MM-dd"),
      own_min: own,
      market_avg: Math.round(avg),
      market_min: Math.round(avg * 0.9),
      market_max: Math.round(avg * 1.15),
      diff_pct: Math.round(diff),
      signal,
      message: signal === "lower"
        ? `Il tuo prezzo (€${own}) è ${Math.abs(Math.round(diff))}% sopra la media. Valuta una riduzione.`
        : signal === "raise"
        ? `Il tuo prezzo (€${own}) è ${Math.abs(Math.round(diff))}% sotto la media. Puoi aumentare.`
        : `Il tuo prezzo (€${own}) è allineato alla media (€${Math.round(avg)}).`,
    };
  });
}

export function useSuggestions(days = 14) {
  const { isDemoMode } = useAuth();
  const demoSuggestions = useMemo(() => generateDemoSuggestions(), []);
  const [data, setData] = useState<PriceSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (isDemoMode) {
      setData(demoSuggestions);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data: sug } = await ratesApi.getSuggestions(days);
      setData(sug);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Errore nel caricamento suggerimenti");
    } finally {
      setIsLoading(false);
    }
  }, [days, isDemoMode, demoSuggestions]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
