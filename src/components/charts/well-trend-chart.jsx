'use client';

/**
 * ECharts — single-well trend with anomalies called out.
 *
 * Same actual-vs-target story as the dashboard chart, but for one well and with
 * the flagged outliers drawn on top as a scatter series, so a spike or a
 * downtime day is impossible to scroll past. Clicking a flagged point is how
 * an analyst gets from "that looks wrong" to the underlying reading.
 */
import { useMemo } from 'react';
import { EChart } from './echarts-chart';
import { useChartTheme } from '@/hooks/use-chart-theme';
import { formatDateShort, formatNumber } from '@/lib/format';

const ANOMALY_LABEL = { downtime: 'Downtime', spike: 'Spike', dip: 'Dip' };

export function WellTrendChart({ readings, flags, height = 380, showAnomalies = true }) {
  const theme = useChartTheme();

  const option = useMemo(() => {
    const labels = readings.map((r) => formatDateShort(r.date));

    // Anomalies become a scatter overlay positioned on the raw 1D series.
    const anomalyPoints = showAnomalies
      ? readings
          .map((reading, index) => {
            const flag = flags?.get(`${reading.well}|${reading.date}`);
            if (!flag) return null;
            return {
              value: [index, reading.production1d],
              flag,
              reading,
              itemStyle: { color: flag.type === 'downtime' ? theme.danger : theme.warning },
            };
          })
          .filter(Boolean)
      : [];

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
        formatter: (params) => {
          const index = params[0].dataIndex;
          const reading = readings[index];
          const flag = flags?.get(`${reading.well}|${reading.date}`);
          const lines = params
            .filter((p) => p.seriesType !== 'scatter')
            .map((p) => `<div style="display:flex;gap:14px;justify-content:space-between">
                <span>${p.marker} ${p.seriesName}</span><strong>${formatNumber(p.value, 1)} m³/d</strong>
              </div>`)
            .join('');
          const anomaly = flag
            ? `<div style="margin-top:4px;color:${flag.type === 'downtime' ? theme.danger : theme.warning}">
                ⚠ ${ANOMALY_LABEL[flag.type]} — ${flag.reason}</div>`
            : '';
          return `<div style="font-weight:600;margin-bottom:4px">${reading.date}</div>${lines}${anomaly}`;
        },
      },

      legend: { top: 0, left: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: theme.muted, fontSize: 11 } },
      grid: { left: 56, right: 20, top: 40, bottom: 56 },

      xAxis: {
        type: 'category',
        data: labels,
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

      dataZoom: [
        { type: 'inside' },
        {
          type: 'slider', bottom: 6, height: 18, borderColor: theme.grid,
          fillerColor: theme.primarySoft, handleStyle: { color: theme.primary },
          textStyle: { color: theme.muted, fontSize: 10 },
        },
      ],

      series: [
        {
          name: 'Production 1D',
          type: 'line',
          data: readings.map((r) => Number(r.production1d.toFixed(2))),
          showSymbol: false,
          lineStyle: { width: 1.2, opacity: 0.55, color: theme.palette[0] },
          itemStyle: { color: theme.palette[0] },
        },
        {
          name: 'Production 7D',
          type: 'line',
          data: readings.map((r) => Number(r.production7d.toFixed(2))),
          showSymbol: false,
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
        },
        {
          name: 'Target',
          type: 'line',
          data: readings.map((r) => Number(r.target.toFixed(2))),
          showSymbol: false,
          step: 'end',
          lineStyle: { width: 2, type: 'dashed', color: theme.warning },
          itemStyle: { color: theme.warning },
        },
        {
          name: 'Anomaly',
          type: 'scatter',
          // Base colour drives the legend swatch; individual points override it
          // (downtime shows red, spikes and dips amber).
          color: theme.warning,
          data: anomalyPoints,
          symbolSize: 9,
          symbol: 'diamond',
          z: 10,
          tooltip: { show: false },
        },
      ],
    };
  }, [readings, flags, showAnomalies, theme]);

  return <EChart option={option} height={height} themeKey={theme.key} />;
}
