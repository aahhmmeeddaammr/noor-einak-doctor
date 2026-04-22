import apiClient from '@/lib/api-client';

export const patientsApi = {
  getAll: (params?: Record<string, unknown>) =>
    apiClient.get('/doctors/me/patients', { params }),

  getById: (id: string) =>
    apiClient.get(`/doctors/me/patients/${id}`),

  togglePermission: (id: string, type: 'chat' | 'test', enabled: boolean) =>
    apiClient.post(`/patients/${id}/toggle-permission`, { type, enabled }),

  bulkPermissions: (data: { canChat?: boolean, canUploadTests?: boolean }) =>
    apiClient.post('/doctors/me/patients/bulk-permissions', data),

  getReminders: (id: string, params?: Record<string, unknown>) =>
    apiClient.get(`/doctors/me/patients/${id}/reminders`, { params }),

  updateMedicalInfo: (id: string, data: { allergies?: string; medicalNotes?: string }) =>
    apiClient.patch(`/patients/${id}/medical-info`, data),
};
