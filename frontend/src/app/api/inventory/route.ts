import { NextRequest, NextResponse } from 'next/server';
import { getJavaBackendUrl, backendUnavailableResponse } from '@/lib/server-backend';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  generateJavaBackendHeaders,
} from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required to query train inventory.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const backendUrl = getJavaBackendUrl();
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = searchParams
    ? backendUrl + '/api/inventory?' + searchParams
    : backendUrl + '/api/inventory';

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: generateJavaBackendHeaders(session.user),
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      status: upstreamRes.status,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    return backendUnavailableResponse(backendUrl, err);
  }
}
