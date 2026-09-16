import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <p className="text-3xl font-semibold">404</p>
      <p className="text-sm text-muted-foreground">That page does not exist.</p>
      <Link href="/dashboard" className="text-sm text-primary hover:underline">Back to the dashboard</Link>
    </div>
  );
}
