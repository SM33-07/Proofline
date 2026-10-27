import { NextRequest, NextResponse } from 'next/server';
import { handleCancelBooking, CancelBookingPayload } from '@/lib/server-backend';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-server';

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'INVALID_JSON_BODY', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  return handleCancelBooking(body as CancelBookingPayload, session.user);
}
