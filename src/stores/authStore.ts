import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  name?:string;
  avatarUrl?: string;
  role: string;
  status: string;
  doctor?: {
    id: string;
    specialization: string;
    clinic?: {
      name?: string;
      address?: string;
      phone?: string;
      addressLink?: string;
    };
    doctorCode: string;
    verificationStatus: string;
    bio?: string;
    yearsOfExperience?: number;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (data: { user: User; accessToken: string; refreshToken: string }) => void;
  updateUser: (userData: Partial<User>) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setAuth: (data) =>
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
        }),

      updateUser: (userData) =>
        set({ user: { ...get().user!, ...userData } }),

      setAccessToken: (token) => set({ accessToken: token }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        }),
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'doctor-portal-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
