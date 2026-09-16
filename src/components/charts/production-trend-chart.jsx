'use client';

/**
 * ECharts — production against target over time.
 *
 * Three series on one axis, which is the whole story the panel needs to tell:
 *   Production 1D   the raw daily reading, drawn faint because it is noisy
 *   Production 7D   the rolling average, drawn bold because it is the trend
 *   Target          the analyst target, dashed and stepped (targets are
 *                   revised at review points, they do not drift continuously)
 *
 * ECharts is used here rather than Highcharts because this is the series that
 * needs real interaction: scroll-to-zoom plus a range slider over six months of
 * daily readings, with a crosshair tooltip comparing all three values on a day.
 *
 * Per-well variance against target is not repeated here — it is the "vs target"
 * column in the well table and the ranking chart beside this one.
 */
import { useMemo } from 'react';
import { EChart } from './echarts-chart';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { formatDateShort, formatNumber } from '@/lib/format';

export function ProductionTrendChart({ series, height = 420 }) {
  const theme = useChartTheme();

  const option = useMemo(() => {
    const line = (name, key, style) => ({
      name,
      type: 'line',
      data: series.map((point) => Number(point[key].toFixed(2))),
      showSymbol: false,
      ...style,
    });

    return {
      backgroundColor: 'transparent',
      textStyle: { fontFamily: theme.fontFamily, color: theme.text },
      animationDuration: 400,

      tooltip: {
        trigger: 'axis',
        backgroundColor: theme.card,
        borderColor: theme.border,
        textStyle: { color: theme.text, fontSize: 12 },
        axisPointer: { type: 'cross', label: { backgroundColor: theme.muted } },
        valueFormatter: (value) => `${formatNumber(value, 1)} m³/d`,
      },

      legend: {
        top: 0,
        left: 0,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: theme.muted, fontSize: 11 },
      },

      grid: { left: 60, right: 20, top: 36, bottom: 56 },

      xAxis: {
        type: 'category',
        data: series.map((point) => formatDateShort(point.date)),
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

      // Scroll/pinch to zoom, plus a slider so the range is also draggable.
      dataZoom: [
        { type: 'inside' },
        {
          type: 'slider', bottom: 6, height: 18, borderColor: theme.grid,
          fillerColor: theme.primarySoft, handleStyle: { color: theme.primary },
          textStyle: { color: theme.muted, fontSize: 10 },
        },
      ],

      series: [
        line('Production 1D', 'production1d', {
          lineStyle: { width: 1, opacity: 0.45, color: theme.palette[0] },
          itemStyle: { color: theme.palette[0] },
        }),
        line('Production 7D', 'production7d', {
          smooth: true,
          lineStyle: { width: 2.5, color: theme.palette[0] },
          itemStyle: { color: theme.palette[0] },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: theme.primaryFadeTop },
                { offset: 1, color: theme.primaryFadeBottom },
              ],
            },
          },
        }),
        line('Target', 'target', {
          step: 'end',
          lineStyle: { width: 2, type: 'dashed', color: theme.warning },
          itemStyle: { color: theme.warning },
        }),
      ],
    };
  }, [series, theme]);

  return <EChart option={option} height={height} themeKey={theme.key} />;
}
