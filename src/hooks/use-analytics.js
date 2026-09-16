'use client';

/**
 * Turns (readings + filters) into every derived number the dashboard renders.
 *
 * Kept in one memoised hook so the expensive aggregation runs once per filter
 * change and all the panels on a page read the same result. Charts and grids
 * therefore cannot drift out of sync with the KPI cards.
 */
import { useMemo } from 'react';
import {
  anomalyList, buildFieldSummaries, buildKpis, buildWellSummaries,
  detectAnomalies, filterReadings, rankWells,
} from '@/lib/metrics';

export function useAnalytics(readings, filters) {
  return useMemo(() => {
    if (!readings) return null;

    const filtered = filterReadings(readings, filters);
    const flags = detectAnomalies(filtered);
    const wellSummaries = buildWellSummaries(filtered, flags);

    return {
      readings: filtered,
      flags,
      wellSummaries,
      fieldSummaries: buildFieldSummaries(wellSummaries),
      kpis: buildKpis(filtered, wellSummaries),
      ranking: rankWells(wellSummaries, 5),
      anomalies: anomalyList(filtered, flags),
      isEmpty: filtered.length === 0,
    };
  }, [readings, filters]);
}
