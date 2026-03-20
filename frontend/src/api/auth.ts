import { apiClient } from "./client";
import type { Token, User } from "../types";

export const authApi = {
  register: (email: string, password: string, full_name: string) =>
    apiClient.post<Token>("/api/auth/register", { email, password, full_name }),

  login: (email: string, password: string) =>
    apiClient.post<Token>("/api/auth/login", { email, password }),

  refresh: (refresh_token: string) =>
    apiClient.post<Token>("/api/auth/refresh", { refresh_token }),

  me: () => apiClient.get<User>("/api/auth/me"),

  updateMe: (data: {
    full_name?: string;
    email?: string;
    current_password?: string;
    new_password?: string;
  }) => apiClient.patch<User>("/api/auth/me", data),
};
