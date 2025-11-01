'use client';

import { useState, useEffect } from 'react';

export type Theme = 'light-parchment' | 'dark-parchment';

export interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

/**
 * Hook to manage parchment theme state with localStorage persistence
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('dark-parchment');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && (savedTheme === 'light-parchment' || savedTheme === 'dark-parchment')) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      // Default to dark-parchment for first-time users
      applyTheme('dark-parchment');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    // Remove all theme classes
    document.documentElement.classList.remove('light-parchment', 'dark-parchment', 'dark');
    // Add the new theme class
    document.documentElement.classList.add(newTheme);
    // Also add 'dark' class for Tailwind dark mode compatibility
    if (newTheme === 'dark-parchment') {
      document.documentElement.classList.add('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme };
}
