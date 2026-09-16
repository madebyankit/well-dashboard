'use client';

/**
 * The three states every data-backed view has to handle.
 *
 * Centralised so loading, error and empty look the same everywhere, and so a
 * new page gets them for free by rendering <DataStates> around its content.
 */
import { AlertTriangle, Inbox, Lock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton that roughly matches the dashboard layout, so nothing jumps. */
export function LoadingState({ rows = 2 }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[104px]" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-[320px]" />
      ))}
      <span className="sr-only">Loading production data…</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-3">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">Could not load production data</p>
          <p className="max-w-md text-sm text-muted-foreground">{message ?? 'An unexpected error occurred.'}</p>
        </div>
        {onRetry ? (
          <Button onClick={onRetry} variant="outline" className="mt-1">
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ title = 'Nothing to show', message, action }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-muted p-3">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">{title}</p>
          {message ? <p className="max-w-md text-sm text-muted-foreground">{message}</p> : null}
        </div>
        {action}
      </CardContent>
    </Card>
  );
}

/** Shown when a role reaches a page its permissions do not cover. */
export function ForbiddenState({ message }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className="rounded-full bg-warning/10 p-3">
          <Lock className="h-6 w-6 text-warning" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold">You do not have access to this page</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {message ?? 'Your role does not include the permission required to view this area. Ask an administrator if you need it.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Convenience wrapper: give it the dataset status and it renders the right
 * state, or the children once data is ready.
 */
export function DataStates({ status, error, onRetry, emptyTitle, emptyMessage, loadingRows, children }) {
  if (status === 'loading') return <LoadingState rows={loadingRows} />;
  if (status === 'error') return <ErrorState message={error} onRetry={onRetry} />;
  if (status === 'empty') {
    return <EmptyState title={emptyTitle ?? 'No production data available'} message={emptyMessage} />;
  }
  return children;
}
