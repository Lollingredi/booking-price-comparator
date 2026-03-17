import { apiClient } from "./client";
import type { Competitor, Hotel, HotelSearchResult } from "../types";

export const hotelsApi = {
  createOrUpdate: (data: {
    name: string;
    booking_key?: string;
    city: string;
    stars?: number | null;
  }) => apiClient.post<Hotel>("/api/hotels", data),

  getMine: () => apiClient.get<Hotel>("/api/hotels/mine"),

  addCompetitor: (data: {
    competitor_name: string;
    competitor_booking_key?: string;
    competitor_stars?: number | null;
  }) => apiClient.post<Competitor>("/api/hotels/competitors", data),

  removeCompetitor: (id: string) =>
    apiClient.delete(`/api/hotels/competitors/${id}`),

  search: (q: string) =>
    apiClient.get<HotelSearchResult[]>("/api/hotels/search", { params: { q } }),

  deleteMine: () => apiClient.delete("/api/hotels/mine"),
};
