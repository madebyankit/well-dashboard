'use client';

/**
 * Highcharts — solid gauge showing attainment against target.
 *
 * The solid-gauge module is Highcharts' strongest card, so this is where it is
 * used: a single "am I hitting target?" number that reads at a glance from
 * across a control room. The band runs 0-150% with the 100% mark called out.
 */
import { useMemo } from 'react';
import { HighchartsChart } from './highcharts-chart';
import { useChartTheme } from '@/hooks/use-chart-theme';

export function AttainmentGauge({ value, label, height = 200 }) {
  const theme = useChartTheme();

  const options = useMemo(() => {
    const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(150, value)) : 0;
    // Same bands as statusFor() in lib/metrics.js: beating target reads green,
    // inside the +/-5% band reads as the neutral primary, below it reads red.
    const colour = safeValue >= 105 ? theme.success : safeValue >= 95 ? theme.primary : theme.danger;

    return {
      chart: {
        type: 'solidgauge',
        backgroundColor: 'transparent',
        style: { fontFamily: theme.fontFamily },
        margin: [0, 0, 0, 0],
        spacing: [0, 0, 0, 0],
      },
      title: { text: undefined },
      credits: { enabled: false },

      pane: {
        center: ['50%', '72%'],
        size: '150%',
        startAngle: -90,
        endAngle: 90,
        background: {
          backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
          innerRadius: '62%',
          outerRadius: '100%',
          shape: 'arc',
          borderWidth: 0,
        },
      },

      yAxis: {
        min: 0,
        max: 150,
        lineWidth: 0,
        tickWidth: 0,
        minorTickInterval: null,
        tickAmount: 2,
        labels: { enabled: false },
        // Call out 100% — the target line the gauge is really measuring against.
        plotBands: [{ from: 99.4, to: 100.6, color: theme.muted, innerRadius: '58%', outerRadius: '104%' }],
      },

      tooltip: { enabled: false },

      plotOptions: {
        solidgauge: {
          innerRadius: '62%',
          borderWidth: 0,
          dataLabels: {
            y: -18,
            borderWidth: 0,
            useHTML: true,
            format: `<div style="text-align:center">
                <div style="font-size:1.5rem;font-weight:600;color:${theme.text}">{y:.1f}%</div>
                <div style="font-size:0.7rem;color:${theme.muted}">${label ?? 'of target'}</div>
              </div>`,
          },
        },
      },

      series: [{ name: 'Attainment', data: [{ y: safeValue, color: colour }] }],
      accessibility: { enabled: false },
    };
  }, [value, label, theme]);

  return <HighchartsChart options={options} height={height} themeKey={theme.key} />;
}
