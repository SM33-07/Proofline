import { NextResponse } from 'next/server';
import { getJavaBackendUrl, backendUnavailableResponse } from '@/lib/server-backend';

export async function GET() {
  const backendUrl = getJavaBackendUrl();
  try {
    const upstreamRes = await fetch(backendUrl + '/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      status: upstreamRes.status,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    return backendUnavailableResponse(backendUrl, err);
  }
}
