import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { AdminStats, AdminStatusFilter, AdminUserPage } from "@/lib/types";

export function useAdminStats(days = 30) {
  return useQuery({
    queryKey: ["admin", "stats", days],
    queryFn: async () => (await api.get<AdminStats>("/admin/stats", { params: { days } })).data,
    refetchInterval: 60_000, // el panel se mantiene al día durante un evento
  });
}

export function useAdminUsers(params: { q: string; status: AdminStatusFilter; page: number }) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: async () =>
      (
        await api.get<AdminUserPage>("/admin/users", {
          params: { q: params.q || undefined, status: params.status, page: params.page, page_size: 25 },
        })
      ).data,
    placeholderData: keepPreviousData,
  });
}

/** Tras cualquier cambio se refrescan la lista y los contadores. */
function useInvalidateAdmin() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ["admin"] });
}

export function useSetUserActive() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) =>
      (await api.patch(`/admin/users/${id}`, { is_active })).data,
    onSettled: invalidate,
  });
}

export function useBulkSetActive() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    /** Sin `user_ids` cambia a TODOS (menos superadmins). */
    mutationFn: async (body: { is_active: boolean; user_ids?: string[] }) =>
      (await api.post<{ updated: number }>("/admin/users/bulk", body)).data,
    onSettled: invalidate,
  });
}

export function useSetRequireApproval() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (require_approval: boolean) =>
      (await api.put("/admin/settings", { require_approval })).data,
    onSettled: invalidate,
  });
}
