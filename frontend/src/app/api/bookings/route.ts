import { NextRequest, NextResponse } from 'next/server';
import { handleGetBookings, handleCreateBooking, CreateBookingPayload } from '@/lib/server-backend';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required to inspect bookings ledger.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return handleGetBookings(request.nextUrl.searchParams, session.user);
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON_BODY', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  return handleCreateBooking(body as CreateBookingPayload, session.user);
}
