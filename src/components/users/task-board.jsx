'use client';

/**
 * The task list.
 *
 * A card list rather than a grid, because tasks are read as prose ("who owns
 * this, by when, why") and because it collapses cleanly to one column on a
 * phone — this is the view an operator actually opens in the field.
 *
 * Every control is permission-aware: an operator sees a status control only on
 * their own tasks, and the delete button only appears for someone who can
 * assign work.
 */
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarClock, Plus, Trash2, User2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/dashboard/states';
import { TaskDialog } from './task-dialog';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/tasks-context';
import { PERMISSIONS, TASK_STATUSES } from '@/lib/rbac';
import { formatDate } from '@/lib/format';

const PRIORITY_VARIANT = { high: 'destructive', medium: 'warning', low: 'secondary' };
const STATUS_VARIANT = { open: 'secondary', 'in-progress': 'default', done: 'success' };

export function TaskBoard({ wells = [] }) {
  const { user, users, hasPermission } = useAuth();
  const { tasks, updateTask, deleteTask } = useTasks();
  const [scope, setScope] = useState('mine');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState('');

  const canAssign = hasPermission(PERMISSIONS.ASSIGN_TASKS);

  const visible = useMemo(() => {
    const list = scope === 'mine' ? tasks.filter((t) => t.assigneeId === user?.id) : tasks;
    // Open work first, then by due date — the order someone works through them.
    const rank = { open: 0, 'in-progress': 1, done: 2 };
    return [...list].sort((a, b) => (rank[a.status] - rank[b.status]) || (a.dueDate || '').localeCompare(b.dueDate || ''));
  }, [tasks, scope, user]);

  const nameOf = (id) => users.find((u) => u.id === id)?.name ?? 'Unassigned';

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Tabs value={scope} onValueChange={setScope}>
          <TabsList>
            <TabsTrigger value="mine">Assigned to me</TabsTrigger>
            <TabsTrigger value="all">All tasks</TabsTrigger>
          </TabsList>
        </Tabs>

        {canAssign ? (
          <div className="sm:ml-auto">
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              New task
            </Button>
          </div>
        ) : null}
      </div>

      {error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

      {visible.length === 0 ? (
        <EmptyState
          title={scope === 'mine' ? 'No tasks assigned to you' : 'No tasks yet'}
          message={
            canAssign
              ? 'Spot an under-performing well on the dashboard and assign follow-up from its detail page.'
              : 'Work assigned to you by an analyst will appear here.'
          }
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2 3xl:grid-cols-3">
          {visible.map((task) => {
            const isMine = task.assigneeId === user?.id;
            const canChangeStatus = canAssign || (isMine && hasPermission(PERMISSIONS.COMPLETE_TASKS));
            const overdue = task.status !== 'done' && task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);

            return (
              <Card key={task.id} className={task.status === 'done' ? 'opacity-70' : undefined}>
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{task.title}</p>
                    <Badge variant={PRIORITY_VARIANT[task.priority]} className="shrink-0 capitalize">{task.priority}</Badge>
                  </div>

                  {task.notes ? <p className="text-sm text-muted-foreground">{task.notes}</p> : null}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    {task.well ? (
                      <Link href={`/wells/${encodeURIComponent(task.well)}`} className="font-medium text-primary hover:underline">
                        {task.well}
                      </Link>
                    ) : null}
                    <span className="flex items-center gap-1">
                      <User2 className="h-3 w-3" />
                      {nameOf(task.assigneeId)}{isMine ? ' (you)' : ''}
                    </span>
                    {task.dueDate ? (
                      <span className={`flex items-center gap-1 ${overdue ? 'font-medium text-destructive' : ''}`}>
                        <CalendarClock className="h-3 w-3" />
                        {formatDate(task.dueDate)}{overdue ? ' · overdue' : ''}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {canChangeStatus ? (
                      <Select
                        value={task.status}
                        onValueChange={(status) => {
                          const result = updateTask(task.id, { status });
                          setError(result.ok ? '' : result.error);
                        }}
                      >
                        <SelectTrigger className="h-7 w-36 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TASK_STATUSES.map((status) => (
                            <SelectItem key={status} value={status} className="capitalize">{status.replace('-', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={STATUS_VARIANT[task.status]} className="capitalize">{task.status.replace('-', ' ')}</Badge>
                    )}

                    {canAssign ? (
                      <Button
                        variant="ghost" size="icon"
                        className="ml-auto h-7 w-7 text-destructive hover:text-destructive"
                        aria-label="Delete task"
                        onClick={() => {
                          const result = deleteTask(task.id);
                          setError(result.ok ? '' : result.error);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <TaskDialog
        wells={wells}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        // A task assigned to someone else would vanish from the default
        // "Assigned to me" view; switch so the user sees what they just created.
        onCreated={(task) => { if (task.assigneeId !== user?.id) setScope('all'); }}
      />
    </div>
  );
}
