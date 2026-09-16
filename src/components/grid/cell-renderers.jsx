'use client';

/**
 * Shared AG Grid cell renderers.
 *
 * Kept together so the same value always looks the same wherever it appears —
 * a status is always the same pill, a variance is always the same red/green.
 */
import { Badge } from '@/components/ui/badge';
import { STATUS, STATUS_LABEL } from '@/lib/metrics';
import { formatSignedPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_VARIANT = {
  [STATUS.OVER]: 'success',
  [STATUS.ON]: 'secondary',
  [STATUS.UNDER]: 'destructive',
};

export function StatusCell({ value }) {
  if (!value) return null;
  return <Badge variant={STATUS_VARIANT[value] ?? 'secondary'}>{STATUS_LABEL[value] ?? value}</Badge>;
}

/** Signed percentage, coloured by direction. */
export function VarianceCell({ value }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn('font-medium tabular-nums', value >= 0 ? 'text-success' : 'text-destructive')}>
      {formatSignedPercent(value)}
    </span>
  );
}

/**
 * Attainment shown as a number plus an inline bar, so the column can be scanned
 * vertically without reading every figure.
 */
export function AttainmentCell({ value }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  const width = Math.max(2, Math.min(100, (value / 150) * 100));
  const tone = value >= 105 ? 'bg-success' : value >= 95 ? 'bg-warning' : 'bg-destructive';

  return (
    <div className="flex h-full items-center gap-2">
      <span className="w-12 shrink-0 tabular-nums">{value.toFixed(1)}%</span>
      <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
        <span className={cn('block h-full rounded-full', tone)} style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}

/** Anomaly count — silent when there is nothing to report. */
export function AnomalyCell({ value }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="warning">{value}</Badge>;
}
