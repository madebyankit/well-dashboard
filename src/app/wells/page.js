import { Suspense } from 'react';
import { WellsView } from './wells-view';
import { LoadingState } from '@/components/dashboard/states';

export const metadata = { title: 'Wells · Well Production Monitor' };

export default function WellsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <WellsView />
    </Suspense>
  );
}
