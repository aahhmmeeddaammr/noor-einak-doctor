import apiClient from '@/lib/api-client';

export const prescriptionsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/prescriptions', { params }),

  getById: (id: string) =>
    apiClient.get(`/prescriptions/${id}`),

  create: (data: Record<string, unknown>) =>
    apiClient.post('/prescriptions', data),

  searchMedications: (q: string) =>
    apiClient.get('/prescriptions/medications/search', { params: { q } }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/prescriptions/${id}`, data),

  cancel: (id: string) =>
    apiClient.patch(`/prescriptions/${id}/cancel`),
};
