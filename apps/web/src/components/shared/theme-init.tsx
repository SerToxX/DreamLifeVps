'use client';
import { useEffect } from 'react';
import { useThemeStore } from '@/stores/theme.store';

export function ThemeInit() {
  const theme = useThemeStore((s) => s.theme);
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);
  return null;
}
