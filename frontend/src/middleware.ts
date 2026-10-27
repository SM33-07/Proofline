import { NextRequest, NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  isSafeRelativeUrl,
} from '@/lib/auth-tokens';

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // 1. Global CSRF check on state-changing API routes
  if (
    pathname.startsWith('/api/') &&
    request.method !== 'GET' &&
    request.method !== 'HEAD' &&
    request.method !== 'OPTIONS'
  ) {
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite === 'cross-site') {
      return NextResponse.json(
        { error: 'FORBIDDEN_CSRF', message: 'Cross-site mutation request rejected.' },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    if (origin && host) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== host) {
          return NextResponse.json(
            { error: 'FORBIDDEN_CSRF', message: 'Origin mismatch rejected.' },
            { status: 403, headers: { 'Cache-Control': 'no-store' } }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'FORBIDDEN_CSRF', message: 'Malformed origin header.' },
          { status: 403, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    }
  }

  // 2. Protection for /app and operational views
  if (pathname.startsWith('/app')) {
    if (!session) {
      const loginUrl = new URL('/login', request.url);
      const safeRedirect = isSafeRelativeUrl(pathname + search) ? pathname + search : '/app';
      loginUrl.searchParams.set('redirect', safeRedirect);
      return NextResponse.redirect(loginUrl);
    }

    // Verify session revocation against Node-side authoritative store
    if (session.jti) {
      try {
        const checkUrl = new URL('/api/auth/revocation-check', request.url);
        checkUrl.searchParams.set('jti', session.jti);
        checkUrl.searchParams.set('userId', session.user.id);
        checkUrl.searchParams.set('version', String(session.sessionVersion || 1));

        const checkRes = await fetch(checkUrl.toString(), {
          cache: 'no-store',
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.revoked) {
            const loginUrl = new URL('/login', request.url);
            const safeRedirect = isSafeRelativeUrl(pathname + search) ? pathname + search : '/app';
            loginUrl.searchParams.set('redirect', safeRedirect);
            loginUrl.searchParams.set('error', 'session_invalidated');
            const res = NextResponse.redirect(loginUrl);
            res.cookies.delete(SESSION_COOKIE_NAME);
            return res;
          }
        }
      } catch {
        // Defense-in-depth layout verification handles fallback
      }
    }

    // Role-based Access Control (RBAC)
    // /app/audit is strictly restricted to Audit Inspector
    if (pathname.startsWith('/app/audit') && session.user.role !== 'Audit Inspector') {
      const accessDeniedUrl = new URL('/app', request.url);
      accessDeniedUrl.searchParams.set('error', 'unauthorized_audit_access');
      return NextResponse.redirect(accessDeniedUrl);
    }

    // Forward verified operator context in internal request headers
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-railsync-user-id', session.user.id);
    requestHeaders.set('x-railsync-user-role', session.user.role);
    requestHeaders.set('x-railsync-user-badge', session.user.badgeId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // 3. Already authenticated operator visiting /login
  if (pathname === '/login' && session) {
    const errorParam = request.nextUrl.searchParams.get('error');
    if (!errorParam) {
      // Check if session is actually active and not revoked
      let isRevoked = false;
      if (session.jti) {
        try {
          const checkUrl = new URL('/api/auth/revocation-check', request.url);
          checkUrl.searchParams.set('jti', session.jti);
          checkUrl.searchParams.set('userId', session.user.id);
          checkUrl.searchParams.set('version', String(session.sessionVersion || 1));
          const checkRes = await fetch(checkUrl.toString(), {
            cache: 'no-store',
            headers: {
              cookie: request.headers.get('cookie') || '',
            },
          });
          if (checkRes.ok) {
            const data = await checkRes.json();
            if (data.revoked) isRevoked = true;
          }
        } catch {}
      }

      if (!isRevoked) {
        const redirectParam = request.nextUrl.searchParams.get('redirect');
        const targetUrl = isSafeRelativeUrl(redirectParam) ? redirectParam! : '/app';
        return NextResponse.redirect(new URL(targetUrl, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*', '/login', '/api/:path*'],
};
