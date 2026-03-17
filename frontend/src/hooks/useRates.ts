import { useCallback, useEffect, useMemo, useState } from "react";
import { ratesApi } from "../api/rates";
import type { ComparisonRow, HistoryPoint, HotelRates } from "../types";
import { format } from "date-fns";
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
