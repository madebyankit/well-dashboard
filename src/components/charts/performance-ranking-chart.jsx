'use client';

/**
 * Highcharts — top and bottom performers against target.
 *
 * Highcharts is used for the ranking view because its horizontal bar charts,
 * plot lines and per-point colouring make "who is above and below the 100%
 * line" readable without any extra work, and the category axis handles long
 * well names gracefully at narrow widths.
 *
 * Bars are drawn as variance from target (attainment - 100), so the 100% line
 * sits at zero and over/under-performance reads as direction, not magnitude.
 */
import { useMemo } from 'react';
import { HighchartsChart } from './highcharts-chart';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { STATUS } from '@/lib/metrics';

export function PerformanceRankingChart({ top, bottom, height = 360, onSelectWell }) {
  const theme = useChartTheme();

  const options = useMemo(() => {
    // Best at the top, worst at the bottom, with the whole spread in one axis.
    const ordered = [...top, ...bottom.filter((w) => !top.some((t) => t.well === w.well))]
      .sort((a, b) => a.attainment - b.attainment);

    const colourFor = (status) =>
      status === STATUS.OVER ? theme.success : status === STATUS.UNDER ? theme.danger : theme.palette[2];

    return {
      chart: {
        type: 'bar',
        backgroundColor: 'transparent',
        style: { fontFamily: theme.fontFamily },
        spacing: [8, 8, 8, 0],
      },
      title: { text: undefined },
      credits: { enabled: false },
      legend: { enabled: false },

      xAxis: {
        categories: ordered.map((w) => w.well),
        labels: { style: { color: theme.muted, fontSize: '11px' } },
        lineColor: theme.grid,
        tickColor: theme.grid,
      },

      yAxis: {
        title: { text: 'Variance from target', style: { color: theme.muted, fontSize: '11px' } },
        labels: { format: '{value}%', style: { color: theme.muted, fontSize: '11px' } },
        gridLineColor: theme.grid,
        gridLineDashStyle: 'Dash',
        // The zero line is the target itself — the reference for the whole chart.
        plotLines: [{ value: 0, color: theme.muted, width: 1.5, zIndex: 5 }],
      },

      tooltip: {
        backgroundColor: theme.card,
        borderColor: theme.border,
        style: { color: theme.text, fontSize: '12px' },
        formatter() {
          const well = ordered[this.point.index];
          return `<b>${well.well}</b><br/>${well.field}<br/>
            Attainment: <b>${well.attainment.toFixed(1)}%</b><br/>
            Average: ${well.avgProduction.toFixed(1)} m³/d<br/>
            Target: ${well.target.toFixed(1)} m³/d`;
        },
      },

      plotOptions: {
        bar: {
          borderWidth: 0,
          borderRadius: 3,
          pointPadding: 0.08,
          groupPadding: 0.08,
          dataLabels: {
            enabled: true,
            format: '{y:.1f}%',
            style: { color: theme.muted, fontSize: '10px', fontWeight: '500', textOutline: 'none' },
          },
          cursor: onSelectWell ? 'pointer' : undefined,
          point: {
            events: {
              click() {
                if (onSelectWell) onSelectWell(ordered[this.index].well);
              },
            },
          },
        },
      },

      series: [
        {
          name: 'Variance',
          data: ordered.map((w) => ({
            y: Number((w.attainment - 100).toFixed(1)),
            color: colourFor(w.status),
          })),
        },
      ],

      accessibility: { enabled: false },
    };
  }, [top, bottom, theme, onSelectWell]);

  return <HighchartsChart options={options} height={height} themeKey={theme.key} />;
}
