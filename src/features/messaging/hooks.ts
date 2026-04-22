import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagingApi } from './api';

export function useConversations(search?: string) {
  return useQuery({
    queryKey: ['conversations', search],
    queryFn: () => messagingApi.getConversations({ search }),
    refetchInterval: 10000,
  });
}

export function useMessages(conversationId: string, params?: any) {
  return useQuery({
    queryKey: ['messages', conversationId, params],
    queryFn: () => messagingApi.getMessages(conversationId, params),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) =>
      messagingApi.sendMessage(conversationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
