import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type {
  Conversation,
  ConversationDetail,
  Message,
  Review,
  ReviewOverview,
  Subject,
  ThinkingPath,
} from "@/lib/types";

export function useSubjects() {
  return useQuery({
    queryKey: ["subjects"],
    queryFn: async () => (await api.get<Subject[]>("/subjects")).data,
    staleTime: 1000 * 60 * 10,
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => (await api.get<Conversation[]>("/tutor/conversations")).data,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: ["conversation", id],
    enabled: !!id,
    queryFn: async () =>
      (await api.get<ConversationDetail>(`/tutor/conversations/${id}`)).data,
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { problem: string; title?: string; grade?: number; path?: ThinkingPath }) =>
      (await api.post<ConversationDetail>("/tutor/conversations", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useAdvance(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      message?: string;
      hint_level?: number;
      confidence?: number;
      tired?: boolean;
    }) =>
      (await api.post<Message>(`/tutor/conversations/${conversationId}/advance`, body)).data,
    // El paso actual también se muestra en "Mis retos", Inicio y Logros.
    onSuccess: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["conversation", conversationId] }),
        qc.invalidateQueries({ queryKey: ["conversations"] }),
        // Completar un reto programa su primer repaso.
        qc.invalidateQueries({ queryKey: ["reviews"] }),
      ]),
  });
}

/** Repasos pendientes de hoy y total de repasos hechos. */
export function useReviews() {
  return useQuery({
    queryKey: ["reviews"],
    queryFn: async () => (await api.get<ReviewOverview>("/reviews")).data,
    staleTime: 1000 * 60,
  });
}

export function useStartReview() {
  return useMutation({
    mutationFn: async (id: string) => (await api.post<Review>(`/reviews/${id}/start`)).data,
  });
}

export function useAnswerReview() {
  return useMutation({
    mutationFn: async ({ id, answer }: { id: string; answer: string }) =>
      (await api.post<Review>(`/reviews/${id}/answer`, { answer })).data,
  });
}
