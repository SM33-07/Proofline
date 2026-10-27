/**
 * test_full_system.mjs
 * Comprehensive end-to-end regression, dual-backend verification, RBAC, session revocation,
 * CSRF, backend secret, and fail-closed security suite.
 */

import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

const REPO_ROOT = path.resolve('..');
const FRONTEND_DIR = path.resolve('.');

// Read secrets from frontend/.env.local
let sessionSecret = '';
let backendSecret = '';

const envLocalPath = path.join(FRONTEND_DIR, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match) {
      if (match[1] === 'RAILSYNC_SESSION_SECRET') sessionSecret = match[2];
      if (match[1] === 'RAILSYNC_BACKEND_SECRET') backendSecret = match[2];
    }
  }
}

// P1: Fail closed if credentials are not explicitly supplied in environment (zero hardcoded fallback)
const dbUser = process.env.RAILSYNC_DB_USER;
const dbPassword = process.env.RAILSYNC_DB_PASSWORD || process.env.MYSQL_PWD;

if (!dbUser || dbUser.trim() === '') {
  console.error('[CONFIGURATION_ERROR] RAILSYNC_DB_USER environment variable is required. (No default fallback permitted)');
  process.exit(1);
}

if (!dbPassword || dbPassword.trim() === '') {
  console.error('[CONFIGURATION_ERROR] Database password is required (RAILSYNC_DB_PASSWORD or MYSQL_PWD). (No default fallback permitted)');
  process.exit(1);
}

if (dbUser.trim().toLowerCase() === 'root') {
  console.error('[SAFETY_VIOLATION] The MySQL root account is strictly prohibited for test execution. A dedicated test account is required.');
  process.exit(1);
}

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

function makeRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
          json,
        });
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await makeRequest(url);
      if (res.status === 200 || res.status === 503 || res.status === 500) {
        return true;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

function extractCookie(res, cookieName) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie.join('; ') : setCookie;
  const match = cookieStr.match(new RegExp(`${cookieName}=([^;]+)`));
  return match ? match[1] : null;
}

function killProcess(proc) {
  if (!proc) return;
  try {
    if (process.platform === 'win32' && proc.pid) {
      spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore' });
    } else {
      proc.kill('SIGKILL');
    }
  } catch {}
}

async function cleanDatabase(pool) {
  try {
    const conn = await pool.getConnection();
    try {
      const [dbInfo] = await conn.query('SELECT DATABASE() AS db');
      if (dbInfo[0]?.db !== 'railsync_test') return;

      const [matchedBookings] = await conn.query(
        "SELECT booking_id FROM BOOKING WHERE group_ref = 'TEST-CONTROLLER-BOOKING'"
      );
      const targetIds = matchedBookings.map((r) => r.booking_id);
      if (targetIds.length > 0) {
        await conn.query('DELETE FROM BOOKING_AUDIT WHERE booking_id IN (?)', [targetIds]);
        await conn.query('DELETE FROM SEAT_ALLOCATION WHERE booking_id IN (?)', [targetIds]);
        await conn.query('DELETE FROM WAITLIST_ENTRY WHERE booking_id IN (?)', [targetIds]);
        await conn.query('DELETE FROM BOOKING WHERE booking_id IN (?)', [targetIds]);
      }
    } finally {
      conn.release();
    }
  } catch {}
}

async function runSuite() {
  console.log('================================================================');
  console.log(' RAILSYNC PHASE 1 DUAL-BACKEND, RBAC & SECURITY VERIFICATION');
  console.log('================================================================\n');

  let javaProc = null;
  let nextProc = null;
  let directDbPool = null;

  try {
    directDbPool = mysql.createPool({
      host: process.env.RAILSYNC_DB_HOST || 'localhost',
      port: process.env.RAILSYNC_DB_PORT ? parseInt(process.env.RAILSYNC_DB_PORT, 10) : 3306,
      user: dbUser.trim(),
      password: dbPassword.trim(),
      database: 'railsync_test',
      waitForConnections: true,
      connectionLimit: 5,
    });

    await cleanDatabase(directDbPool);

    // -------------------------------------------------------------------------
    // 0. CONFIGURATION RESOLUTION ORDER VERIFICATION (P4)
    // -------------------------------------------------------------------------
    console.log('[SECTION 0] Java Backend URL Configuration Resolution Order (P4)');
    const { getJavaBackendUrl } = await import('../src/lib/server-backend.ts');

    const origBackendUrl = process.env.RAILSYNC_JAVA_BACKEND_URL;
    const origApiUrl = process.env.RAILSYNC_JAVA_API_URL;

    // Test Default
    delete process.env.RAILSYNC_JAVA_BACKEND_URL;
    delete process.env.RAILSYNC_JAVA_API_URL;
    assert(getJavaBackendUrl() === 'http://localhost:8080', 'Default resolves to http://localhost:8080 when no env var is set');

    // Test RAILSYNC_JAVA_API_URL
    process.env.RAILSYNC_JAVA_API_URL = 'http://127.0.0.1:8080';
    assert(getJavaBackendUrl() === 'http://127.0.0.1:8080', 'Resolves to RAILSYNC_JAVA_API_URL when configured');

    // Test RAILSYNC_JAVA_BACKEND_URL takes precedence
    process.env.RAILSYNC_JAVA_BACKEND_URL = 'http://127.0.0.1:8081';
    assert(getJavaBackendUrl() === 'http://127.0.0.1:8081', 'RAILSYNC_JAVA_BACKEND_URL takes precedence over RAILSYNC_JAVA_API_URL');

    // Restore
    if (origBackendUrl !== undefined) process.env.RAILSYNC_JAVA_BACKEND_URL = origBackendUrl;
    else delete process.env.RAILSYNC_JAVA_BACKEND_URL;
    if (origApiUrl !== undefined) process.env.RAILSYNC_JAVA_API_URL = origApiUrl;
    else delete process.env.RAILSYNC_JAVA_API_URL;

    // -------------------------------------------------------------------------
    // 1. JAVA BACKEND DIRECT SECURITY TESTS (GATEWAY SECRET ENFORCEMENT)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 1] Java In-Memory Backend Gateway Secret & Direct Access');
    
    javaProc = spawn('java', ['-cp', 'bin', 'railsync.server.RailSyncServer', '8080'], {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        RAILSYNC_BACKEND_SECRET: backendSecret,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const javaReady = await waitForServer('http://127.0.0.1:8080/api/health', 15000);
    assert(javaReady, 'Java server booted and listening on 127.0.0.1:8080');

    // Health is public for health checks
    const javaHealth = await makeRequest('http://127.0.0.1:8080/api/health');
    assert(javaHealth.status === 200 && javaHealth.json?.status === 'UP', 'Java /api/health is UP');

    // Operational routes reject unauthorized direct callers
    const unauthInventory = await makeRequest('http://127.0.0.1:8080/api/inventory');
    assert(
      unauthInventory.status === 401 && unauthInventory.json?.error === 'UNAUTHORIZED_GATEWAY_ACCESS',
      'Java operational route rejects direct caller without Authorization header (401)'
    );

    const badSecretInventory = await makeRequest('http://127.0.0.1:8080/api/inventory', {
      headers: { 'Authorization': 'Bearer wrong-secret-token-attempt-xyz' },
    });
    assert(
      badSecretInventory.status === 401 && badSecretInventory.json?.error === 'UNAUTHORIZED_GATEWAY_ACCESS',
      'Java operational route rejects direct caller with invalid gateway secret (401)'
    );

    const validSecretInventory = await makeRequest('http://127.0.0.1:8080/api/inventory', {
      headers: { 'Authorization': `Bearer ${backendSecret}` },
    });
    assert(
      validSecretInventory.status === 200 && Array.isArray(validSecretInventory.json) && validSecretInventory.json.length > 0,
      'Java operational route allows request with valid gateway secret (200)'
    );

    // -------------------------------------------------------------------------
    // 2. NEXT.JS SERVER IN MEMORY MODE (PORT 3001)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 2] Next.js Server in Memory Mode (RAILSYNC_BACKEND=memory)');

    nextProc = spawn('npx', ['next', 'start', '-p', '3001'], {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        PORT: '3001',
        RAILSYNC_BACKEND: 'memory',
        RAILSYNC_SESSION_SECRET: sessionSecret,
        RAILSYNC_BACKEND_SECRET: backendSecret,
        RAILSYNC_JAVA_BACKEND_URL: 'http://127.0.0.1:8080',
        RAILSYNC_DB_USER: dbUser.trim(),
        RAILSYNC_DB_PASSWORD: dbPassword.trim(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    const nextReady = await waitForServer('http://127.0.0.1:3001/api/health', 25000);
    assert(nextReady, 'Next.js server booted and listening on port 3001 in memory mode');

    // Health check reports memory mode + Java reachability truthfully
    const healthMem = await makeRequest('http://127.0.0.1:3001/api/health');
    assert(healthMem.status === 200, 'Next.js /api/health returns 200 when backend is UP');
    assert(healthMem.json?.backend === 'memory', 'Health reports backend: memory');
    assert(healthMem.json?.javaBackend?.status === 'UP', 'Health reports Java simulator status: UP');

    // CSRF Protection on Login
    console.log('\n[SECTION 3] CSRF Defenses & Authentication Hardening');
    const csrfCrossSite = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'sec-fetch-site': 'cross-site',
        'host': '127.0.0.1:3001',
      },
    }, { identifier: 'OP-4091', password: 'ControllerPass@123' });
    assert(csrfCrossSite.status === 403, 'CSRF: sec-fetch-site cross-site rejected with 403');

    const csrfOriginMismatch = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'origin': 'https://malicious-train-site.attacker.com',
        'host': '127.0.0.1:3001',
      },
    }, { identifier: 'OP-4091', password: 'ControllerPass@123' });
    assert(csrfOriginMismatch.status === 403, 'CSRF: origin mismatch rejected with 403');

    // Invalid credentials
    const badLogin = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'host': '127.0.0.1:3001' },
    }, { identifier: 'OP-4091', password: 'WrongPassword' });
    assert(badLogin.status === 401, 'Login with incorrect password rejected with 401');

    // Successful Logins for 3 Operator Roles
    const opLogin = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'host': '127.0.0.1:3001' },
    }, { identifier: 'controller.ndls@railsync.internal', password: 'ControllerPass@123' });
    assert(opLogin.status === 200 && opLogin.json?.user?.role === 'Operations Controller', 'Operations Controller login succeeded');
    const opCookie = extractCookie(opLogin, 'railsync_session');
    assert(!!opCookie, 'Operations Controller received HttpOnly railsync_session cookie');

    const smLogin = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'host': '127.0.0.1:3001' },
    }, { identifier: 'master.cnb@railsync.internal', password: 'StationPass@123' });
    assert(smLogin.status === 200 && smLogin.json?.user?.role === 'Station Master', 'Station Master login succeeded');
    const smCookie = extractCookie(smLogin, 'railsync_session');
    assert(!!smCookie, 'Station Master received HttpOnly railsync_session cookie');

    const aiLogin = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'host': '127.0.0.1:3001' },
    }, { identifier: 'inspector.hq@railsync.internal', password: 'AuditPass@123' });
    assert(aiLogin.status === 200 && aiLogin.json?.user?.role === 'Audit Inspector', 'Audit Inspector login succeeded');
    const aiCookie = extractCookie(aiLogin, 'railsync_session');
    assert(!!aiCookie, 'Audit Inspector received HttpOnly railsync_session cookie');

    // -------------------------------------------------------------------------
    // 4. ROLE-BASED ACCESS CONTROL (RBAC) & CLIENT SPOOFING DEFENSE
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 4] Role-Based Access Control & Header Spoofing Protection');

    const unauthInv = await makeRequest('http://127.0.0.1:3001/api/inventory');
    assert(unauthInv.status === 401, 'Unauthenticated GET /api/inventory rejected (401)');

    const unauthBook = await makeRequest('http://127.0.0.1:3001/api/bookings', { method: 'POST' }, {});
    assert(unauthBook.status === 401, 'Unauthenticated POST /api/bookings rejected (401)');

    const unauthCancel = await makeRequest('http://127.0.0.1:3001/api/bookings/cancel', { method: 'POST' }, {});
    assert(unauthCancel.status === 401, 'Unauthenticated POST /api/bookings/cancel rejected (401)');

    const unauthRefund = await makeRequest('http://127.0.0.1:3001/api/refund/evaluate', { method: 'POST' }, {});
    assert(unauthRefund.status === 401, 'Unauthenticated POST /api/refund/evaluate rejected (401)');

    const spoofHeader = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: {
        'X-RailSync-Role': 'Operations Controller',
        'X-User-Role': 'Operations Controller',
      },
    });
    assert(spoofHeader.status === 401, 'Client spoofing X-RailSync-Role header without cookie rejected (401)');

    const [payloadB64, sig] = opCookie.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    decodedPayload.user.role = 'SuperAdmin';
    const tamperedPayloadB64 = Buffer.from(JSON.stringify(decodedPayload)).toString('base64url');
    const tamperedCookie = `${tamperedPayloadB64}.${sig}`;

    const tamperedReq = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${tamperedCookie}` },
    });
    assert(tamperedReq.status === 401, 'Tampered cookie payload fails HMAC verification (401)');

    const aiInv = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${aiCookie}` },
    });
    assert(aiInv.status === 200, 'Audit Inspector allowed to view inventory (200)');

    const aiCreate = await makeRequest('http://127.0.0.1:3001/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `railsync_session=${aiCookie}`,
      },
    }, { journeyId: 101, journeyClassId: 1, passengerId: 1 });
    assert(aiCreate.status === 403 && aiCreate.json?.error === 'FORBIDDEN', 'Audit Inspector denied booking creation (403 FORBIDDEN)');

    const aiCancel = await makeRequest('http://127.0.0.1:3001/api/bookings/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `railsync_session=${aiCookie}`,
      },
    }, { bookingId: 1, pnr: 'PNR-TEST' });
    assert(aiCancel.status === 403 && aiCancel.json?.error === 'FORBIDDEN', 'Audit Inspector denied booking cancellation (403 FORBIDDEN)');

    const smRefund = await makeRequest('http://127.0.0.1:3001/api/refund/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `railsync_session=${smCookie}`,
      },
    }, { caseId: 'CASE-TEST', passengerId: 1, journeyId: 101, classCode: 'SL' });
    assert(smRefund.status === 403 && smRefund.json?.error === 'FORBIDDEN', 'Station Master denied refund rule evaluation (403 FORBIDDEN)');

    const opInv = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${opCookie}` },
    });
    assert(opInv.status === 200 && Array.isArray(opInv.json) && opInv.json.length > 0, 'Operations Controller allowed inventory query (200)');

    // -------------------------------------------------------------------------
    // 5. SESSION REVOCATION & LOGOUT ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 5] Session Revocation and Logout Verification');

    const sessionBefore = await makeRequest('http://127.0.0.1:3001/api/auth/session', {
      headers: { Cookie: `railsync_session=${opCookie}` },
    });
    assert(sessionBefore.status === 200 && sessionBefore.json?.authenticated === true, 'Session active before logout');

    const logoutRes = await makeRequest('http://127.0.0.1:3001/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: `railsync_session=${opCookie}` },
    });
    assert(logoutRes.status === 200 && logoutRes.json?.success === true, 'Logout API returned 200 success');

    const sessionAfter = await makeRequest('http://127.0.0.1:3001/api/auth/session', {
      headers: { Cookie: `railsync_session=${opCookie}` },
    });
    assert(sessionAfter.status === 200 && sessionAfter.json?.authenticated === false, 'Replay of revoked session token returns authenticated: false');

    const invAfterLogout = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${opCookie}` },
    });
    assert(invAfterLogout.status === 401, 'Protected operational route rejects revoked session token (401)');

    // -------------------------------------------------------------------------
    // 6. JAVA BACKEND UNAVAILABLE BEHAVIOR (MEMORY MODE)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 6] Truthful Backend Reachability & Failure Behavior (Memory Mode)');

    killProcess(javaProc);
    javaProc = null;
    await new Promise(r => setTimeout(r, 2000));

    const healthDown = await makeRequest('http://127.0.0.1:3001/api/health');
    assert(healthDown.status === 503, 'Health returns 503 when Java backend process is unreachable');
    assert(healthDown.json?.status === 'DOWN', 'Health status is DOWN');
    assert(healthDown.json?.javaBackend?.status === 'DOWN', 'javaBackend.status is DOWN');

    const opLogin2 = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'host': '127.0.0.1:3001' },
    }, { identifier: 'controller.ndls@railsync.internal', password: 'ControllerPass@123' });
    const opCookie2 = extractCookie(opLogin2, 'railsync_session');

    const invDown = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${opCookie2}` },
    });
    assert(
      invDown.status === 503 && invDown.json?.error === 'BACKEND_UNAVAILABLE',
      'Inventory returns 503 BACKEND_UNAVAILABLE when Java is unreachable (no mock substitution)'
    );

    killProcess(nextProc);
    nextProc = null;
    await new Promise(r => setTimeout(r, 2000));

    // -------------------------------------------------------------------------
    // 7. NEXT.JS SERVER IN MYSQL MODE (RAILSYNC_BACKEND=mysql)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 7] Next.js Server in MySQL Mode (RAILSYNC_BACKEND=mysql)');

    nextProc = spawn('npx', ['next', 'start', '-p', '3001'], {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        PORT: '3001',
        RAILSYNC_BACKEND: 'mysql',
        RAILSYNC_SESSION_SECRET: sessionSecret,
        RAILSYNC_BACKEND_SECRET: backendSecret,
        RAILSYNC_DB_USER: dbUser.trim(),
        RAILSYNC_DB_PASSWORD: dbPassword.trim(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    const nextMysqlReady = await waitForServer('http://127.0.0.1:3001/api/health', 25000);
    assert(nextMysqlReady, 'Next.js server booted in MySQL mode on port 3001');

    const healthMysql = await makeRequest('http://127.0.0.1:3001/api/health');
    assert(healthMysql.status === 200, 'Next.js /api/health returns 200 in MySQL mode');
    assert(healthMysql.json?.backend === 'mysql', 'Health reports backend: mysql');
    assert(healthMysql.json?.database?.status === 'UP', 'Health reports database.status: UP');
    assert(healthMysql.json?.database?.database === 'railsync_test', 'Health verifies database is isolated railsync_test');

    const mysqlLogin = await makeRequest('http://127.0.0.1:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'host': '127.0.0.1:3001' },
    }, { identifier: 'controller.ndls@railsync.internal', password: 'ControllerPass@123' });
    const mysqlOpCookie = extractCookie(mysqlLogin, 'railsync_session');
    assert(!!mysqlOpCookie, 'Controller login successful in MySQL mode');

    // Route 1: GET /api/inventory
    const mysqlInv = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${mysqlOpCookie}` },
    });
    assert(mysqlInv.status === 200, 'GET /api/inventory returns 200 in MySQL mode');
    assert(Array.isArray(mysqlInv.json) && mysqlInv.json.length > 0, 'Inventory contains classes from MySQL base tables');

    // Route 2: POST /api/bookings
    const mysqlBook = await makeRequest('http://127.0.0.1:3001/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `railsync_session=${mysqlOpCookie}`,
      },
    }, {
      journeyId: 101,
      journeyClassId: 1,
      passengerId: 4,
    });
    assert(mysqlBook.status === 201 || mysqlBook.status === 200, 'POST /api/bookings created booking via MySQL procedure (201)');
    assert(!!mysqlBook.json?.pnr, `MySQL booking returned PNR: ${mysqlBook.json?.pnr}`);
    const bookedPnr = mysqlBook.json?.pnr;

    // Route 3: POST /api/bookings/cancel
    const mysqlCancel = await makeRequest('http://127.0.0.1:3001/api/bookings/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `railsync_session=${mysqlOpCookie}`,
      },
    }, {
      pnr: bookedPnr,
    });
    assert(mysqlCancel.status === 200, 'POST /api/bookings/cancel cancelled booking via MySQL procedure (200)');
    assert(mysqlCancel.json?.status === 'CANCELLED', 'Booking status transitioned to CANCELLED in MySQL');

    // Route 4: POST /api/refund/evaluate
    // Check baseline records before refund evaluation
    const [bkgBefore] = await directDbPool.query('SELECT COUNT(*) AS cnt FROM BOOKING');
    const [caseBefore] = await directDbPool.query('SELECT COUNT(*) AS cnt FROM DISRUPTION_CASE');

    const d01Path = path.resolve('../fixtures/disruption/D-01-late-over-3hr.json');
    const d01Data = JSON.parse(fs.readFileSync(d01Path, 'utf8'));

    const mysqlRefund = await makeRequest('http://127.0.0.1:3001/api/refund/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `railsync_session=${mysqlOpCookie}`,
      },
    }, d01Data);
    assert(mysqlRefund.status === 200, 'POST /api/refund/evaluate executed evaluate_case procedure (200)');
    assert(mysqlRefund.json?.outcome === d01Data.expected.outcome, `Refund outcome matches canonical fixture (${d01Data.expected.outcome})`);
    assert(mysqlRefund.json?.refundAmount === d01Data.expected.refundAmount, `Refund amount matches canonical fixture (${d01Data.expected.refundAmount})`);
    assert(Array.isArray(mysqlRefund.json?.reasonCodes) && mysqlRefund.json.reasonCodes.includes('DELAY_OVER_THRESHOLD'), 'Includes DELAY_OVER_THRESHOLD reason code');

    // P3 Check: Verify ZERO persistent evaluation rows remain in BOOKING or DISRUPTION_CASE
    const [bkgAfter] = await directDbPool.query('SELECT COUNT(*) AS cnt FROM BOOKING');
    const [caseAfter] = await directDbPool.query('SELECT COUNT(*) AS cnt FROM DISRUPTION_CASE');
    assert(Number(bkgAfter[0].cnt) === Number(bkgBefore[0].cnt), 'Atomic rollback guaranteed: zero synthetic bookings persist after refund evaluation');
    assert(Number(caseAfter[0].cnt) === Number(caseBefore[0].cnt), 'Atomic rollback guaranteed: zero synthetic cases persist after refund evaluation');

    // -------------------------------------------------------------------------
    // 8. DATABASE DOWN BEHAVIOR (MYSQL MODE)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 8] Database Unavailable Behavior (MySQL Mode)');

    killProcess(nextProc);
    nextProc = null;
    await new Promise(r => setTimeout(r, 2000));

    nextProc = spawn('npx', ['next', 'start', '-p', '3001'], {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        PORT: '3001',
        RAILSYNC_BACKEND: 'mysql',
        RAILSYNC_SESSION_SECRET: sessionSecret,
        RAILSYNC_BACKEND_SECRET: backendSecret,
        RAILSYNC_DB_PORT: '3399',
        RAILSYNC_DB_USER: dbUser.trim(),
        RAILSYNC_DB_PASSWORD: dbPassword.trim(),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    const nextBadDbReady = await waitForServer('http://127.0.0.1:3001/api/health', 25000);
    assert(nextBadDbReady, 'Next.js server responded on port 3001');

    const healthDbDown = await makeRequest('http://127.0.0.1:3001/api/health');
    assert(healthDbDown.status === 503, 'Health returns 503 when MySQL database is unreachable');
    assert(healthDbDown.json?.status === 'DOWN', 'Health status is DOWN');
    assert(healthDbDown.json?.database?.status === 'DOWN', 'database.status is DOWN');

    const invDbDown = await makeRequest('http://127.0.0.1:3001/api/inventory', {
      headers: { Cookie: `railsync_session=${mysqlOpCookie}` },
    });
    assert(
      invDbDown.status === 503 && invDbDown.json?.error === 'BACKEND_UNAVAILABLE',
      'Inventory returns 503 BACKEND_UNAVAILABLE when MySQL is unreachable'
    );

    // -------------------------------------------------------------------------
    // 9. UNSUPPORTED BACKEND MODE (FAIL-CLOSED CONFIGURATION)
    // -------------------------------------------------------------------------
    console.log('\n[SECTION 9] Unsupported Backend Mode Configuration (Fail-Closed)');

    killProcess(nextProc);
    nextProc = null;
    await new Promise(r => setTimeout(r, 2000));

    nextProc = spawn('npx', ['next', 'start', '-p', '3001'], {
      cwd: FRONTEND_DIR,
      env: {
        ...process.env,
        PORT: '3001',
        RAILSYNC_BACKEND: 'oracle_unsupported',
        RAILSYNC_SESSION_SECRET: sessionSecret,
        RAILSYNC_BACKEND_SECRET: backendSecret,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    await waitForServer('http://127.0.0.1:3001/api/health', 25000);
    const healthUnsupported = await makeRequest('http://127.0.0.1:3001/api/health');
    assert(healthUnsupported.status === 500, 'Unsupported backend mode returns 500 configuration error');
    assert(healthUnsupported.json?.error === 'UNSUPPORTED_BACKEND_MODE', 'Health returns UNSUPPORTED_BACKEND_MODE error code');

  } catch (err) {
    console.error('Test execution failed with unexpected error:', err);
    failed++;
  } finally {
    if (javaProc) killProcess(javaProc);
    if (nextProc) killProcess(nextProc);
    if (directDbPool) {
      await cleanDatabase(directDbPool);
      await directDbPool.end();
    }
  }

  console.log('\n================================================================');
  console.log(` SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runSuite();
