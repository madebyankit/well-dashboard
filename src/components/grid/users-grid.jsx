'use client';

/**
 * AG Grid — the user directory.
 *
 * The same grid component as the production tables, reused for administration:
 * sorting, filtering and search come for free, which matters once a directory
 * outgrows a handful of people.
 *
 * Edit and remove are rendered only for a user who holds MANAGE_USERS; the
 * context layer re-checks the same permission before it mutates anything, so
 * hiding the buttons is a convenience, not the control.
 */
import { useMemo, useState } from 'react';
import { Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import { DataGrid } from './data-grid';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { PERMISSIONS, ROLE_LABEL } from '@/lib/rbac';
import { UserDialog } from '@/components/users/user-dialog';

function RoleCell({ value }) {
  const variant = value === 'admin' ? 'default' : value === 'analyst' ? 'success' : 'secondary';
  return <Badge variant={variant}>{ROLE_LABEL[value] ?? value}</Badge>;
}

function ActiveCell({ value }) {
  return <Badge variant={value ? 'success' : 'secondary'}>{value ? 'Active' : 'Disabled'}</Badge>;
}

export function UsersGrid({ fields, height = 420 }) {
  const { users, user: currentUser, hasPermission, deleteUser } = useAuth();
  const [quickFilter, setQuickFilter] = useState('');
  const [editing, setEditing] = useState(null); // user being edited, or 'new'
  const [error, setError] = useState('');

  const canManage = hasPermission(PERMISSIONS.MANAGE_USERS);

  const columnDefs = useMemo(() => {
    const columns = [
      { field: 'name', headerName: 'Name', pinned: 'left', minWidth: 150, cellClass: 'font-medium' },
      { field: 'email', headerName: 'Email', minWidth: 220, flex: 1.4 },
      { field: 'title', headerName: 'Job title', minWidth: 200 },
      { field: 'role', headerName: 'Role', minWidth: 160, cellRenderer: RoleCell },
      {
        field: 'fields',
        headerName: 'Field entitlement',
        minWidth: 220,
        flex: 1.4,
        // '*' is stored internally but means nothing to a reader.
        valueGetter: (p) => (p.data.fields.includes('*') ? 'All fields' : p.data.fields.join(', ')),
      },
      { field: 'active', headerName: 'Status', minWidth: 110, cellRenderer: ActiveCell },
      { field: 'createdAt', headerName: 'Added', minWidth: 120 },
    ];

    if (canManage) {
      columns.push({
        headerName: '',
        field: 'actions',
        pinned: 'right',
        minWidth: 96,
        maxWidth: 96,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params) => (
          <div className="flex h-full items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${params.data.name}`}
              onClick={() => { setError(''); setEditing(params.data); }}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost" size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              aria-label={`Remove ${params.data.name}`}
              disabled={params.data.id === currentUser?.id}
              onClick={() => {
                const result = deleteUser(params.data.id);
                setError(result.ok ? '' : result.error);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ),
      });
    }

    return columns;
  }, [canManage, currentUser, deleteUser]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={quickFilter}
            onChange={(event) => setQuickFilter(event.target.value)}
            placeholder="Search people…"
            className="h-8 pl-8 text-sm"
          />
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto">{users.length} people</p>
        {canManage ? (
          <Button size="sm" onClick={() => { setError(''); setEditing('new'); }}>
            <UserPlus className="h-4 w-4" />
            Add user
          </Button>
        ) : null}
      </div>

      {error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      <DataGrid
        rowData={users}
        columnDefs={columnDefs}
        quickFilterText={quickFilter}
        height={height}
        getRowId={(params) => params.data.id}
      />

      <UserDialog
        open={Boolean(editing)}
        user={editing === 'new' ? null : editing}
        fields={fields}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
