import apiClient from '@/lib/api-client';

export const articlesApi = {
  /** All published articles */
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/articles', { params }),

  /** Doctor's own articles (all statuses) */
  getMine: (params?: Record<string, unknown>) =>
    apiClient.get('/articles/my', { params }),

  getById: (id: string) =>
    apiClient.get(`/articles/${id}`),

  create: (data: Record<string, unknown> | FormData) => {
    const isFormData = data instanceof FormData;
    return apiClient.post('/articles', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  update: (id: string, data: Record<string, unknown> | FormData) => {
    const isFormData = data instanceof FormData;
    return apiClient.patch(`/articles/${id}`, data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },

  delete: (id: string) =>
    apiClient.delete(`/articles/${id}`),
};
