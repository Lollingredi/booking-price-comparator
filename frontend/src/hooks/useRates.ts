import { useCallback, useEffect, useMemo, useState } from "react";
import { ratesApi } from "../api/rates";
import type { CalendarDay, ComparisonRow, HistoryPoint, HotelRates } from "../types";
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
