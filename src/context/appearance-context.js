'use client';

/**
 * Appearance: theme, font family and font size.
 *
 * All three are written onto <html> as data attributes; globals.css does the
 * rest. Because every colour, font and spacing value in the app resolves
 * through those tokens, one attribute change restyles charts, grids and cards
 * together — including ECharts, Highcharts and AG Grid, which read the same CSS
 * variables through the useChartTheme hook.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, loadJson, saveJson } from '@/lib/storage';

export const THEMES = [
  { id: 'light', label: 'Light', description: 'Default daylight palette.' },
  { id: 'dark', label: 'Dark', description: 'Low-light control room and evening shifts.' },
  { id: 'contrast', label: 'High contrast', description: 'Maximum legibility on projectors and wall displays.' },
  { id: 'system', label: 'Match system', description: 'Follow the operating system setting.' },
];

export const FONTS = [
  { id: 'sans', label: 'Sans', sample: 'System UI' },
  { id: 'serif', label: 'Serif', sample: 'Georgia' },
  { id: 'mono', label: 'Monospace', sample: 'SF Mono' },
  { id: 'rounded', label: 'Rounded', sample: 'Nunito' },
];

export const SCALES = [
  { id: 'sm', label: 'Compact', hint: '14px base — dense tables' },
  { id: 'md', label: 'Default', hint: '16px base' },
  { id: 'lg', label: 'Large', hint: '18px base — shared screens' },
  { id: 'xl', label: 'Projector', hint: '21px base — control room' },
];

const DEFAULTS = { theme: 'system', font: 'sans', scale: 'md' };

const AppearanceContext = createContext(null);

/** Resolve 'system' to the concrete theme the OS is currently asking for. */
function resolveTheme(theme) {
  if (theme !== 'system') return theme;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppearanceProvider({ children }) {
  const [appearance, setAppearance] = useState(DEFAULTS);
  const [resolvedTheme, setResolvedTheme] = useState('light');

  // Hydrate from localStorage after mount (the server has no access to it).
  useEffect(() => {
    setAppearance({ ...DEFAULTS, ...loadJson(STORAGE_KEYS.APPEARANCE, {}) });
  }, []);

  // Push the current preferences onto <html>.
  useEffect(() => {
    const root = document.documentElement;
    const actual = resolveTheme(appearance.theme);
    root.dataset.theme = actual;
    root.dataset.font = appearance.font;
    root.dataset.scale = appearance.scale;
    root.style.colorScheme = actual === 'light' ? 'light' : 'dark';
    setResolvedTheme(actual);
    saveJson(STORAGE_KEYS.APPEARANCE, appearance);
  }, [appearance]);

  // While on 'system', react to the OS flipping between light and dark.
  useEffect(() => {
    if (appearance.theme !== 'system') return undefined;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      const actual = query.matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = actual;
      setResolvedTheme(actual);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [appearance.theme]);

  const update = useCallback((patch) => setAppearance((current) => ({ ...current, ...patch })), []);
  const reset = useCallback(() => setAppearance(DEFAULTS), []);

  const value = useMemo(
    () => ({ ...appearance, resolvedTheme, update, reset }),
    [appearance, resolvedTheme, update, reset],
  );

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (!context) throw new Error('useAppearance must be used inside <AppearanceProvider>');
  return context;
}
