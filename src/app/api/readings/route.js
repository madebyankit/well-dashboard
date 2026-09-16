/**
 * GET /api/readings
 *
 * Serves the whole (small) production dataset as JSON. The client fetches it
 * once on mount and every filter afterwards is applied in the browser, which
 * keeps filtering, brushing and cross-chart interaction instant.
 *
 * Going through an API route rather than inlining the data in a server
 * component is deliberate: it gives the UI real loading, error and empty states
 * to handle, which the brief asks for.
 */
import { NextResponse } from 'next/server';
import { loadDataset } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataset = await loadDataset();
    return NextResponse.json(dataset, {
      headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (error) {
    console.error('[api/readings] failed to load dataset', error);
    return NextResponse.json(
      { error: 'Unable to load the production dataset. Check that data/frontend_sample_data.csv exists.' },
      { status: 500 },
    );
  }
}
