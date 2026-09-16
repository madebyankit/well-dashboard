'use client';

/**
 * Reads the dashboard filter state out of the URL and writes changes back.
 *
 * Every filter control on the page calls `setFilters`; nothing keeps a private
 * copy. That is what makes the view shareable — the URL always describes
 * exactly what is on screen.
 *
 * `router.replace` with `scroll: false` is used so filtering does not flood the
 * browser history or jump the page to the top.
 */
import { useCallback, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { DEFAULT_FILTERS, filtersFromSearchParams, filtersToQueryString } from '@/lib/filters';

export function useFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const setFilters = useCallback(
    (patch) => {
      const next = { ...filters, ...(typeof patch === 'function' ? patch(filters) : patch) };
      const query = filtersToQueryString(next);
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [filters, pathname, router],
  );

  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  /** Toggle one value inside a list filter (fields / wells). */
  const toggleInList = useCallback(
    (key, value) => {
      const current = filters[key] ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      setFilters({ [key]: next });
    },
    [filters, setFilters],
  );

  /** Absolute URL for the current view — what the Share button copies. */
  const shareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const query = filtersToQueryString(filters);
    return `${window.location.origin}${pathname}${query ? `?${query}` : ''}`;
  }, [filters, pathname]);

  return { filters, setFilters, resetFilters, toggleInList, shareUrl, defaults: DEFAULT_FILTERS };
}
