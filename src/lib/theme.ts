type Theme = 'light' | 'dark';

interface ThemeStore {
  getState: () => { theme: Theme };
  setState: (state: { theme: Theme }) => void;
  subscribe: (listener: (state: { theme: Theme }) => void) => unknown;
}

let selectedTheme: Theme | null = null;

const STORAGE_KEY = 'doctor-portal-ui';

export function getSavedTheme(): Theme | null {
  try {
    const theme = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')?.state?.theme;
    return theme === 'light' || theme === 'dark' ? theme : null;
  } catch { return null; }
}

export function getInitialTheme(): Theme {
  return getSavedTheme() ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}

export function saveTheme(theme: Theme) {
  selectedTheme = theme;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { theme }, version: 0 })); }
  catch { /* Keep switching functional when browser storage is unavailable. */ }
}

// Apply globally: authentication screens, portal routes and portaled overlays.
export function initializeTheme(store: ThemeStore) {
  const apply = (theme: Theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  };
  selectedTheme = getSavedTheme();
  apply(store.getState().theme);
  store.subscribe((state) => apply(state.theme));
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
    if (!selectedTheme) store.setState({ theme: event.matches ? 'dark' : 'light' });
  });
  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      selectedTheme = getSavedTheme();
      store.setState({ theme: getInitialTheme() });
    }
  });
}
