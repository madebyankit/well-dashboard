'use client';

/**
 * Create / edit a user.
 *
 * Two things are set here, and they are the two halves of RBAC:
 *   - `role`   what the person may do (the permission matrix in lib/rbac.js)
 *   - `fields` what data they may see (readings are scoped before any metric
 *              is computed, in data-context.js)
 */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/context/auth-context';
import { ROLES, ROLE_DESCRIPTION, ROLE_LABEL } from '@/lib/rbac';

const BLANK = { name: '', email: '', title: '', role: ROLES.VIEWER, fields: ['*'], active: true };

export function UserDialog({ open, user, fields, onOpenChange }) {
  const { createUser, updateUser } = useAuth();
  const [draft, setDraft] = useState(BLANK);
  const [error, setError] = useState('');

  // Reload the form whenever a different user is opened.
  useEffect(() => {
    setDraft(user ? { ...user } : BLANK);
    setError('');
  }, [user, open]);

  const allFields = draft.fields.includes('*');

  function handleSubmit(event) {
    event.preventDefault();
    const result = user ? updateUser(user.id, draft) : createUser(draft);
    if (result.ok) onOpenChange(false);
    else setError(result.error);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? `Edit ${user.name}` : 'Add a user'}</DialogTitle>
          <DialogDescription>
            A user&apos;s role decides what they can do; their field entitlement decides what data they can see.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Name</Label>
              <Input id="user-name" required value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-email">Email</Label>
              <Input id="user-email" type="email" required value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-title">Job title</Label>
            <Input id="user-title" value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={draft.role} onValueChange={(role) => setDraft({ ...draft, role })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(ROLES).map((role) => (
                  <SelectItem key={role} value={role}>{ROLE_LABEL[role]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[draft.role]}</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Field entitlement</Label>
              <div className="flex items-center gap-2">
                <Switch
                  id="all-fields"
                  checked={allFields}
                  onCheckedChange={(checked) => setDraft({ ...draft, fields: checked ? ['*'] : [] })}
                />
                <Label htmlFor="all-fields" className="text-xs font-normal text-muted-foreground">All fields</Label>
              </div>
            </div>

            {!allFields ? (
              <div className="space-y-1 rounded-md border p-2">
                {fields.map((field) => (
                  <label key={field} className="flex cursor-pointer items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent">
                    <Checkbox
                      checked={draft.fields.includes(field)}
                      onCheckedChange={() =>
                        setDraft({
                          ...draft,
                          fields: draft.fields.includes(field)
                            ? draft.fields.filter((f) => f !== field)
                            : [...draft.fields, field],
                        })
                      }
                    />
                    {field}
                  </label>
                ))}
              </div>
            ) : null}
          </div>

          {user ? (
            <div className="flex items-center gap-2">
              <Switch id="user-active" checked={draft.active}
                onCheckedChange={(active) => setDraft({ ...draft, active })} />
              <Label htmlFor="user-active" className="text-sm font-normal">Account active</Label>
            </div>
          ) : null}

          {error ? <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">{user ? 'Save changes' : 'Add user'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
