import { useCallback, useEffect, useState } from "react";
import { ratesApi } from "../api/rates";
import type { ComparisonRow, HistoryPoint, HotelRates } from "../types";
import { format } from "date-fns";

export function useCurrentRates(checkIn: Date, checkOut: Date) {
  const [data, setData] = useState<HotelRates[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
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
  }, [checkIn, checkOut]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useComparison(checkIn: Date, checkOut: Date) {
  const [data, setData] = useState<ComparisonRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
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
  }, [checkIn, checkOut]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

export function useHistory(hotelKey: string, days = 30) {
  const [data, setData] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
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
  }, [hotelKey, days]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}
