import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

export const BASE_URL = 'https://api.nooreinak.com/api/v1' ;

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('Refresh token is missing');

  // Use the same API host as every other request, without invoking this interceptor.
  const response = await axios.post(`${BASE_URL.replace(/\/$/, '')}/auth/refresh-token`, { refreshToken }, { timeout: 15000 });
  const { accessToken, refreshToken: nextRefreshToken } = response.data.data;
  const state = useAuthStore.getState();
  if (!state.user || state.refreshToken !== refreshToken) throw new Error('Session changed during refresh');

  state.setAuth({ user: state.user, accessToken, refreshToken: nextRefreshToken });
  return accessToken;
};

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    const isAuthRequest = ['/auth/login', '/auth/refresh-token', '/auth/logout']
      .some((path) => originalRequest?.url?.includes(path));
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken()
          .catch((refreshError) => {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            throw refreshError;
          })
          .finally(() => { refreshPromise = null; });
      }
      try {
        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
