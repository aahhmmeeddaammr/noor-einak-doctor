import apiClient from '@/lib/api-client';

export const authApi = {
  login: (data: { identifier: string; password: string }) =>
    apiClient.post('/auth/login', data),

  registerDoctor: (data: Record<string, unknown>) =>
    apiClient.post('/auth/register/doctor', { ...data, role: 'doctor' }),

  verifyOtp: (data: { target: string; code: string; purpose: string }) =>
    apiClient.post('/auth/verify-otp', data),

  resendOtp: (data: { target: string; purpose: string }) =>
    apiClient.post('/auth/resend-otp', data),

  forgotPassword: (data: { identifier: string }) =>
    apiClient.post('/auth/forgot-password', data),

  resetPassword: (data: { target: string; code: string; newPassword: string }) =>
    apiClient.post('/auth/reset-password', data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    apiClient.post('/auth/change-password', data),

  refreshToken: (data: { refreshToken: string }) =>
    apiClient.post('/auth/refresh-token', data),

  logout: (data: { refreshToken: string }) =>
    apiClient.post('/auth/logout', data),

  getProfile: () =>
    apiClient.get('/auth/profile'),
};
