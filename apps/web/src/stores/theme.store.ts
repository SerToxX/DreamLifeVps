import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      toggle: () => {
        const next: Theme = get().theme === 'light' ? 'dark' : 'light';
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next === 'dark');
        }
        set({ theme: next });
      },
      setTheme: (t) => {
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', t === 'dark');
        }
        set({ theme: t });
      },
    }),
    { name: 'dreamlife-theme' }
  )
);
