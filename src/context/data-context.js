'use client';

/**
 * Dataset loading.
 *
 * Fetches the whole production dataset once from /api/readings, then hands it
 * to the rest of the app. The set is small (a few thousand daily readings), so
 * every filter, sort and cross-chart interaction afterwards happens in the
 * browser and feels instant.
 *
 * Exposes an explicit status machine — 'loading' | 'error' | 'empty' | 'ready'
 * — which the UI renders directly, so loading/error/empty states are impossible
 * to forget.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { scopeToFields } from '@/lib/metrics';
import { useAuth } from './auth-context';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({ status: 'loading', dataset: null, error: null });

  const load = useCallback(async () => {
    setState({ status: 'loading', dataset: null, error: null });
    try {
      const response = await fetch('/api/readings');
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed with status ${response.status}`);
      }
      const dataset = await response.json();
      setState({
        status: dataset.readings?.length ? 'ready' : 'empty',
        dataset,
        error: null,
      });
    } catch (error) {
      setState({ status: 'error', dataset: null, error: error.message ?? 'Something went wrong loading the data.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * RBAC data scoping. An operator entitled only to North Ridge never receives
   * another field's readings, so their KPIs, charts and grids are all narrowed
   * consistently without any page having to remember to do it.
   */
  const scoped = useMemo(() => {
    if (state.status !== 'ready' && state.status !== 'empty') return null;
    if (!state.dataset) return null;

    const readings = scopeToFields(state.dataset.readings, user?.fields);
    const fields = state.dataset.fields.filter((f) => !user?.fields || user.fields.includes('*') || user.fields.includes(f));
    const wells = state.dataset.wells.filter((w) => fields.includes(w.field));
    const dates = readings.length ? [readings[0].date, readings[readings.length - 1].date] : ['', ''];

    return {
      readings,
      fields,
      wells,
      dateRange: { from: dates[0], to: dates[1] },
      // True when the user's entitlement hides part of the dataset — the UI
      // surfaces this so a scoped user knows they are seeing a subset.
      isScoped: !user?.fields?.includes('*'),
      totalFields: state.dataset.fields.length,
    };
  }, [state, user]);

  // A user whose entitlement matches no data gets the empty state, not a blank
  // dashboard that looks broken.
  const status = state.status === 'ready' && scoped && scoped.readings.length === 0 ? 'empty' : state.status;

  const value = useMemo(
    () => ({ status, error: state.error, data: scoped, reload: load }),
    [status, state.error, scoped, load],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataset() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useDataset must be used inside <DataProvider>');
  return context;
}
