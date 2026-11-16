import { create } from 'zustand';
import { getInitialTheme, saveTheme } from '../lib/theme';

type Theme = 'light' | 'dark';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  theme: getInitialTheme(),
  toggleTheme: () => set((state) => {
    const theme = state.theme === 'light' ? 'dark' : 'light';
    saveTheme(theme);
    return { theme };
  }),
  setTheme: (theme) => { saveTheme(theme); set({ theme }); },
}));
