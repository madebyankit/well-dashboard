import { Suspense } from 'react';
import { DashboardView } from './dashboard-view';
import { LoadingState } from '@/components/dashboard/states';

export const metadata = { title: 'Field overview · Well Production Monitor' };

/**
 * The dashboard reads its filters from the query string via useSearchParams,
 * which Next requires to sit inside a Suspense boundary.
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardView />
    </Suspense>
  );
}
