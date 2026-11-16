import apiClient from '@/lib/api-client';

export const messagingApi = {
  getOrCreateConversation: (otherUserId: string) =>
    apiClient.post('/messaging/conversations', { otherUserId }),

  getConversations: (params?: any) =>
    apiClient.get('/messaging/conversations', { params }),

  getMessages: (conversationId: string, params?: Record<string, unknown>) =>
    apiClient.get(`/messaging/conversations/${conversationId}/messages`, { params }),

  sendMessage: (conversationId: string, data: any) =>
    apiClient.post(`/messaging/conversations/${conversationId}/messages`, data),

  markAsRead: (conversationId: string) =>
    apiClient.patch(`/messaging/conversations/${conversationId}/read`),
};
