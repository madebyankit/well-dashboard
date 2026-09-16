'use client';

/**
 * AG Grid — the raw daily readings for one well.
 *
 * This is the audit trail behind the charts: every row the analytics were
 * computed from, with the anomaly verdict attached, so a user can check a
 * suspicious point rather than take the chart's word for it.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { DataGrid } from './data-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VarianceCell } from './cell-renderers';
import { formatDuration, formatNumber } from '@/lib/format';

const ANOMALY_LABEL = { downtime: 'Downtime', spike: 'Spike', dip: 'Dip' };

function AnomalyTypeCell({ value }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return <Badge variant={value === 'downtime' ? 'destructive' : 'warning'}>{ANOMALY_LABEL[value]}</Badge>;
}

export function ReadingsGrid({ readings, flags, wellName, canExport = false, height = 420 }) {
  const [quickFilter, setQuickFilter] = useState('');
  const [anomaliesOnly, setAnomaliesOnly] = useState(false);
  const gridRef = useRef(null);

  // Flatten the anomaly verdict onto each row so it can be sorted and filtered
  // like any other column.
  const rows = useMemo(
    () =>
      readings
        .map((reading) => {
          const flag = flags?.get(`${reading.well}|${reading.date}`);
          return {
            ...reading,
            variance: reading.target > 0 ? ((reading.production1d - reading.target) / reading.target) * 100 : null,
            anomalyType: flag?.type ?? '',
            anomalyReason: flag?.reason ?? '',
          };
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [readings, flags],
  );

  const visibleRows = useMemo(() => (anomaliesOnly ? rows.filter((r) => r.anomalyType) : rows), [rows, anomaliesOnly]);

  const columnDefs = useMemo(
    () => [
      { field: 'date', headerName: 'Date', pinned: 'left', minWidth: 120, sort: 'desc' },
      { field: 'production1d', headerName: 'Prod 1D', type: 'numericColumn', valueFormatter: (p) => formatNumber(p.value, 2) },
      { field: 'production7d', headerName: 'Prod 7D', type: 'numericColumn', valueFormatter: (p) => formatNumber(p.value, 2) },
      { field: 'target', headerName: 'Target', type: 'numericColumn', valueFormatter: (p) => formatNumber(p.value, 1) },
      { field: 'variance', headerName: 'vs target', minWidth: 110, cellRenderer: VarianceCell },
      { field: 'cycleTime', headerName: 'Cycle time', type: 'numericColumn', valueFormatter: (p) => formatDuration(p.value) },
      { field: 'anomalyType', headerName: 'Anomaly', minWidth: 130, cellRenderer: AnomalyTypeCell },
      { field: 'anomalyReason', headerName: 'Detail', minWidth: 260, flex: 2 },
    ],
    [],
  );

  const exportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `${wellName}-readings.csv` });
  }, [wellName]);

  const anomalyCount = rows.filter((r) => r.anomalyType).length;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={quickFilter}
            onChange={(event) => setQuickFilter(event.target.value)}
            placeholder="Search readings…"
            className="h-8 pl-8 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch id="anomalies-only" checked={anomaliesOnly} onCheckedChange={setAnomaliesOnly} disabled={anomalyCount === 0} />
          <Label htmlFor="anomalies-only" className="text-xs font-normal text-muted-foreground">
            Anomalies only ({anomalyCount})
          </Label>
        </div>

        {canExport ? (
          <Button variant="outline" size="sm" className="sm:ml-auto" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        ) : null}
      </div>

      <DataGrid
        ref={gridRef}
        rowData={visibleRows}
        columnDefs={columnDefs}
        quickFilterText={quickFilter}
        height={height}
        pagination
        paginationPageSize={50}
        getRowId={(params) => `${params.data.well}-${params.data.date}`}
      />
    </div>
  );
}
