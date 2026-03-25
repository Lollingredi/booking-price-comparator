import { apiClient } from "./client";

export interface TeamMember {
  id: string;
  hotel_id: string;
  user_id: string;
  role: "owner" | "manager" | "viewer";
  invited_email: string | null;
  created_at: string;
  user_email: string | null;
  user_name: string | null;
}

export const teamApi = {
  list: () => apiClient.get<TeamMember[]>("/api/team"),

  invite: (email: string, role: "manager" | "viewer") =>
    apiClient.post<TeamMember>("/api/team", { email, role }),

  updateRole: (memberId: string, role: "manager" | "viewer") =>
    apiClient.patch<TeamMember>(`/api/team/${memberId}`, { role }),

  remove: (memberId: string) =>
    apiClient.delete(`/api/team/${memberId}`),
};
