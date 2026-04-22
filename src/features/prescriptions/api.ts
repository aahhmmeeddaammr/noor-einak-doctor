import apiClient from '@/lib/api-client';

export const prescriptionsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/prescriptions', { params }),

  getById: (id: string) =>
    apiClient.get(`/prescriptions/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/prescriptions', data),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/prescriptions/${id}`, data),

  cancel: (id: string) =>
    apiClient.patch(`/prescriptions/${id}/cancel`),
};
