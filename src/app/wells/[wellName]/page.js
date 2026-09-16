import { Suspense } from 'react';
import { WellView } from './well-view';
import { LoadingState } from '@/components/dashboard/states';

/** Well names arrive URL-encoded (they can contain characters like `/`). */
export async function generateMetadata({ params }) {
  const { wellName } = await params;
  return { title: `${decodeURIComponent(wellName)} · Well Production Monitor` };
}

export default async function WellPage({ params }) {
  const { wellName } = await params;

  return (
    <Suspense fallback={<LoadingState />}>
      <WellView wellName={decodeURIComponent(wellName)} />
    </Suspense>
  );
}
