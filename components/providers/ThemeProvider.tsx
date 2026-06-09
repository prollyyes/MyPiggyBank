'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Theme } from '@/lib/types';
import { storage } from '@/lib/storage';

interface ThemeCtx {
  theme: Theme;
  colorPalette: 'amalfi' | 'santorini' | 'tuscany';
  toggle: () => void;
  setPalette: (p: 'amalfi' | 'santorini' | 'tuscany') => void;
}

const Ctx = createContext<ThemeCtx>({ 
  theme: 'light', 
  colorPalette: 'amalfi',
  toggle: () => {},
  setPalette: () => {}
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [palette, setPaletteState] = useState<'amalfi' | 'santorini' | 'tuscany'>('amalfi');

  useEffect(() => {
    const s = storage.getSettings();
    setTheme(s.theme);
    setPaletteState(s.colorPalette || 'amalfi');
    applyTheme(s.theme, s.colorPalette || 'amalfi');
  }, []);

  const toggle = useCallback(() => {
    setTheme(prev => {
      const next: Theme = prev === 'light' ? 'dark' : 'light';
      setPaletteState(currentPalette => {
        applyTheme(next, currentPalette);
        const s = storage.getSettings();
        storage.saveSettings({ ...s, theme: next });
        return currentPalette;
      });
      return next;
    });
  }, []);

  const setPalette = useCallback((p: 'amalfi' | 'santorini' | 'tuscany') => {
    setPaletteState(p);
    setTheme(currentTheme => {
      applyTheme(currentTheme, p);
      const s = storage.getSettings();
      storage.saveSettings({ ...s, colorPalette: p });
      return currentTheme;
    });
  }, []);

  return <Ctx.Provider value={{ theme, colorPalette: palette, toggle, setPalette }}>{children}</Ctx.Provider>;
}

function applyTheme(theme: Theme, palette: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.classList.remove('theme-amalfi', 'theme-santorini', 'theme-tuscany');
  document.documentElement.classList.add(`theme-${palette}`);
}

export function useTheme() {
  return useContext(Ctx);
}
