import { apiClient } from "./client";
import type { ComparisonRow, HistoryPoint, HotelRates } from "../types";

export const ratesApi = {
  getCurrent: (check_in: string, check_out: string) =>
    apiClient.get<HotelRates[]>("/api/rates/current", {
      params: { check_in, check_out },
    }),

  getHistory: (hotel_key: string, days = 30) =>
    apiClient.get<HistoryPoint[]>("/api/rates/history", {
      params: { hotel_key, days },
    }),

  getComparison: (check_in: string, check_out: string) =>
    apiClient.get<ComparisonRow[]>("/api/rates/comparison", {
      params: { check_in, check_out },
    }),
};
