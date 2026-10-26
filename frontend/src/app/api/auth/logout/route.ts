import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  revocationRegistry,
} from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  // Extract and revoke active token server-side
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const payload = await verifySessionToken(token);
      if (payload) {
        if (payload.jti) {
          revocationRegistry.revokeToken(payload.jti, payload.exp);
        }
        if (payload.sub) {
          revocationRegistry.bumpUserVersion(payload.sub);
        }
      }
    } catch {
      // Invalidation proceeds regardless
    }
  }

  const response = NextResponse.json(
    {
      success: true,
      message: 'Logged out successfully. Session invalidated on server.',
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  return response;
}
