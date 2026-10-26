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
      { error: 'UNAUTHORIZED', message: 'Authentication required to inspect bookings ledger.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const backendUrl = getJavaBackendUrl();
  const searchParams = request.nextUrl.searchParams.toString();
  const targetUrl = searchParams
    ? backendUrl + '/api/bookings?' + searchParams
    : backendUrl + '/api/bookings';

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

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required to perform booking reservations.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Enforce server-side authorization: Audit Inspector is read-only
  if (!session.user.permissions.canCreateBooking) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: 'Audit Inspector accounts possess read-only verification privileges and cannot create bookings.',
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
    const upstreamRes = await fetch(backendUrl + '/api/bookings', {
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
