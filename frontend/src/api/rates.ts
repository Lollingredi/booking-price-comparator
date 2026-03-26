import { apiClient } from "./client";
import type { CalendarDay, ComparisonRow, HistoryPoint, HotelRates, PriceSuggestion } from "../types";

export const ratesApi = {
  getCurrent: (check_in: string, check_out: string) =>
    apiClient.get<HotelRates[]>("/api/rates/current", {
      params: { check_in, check_out },
    }),

  getHistory: (hotel_key: string, days = 30) =>
    apiClient.get<HistoryPoint[]>("/api/rates/history", {
      params: { hotel_key, days },
    }),

  getHistoryAll: (days = 30) =>
    apiClient.get<HistoryPoint[]>("/api/rates/history/all", { params: { days } }),

  getComparison: (check_in: string, check_out: string) =>
    apiClient.get<ComparisonRow[]>("/api/rates/comparison", {
      params: { check_in, check_out },
    }),

  fetchNow: (check_in: string, check_out: string, days_ahead = 7) =>
    apiClient.post<{ scraped: number; prices_found: number; errors: string[]; workflow_triggered: boolean; workflow_run_url: string | null }>(
      "/api/rates/fetch-now",
      null,
      { params: { check_in, check_out, days_ahead } }
    ),

  getCalendar: (days = 30) =>
    apiClient.get<CalendarDay[]>("/api/rates/calendar", { params: { days } }),

  getSuggestions: (days = 14) =>
    apiClient.get<PriceSuggestion[]>("/api/rates/suggestions", { params: { days } }),
};
