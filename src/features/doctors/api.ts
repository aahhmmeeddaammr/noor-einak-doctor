import apiClient from '@/lib/api-client';

export const doctorsApi = {
  getMe: () => apiClient.get('/doctors/me'),
  updateProfile: (data: Record<string, unknown> | FormData) => {
    const isFormData = data instanceof FormData;
    return apiClient.patch('/doctors/me', data, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
  },
};
