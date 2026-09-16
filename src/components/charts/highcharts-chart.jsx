'use client';

/**
 * Thin Highcharts wrapper.
 *
 * The ESM builds are imported (rather than the default UMD ones) because those
 * attach themselves to `window` at import time, which breaks server rendering.
 * The ESM entry points share a single Highcharts instance, so the feature
 * modules below register against the same object.
 */
import { useEffect, useRef } from 'react';
import Highcharts from 'highcharts/esm/highcharts.js';
import 'highcharts/esm/highcharts-more.js';
import 'highcharts/esm/modules/solid-gauge.js';
import 'highcharts/esm/modules/accessibility.js';

export function HighchartsChart({ options, height = 320, className = '', themeKey = 'default' }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !options) return undefined;

    const chart = Highcharts.chart(container, {
      ...options,
      chart: { ...options.chart, height },
      credits: { enabled: false },
      // Highcharts' own exporting/context menu is off — the grids handle export.
      exporting: { enabled: false },
      title: options.title ?? { text: undefined },
    });
    chartRef.current = chart;

    // Highcharts only reflows on a window resize by default, so a chart whose
    // container changes for any other reason (the sidebar collapsing, a grid
    // re-flowing, the text-size setting changing) would keep a stale width.
    // Deferring to the next frame coalesces bursts, as in the ECharts wrapper.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => chart.reflow());
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      chart.destroy();
      chartRef.current = null;
    };
    // Rebuilt wholesale on any change: these charts are small, and a full
    // rebuild is simpler and safer than diffing Highcharts config objects.
  }, [options, height, themeKey]);

  // `min-width: 0` lets the chart shrink inside a grid or flex parent. Without
  // it those parents size to the chart's intrinsic width, and a narrow phone
  // viewport ends up with the whole column pushed wider than the screen.
  return <div ref={containerRef} className={className} style={{ width: '100%', minWidth: 0 }} />;
}

export { Highcharts };
