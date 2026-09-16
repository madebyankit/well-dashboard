'use client';

/**
 * Per-field roll-up strip.
 *
 * Sits between the whole-asset KPIs and the per-well grid, which is the level a
 * production meeting usually starts at: which field is carrying the asset and
 * which one is dragging.
 */
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatNumber, formatPercent } from '@/lib/format';
import { cn } from '@/lib/utils';

export function FieldSummary({ fields, selectedFields, onSelectField }) {
  return (
    <div className="space-y-2">
      {fields.map((field) => {
        const selected = selectedFields.includes(field.field);
        const tone = field.attainment >= 100 ? 'text-success' : field.attainment >= 95 ? 'text-warning' : 'text-destructive';

        return (
          <Button
            key={field.field}
            variant="ghost"
            // Clicking a field toggles it into the URL filter — the strip is a
            // control, not just a readout.
            onClick={() => onSelectField(field.field)}
            className={cn(
              'h-auto w-full flex-col items-start gap-1.5 rounded-md border p-3 text-left',
              selected && 'border-primary bg-primary/5',
            )}
          >
            <div className="flex w-full items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{field.field}</span>
              <span className={cn('shrink-0 text-sm font-semibold tabular-nums', tone)}>
                {formatPercent(field.attainment)}
              </span>
            </div>

            <div className="flex w-full flex-wrap items-center gap-1.5 text-xs font-normal text-muted-foreground">
              <span>{field.wellCount} wells</span>
              <span>·</span>
              <span>{formatNumber(field.avgProduction, 0)} m³/d avg</span>
              {field.underperforming > 0 ? (
                <Badge variant="destructive" className="ml-auto">{field.underperforming} under</Badge>
              ) : (
                <Badge variant="success" className="ml-auto">on plan</Badge>
              )}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
