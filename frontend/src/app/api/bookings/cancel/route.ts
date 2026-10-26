import { NextRequest, NextResponse } from 'next/server';
import { getJavaBackendUrl, backendUnavailableResponse } from '@/lib/server-backend';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  generateJavaBackendHeaders,
} from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required to cancel bookings.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Enforce server-side authorization: Audit Inspector is read-only
  if (!session.user.permissions.canCancelBooking) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: 'Audit Inspector accounts possess read-only verification privileges and cannot cancel bookings.',
        role: session.user.role,
      },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const backendUrl = getJavaBackendUrl();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON_BODY', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  try {
    const upstreamRes = await fetch(backendUrl + '/api/bookings/cancel', {
      method: 'POST',
      headers: {
        ...generateJavaBackendHeaders(session.user),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    return backendUnavailableResponse(backendUrl, err);
  }
}
