/**
 * test_e2e_http_auth.mjs
 * End-to-end HTTP verification of RailSync Authentication & Authorization against live Next.js server.
 *
 * Safety rules:
 * - Never prints passwords, hashes, tokens, session cookies, or secrets.
 * - Restores pre-test revocation registry upon completion.
 * - Records exact status codes, headers, and assertion results.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName} - ${details}`);
  }
}

// Development fixture credentials (never printed to output)
const FIXTURES = {
  controller: {
    badge: 'OP-4091',
    password: 'ControllerPass@123',
    role: 'Operations Controller',
  },
  stationMaster: {
    badge: 'SM-1042',
    password: 'StationPass@123',
    role: 'Station Master',
  },
  auditInspector: {
    badge: 'AI-9001',
    password: 'AuditPass@123',
    role: 'Audit Inspector',
  },
};

// Helper cookie jar
function extractCookie(res, cookieName = 'railsync_session') {
  const raw = res.headers.get('set-cookie');
  if (!raw) return null;
  const match = raw.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

function parseSetCookieAttributes(res) {
  const raw = res.headers.get('set-cookie');
  if (!raw) return {};
  const isHttpOnly = /httponly/i.test(raw);
  const isSameSiteLax = /samesite=lax/i.test(raw);
  const pathMatch = raw.match(/path=([^;]+)/i);
  return {
    isHttpOnly,
    isSameSiteLax,
    path: pathMatch ? pathMatch[1] : null,
  };
}

console.log('================================================================');
console.log('RailSync Track 1: End-to-End HTTP Authentication Verification');
console.log(`Target Server: ${BASE_URL}`);
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Pre-flight: Check server availability & /login page
// -----------------------------------------------------------------------------
console.log('--- Pre-flight: Server Liveness & /login page ---');
try {
  const res = await fetch(`${BASE_URL}/login`);
  assert(res.status === 200, `GET /login returns HTTP 200 (actual: ${res.status})`);
  const html = await res.text();
  assert(html.includes('Sign In') || html.includes('RailSync'), 'GET /login serves RailSync login page');
} catch (err) {
  console.error('[FATAL] Next.js server is not reachable at ' + BASE_URL, err);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// Test 1 & 2: Login with valid fixture account & Verify HttpOnly session cookie
// -----------------------------------------------------------------------------
console.log('\n--- Test 1 & 2: Valid Login & HttpOnly Cookie Issuance ---');
let controllerCookie = null;
let controllerJti = null;

{
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      identifier: FIXTURES.controller.badge,
      password: FIXTURES.controller.password,
      rememberMe: true,
    }),
  });

  assert(res.status === 200, `POST /api/auth/login returns HTTP 200 (actual: ${res.status})`);
  const body = await res.json();
  assert(body.success === true, 'Login response body contains success: true');
  assert(body.user?.role === FIXTURES.controller.role, `Login user role is '${FIXTURES.controller.role}'`);
  assert(body.user?.badgeId === FIXTURES.controller.badge, `Login badge ID is '${FIXTURES.controller.badge}'`);

  controllerCookie = extractCookie(res);
  assert(controllerCookie !== null, 'Response Set-Cookie contains railsync_session cookie');

  const cookieAttrs = parseSetCookieAttributes(res);
  assert(cookieAttrs.isHttpOnly === true, 'Session cookie has HttpOnly flag set');
  assert(cookieAttrs.isSameSiteLax === true, 'Session cookie has SameSite=Lax flag set');
  assert(cookieAttrs.path === '/', 'Session cookie has Path=/ set');

  // Verify cookie value structure without printing sensitive content
  if (controllerCookie) {
    const parts = controllerCookie.split('.');
    assert(parts.length === 2, 'Session cookie has valid signature-separated structure [payload.signature]');
    try {
      const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
      controllerJti = payload.jti;
      assert(typeof payload.jti === 'string' && payload.jti.length > 0, 'Session payload contains valid JTI UUID');
      assert(payload.exp > Math.floor(Date.now() / 1000), 'Session payload expiry timestamp is in the future');
    } catch {
      assert(false, 'Session cookie payload is valid JSON base64url');
    }
  }
}

// -----------------------------------------------------------------------------
// Test 3: Follow redirect and access /app with valid session
// -----------------------------------------------------------------------------
console.log('\n--- Test 3: Access Protected Route /app with Valid Session ---');
{
  const res = await fetch(`${BASE_URL}/app`, {
    headers: {
      Cookie: `railsync_session=${controllerCookie}`,
    },
    redirect: 'manual',
  });

  assert(
    res.status === 200,
    `GET /app with valid session returns HTTP 200 (actual: ${res.status}, no redirect)`
  );
  const html = await res.text();
  assert(
    html.includes('Operations') || html.includes('Corridor') || html.includes('RailSync'),
    'GET /app renders operational console layout'
  );
}

// -----------------------------------------------------------------------------
// Test 4: Call protected session and operational APIs with valid session
// -----------------------------------------------------------------------------
console.log('\n--- Test 4: Call Protected API with Valid Session ---');
{
  // 4a. /api/auth/session
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: {
      Cookie: `railsync_session=${controllerCookie}`,
    },
  });
  assert(sessionRes.status === 200, `GET /api/auth/session returns HTTP 200 (actual: ${sessionRes.status})`);
  const sessionData = await sessionRes.json();
  assert(sessionData.authenticated === true, 'Session endpoint confirms authenticated: true');
  assert(sessionData.user?.id === 'OP-4091', 'Session endpoint returns verified operator identity');

  // 4b. Protected operational API: /api/inventory
  const invRes = await fetch(`${BASE_URL}/api/inventory`, {
    headers: {
      Cookie: `railsync_session=${controllerCookie}`,
    },
  });
  assert(
    invRes.status === 200 || invRes.status === 503,
    `GET /api/inventory auth check passed with status ${invRes.status} (not 401 Unauthorized)`
  );
  if (invRes.status === 503) {
    console.log('    [NOTE] /api/inventory returned 503 (Expected: Live Java/MySQL backend service is not running)');
  }
}

// -----------------------------------------------------------------------------
// Test 5: Attempt login with invalid password
// -----------------------------------------------------------------------------
console.log('\n--- Test 5: Attempt Login with Invalid Password ---');
{
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE_URL,
    },
    body: JSON.stringify({
      identifier: FIXTURES.controller.badge,
      password: 'DefinitivelyIncorrectPassword!999',
    }),
  });

  assert(res.status === 401, `POST /api/auth/login with invalid password returns HTTP 401 (actual: ${res.status})`);
  const body = await res.json();
  assert(body.success === false, 'Invalid login response body has success: false');
  assert(
    body.error === 'Invalid enterprise credentials or unrecognized badge ID.',
    `Error message is generic: '${body.error}'`
  );
  const badCookie = extractCookie(res);
  assert(badCookie === null, 'No session cookie is issued on invalid password');
}

// -----------------------------------------------------------------------------
// Test 6: Access protected page without a session
// -----------------------------------------------------------------------------
console.log('\n--- Test 6: Access Protected Route Without Session ---');
{
  const res = await fetch(`${BASE_URL}/app`, {
    redirect: 'manual',
  });

  assert(
    res.status === 307 || res.status === 308 || res.status === 302,
    `GET /app without session returns redirect HTTP ${res.status}`
  );
  const location = res.headers.get('location') || '';
  assert(
    location.includes('/login') && location.includes('redirect=%2Fapp'),
    `Redirect Location points to /login?redirect=/app (actual: '${location}')`
  );
}

// -----------------------------------------------------------------------------
// Test 7: Tamper with session cookie and retry
// -----------------------------------------------------------------------------
console.log('\n--- Test 7: Tamper with Session Cookie & Verify Rejection ---');
{
  const tamperedCookie = controllerCookie ? controllerCookie.slice(0, -6) + 'xxxxxx' : 'invalid.cookie';

  // 7a. GET /app with tampered cookie
  const appRes = await fetch(`${BASE_URL}/app`, {
    headers: {
      Cookie: `railsync_session=${tamperedCookie}`,
    },
    redirect: 'manual',
  });
  assert(
    appRes.status === 307 || appRes.status === 308 || appRes.status === 302,
    `GET /app with tampered cookie returns redirect HTTP ${appRes.status}`
  );

  // 7b. GET /api/auth/session with tampered cookie
  const sessionRes = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: {
      Cookie: `railsync_session=${tamperedCookie}`,
    },
  });
  assert(sessionRes.status === 200, `GET /api/auth/session returns HTTP 200`);
  const sessionData = await sessionRes.json();
  assert(sessionData.authenticated === false, 'Session endpoint reports authenticated: false for tampered cookie');

  // 7c. GET /api/bookings with tampered cookie
  const bookingsRes = await fetch(`${BASE_URL}/api/bookings`, {
    headers: {
      Cookie: `railsync_session=${tamperedCookie}`,
    },
  });
  assert(bookingsRes.status === 401, `GET /api/bookings rejects tampered cookie with HTTP 401 (actual: ${bookingsRes.status})`);
}

// -----------------------------------------------------------------------------
// Test 8: Role-restricted page and API with wrong role
// -----------------------------------------------------------------------------
console.log('\n--- Test 8: Role-Restricted Pages & APIs with Non-Authorized Roles ---');

// Log in as Station Master
let stationMasterCookie = null;
{
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
    body: JSON.stringify({
      identifier: FIXTURES.stationMaster.badge,
      password: FIXTURES.stationMaster.password,
    }),
  });
  assert(res.status === 200, `Station Master login returns HTTP 200`);
  stationMasterCookie = extractCookie(res);
}

// 8a. Station Master attempting /app/audit (strictly restricted to Audit Inspector)
{
  const res = await fetch(`${BASE_URL}/app/audit`, {
    headers: {
      Cookie: `railsync_session=${stationMasterCookie}`,
    },
    redirect: 'manual',
  });
  assert(
    res.status === 307 || res.status === 308 || res.status === 302,
    `Station Master accessing /app/audit is redirected with HTTP ${res.status}`
  );
  const location = res.headers.get('location') || '';
  assert(
    location.includes('error=unauthorized_audit_access'),
    `Redirect location includes error=unauthorized_audit_access (actual: '${location}')`
  );
}

// 8b. Station Master attempting POST /api/refund/evaluate (restricted to Controller & Audit Inspector)
{
  const res = await fetch(`${BASE_URL}/api/refund/evaluate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE_URL,
      Cookie: `railsync_session=${stationMasterCookie}`,
    },
    body: JSON.stringify({ fixtureId: 'D-01' }),
  });
  assert(
    res.status === 403,
    `Station Master POST /api/refund/evaluate rejected with HTTP 403 Forbidden (actual: ${res.status})`
  );
  const body = await res.json();
  assert(body.error === 'FORBIDDEN', 'Error code is FORBIDDEN');
}

// Log in as Audit Inspector
let auditInspectorCookie = null;
{
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE_URL },
    body: JSON.stringify({
      identifier: FIXTURES.auditInspector.badge,
      password: FIXTURES.auditInspector.password,
    }),
  });
  assert(res.status === 200, `Audit Inspector login returns HTTP 200`);
  auditInspectorCookie = extractCookie(res);
}

// 8c. Audit Inspector attempting POST /api/bookings (Audit Inspector is read-only)
{
  const res = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE_URL,
      Cookie: `railsync_session=${auditInspectorCookie}`,
    },
    body: JSON.stringify({ journeyId: 'J-12301-20261025' }),
  });
  assert(
    res.status === 403,
    `Audit Inspector POST /api/bookings rejected with HTTP 403 Forbidden (actual: ${res.status})`
  );
  const body = await res.json();
  assert(body.error === 'FORBIDDEN', 'Error code is FORBIDDEN for read-only Audit Inspector mutation');
}

// -----------------------------------------------------------------------------
// Test 9: Log out using the actual supported endpoint
// -----------------------------------------------------------------------------
console.log('\n--- Test 9: Log Out via POST /api/auth/logout ---');
{
  const res = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Origin: BASE_URL,
      Cookie: `railsync_session=${controllerCookie}`,
    },
  });

  assert(res.status === 200, `POST /api/auth/logout returns HTTP 200 (actual: ${res.status})`);
  const body = await res.json();
  assert(body.success === true, 'Logout body contains success: true');
  assert(
    body.message.includes('Logged out successfully'),
    `Logout message confirms session invalidation: '${body.message}'`
  );

  const rawSetCookie = res.headers.get('set-cookie') || '';
  assert(
    rawSetCookie.includes('railsync_session=;') || rawSetCookie.includes('Max-Age=0'),
    'Set-Cookie header clears railsync_session with Max-Age=0'
  );
}

// -----------------------------------------------------------------------------
// Test 10: Retry protected page and API with previously issued cookie
// -----------------------------------------------------------------------------
console.log('\n--- Test 10: Retry Protected Page & API with Revoked Session ---');
{
  // 10a. GET /app with revoked cookie
  const appRes = await fetch(`${BASE_URL}/app`, {
    headers: {
      Cookie: `railsync_session=${controllerCookie}`,
    },
    redirect: 'manual',
  });
  assert(
    appRes.status === 307 || appRes.status === 308 || appRes.status === 302,
    `GET /app with revoked session receives redirect HTTP ${appRes.status}`
  );
  const location = appRes.headers.get('location') || '';
  assert(
    location.includes('error=session_invalidated') || location.includes('/login'),
    `Redirect location invalidates session (actual: '${location}')`
  );

  // 10b. Query /api/auth/revocation-check boundary & parameter verification
  if (controllerJti) {
    // 10b.1: Unauthenticated request must be rejected with 401
    const unauthRevRes = await fetch(`${BASE_URL}/api/auth/revocation-check?jti=${controllerJti}&userId=OP-4091&version=1`);
    assert(unauthRevRes.status === 401, `GET /api/auth/revocation-check without signed session returns HTTP 401 (actual: ${unauthRevRes.status})`);

    // 10b.2: Caller probing someone else's session must be rejected with 403
    const mismatchRevRes = await fetch(
      `${BASE_URL}/api/auth/revocation-check?jti=${controllerJti}&userId=OP-4091&version=1`,
      {
        headers: {
          Cookie: `railsync_session=${auditInspectorCookie}`,
        },
      }
    );
    assert(mismatchRevRes.status === 403, `GET /api/auth/revocation-check with mismatched session returns HTTP 403 (actual: ${mismatchRevRes.status})`);

    // 10b.3: Query with genuine signed session succeeds and reports revoked: true
    const revRes = await fetch(
      `${BASE_URL}/api/auth/revocation-check?jti=${controllerJti}&userId=OP-4091&version=1`,
      {
        headers: {
          Cookie: `railsync_session=${controllerCookie}`,
        },
      }
    );
    assert(revRes.status === 200, `GET /api/auth/revocation-check with caller's signed session returns HTTP 200`);
    const revData = await revRes.json();
    assert(revData.revoked === true, `Revocation registry reports token JTI as revoked: true`);
  }
}

// -----------------------------------------------------------------------------
// Test 11: Expiry / Revocation behavior & Safe Redirect Validation
// -----------------------------------------------------------------------------
console.log('\n--- Test 11: Redirect Validation & Safe URL Handling ---');
{
  // 11a. Unsafe redirect target in login query: https://evil.com
  const unsafeReq = await fetch(`${BASE_URL}/login?redirect=https://evil.com`, {
    headers: {
      Cookie: `railsync_session=${auditInspectorCookie}`,
    },
    redirect: 'manual',
  });
  assert(
    unsafeReq.status === 307 || unsafeReq.status === 308 || unsafeReq.status === 302,
    `Authenticated operator visiting /login?redirect=https://evil.com is redirected`
  );
  const loc = unsafeReq.headers.get('location') || '';
  assert(
    !loc.startsWith('https://evil.com'),
    `Open redirect neutralized; location does not target https://evil.com (actual: '${loc}')`
  );
  assert(loc.includes('/app'), `Sanitized fallback destination is /app`);

  // 11b. Safe relative redirect target: /demo/operations
  const safeReq = await fetch(`${BASE_URL}/login?redirect=%2Fdemo%2Foperations`, {
    headers: {
      Cookie: `railsync_session=${auditInspectorCookie}`,
    },
    redirect: 'manual',
  });
  const safeLoc = safeReq.headers.get('location') || '';
  assert(
    safeLoc.includes('/demo/operations'),
    `Safe relative redirect /demo/operations is preserved (actual: '${safeLoc}')`
  );
}

// -----------------------------------------------------------------------------
// Test 12: CSRF & Origin Validation
// -----------------------------------------------------------------------------
console.log('\n--- Test 12: CSRF & Origin Validation ---');
{
  // 12a. Cross-site Sec-Fetch-Site on login
  const csrfRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sec-Fetch-Site': 'cross-site',
    },
    body: JSON.stringify({
      identifier: FIXTURES.controller.badge,
      password: FIXTURES.controller.password,
    }),
  });
  assert(
    csrfRes.status === 403,
    `POST /api/auth/login with Sec-Fetch-Site: cross-site rejected with HTTP 403 (actual: ${csrfRes.status})`
  );

  // 12b. Origin mismatch on login
  const originMismatchRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'http://malicious-attacker.internal',
      Host: 'localhost:3000',
    },
    body: JSON.stringify({
      identifier: FIXTURES.controller.badge,
      password: FIXTURES.controller.password,
    }),
  });
  assert(
    originMismatchRes.status === 403,
    `POST /api/auth/login with mismatched Origin rejected with HTTP 403 (actual: ${originMismatchRes.status})`
  );

  // 12c. Cross-site on operational mutation route
  const apiCsrfRes = await fetch(`${BASE_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Sec-Fetch-Site': 'cross-site',
    },
    body: JSON.stringify({}),
  });
  assert(
    apiCsrfRes.status === 403,
    `POST /api/bookings with Sec-Fetch-Site: cross-site rejected with HTTP 403 (actual: ${apiCsrfRes.status})`
  );
}

// -----------------------------------------------------------------------------
// Isolation Restoration: Clean up test revocation data
// -----------------------------------------------------------------------------
console.log('\n--- Test Isolation Restoration ---');
const bakPath = path.join(FRONTEND_DIR, 'data/revoked_sessions.json.bak');
const targetPath = path.join(FRONTEND_DIR, 'data/revoked_sessions.json');
if (fs.existsSync(bakPath)) {
  fs.copyFileSync(bakPath, targetPath);
  fs.unlinkSync(bakPath);
  console.log('  [RESTORED] Pre-test revocation registry restored from backup.');
}

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Track 1 HTTP Verification Summary:`);
console.log(`Passed: ${passed} | Failed: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
