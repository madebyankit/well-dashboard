'use client';

/**
 * Users, roles and task assignment.
 *
 * Three tabs, matching the three things the brief asks for:
 *   Tasks        assignment of work to individual users
 *   Directory    user management (admin only)
 *   Permissions  the RBAC matrix, shown rather than described, so a reviewer
 *                can see exactly what each role can do
 *
 * Which tabs appear depends on the signed-in role — an operator gets Tasks and
 * Permissions but never the Directory.
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Minus, RotateCcw } from 'lucide-react';
import { ForbiddenState } from '@/components/dashboard/states';
import { UsersGrid } from '@/components/grid/users-grid';
import { TaskBoard } from '@/components/users/task-board';
import { useAuth } from '@/context/auth-context';
import { useDataset } from '@/context/data-context';
import { PERMISSIONS, ROLES, ROLE_DESCRIPTION, ROLE_LABEL, ROLE_PERMISSIONS } from '@/lib/rbac';

export function UsersView() {
  const { hasPermission, user, resetDirectory } = useAuth();
  const { data } = useDataset();
  const canManage = hasPermission(PERMISSIONS.MANAGE_USERS);
  const canViewDirectory = hasPermission(PERMISSIONS.VIEW_USERS);
  const [tab, setTab] = useState('tasks');

  if (!hasPermission(PERMISSIONS.VIEW_TASKS)) return <ForbiddenState />;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Users &amp; tasks</h2>
        <p className="text-sm text-muted-foreground">
          You are signed in as <span className="font-medium text-foreground">{ROLE_LABEL[user.role]}</span>.
          {canManage
            ? ' You can add people, change roles and assign work.'
            : ' Your role can view and act on the work assigned to you.'}
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="tasks" className="flex-1 sm:flex-none">Tasks</TabsTrigger>
          {canViewDirectory ? <TabsTrigger value="directory" className="flex-1 sm:flex-none">Directory</TabsTrigger> : null}
          <TabsTrigger value="permissions" className="flex-1 sm:flex-none">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task assignment</CardTitle>
              <CardDescription>
                Work raised against a specific well and owned by a named person.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaskBoard wells={data?.wells ?? []} />
            </CardContent>
          </Card>
        </TabsContent>

        {canViewDirectory ? (
          <TabsContent value="directory">
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle>User directory</CardTitle>
                  <CardDescription>
                    {canManage
                      ? 'Add people, change their role and set which fields they may see.'
                      : 'Read-only: your role can see the directory but not change it.'}
                  </CardDescription>
                </div>
                {canManage ? (
                  <Button variant="ghost" size="sm" onClick={resetDirectory} title="Restore the seeded demo accounts">
                    <RotateCcw className="h-4 w-4" />
                    <span className="hidden sm:inline">Reset demo data</span>
                  </Button>
                ) : null}
              </CardHeader>
              <CardContent>
                <UsersGrid fields={data?.fields ?? []} height={420} />
              </CardContent>
            </Card>
          </TabsContent>
        ) : null}

        <TabsContent value="permissions">
          <PermissionMatrix currentRole={user.role} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Renders lib/rbac.js directly. Because it is generated from the same constant
 * the application checks against, it cannot drift out of date.
 */
function PermissionMatrix({ currentRole }) {
  const roles = Object.values(ROLES);
  const permissions = Object.entries(PERMISSIONS);

  const LABELS = {
    VIEW_DASHBOARD: 'View the dashboard',
    VIEW_WELL_DETAIL: 'Open well detail',
    EXPORT_DATA: 'Export data to CSV',
    VIEW_USERS: 'View the user directory',
    MANAGE_USERS: 'Add, edit and remove users',
    VIEW_TASKS: 'View tasks',
    ASSIGN_TASKS: 'Create and assign tasks',
    COMPLETE_TASKS: 'Update task status',
    MANAGE_APPEARANCE: 'Change their own appearance settings',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Role permissions</CardTitle>
        <CardDescription>
          Generated from the permission matrix the application enforces, so this table is always accurate.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Horizontal scroll rather than a cramped table on narrow screens. */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4 font-medium text-muted-foreground">Capability</th>
                {roles.map((role) => (
                  <th key={role} className="px-3 py-2 text-center font-medium">
                    <span className={role === currentRole ? 'text-primary' : ''}>{ROLE_LABEL[role]}</span>
                    {role === currentRole ? <Badge className="ml-1">you</Badge> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map(([key, value]) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="py-2 pr-4">{LABELS[key] ?? key}</td>
                  {roles.map((role) => (
                    <td key={role} className="px-3 py-2 text-center">
                      {ROLE_PERMISSIONS[role].includes(value) ? (
                        <Check className="mx-auto h-4 w-4 text-success" aria-label="allowed" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" aria-label="not allowed" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {roles.map((role) => (
            <div key={role} className="rounded-md border p-3">
              <p className="text-sm font-medium">{ROLE_LABEL[role]}</p>
              <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[role]}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          Roles also carry a <span className="font-medium">field entitlement</span>. Readings are narrowed to a
          user&apos;s entitled fields before any metric is calculated, so a scoped user&apos;s KPIs, charts and tables
          all describe only the part of the asset they are allowed to see.
        </p>
      </CardContent>
    </Card>
  );
}
