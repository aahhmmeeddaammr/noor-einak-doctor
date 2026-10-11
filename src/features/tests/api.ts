import apiClient from '@/lib/api-client';

export const testsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/tests', { params }),

  getById: (id: string) =>
    apiClient.get(`/tests/${id}`),

  review: (id: string, data: { status: string; doctorNotes?: string }) =>
    apiClient.patch(`/tests/${id}/review`, data),

  uploadForPatient: (patientId: string, data: FormData) =>
    apiClient.post(`/tests/for-patient/${patientId}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
