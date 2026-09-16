/**
 * Filter state <-> URL query string.
 *
 * The URL is the single source of truth for the dashboard view. Nothing about
 * "what am I looking at" is held in component state, which is what makes the
 * Share button work: copy the address bar and the recipient sees exactly the
 * same thing.
 *
 * Query shape:
 *   ?fields=North+Ridge+(ESP),Blue+Mesa+(PCP)   comma separated
 *   &wells=NR-001,NR-004
 *   &from=2026-06-01&to=2026-09-15              inclusive ISO dates
 *   &status=underperforming                     all | outperforming | on-target | underperforming
 */

export const DEFAULT_FILTERS = {
  fields: [],
  wells: [],
  from: '',
  to: '',
  status: 'all',
};

/** Read filter state out of a Next.js `useSearchParams()` object. */
export function filtersFromSearchParams(searchParams) {
  const get = (key) => searchParams.get(key) ?? '';
  const list = (key) => (get(key) ? get(key).split(',').filter(Boolean) : []);

  return {
    fields: list('fields'),
    wells: list('wells'),
    from: get('from'),
    to: get('to'),
    status: get('status') || DEFAULT_FILTERS.status,
  };
}

/**
 * Serialise filters back to a query string, omitting anything left at its
 * default so shared URLs stay short and readable.
 */
export function filtersToQueryString(filters) {
  const params = new URLSearchParams();
  if (filters.fields?.length) params.set('fields', filters.fields.join(','));
  if (filters.wells?.length) params.set('wells', filters.wells.join(','));
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  if (filters.status && filters.status !== DEFAULT_FILTERS.status) params.set('status', filters.status);
  return params.toString();
}

/** True when the user has not narrowed anything — drives the "Reset" button. */
export function hasActiveFilters(filters) {
  return Boolean(
    filters.fields?.length ||
      filters.wells?.length ||
      filters.from ||
      filters.to ||
      (filters.status && filters.status !== DEFAULT_FILTERS.status),
  );
}

/** Human-readable chips describing the active filters. */
export function describeFilters(filters) {
  const chips = [];
  filters.fields?.forEach((field) => chips.push({ key: `field:${field}`, group: 'fields', value: field, label: field }));
  filters.wells?.forEach((well) => chips.push({ key: `well:${well}`, group: 'wells', value: well, label: well }));
  if (filters.from || filters.to) {
    chips.push({
      key: 'range',
      group: 'range',
      label: `${filters.from || 'start'} → ${filters.to || 'latest'}`,
    });
  }
  if (filters.status && filters.status !== 'all') {
    chips.push({ key: 'status', group: 'status', label: `Status: ${filters.status.replace('-', ' ')}` });
  }
  return chips;
}

/** Convenience presets for the date range control. */
export const RANGE_PRESETS = [
  { id: '7d', label: 'Last 7 days', days: 7 },
  { id: '30d', label: 'Last 30 days', days: 30 },
  { id: '90d', label: 'Last 90 days', days: 90 },
  { id: 'all', label: 'Full history', days: null },
];

/** Turn a preset into concrete from/to dates, anchored on the latest reading. */
export function presetToRange(preset, latestDate) {
  if (!latestDate || !preset?.days) return { from: '', to: '' };
  const end = new Date(`${latestDate}T00:00:00Z`);
  const start = new Date(end.getTime() - (preset.days - 1) * 86400000);
  return { from: start.toISOString().slice(0, 10), to: latestDate };
}
