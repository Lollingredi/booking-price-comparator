import { apiClient } from "./client";
import type { AlertLog, AlertRule } from "../types";

export const alertsApi = {
  listRules: () => apiClient.get<AlertRule[]>("/api/alerts/rules"),

  createRule: (data: {
    rule_type: string;
    threshold_value: number;
    notify_email?: boolean;
    notify_whatsapp?: boolean;
  }) => apiClient.post<AlertRule>("/api/alerts/rules", data),

  updateRule: (id: string, data: Partial<AlertRule>) =>
    apiClient.put<AlertRule>(`/api/alerts/rules/${id}`, data),

  deleteRule: (id: string) => apiClient.delete(`/api/alerts/rules/${id}`),

  getLogs: (page = 1, page_size = 50) =>
    apiClient.get<AlertLog[]>("/api/alerts/log", { params: { page, page_size } }),

  markRead: (id: string) =>
    apiClient.put<AlertLog>(`/api/alerts/log/${id}/read`, {}),
};
