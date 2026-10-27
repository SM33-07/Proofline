import { NextRequest, NextResponse } from 'next/server';
import { handleEvaluateRefund, DisruptionCasePayload } from '@/lib/server-backend';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Authentication required to evaluate refund rules.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Station Master cannot evaluate network refund rules
  if (!session.user.permissions.canEvaluateRefunds) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: 'Station Master accounts do not have permission to evaluate network refund rules. Access is restricted to Operations Controllers and Audit Inspectors.',
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

  return handleEvaluateRefund(body as DisruptionCasePayload, session.user);
}
