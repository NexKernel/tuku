import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Conversation, ConversationDetail, Message, Subject } from "@/lib/types";

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
    mutationFn: async (body: { problem: string; title?: string }) =>
      (await api.post<ConversationDetail>("/tutor/conversations", body)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["conversations"] }),
  });
}

export function useAdvance(conversationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { message?: string; hint_level?: number }) =>
      (await api.post<Message>(`/tutor/conversations/${conversationId}/advance`, body)).data,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["conversation", conversationId] }),
  });
}
