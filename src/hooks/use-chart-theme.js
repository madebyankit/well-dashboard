'use client';

/**
 * Bridges the CSS design tokens into the charting libraries.
 *
 * ECharts, Highcharts and AG Grid all want concrete colour strings, not CSS
 * variables. This hook reads the computed values off <html> and re-reads them
 * whenever the appearance settings change, so all three libraries restyle in
 * step with the rest of the UI when the user switches theme.
 */
import { useEffect, useState } from 'react';
import { useAppearance } from '@/context/appearance-context';

/**
 * `--primary: 201 96% 32%` -> `hsl(201, 96%, 32%)`
 *
 * Tailwind stores its colour tokens space-separated. A browser canvas
 * understands that form, but ECharts and Highcharts parse colours *themselves*
 * to derive hover and gradient shades, and their parsers only accept the older
 * comma syntax. Given a space-separated value they return `undefined`, which is
 * how a line ends up with no stroke and vanishes the moment you hover it. So
 * the commas are added here, once, for every chart.
 */
function readToken(styles, name, alpha) {
  const raw = styles.getPropertyValue(name).trim();
  const [h, s, l] = raw.split(/\s+/);
  // Never hand a chart a colour it cannot parse: zrender interpolates colours
  // as [r,g,b,a] arrays while animating, and an unparseable value throws there
  // instead of just looking wrong.
  if (!h || !s || !l) return '#888888';
  return alpha === undefined ? `hsl(${h}, ${s}, ${l})` : `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

/**
 * Re-open a colour this hook produced and give it an alpha, so a series can
 * build a gradient from its *own* colour rather than a hard-coded one.
 * `hsl(268, 62%, 56%)` -> `hsla(268, 62%, 56%, 0.3)`
 */
export function fade(color, alpha) {
  if (typeof color !== 'string') return color;
  const match = /^hsla?\(([^)]+)\)$/.exec(color);
  if (!match) return color;
  const [h, s, l] = match[1].split(',').map((part) => part.trim());
  return `hsla(${h}, ${s}, ${l}, ${alpha})`;
}

const FALLBACK = {
  text: '#334155',
  muted: '#64748b',
  grid: '#e2e8f0',
  background: '#ffffff',
  card: '#ffffff',
  border: '#e2e8f0',
  primary: '#0369a1',
  primarySoft: 'rgba(3,105,161,0.15)',
  primaryFadeTop: 'rgba(3,105,161,0.26)',
  primaryFadeBottom: 'rgba(3,105,161,0)',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  palette: ['#0284c7', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444'],
  isDark: false,
  key: 'fallback',
};

export function useChartTheme() {
  const { resolvedTheme, font, scale } = useAppearance();
  const [theme, setTheme] = useState(FALLBACK);

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setTheme({
      text: readToken(styles, '--foreground'),
      muted: readToken(styles, '--muted-foreground'),
      grid: readToken(styles, '--chart-grid'),
      background: 'transparent',
      card: readToken(styles, '--card'),
      border: readToken(styles, '--border'),
      primary: readToken(styles, '--primary'),
      success: readToken(styles, '--success'),
      warning: readToken(styles, '--warning'),
      danger: readToken(styles, '--destructive'),
      primarySoft: readToken(styles, '--primary', 0.15),
      // Gradient stops for area fills: a solid-ish top fading to nothing, so
      // the fill reads as depth under the line rather than a filled block.
      primaryFadeTop: readToken(styles, '--primary', 0.26),
      primaryFadeBottom: readToken(styles, '--primary', 0),
      palette: [
        readToken(styles, '--chart-1'),
        readToken(styles, '--chart-2'),
        readToken(styles, '--chart-3'),
        readToken(styles, '--chart-4'),
        readToken(styles, '--chart-5'),
      ],
      fontFamily: styles.getPropertyValue('--app-font').trim() || 'system-ui, sans-serif',
      isDark: resolvedTheme !== 'light',
      // Bumping this string forces the chart wrappers to rebuild their options.
      key: `${resolvedTheme}-${font}-${scale}`,
    });
  }, [resolvedTheme, font, scale]);

  return theme;
}
