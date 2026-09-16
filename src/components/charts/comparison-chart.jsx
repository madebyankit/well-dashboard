'use client';

/**
 * ECharts — compare several fields (or several wells) side by side.
 *
 * The dashboard flips the grouping automatically: while more than one field is
 * in view it compares fields, and once the user narrows to a single field it
 * compares the wells inside it. That keeps the panel useful at every level of
 * drill-down instead of going flat.
 *
 * Every line stays at full strength on hover. ECharts can dim the other series
 * to highlight one, but on a comparison chart that hides exactly what the user
 * is trying to compare against.
 */
import { useMemo } from 'react';
import { EChart } from './echarts-chart';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { formatDateShort, formatNumber } from '@/lib/format';

export function ComparisonChart({ dates, series, height = 320 }) {
  const theme = useChartTheme();

  const option = useMemo(() => ({
    backgroundColor: 'transparent',
    textStyle: { fontFamily: theme.fontFamily, color: theme.text },
    color: theme.palette,
    animationDuration: 400,

    tooltip: {
      trigger: 'axis',
      backgroundColor: theme.card,
      borderColor: theme.border,
      textStyle: { color: theme.text, fontSize: 12 },
      // Largest first, so the tooltip reads as a ranking for that day.
      order: 'valueDesc',
      valueFormatter: (value) => (value == null ? '—' : `${formatNumber(value, 1)} m³/d`),
    },

    legend: {
      type: 'scroll',
      top: 0,
      icon: 'roundRect',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: theme.muted, fontSize: 11 },
    },

    grid: { left: 60, right: 20, top: 40, bottom: 34 },

    xAxis: {
      type: 'category',
      data: dates.map(formatDateShort),
      boundaryGap: false,
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, fontSize: 10, hideOverlap: true },
      axisTick: { show: false },
    },

    yAxis: {
      type: 'value',
      name: 'm³/d',
      nameTextStyle: { color: theme.muted, fontSize: 10, align: 'right' },
      axisLabel: { color: theme.muted, fontSize: 10 },
      splitLine: { lineStyle: { color: theme.grid, type: 'dashed' } },
    },

    dataZoom: [{ type: 'inside' }],

    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 2 },
    })),
  }), [dates, series, theme]);

  return <EChart option={option} height={height} themeKey={theme.key} />;
}
