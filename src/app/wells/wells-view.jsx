'use client';

/**
 * The well directory — the bridge between the asset overview and a single well.
 *
 * Deliberately kept to one job: find the well you care about. It shares the
 * same filter bar and the same URL state as the dashboard, so moving between
 * the two keeps your selection.
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataStates, EmptyState, ForbiddenState } from '@/components/dashboard/states';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { WellsGrid } from '@/components/grid/wells-grid';
import { PerformanceRankingChart } from '@/components/charts/performance-ranking-chart';
import { useDataset } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { useFilters } from '@/hooks/use-filters';
import { useAnalytics } from '@/hooks/use-analytics';
import { PERMISSIONS } from '@/lib/rbac';
import { useRouter } from 'next/navigation';

export function WellsView() {
  const { status, error, data, reload } = useDataset();
  const { hasPermission } = useAuth();
  const { filters } = useFilters();
  const analytics = useAnalytics(data?.readings, filters);
  const router = useRouter();

  if (!hasPermission(PERMISSIONS.VIEW_WELL_DETAIL)) return <ForbiddenState />;

  return (
    <DataStates status={status} error={error} onRetry={reload} loadingRows={1}>
      {analytics ? (
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Wells</h2>
            <p className="text-sm text-muted-foreground">
              Every well in your entitlement, ranked against its analyst target. Select one to see its full history.
            </p>
          </div>

          <FilterBar fields={data.fields} wells={data.wells} dateRange={data.dateRange} />

          {analytics.isEmpty ? (
            <EmptyState title="No wells match these filters" message="Clear a filter or widen the date range." />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Performance spread</CardTitle>
                  <CardDescription>Best and worst performers against target. Click a bar to open the well.</CardDescription>
                </CardHeader>
                <CardContent>
                  <PerformanceRankingChart
                    top={analytics.ranking.top}
                    bottom={analytics.ranking.bottom}
                    height={340}
                    onSelectWell={(well) => router.push(`/wells/${encodeURIComponent(well)}`)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>All wells</CardTitle>
                  <CardDescription>{analytics.wellSummaries.length} wells in the current selection.</CardDescription>
                </CardHeader>
                <CardContent>
                  <WellsGrid
                    rows={analytics.wellSummaries}
                    canExport={hasPermission(PERMISSIONS.EXPORT_DATA)}
                    height={560}
                  />
                </CardContent>
              </Card>
            </>
          )}
        </div>
      ) : null}
    </DataStates>
  );
}
