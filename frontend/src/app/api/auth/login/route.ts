import { NextRequest, NextResponse } from 'next/server';
import {
  findOperatorByIdentifier,
  verifyOperatorPassword,
  performDummyPasswordVerification,
  buildAuthenticatedUser,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from '@/lib/auth-server';

interface LoginRequestBody {
  email?: unknown;
  identifier?: unknown;
  password?: unknown;
  rememberMe?: unknown;
}

export async function POST(request: NextRequest) {
  try {
    // CSRF Defense on Authentication endpoint
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const secFetchSite = request.headers.get('sec-fetch-site');

    if (secFetchSite === 'cross-site') {
      return NextResponse.json(
        { success: false, error: 'Cross-site request rejected.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { success: false, error: 'Origin mismatch rejected.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } }
          );
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid origin header.' },
          { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }

    let body: LoginRequestBody;
    try {
      body = (await request.json()) as LoginRequestBody;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const rawIdentifier =
      typeof body?.email === 'string'
        ? body.email.trim()
        : typeof body?.identifier === 'string'
        ? body.identifier.trim()
        : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const rememberMe = Boolean(body?.rememberMe);

    if (!rawIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Enterprise email address or badge ID is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password is required.' },
        { status: 400, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const operator = findOperatorByIdentifier(rawIdentifier);

    // Timing-attack mitigation: perform dummy derivation if user doesn't exist
    if (!operator) {
      await performDummyPasswordVerification(password);
      return NextResponse.json(
        { success: false, error: 'Invalid enterprise credentials or unrecognized badge ID.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const isPasswordValid = await verifyOperatorPassword(password, operator);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid enterprise credentials or unrecognized badge ID.' },
        { status: 401, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const user = buildAuthenticatedUser(operator);
    const { token, expiresAt, maxAgeSeconds } = await createSessionToken(user, rememberMe);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Authenticated successfully as ' + user.name + ' (' + user.role + ')',
        user,
        redirectTo: '/app',
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
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: rememberMe ? maxAgeSeconds : undefined,
      expires: rememberMe ? expiresAt : undefined,
    });

    return response;
  } catch (err) {
    const isConfigErr = err instanceof Error && err.message.includes('CONFIGURATION_ERROR');
    return NextResponse.json(
      {
        success: false,
        error: isConfigErr ? err.message : 'An internal authentication error occurred.',
      },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
