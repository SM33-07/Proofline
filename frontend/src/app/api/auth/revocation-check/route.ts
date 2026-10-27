import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  revocationRegistry,
  verifySessionTokenSignature,
} from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  // Ensure registry is synchronized with persistent disk state
  revocationRegistry.reload();

  // 1. Authenticate caller: require valid signed session token or internal backend secret
  const internalSecret = process.env.RAILSYNC_BACKEND_SECRET;
  const headerKey = request.headers.get('x-railsync-internal-key');
  const isInternalCall = Boolean(
    internalSecret &&
    headerKey &&
    headerKey === internalSecret
  );

  let callerSession = null;
  if (!isInternalCall) {
    const token =
      request.cookies.get(SESSION_COOKIE_NAME)?.value ||
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Authentication required to query revocation status.',
        },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }

    callerSession = await verifySessionTokenSignature(token);
    if (!callerSession) {
      return NextResponse.json(
        {
          error: 'UNAUTHORIZED',
          message: 'Invalid or forged session token.',
        },
        {
          status: 401,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }
  }

  // 2. Validate query parameters against verified session identity
  const requestedJti = request.nextUrl.searchParams.get('jti');
  const requestedUserId = request.nextUrl.searchParams.get('userId');
  const versionStr = request.nextUrl.searchParams.get('version');
  const tokenVersion = versionStr
    ? parseInt(versionStr, 10)
    : callerSession?.sessionVersion || 1;

  if (callerSession) {
    // Prevent cross-user / cross-session probing
    if (requestedJti && requestedJti !== callerSession.jti) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Caller cannot query revocation status of another session.',
        },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }
    if (
      requestedUserId &&
      requestedUserId !== callerSession.user.id &&
      requestedUserId !== callerSession.sub
    ) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Caller cannot query revocation status of another operator.',
        },
        {
          status: 403,
          headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        }
      );
    }
  }

  const targetJti = callerSession ? callerSession.jti : requestedJti;
  const targetUserId = callerSession
    ? callerSession.user.id || callerSession.sub
    : requestedUserId;

  let isRevoked = false;
  if (targetJti && revocationRegistry.isRevoked(targetJti)) {
    isRevoked = true;
  }

  if (targetUserId) {
    const currentVer = revocationRegistry.getUserVersion(targetUserId);
    if (tokenVersion < currentVer) {
      isRevoked = true;
    }
  }

  return NextResponse.json(
    { revoked: isRevoked },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
