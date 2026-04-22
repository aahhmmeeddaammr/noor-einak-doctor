import apiClient from '@/lib/api-client';

export const dashboardApi = {
  getDashboard: () => apiClient.get('/doctors/me/dashboard'),
};
