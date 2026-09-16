'use client';

/**
 * The asset overview — page 1 of the application.
 *
 * Information architecture, top to bottom, follows how a production review
 * actually runs:
 *   1. filters        what am I looking at (and the link that reproduces it)
 *   2. KPI row        is the asset hitting target right now
 *   3. trend          how did output move, and where did it sit against target
 *   4. fields/gauge   which field is carrying the asset
 *   5. comparison     compare fields against each other — or wells, once the
 *                     user has drilled into a single field
 *   6. ranking        who is best and worst against target
 *   7. anomalies      what needs a human today
 *   8. well grid      the full table, and the way into a single well
 *
 * Each of the three mandated libraries is used where it is strongest:
 * ECharts for the linked, zoomable time series, Highcharts for the ranking bars
 * and solid gauge, AG Grid for the dense sortable table.
 */
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataStates, EmptyState, ForbiddenState } from '@/components/dashboard/states';
import { FilterBar } from '@/components/dashboard/filter-bar';
import { KpiCards } from '@/components/dashboard/kpi-cards';
import { FieldSummary } from '@/components/dashboard/field-summary';
import { AnomalyPanel } from '@/components/dashboard/anomaly-panel';
import { ProductionTrendChart } from '@/components/charts/production-trend-chart';
import { ComparisonChart } from '@/components/charts/comparison-chart';
import { PerformanceRankingChart } from '@/components/charts/performance-ranking-chart';
import { AttainmentGauge } from '@/components/charts/attainment-gauge';
import { WellsGrid } from '@/components/grid/wells-grid';
import { useDataset } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { useFilters } from '@/hooks/use-filters';
import { useAnalytics } from '@/hooks/use-analytics';
import { buildGroupSeries, buildTimeSeries } from '@/lib/metrics';
import { PERMISSIONS } from '@/lib/rbac';
import { formatDate } from '@/lib/format';

export function DashboardView() {
  const { status, error, data, reload } = useDataset();
  const { hasPermission } = useAuth();
  const { filters, toggleInList } = useFilters();
  const router = useRouter();

  // Analytics only run once data has arrived; the hook tolerates null.
  const analytics = useAnalytics(data?.readings, filters);

  // One point per day, summed across whatever wells are currently selected.
  const trendSeries = useMemo(
    () => (analytics ? buildTimeSeries(analytics.readings) : []),
    [analytics],
  );

  // Compare fields by default; once one field is selected, compare its wells.
  const comparisonGroup = filters.fields.length === 1 || (data?.fields.length === 1) ? 'well' : 'field';
  const comparison = useMemo(
    () => (analytics ? buildGroupSeries(analytics.readings, comparisonGroup, 'production7d') : { dates: [], series: [], hidden: 0 }),
    [analytics, comparisonGroup],
  );

  if (!hasPermission(PERMISSIONS.VIEW_DASHBOARD)) return <ForbiddenState />;

  return (
    <DataStates status={status} error={error} onRetry={reload} loadingRows={2}
      emptyMessage="No readings are available for the fields you are entitled to see.">
      {analytics ? (
        <div className="space-y-4">
          <PageIntro data={data} kpis={analytics.kpis} />

          <FilterBar fields={data.fields} wells={data.wells} dateRange={data.dateRange} />

          {analytics.isEmpty ? (
            <EmptyState
              title="No wells match these filters"
              message="Widen the date range or clear a filter to bring readings back into view."
            />
          ) : (
            <>
              <KpiCards kpis={analytics.kpis} />

              {/* Trend + field roll-up */}
              <div className="grid gap-4 xl:grid-cols-3">
                <Card className="flex flex-col xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Production against target</CardTitle>
                    <CardDescription>
                      Daily output, the seven-day rolling average and the analyst target, summed across the
                      selected wells.
                    </CardDescription>
                  </CardHeader>
                  {/* flex-1 + a min height lets the chart grow to match the
                      taller neighbouring column rather than leaving a gap. */}
                  <CardContent className="min-h-[420px] flex-1">
                    <ProductionTrendChart series={trendSeries} height="100%" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Attainment by field</CardTitle>
                    <CardDescription>Select a field to filter the whole dashboard.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <AttainmentGauge value={analytics.kpis.attainment} label="of target, all selected wells" height={180} />
                    <FieldSummary
                      fields={analytics.fieldSummaries}
                      selectedFields={filters.fields}
                      onSelectField={(field) => toggleInList('fields', field)}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Comparison + ranking */}
              <div className="grid gap-4 xl:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{comparisonGroup === 'field' ? 'Field comparison' : 'Well comparison'}</CardTitle>
                    <CardDescription>
                      Seven-day average output per {comparisonGroup}
                      {comparison.hidden > 0 ? ` — showing the ${comparison.series.length} largest, ${comparison.hidden} hidden` : ''}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ComparisonChart dates={comparison.dates} series={comparison.series} height={320} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Best and worst against target</CardTitle>
                    <CardDescription>Variance from the analyst target. Click a bar to open the well.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PerformanceRankingChart
                      top={analytics.ranking.top}
                      bottom={analytics.ranking.bottom}
                      height={320}
                      onSelectWell={(well) => router.push(`/wells/${encodeURIComponent(well)}`)}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Anomalies + full grid */}
              <div className="grid gap-4 xl:grid-cols-3">
                <Card className="xl:col-span-1">
                  <CardHeader>
                    <CardTitle>Anomalies</CardTitle>
                    <CardDescription>Downtime and readings outside a well&apos;s normal range.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AnomalyPanel anomalies={analytics.anomalies} />
                  </CardContent>
                </Card>

                <Card className="xl:col-span-2">
                  <CardHeader>
                    <CardTitle>Well performance</CardTitle>
                    <CardDescription>Sort, filter and search every well in the current selection.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <WellsGrid
                      rows={analytics.wellSummaries}
                      canExport={hasPermission(PERMISSIONS.EXPORT_DATA)}
                      height={440}
                    />
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      ) : null}
    </DataStates>
  );
}

/** Page heading, plus a note for users whose data access is scoped. */
function PageIntro({ data, kpis }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Field overview</h2>
      <p className="text-sm text-muted-foreground">
        {kpis.wellCount} wells · {kpis.fieldCount} field{kpis.fieldCount === 1 ? '' : 's'} ·
        {' '}readings to {formatDate(kpis.latestDate)}
        {data.isScoped ? (
          <span className="ml-1 text-warning">
            — your role is entitled to {data.fields.length} of {data.totalFields} fields
          </span>
        ) : null}
      </p>
    </div>
  );
}
