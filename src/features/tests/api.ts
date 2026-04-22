import apiClient from '@/lib/api-client';

export const testsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/tests', { params }),

  getById: (id: string) =>
    apiClient.get(`/tests/${id}`),

  review: (id: string, data: { status: string; doctorNotes?: string }) =>
    apiClient.patch(`/tests/${id}/review`, data),
};
