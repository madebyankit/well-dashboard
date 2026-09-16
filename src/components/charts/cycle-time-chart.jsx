'use client';

/**
 * Highcharts — cycle time against production for a single well.
 *
 * Cycle time is the operational early-warning signal: a well that is slowing
 * down usually shows a lengthening cycle before the production loss becomes
 * obvious. Plotting both on a dual axis makes that relationship visible.
 */
import { useMemo } from 'react';
import { HighchartsChart } from './highcharts-chart';
import { fade, useChartTheme } from '@/hooks/use-chart-theme';
import { formatDateShort } from '@/lib/format';

export function CycleTimeChart({ series, height = 280 }) {
  const theme = useChartTheme();

  const options = useMemo(() => ({
    chart: {
      backgroundColor: 'transparent',
      style: { fontFamily: theme.fontFamily },
      spacing: [8, 8, 8, 0],
      zooming: { type: 'x' },
    },
    title: { text: undefined },
    credits: { enabled: false },

    legend: {
      itemStyle: { color: theme.muted, fontSize: '11px', fontWeight: '500' },
      itemHoverStyle: { color: theme.text },
    },

    xAxis: {
      categories: series.map((point) => formatDateShort(point.date)),
      // A category axis will happily print all 180 dates on top of each other;
      // thin them to roughly ten readable ticks whatever the range.
      tickInterval: Math.max(1, Math.ceil(series.length / 10)),
      labels: { style: { color: theme.muted, fontSize: '10px' }, rotation: 0, overflow: 'justify' },
      lineColor: theme.grid,
      tickColor: theme.grid,
      crosshair: { color: theme.grid },
    },

    yAxis: [
      {
        title: { text: 'Cycle time (min)', style: { color: theme.muted, fontSize: '11px' } },
        labels: { style: { color: theme.muted, fontSize: '10px' } },
        gridLineColor: theme.grid,
        gridLineDashStyle: 'Dash',
      },
      {
        title: { text: 'Production (m³/d)', style: { color: theme.muted, fontSize: '11px' } },
        labels: { style: { color: theme.muted, fontSize: '10px' } },
        gridLineWidth: 0,
        opposite: true,
      },
    ],

    tooltip: {
      shared: true,
      backgroundColor: theme.card,
      borderColor: theme.border,
      style: { color: theme.text, fontSize: '12px' },
    },

    plotOptions: {
      series: { marker: { enabled: false }, states: { inactive: { opacity: 0.4 } } },
    },

    series: [
      {
        name: 'Average cycle time',
        type: 'areaspline',
        yAxis: 0,
        // Seconds are precise but unreadable on an axis — minutes are not.
        data: series.map((point) => Number((point.cycleTime / 60).toFixed(2))),
        color: theme.palette[3],
        // Fade the fill out downwards so it reads as depth under the line
        // rather than a solid block of colour.
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [[0, fade(theme.palette[3], 0.3)], [1, fade(theme.palette[3], 0)]],
        },
        lineWidth: 2,
        tooltip: { valueSuffix: ' min' },
      },
      {
        name: 'Production 7D',
        type: 'spline',
        yAxis: 1,
        data: series.map((point) => Number(point.production7d.toFixed(2))),
        color: theme.palette[0],
        lineWidth: 2,
        dashStyle: 'ShortDot',
        tooltip: { valueSuffix: ' m³/d' },
      },
    ],

    accessibility: { enabled: false },
  }), [series, theme]);

  return <HighchartsChart options={options} height={height} themeKey={theme.key} />;
}
