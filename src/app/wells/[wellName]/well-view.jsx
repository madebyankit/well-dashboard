'use client';

/**
 * Single-well detail — page 2 of the application.
 *
 * The dashboard answers "which well should I look at"; this page answers "what
 * is happening to it, and what should someone do about it". Hence the layout:
 * the well's own numbers, its full history with anomalies marked, the cycle
 * time that usually moves first, the raw readings behind all of it, and the
 * tasks people have been assigned against it.
 *
 * Access is checked twice: the role must hold VIEW_WELL_DETAIL, and the well
 * must sit inside the user's field entitlement — a scoped operator following a
 * shared link to another field's well gets a clear refusal, not a blank page.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DataStates, EmptyState, ForbiddenState } from '@/components/dashboard/states';
import { ShareButton } from '@/components/dashboard/share-button';
import { WellTrendChart } from '@/components/charts/well-trend-chart';
import { CycleTimeChart } from '@/components/charts/cycle-time-chart';
import { AttainmentGauge } from '@/components/charts/attainment-gauge';
import { ReadingsGrid } from '@/components/grid/readings-grid';
import { TaskDialog } from '@/components/users/task-dialog';
import { useDataset } from '@/context/data-context';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/tasks-context';
import { useFilters } from '@/hooks/use-filters';
import { buildWellSummaries, detectAnomalies, filterReadings, STATUS_LABEL } from '@/lib/metrics';
import { PERMISSIONS } from '@/lib/rbac';
import { formatDate, formatDuration, formatNumber, formatPercent, formatSignedPercent } from '@/lib/format';

export function WellView({ wellName }) {
  const { status, error, data, reload } = useDataset();
  const { hasPermission, user } = useAuth();
  const { tasksForWell } = useTasks();
  const { filters } = useFilters();
  const [taskOpen, setTaskOpen] = useState(false);

  /**
   * Everything for this one well. The dashboard's date filter is respected so a
   * shared link lands on the same window, but field/well filters are ignored —
   * the route already names the well.
   */
  const view = useMemo(() => {
    if (!data) return null;
    const all = data.readings.filter((r) => r.well === wellName);
    if (all.length === 0) return { missing: true };

    const readings = filterReadings(all, { from: filters.from, to: filters.to });
    if (readings.length === 0) return { missing: false, empty: true, field: all[0].field };

    const flags = detectAnomalies(readings);
    const [summary] = buildWellSummaries(readings, flags);
    return { readings, flags, summary, anomalyCount: summary.anomalies };
  }, [data, wellName, filters.from, filters.to]);

  const tasks = tasksForWell(wellName);

  if (!hasPermission(PERMISSIONS.VIEW_WELL_DETAIL)) return <ForbiddenState />;

  return (
    <DataStates status={status} error={error} onRetry={reload} loadingRows={2}>
      {view ? (
        view.missing ? (
          // Either the well does not exist, or the user's entitlement hides it.
          <ForbiddenState
            message={
              user?.fields?.includes('*')
                ? `No well named "${wellName}" exists in the dataset.`
                : `"${wellName}" is not in a field your role is entitled to see.`
            }
          />
        ) : view.empty ? (
          <EmptyState
            title={`No readings for ${wellName} in this date range`}
            message="Widen the range on the dashboard, or open the well without a shared date filter."
            action={<Button asChild variant="outline"><Link href={`/wells/${encodeURIComponent(wellName)}`}>Show full history</Link></Button>}
          />
        ) : (
          <div className="space-y-4">
            <WellHeader summary={view.summary} onAssign={() => setTaskOpen(true)}
              canAssign={hasPermission(PERMISSIONS.ASSIGN_TASKS)} taskCount={tasks.length} />

            {/* Production history — the main event */}
            <div className="grid gap-4 xl:grid-cols-4">
              <Card className="xl:col-span-3">
                <CardHeader>
                  <CardTitle>Production history</CardTitle>
                  <CardDescription>
                    Daily output against the seven-day average and the analyst target.
                    {view.anomalyCount > 0 ? ` ${view.anomalyCount} reading(s) flagged as anomalous.` : ' No anomalies detected.'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WellTrendChart readings={view.readings} flags={view.flags} height={400} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Attainment</CardTitle>
                  <CardDescription>Over the selected period.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AttainmentGauge value={view.summary.attainment} label="of target" height={180} />
                  <Separator />
                  <StatList summary={view.summary} />
                </CardContent>
              </Card>
            </div>

            {/* Cycle time — the early warning signal */}
            <Card>
              <CardHeader>
                <CardTitle>Cycle time and production</CardTitle>
                <CardDescription>
                  A lengthening cycle usually precedes a production loss, so the two are read together.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CycleTimeChart series={view.readings} height={300} />
              </CardContent>
            </Card>

            {/* Tasks raised against this well */}
            {tasks.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Assigned work</CardTitle>
                  <CardDescription>Follow-up raised against this well.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="flex flex-wrap items-center gap-2 rounded-md border p-3 text-sm">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant={task.status === 'done' ? 'success' : task.status === 'in-progress' ? 'default' : 'secondary'} className="capitalize">
                        {task.status.replace('-', ' ')}
                      </Badge>
                      {task.dueDate ? <span className="text-xs text-muted-foreground">due {formatDate(task.dueDate)}</span> : null}
                      <Link href="/users" className="ml-auto text-xs text-primary hover:underline">Manage</Link>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            {/* The raw data behind every chart above */}
            <Card>
              <CardHeader>
                <CardTitle>Daily readings</CardTitle>
                <CardDescription>Every reading the figures above were calculated from.</CardDescription>
              </CardHeader>
              <CardContent>
                <ReadingsGrid
                  readings={view.readings}
                  flags={view.flags}
                  wellName={wellName}
                  canExport={hasPermission(PERMISSIONS.EXPORT_DATA)}
                  height={420}
                />
              </CardContent>
            </Card>

            <TaskDialog
              open={taskOpen}
              onOpenChange={setTaskOpen}
              defaultWell={wellName}
              wellField={view.summary.field}
            />
          </div>
        )
      ) : null}
    </DataStates>
  );
}

function WellHeader({ summary, onAssign, canAssign, taskCount }) {
  const statusVariant =
    summary.status === 'outperforming' ? 'success' : summary.status === 'underperforming' ? 'destructive' : 'secondary';

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <Button asChild variant="ghost" size="sm" className="-ml-2 h-7 text-muted-foreground">
          <Link href="/wells"><ArrowLeft className="h-3.5 w-3.5" />Back to wells</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-semibold tracking-tight">{summary.well}</h2>
          <Badge variant={statusVariant}>{STATUS_LABEL[summary.status]}</Badge>
          {summary.anomalies > 0 ? <Badge variant="warning">{summary.anomalies} anomalies</Badge> : null}
        </div>
        <p className="text-sm text-muted-foreground">
          {summary.field} · {summary.readings} readings to {formatDate(summary.latestDate)}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <ShareButton size="sm" />
        {canAssign ? (
          <Button size="sm" onClick={onAssign}>
            <ClipboardPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Assign follow-up</span>
            {taskCount > 0 ? <Badge variant="secondary" className="ml-1">{taskCount}</Badge> : null}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** The well's numbers in one compact column beside the gauge. */
function StatList({ summary }) {
  const rows = [
    { label: 'Average production', value: `${formatNumber(summary.avgProduction, 1)} m³/d` },
    { label: 'Latest 7-day average', value: `${formatNumber(summary.latestProduction7d, 1)} m³/d` },
    { label: 'Current target', value: `${formatNumber(summary.target, 1)} m³/d` },
    { label: 'Gap to target', value: `${formatSignedPercent(summary.variance)}`, tone: summary.variance >= 0 ? 'success' : 'destructive' },
    { label: 'Trend (recent vs early)', value: formatSignedPercent(summary.trend), tone: summary.trend >= 0 ? 'success' : 'destructive' },
    { label: 'Average cycle time', value: formatDuration(summary.avgCycleTime) },
    { label: 'Uptime', value: formatPercent(summary.uptime) },
    { label: 'Downtime days', value: formatNumber(summary.downtimeDays, 0) },
  ];

  return (
    <dl className="space-y-2 text-sm">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{row.label}</dt>
          <dd className={`font-medium tabular-nums ${row.tone === 'success' ? 'text-success' : row.tone === 'destructive' ? 'text-destructive' : ''}`}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
