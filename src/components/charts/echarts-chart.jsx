'use client';

/**
 * Thin ECharts wrapper.
 *
 * Owns the whole imperative lifecycle so the chart components above it stay
 * declarative — they only ever build an `option` object.
 *   - initialise on mount, dispose on unmount
 *   - re-apply options when they change
 *   - resize with the container (ResizeObserver), which is what keeps charts
 *     usable from phone width up to a control-room display
 *   - rebuild from scratch when the theme changes, because ECharts caches
 *     colours inside the instance
 */
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

/**
 * `height` accepts a number of pixels or any CSS length. Passing '100%' makes
 * the chart fill a definite-height parent — the ResizeObserver below keeps it
 * correct as that parent grows.
 */
export function EChart({ option, height = 320, className = '', themeKey = 'default', onEvents }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  // Create / destroy. `themeKey` in the dependency list forces a clean rebuild
  // whenever the palette changes.
  useEffect(() => {
    if (!containerRef.current) return undefined;
    const chart = echarts.init(containerRef.current, undefined, { renderer: 'canvas' });
    chartRef.current = chart;

    // Resizing synchronously inside the observer can re-trigger the observer.
    // Deferring to the next frame coalesces bursts (a font-size change resizes
    // every chart at once) and avoids the resize-loop warning in Safari.
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => chart.resize());
    });
    observer.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, [themeKey]);

  // Push new options. `notMerge` avoids stale series lingering when the filter
  // changes the number of series.
  useEffect(() => {
    if (chartRef.current && option) {
      chartRef.current.setOption(option, { notMerge: true, lazyUpdate: true });
    }
  }, [option]);

  // Wire up optional click / brush handlers (used for chart -> grid drilldown).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !onEvents) return undefined;
    const entries = Object.entries(onEvents);
    entries.forEach(([event, handler]) => chart.on(event, handler));
    return () => entries.forEach(([event, handler]) => chart.off(event, handler));
  }, [onEvents, themeKey]);

  return <div ref={containerRef} className={className} style={{ height, width: '100%' }} />;
}
