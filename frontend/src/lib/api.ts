import axios, { AxiosError } from "axios";
import { useAuthStore } from "@/store/auth";
import type { TokenPair } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Refresco automático de token ante un 401.
let refreshing: Promise<string | null> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config;
    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    if (error.response?.status === 401 && original && !(original as any)._retry && refreshToken) {
      (original as any)._retry = true;
      refreshing ??= api
        .post<TokenPair>("/auth/refresh", { refresh_token: refreshToken })
        .then((res) => {
          setTokens(res.data.access_token, res.data.refresh_token);
          return res.data.access_token;
        })
        .catch(() => {
          logout();
          return null;
        })
        .finally(() => {
          refreshing = null;
        });

      const newToken = await refreshing;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  },
);

export function apiError(err: unknown, fallback = "Ocurrió un error."): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { detail?: string })?.detail ?? fallback;
  }
  return fallback;
}
