'use client';

/**
 * The anomaly feed.
 *
 * Anomalies are detected in lib/metrics.js with a median/MAD robust z-score.
 * This panel is the "what needs a human?" list: the most recent flags, each one
 * a link into the well where it happened.
 */
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, PowerOff, TrendingDown, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber } from '@/lib/format';

const ICON = { downtime: PowerOff, spike: TrendingUp, dip: TrendingDown };
const LABEL = { downtime: 'Downtime', spike: 'Spike', dip: 'Dip' };
const VARIANT = { downtime: 'destructive', spike: 'warning', dip: 'warning' };

export function AnomalyPanel({ anomalies, limit = 8 }) {
  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="h-6 w-6 text-success" />
        <p className="text-sm font-medium">No anomalies in this selection</p>
        <p className="text-xs text-muted-foreground">Every reading sits inside its well&apos;s normal range.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <ul className="divide-y">
        {anomalies.slice(0, limit).map((anomaly) => {
          const Icon = ICON[anomaly.type] ?? AlertTriangle;
          return (
            <li key={`${anomaly.well}-${anomaly.date}`} className="flex items-start gap-3 py-2.5">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${anomaly.type === 'downtime' ? 'text-destructive' : 'text-warning'}`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/wells/${encodeURIComponent(anomaly.well)}`} className="text-sm font-medium text-primary hover:underline">
                    {anomaly.well}
                  </Link>
                  <Badge variant={VARIANT[anomaly.type]}>{LABEL[anomaly.type]}</Badge>
                  <span className="text-xs text-muted-foreground">{formatDate(anomaly.date)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatNumber(anomaly.production1d, 1)} m³/d against a {formatNumber(anomaly.target, 1)} m³/d target — {anomaly.reason}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {anomalies.length > limit ? (
        <p className="pt-1 text-xs text-muted-foreground">+ {anomalies.length - limit} more in the current selection</p>
      ) : null}
    </div>
  );
}
