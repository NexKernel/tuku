import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth";
import type { TokenPair, User } from "@/lib/types";

export function useCurrentUser() {
  const token = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: ["me"],
    enabled: !!token,
    queryFn: async () => {
      const { data } = await api.get<User>("/auth/me");
      setUser(data);
      return data;
    },
  });
}

export function useLogin() {
  const { setTokens } = useAuthStore();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (creds: { email: string; password: string }) => {
      const { data } = await api.post<TokenPair>("/auth/login", creds);
      return data;
    },
    onSuccess: (data) => {
      setTokens(data.access_token, data.refresh_token);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (body: { email: string; password: string; full_name: string }) => {
      const { data } = await api.post<User>("/auth/register", body);
      return data;
    },
  });
}
