'use client';

/**
 * Assign a task to a user.
 *
 * Opened from two places: the Users & Tasks page, and the "Assign follow-up"
 * button on a well's detail page — which pre-fills the well, so the task
 * carries the analytical context that prompted it.
 *
 * The assignee list is filtered to people actually entitled to the well's
 * field: assigning Cedar Flats work to an operator who cannot see Cedar Flats
 * would create a task nobody can act on.
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth-context';
import { useTasks } from '@/context/tasks-context';
import { ROLE_LABEL, TASK_PRIORITIES, canSeeField } from '@/lib/rbac';

const BLANK = { title: '', well: '', assigneeId: '', priority: 'medium', dueDate: '', notes: '' };

export function TaskDialog({ trigger, defaultWell = '', wellField = '', wells = [], open, onOpenChange, onCreated }) {
  const { users } = useAuth();
  const { createTask } = useTasks();
  const [draft, setDraft] = useState({ ...BLANK, well: defaultWell });
  const [error, setError] = useState('');

  useEffect(() => {
    setDraft({ ...BLANK, well: defaultWell });
    setError('');
  }, [defaultWell, open]);

  // Which field does the chosen well belong to? Used to narrow the assignees.
  const targetField = wellField || wells.find((w) => w.well === draft.well)?.field || '';
  const candidates = users.filter((u) => u.active && (!targetField || canSeeField(u, targetField)));

  function handleSubmit(event) {
    event.preventDefault();
    const result = createTask(draft);
    if (result.ok) {
      onOpenChange?.(false);
      onCreated?.(result.task);
    } else {
      setError(result.error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign a task</DialogTitle>
          <DialogDescription>
            Follow-up work tied to a well, so what the dashboard surfaces turns into something somebody owns.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Task</Label>
            <Input
              id="task-title" required autoFocus
              placeholder="Investigate sustained under-performance"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Well</Label>
              {defaultWell ? (
                <Input value={defaultWell} readOnly className="bg-muted" />
              ) : (
                <Select value={draft.well} onValueChange={(well) => setDraft({ ...draft, well, assigneeId: '' })}>
                  <SelectTrigger><SelectValue placeholder="Select a well" /></SelectTrigger>
                  <SelectContent className="max-h-64">
                    {wells.map((w) => (
                      <SelectItem key={w.well} value={w.well}>{w.well} — {w.field}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select value={draft.assigneeId} onValueChange={(assigneeId) => setDraft({ ...draft, assigneeId })}>
                <SelectTrigger><SelectValue placeholder="Select a person" /></SelectTrigger>
                <SelectContent>
                  {candidates.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{u.name} — {ROLE_LABEL[u.role]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {targetField ? (
                <p className="text-xs text-muted-foreground">Showing people entitled to {targetField}.</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={draft.priority} onValueChange={(priority) => setDraft({ ...draft, priority })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority} className="capitalize">{priority}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due">Due date</Label>
              <Input id="task-due" type="date" value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-notes">Notes</Label>
            <Textarea id="task-notes" placeholder="What did you see, and what should they check?"
              value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
          </div>

          {error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>Cancel</Button>
            <Button type="submit">Assign task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
