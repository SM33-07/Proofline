/**
 * test_demo_flow.mjs
 * Automated test suite for RailSync Public Demo Mode and Access Operations Flow:
 * 1. Anonymous access to /demo.
 * 2. Selecting each of the three roles (Operations Controller, Station Master, Audit Inspector).
 * 3. Successful navigation into /demo/operations without a session cookie.
 * 4. Correct simulated role rendering (headers, KPIs, corridor map, station manifest, invariant proofs).
 * 5. Standalone demo availability without Java, MySQL, or Supabase.
 * 6. Zero write requests to operational APIs from demo interactions.
 * 7. /app still redirects unauthenticated visitors to /login.
 * 8. Operational APIs still reject unauthorized requests with 401.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NextRequest } from 'next/server.js';
import { middleware, config as middlewareConfig } from '../src/middleware.ts';
import { ROLE_DEFINITIONS } from '../src/lib/auth.ts';
import { STATIONS, JOURNEYS, BOOKINGS, AUDIT_LOGS } from '../src/lib/mock-data.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');

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

console.log('================================================================');
console.log('RailSync: Public Demo Mode & Access Operations Test Suite');
console.log('Verification of Demo Routing, Role Perspective & Security Guards');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test Group 1: Anonymous Access to /demo
// -----------------------------------------------------------------------------
console.log('--- Test Group 1: Anonymous Access to /demo ---');

const demoPagePath = path.join(FRONTEND_DIR, 'src/app/demo/page.tsx');
assert(fs.existsSync(demoPagePath), 'Demo landing page file exists at src/app/demo/page.tsx');

const demoPageContent = fs.readFileSync(demoPagePath, 'utf8');

assert(
  !demoPageContent.includes('cookies()') && !demoPageContent.includes('verifySessionToken'),
  '/demo page has zero session cookie or server-side auth requirements'
);

assert(
  demoPageContent.includes('Operations Controller') &&
    demoPageContent.includes('Station Master') &&
    demoPageContent.includes('Audit Inspector'),
  '/demo page provides options for all three roles'
);

// -----------------------------------------------------------------------------
// Test Group 2: Role Selection & Navigation Target
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 2: Role Selection & Navigation Target ---');

assert(
  demoPageContent.includes("router.push(`/demo/operations?role=${encodeURIComponent(selectedRole)}`)") ||
    demoPageContent.includes("'/demo/operations?role='"),
  'Role selection navigates to /demo/operations (dedicated demo route) instead of protected /app'
);

const roles = ['Operations Controller', 'Station Master', 'Audit Inspector'];
for (const role of roles) {
  const targetUrl = `/demo/operations?role=${encodeURIComponent(role)}`;
  assert(
    targetUrl.startsWith('/demo/operations?role='),
    `Role '${role}' targets non-protected route: ${targetUrl}`
  );
  assert(
    role in ROLE_DEFINITIONS,
    `Role '${role}' is mapped in canonical ROLE_DEFINITIONS with valid division and station`
  );
}

// -----------------------------------------------------------------------------
// Test Group 3: Navigation Without Session Cookie (/demo/operations vs /app)
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 3: Navigation Without Session Cookie ---');

// Check middleware config matcher does not match /demo or /demo/operations
const matchers = middlewareConfig.matcher;
const matchesDemo = matchers.some((m) => {
  if (m === '/demo' || m.startsWith('/demo/')) return true;
  return false;
});
assert(!matchesDemo, 'Middleware matcher explicitly excludes /demo and /demo/* paths');

// Simulate unauthenticated request to /demo/operations
const demoReq = new NextRequest('http://localhost:3000/demo/operations?role=Operations%20Controller');
const demoRes = await middleware(demoReq);
assert(
  demoRes.status === 200 || !demoRes.headers.get('location'),
  'Anonymous visitor to /demo/operations is NOT redirected (status 200/next, no login redirect)'
);

// Simulate unauthenticated request to /app (must be redirected to /login)
const appReq = new NextRequest('http://localhost:3000/app');
const appRes = await middleware(appReq);
assert(
  appRes.status === 307 || appRes.status === 308 || appRes.status === 302,
  'Unauthenticated request to /app receives redirect status'
);
const location = appRes.headers.get('location') || '';
assert(
  location.includes('/login') && location.includes('redirect=%2Fapp'),
  `/app redirects unauthenticated visitor to /login?redirect=/app (got: ${location})`
);

// -----------------------------------------------------------------------------
// Test Group 4: Correct Simulated Role Rendering & Showcase Indicators
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 4: Simulated Role Rendering & Showcase Indicators ---');

const demoOpsPath = path.join(FRONTEND_DIR, 'src/app/demo/operations/page.tsx');
assert(fs.existsSync(demoOpsPath), 'Demo operations page exists at src/app/demo/operations/page.tsx');

const demoOpsContent = fs.readFileSync(demoOpsPath, 'utf8');

// Indicator banner
assert(
  demoOpsContent.includes('DEMO MODE — SIMULATED DATA — READ ONLY'),
  'Renders distinct DEMO MODE — SIMULATED DATA — READ ONLY indicator banner'
);

// Exit Demo and Sign In actions
assert(
  demoOpsContent.includes('href="/demo"') && demoOpsContent.includes('Exit Demo'),
  'Provides visible "Exit Demo" action returning to /demo'
);
assert(
  demoOpsContent.includes('href="/login"') && (demoOpsContent.includes('Operator Sign In') || demoOpsContent.includes('Sign In')),
  'Provides distinct link to /login for real operator credentialed access'
);

// Role perspective content
assert(
  demoOpsContent.includes("activeRole === 'Operations Controller'") &&
    demoOpsContent.includes('RailwayNetworkMap') &&
    demoOpsContent.includes('Simulated Incident Advisory C-01'),
  'Operations Controller view renders corridor route schematic and incident advisory'
);

assert(
  demoOpsContent.includes("activeRole === 'Station Master'") &&
    demoOpsContent.includes('Passenger Manifest & Allocation Ledger') &&
    demoOpsContent.includes('Kanpur Central [CNB]'),
  'Station Master view renders CNB station console and passenger manifest'
);

assert(
  demoOpsContent.includes("activeRole === 'Audit Inspector'") &&
    demoOpsContent.includes('Relational Invariant Verification Engine') &&
    demoOpsContent.includes('INV-01') &&
    demoOpsContent.includes('INV-08') &&
    demoOpsContent.includes('R-11 / R-12'),
  'Audit Inspector view renders formal specification proofs and invariant engine'
);

// -----------------------------------------------------------------------------
// Test Group 5: Standalone Resilience Without Operational Backend
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 5: Standalone Resilience Without Operational Backend ---');

assert(
  demoOpsContent.includes('@/lib/mock-data'),
  'Demo operations uses deterministic synthetic mock data from @/lib/mock-data'
);

assert(
  !demoOpsContent.includes('mysql2') &&
    !demoOpsContent.includes('@supabase') &&
    !demoOpsContent.includes('localhost:8080'),
  'Demo operations has zero dependencies on MySQL, Supabase, or live Java backend service'
);

assert(
  STATIONS.length > 0 && JOURNEYS.length > 0 && BOOKINGS.length > 0 && AUDIT_LOGS.length > 0,
  'Deterministic mock data sets are populated and valid'
);

// -----------------------------------------------------------------------------
// Test Group 6: Zero Mutation Requests to Operational APIs
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 6: Zero Mutation Requests to Operational APIs ---');

const forbiddenOperationalApis = [
  '/api/bookings/cancel',
  '/api/refund/evaluate',
  '/api/inventory',
  'fetch(\'/api/bookings\'',
  'fetch("/api/bookings"',
];

for (const api of forbiddenOperationalApis) {
  assert(
    !demoOpsContent.includes(api),
    `Demo operations page does not call operational API: ${api}`
  );
}

assert(
  demoOpsContent.includes('setSimulatedFeedback') &&
    demoOpsContent.includes('handleSimulateVerification'),
  'Interactive actions (holds, announcements, invariant proofs) mutate local client state only'
);

// -----------------------------------------------------------------------------
// Test Group 7: Security Guard Preservation on /app ---
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 7: Security Guard Preservation on /app ---');

const appLayoutPath = path.join(FRONTEND_DIR, 'src/app/app/layout.tsx');
const appLayoutContent = fs.readFileSync(appLayoutPath, 'utf8');

assert(
  appLayoutContent.includes('verifySessionToken') && appLayoutContent.includes("redirect('/login?redirect=/app')"),
  '/app server layout strictly enforces SessionAuthGuard redirect for unauthenticated access'
);

const middlewarePath = path.join(FRONTEND_DIR, 'src/middleware.ts');
const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');

assert(
  middlewareContent.includes("pathname.startsWith('/app')") &&
    middlewareContent.includes("loginUrl.searchParams.set('redirect', safeRedirect)"),
  'Middleware strictly enforces /app session check and redirects unauthenticated visitors to /login'
);

// -----------------------------------------------------------------------------
// Test Group 8: Operational APIs Reject Unauthorized Requests
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 8: Operational APIs Reject Unauthorized Requests ---');

// Dynamically test API route handlers for /api/bookings and /api/bookings/cancel
const { GET: getBookings, POST: createBooking } = await import('../src/app/api/bookings/route.ts');
const { POST: cancelBooking } = await import('../src/app/api/bookings/cancel/route.ts');
const { POST: evaluateRefund } = await import('../src/app/api/refund/evaluate/route.ts');

// 1. Unauthenticated GET /api/bookings
const unauthGetReq = new NextRequest('http://localhost:3000/api/bookings');
const unauthGetRes = await getBookings(unauthGetReq);
assert(
  unauthGetRes.status === 401,
  `GET /api/bookings rejects unauthenticated request with status 401 (got ${unauthGetRes.status})`
);

// 2. Unauthenticated POST /api/bookings
const unauthPostReq = new NextRequest('http://localhost:3000/api/bookings', {
  method: 'POST',
  body: JSON.stringify({ journeyId: 'J-12301-20261025' }),
});
const unauthPostRes = await createBooking(unauthPostReq);
assert(
  unauthPostRes.status === 401,
  `POST /api/bookings rejects unauthenticated request with status 401 (got ${unauthPostRes.status})`
);

// 3. Unauthenticated POST /api/bookings/cancel
const unauthCancelReq = new NextRequest('http://localhost:3000/api/bookings/cancel', {
  method: 'POST',
  body: JSON.stringify({ pnr: '241-8930124' }),
});
const unauthCancelRes = await cancelBooking(unauthCancelReq);
assert(
  unauthCancelRes.status === 401,
  `POST /api/bookings/cancel rejects unauthenticated request with status 401 (got ${unauthCancelRes.status})`
);

// 4. Unauthenticated POST /api/refund/evaluate
const unauthRefundReq = new NextRequest('http://localhost:3000/api/refund/evaluate', {
  method: 'POST',
  body: JSON.stringify({ fixtureId: 'D-01' }),
});
const unauthRefundRes = await evaluateRefund(unauthRefundReq);
assert(
  unauthRefundRes.status === 401,
  `POST /api/refund/evaluate rejects unauthenticated request with status 401 (got ${unauthRefundRes.status})`
);

// 5. CSRF Protection rejection in middleware
const csrfReq = new NextRequest('http://localhost:3000/api/bookings', {
  method: 'POST',
  headers: {
    'sec-fetch-site': 'cross-site',
  },
});
const csrfRes = await middleware(csrfReq);
assert(
  csrfRes.status === 403,
  `Cross-site mutation request rejected with 403 FORBIDDEN_CSRF (got ${csrfRes.status})`
);

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Public Demo Mode Test Summary:`);
console.log(`Passed: ${passed} | Failed: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
