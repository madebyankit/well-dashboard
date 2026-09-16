'use client';

/**
 * Shared AG Grid host.
 *
 * Applies the app theme and the common defaults (row height, animation, no-rows
 * overlay) so every table in the app behaves identically. Refs are forwarded so
 * callers can reach the grid API for things like CSV export.
 */
import { forwardRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { useGridTheme } from './use-grid-theme';

export const DataGrid = forwardRef(function DataGrid(
  { rowData, columnDefs, height = 420, className = '', rowClass, ...gridProps },
  ref,
) {
  const { theme, defaultColDef, noRowsTemplate } = useGridTheme();

  return (
    <div className={className} style={{ height, width: '100%' }}>
      <AgGridReact
        ref={ref}
        theme={theme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        overlayNoRowsTemplate={noRowsTemplate}
        rowClass={rowClass}
        animateRows
        rowHeight={40}
        headerHeight={38}
        suppressCellFocus
        {...gridProps}
      />
    </div>
  );
});
