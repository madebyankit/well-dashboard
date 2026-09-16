'use client';

/**
 * AG Grid — the well performance table.
 *
 * AG Grid earns its place here: this is the dense, sortable, filterable,
 * exportable table view of every well, and it is the component that gets a user
 * from "something is off" to a specific well. Clicking a row opens well detail.
 *
 * Column set is deliberately ordered as: identity -> output -> target ->
 * reliability, which is the order an analyst actually reads it in.
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Search } from 'lucide-react';
import { DataGrid } from './data-grid';
import { AnomalyCell, AttainmentCell, StatusCell, VarianceCell } from './cell-renderers';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDuration, formatNumber } from '@/lib/format';

export function WellsGrid({ rows, canExport = false, height = 460 }) {
  const router = useRouter();
  const [quickFilter, setQuickFilter] = useState('');
  const gridRef = useRef(null);

  const columnDefs = useMemo(
    () => [
      { field: 'well', headerName: 'Well', pinned: 'left', minWidth: 110, maxWidth: 140, cellClass: 'font-medium' },
      { field: 'field', headerName: 'Field', minWidth: 170 },
      {
        field: 'avgProduction',
        headerName: 'Avg production',
        type: 'numericColumn',
        minWidth: 140,
        valueFormatter: (p) => formatNumber(p.value, 1),
      },
      {
        field: 'latestProduction7d',
        headerName: 'Latest 7D',
        type: 'numericColumn',
        minWidth: 120,
        valueFormatter: (p) => formatNumber(p.value, 1),
      },
      {
        field: 'target',
        headerName: 'Target',
        type: 'numericColumn',
        minWidth: 110,
        valueFormatter: (p) => formatNumber(p.value, 1),
      },
      { field: 'attainment', headerName: 'Attainment', minWidth: 170, cellRenderer: AttainmentCell },
      { field: 'variance', headerName: 'vs target', minWidth: 110, cellRenderer: VarianceCell },
      { field: 'trend', headerName: 'Trend', minWidth: 110, cellRenderer: VarianceCell, headerTooltip: 'Recent third of the period vs the first third' },
      { field: 'status', headerName: 'Status', minWidth: 150, cellRenderer: StatusCell },
      {
        field: 'avgCycleTime',
        headerName: 'Cycle time',
        type: 'numericColumn',
        minWidth: 120,
        valueFormatter: (p) => formatDuration(p.value),
      },
      {
        field: 'uptime',
        headerName: 'Uptime',
        type: 'numericColumn',
        minWidth: 110,
        valueFormatter: (p) => `${formatNumber(p.value, 1)}%`,
      },
      { field: 'anomalies', headerName: 'Anomalies', minWidth: 120, cellRenderer: AnomalyCell },
    ],
    [],
  );

  const onRowClicked = useCallback((event) => router.push(`/wells/${encodeURIComponent(event.data.well)}`), [router]);

  /** CSV export is gated on the EXPORT_DATA permission by the caller. */
  const exportCsv = useCallback(() => {
    gridRef.current?.api?.exportDataAsCsv({ fileName: `well-performance-${new Date().toISOString().slice(0, 10)}.csv` });
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={quickFilter}
            onChange={(event) => setQuickFilter(event.target.value)}
            placeholder="Search wells or fields…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {rows.length} well{rows.length === 1 ? '' : 's'} · click a row for detail
        </p>
        {canExport ? (
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>
        ) : null}
      </div>

      <DataGrid
        ref={gridRef}
        rowData={rows}
        columnDefs={columnDefs}
        quickFilterText={quickFilter}
        onRowClicked={onRowClicked}
        height={height}
        rowClass="cursor-pointer"
        getRowId={(params) => params.data.well}
      />
    </div>
  );
}
