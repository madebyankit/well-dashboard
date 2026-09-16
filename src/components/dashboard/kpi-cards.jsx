'use client';

/**
 * The headline row: the five numbers that answer "how is the field doing?"
 * before the user reads a single chart.
 */
import { Activity, AlertTriangle, Target, Timer, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDuration, formatNumber, formatPercent, formatSignedPercent } from '@/lib/format';
import { TARGET_BAND } from '@/lib/metrics';

function KpiCard({ label, value, unit, icon: Icon, tone = 'default', footer, title }) {
  const toneClass = {
    default: 'text-muted-foreground',
    success: 'text-success',
    warning: 'text-warning',
    destructive: 'text-destructive',
  }[tone];

  return (
    // `title` gives the hover explanation for figures whose definition is not
    // obvious from the label alone.
    <Card title={title}>
      <CardContent>
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <Icon className={cn('h-4 w-4 shrink-0', toneClass)} />
        </div>
        <p className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl font-semibold tabular-nums tracking-tight 3xl:text-3xl">{value}</span>
          {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
        </p>
        {footer ? <div className="mt-1.5 text-xs text-muted-foreground">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}

export function KpiCards({ kpis }) {
  const attainmentTone = kpis.attainment >= 100 ? 'success' : kpis.attainment >= 95 ? 'warning' : 'destructive';
  const rising = kpis.productionChange >= 0;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-5">
      <KpiCard
        label="Latest daily production"
        value={formatNumber(kpis.latestProduction, 0)}
        unit="m³/d"
        icon={rising ? TrendingUp : TrendingDown}
        tone={rising ? 'success' : 'destructive'}
        footer={
          <span className={rising ? 'text-success' : 'text-destructive'}>
            {formatSignedPercent(kpis.productionChange)} vs prior 7-day average
          </span>
        }
      />

      <KpiCard
        label="Target attainment"
        value={formatPercent(kpis.attainment)}
        icon={Target}
        tone={attainmentTone}
        footer={`${formatNumber(kpis.totalProduction, 0)} of ${formatNumber(kpis.totalTarget, 0)} m³ over ${kpis.dayCount} days`}
      />

      <KpiCard
        label="Well performance"
        value={`${kpis.outperforming} / ${kpis.onTarget} / ${kpis.underperforming}`}
        // "On target" means within +/- TARGET_BAND percent; showing the actual
        // threshold saves the reader guessing what the middle number counts.
        title={`Over / on / under target (on target = within ${TARGET_BAND}% of target)`}
        icon={Activity}
        tone={kpis.underperforming > kpis.outperforming ? 'destructive' : 'success'}
        footer={
          <span className="flex flex-wrap gap-1">
            <Badge variant="success">{kpis.outperforming} over</Badge>
            <Badge variant="secondary">{kpis.onTarget} on</Badge>
            <Badge variant="destructive">{kpis.underperforming} under</Badge>
          </span>
        }
      />

      <KpiCard
        label="Average cycle time"
        value={formatDuration(kpis.avgCycleTime)}
        icon={Timer}
        footer={`Across ${kpis.wellCount} wells in ${kpis.fieldCount} field${kpis.fieldCount === 1 ? '' : 's'}`}
      />

      <KpiCard
        label="Anomalies flagged"
        value={formatNumber(kpis.anomalies, 0)}
        icon={AlertTriangle}
        tone={kpis.anomalies > 0 ? 'warning' : 'success'}
        footer="Downtime days and readings outside the well's normal range"
      />
    </div>
  );
}
