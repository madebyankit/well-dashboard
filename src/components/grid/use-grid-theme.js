'use client';

/**
 * AG Grid theme + shared defaults.
 *
 * AG Grid v36 configures its look through the Theming API in JavaScript rather
 * than a CSS import, which suits this app: the parameters are derived from the
 * same design tokens as everything else, so the grid follows the user's
 * light / dark / high-contrast and text-size choices automatically.
 *
 * All community modules are registered once at module scope — v33+ requires
 * explicit registration before any grid is constructed.
 */
import { useMemo } from 'react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { useChartTheme } from '@/hooks/use-chart-theme';

ModuleRegistry.registerModules([AllCommunityModule]);

export function useGridTheme() {
  const chartTheme = useChartTheme();

  const theme = useMemo(
    () =>
      themeQuartz.withParams({
        backgroundColor: chartTheme.card,
        foregroundColor: chartTheme.text,
        headerBackgroundColor: chartTheme.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
        headerTextColor: chartTheme.muted,
        borderColor: chartTheme.border,
        oddRowBackgroundColor: 'transparent',
        rowHoverColor: chartTheme.primarySoft,
        selectedRowBackgroundColor: chartTheme.primarySoft,
        accentColor: chartTheme.primary,
        fontFamily: chartTheme.fontFamily,
        // Sizes in rem so the Settings text-scale also scales the grid — which
        // is what makes the "Projector" preset usable on a wall display.
        fontSize: '0.875rem',
        headerFontSize: '0.75rem',
        wrapperBorderRadius: '0.5rem',
      }),
    [chartTheme],
  );

  const defaultColDef = useMemo(
    () => ({ sortable: true, filter: true, resizable: true, minWidth: 110, flex: 1 }),
    [],
  );

  const noRowsTemplate = `<span style="color:${chartTheme.muted};font-size:0.875rem">No rows match the current filters.</span>`;

  return { theme, defaultColDef, noRowsTemplate };
}
