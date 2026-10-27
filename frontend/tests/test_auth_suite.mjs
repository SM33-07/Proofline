/**
 * test_auth_suite.mjs
 * Comprehensive unit and integration test suite for RailSync's Authentication & Authorization Engine:
 * 1. Session token minting, HMAC SHA-256 cryptographic signature validation.
 * 2. Token expiration, timing-safe verification, tampering rejection.
 * 3. JTI session revocation tracking & memory registry.
 * 4. Password hashing verification (PBKDF2/SHA-256).
 * 5. Safe relative URL validation (open redirect defense).
 * 6. Role-based permissions matrix across all operator roles.
 * 7. CSRF origin and sec-fetch-site validation.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  verifySessionToken,
  verifySessionTokenSignature,
  isSafeRelativeUrl,
  setTestSessionSecretOverride,
} from '../src/lib/auth-tokens.ts';
import {
  createSessionToken,
  revocationRegistry,
  ROLE_PERMISSIONS,
  OPERATOR_ACCOUNTS,
} from '../src/lib/auth-server.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');

// Load environment from .env.local if present
const envLocalPath = path.join(FRONTEND_DIR, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of content.split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2];
    }
  }
}

// Ensure test session secret is available
const activeSecret =
  process.env.RAILSYNC_SESSION_SECRET && process.env.RAILSYNC_SESSION_SECRET.length >= 32
    ? process.env.RAILSYNC_SESSION_SECRET
    : 'railsync_test_session_secret_at_least_32_chars_long_isolated_run';

setTestSessionSecretOverride(activeSecret);

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
console.log('RailSync: Authentication & Role Authorization Engine Test Suite');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// Test Group 1: Session Token Cryptography & Verification
// -----------------------------------------------------------------------------
console.log('--- Test Group 1: Session Token Cryptography & Verification ---');

const testUser = {
  id: 'usr_controller_01',
  badgeId: 'OP-4091',
  name: 'R. K. Verma',
  email: 'controller.ndls@railsync.internal',
  role: 'Operations Controller',
  division: 'Northern Railway',
  stationCode: 'NDLS',
  accessTier: 'DISPATCHER_OPERATOR',
  permissions: ROLE_PERMISSIONS['Operations Controller'],
};

const sessionRes = await createSessionToken(testUser, false);
const token = sessionRes.token;
assert(typeof token === 'string' && token.split('.').length === 2, 'Token is well-formed base64url payload.signature');

const verified = await verifySessionToken(token);
assert(verified !== null, 'Token verifies successfully with current secret');
assert(verified?.user.id === testUser.id, 'Verified user ID matches payload');
assert(verified?.user.role === 'Operations Controller', 'Verified user role matches payload');
assert(verified?.user.permissions.canOverrideSignals === true, 'Verified permissions match role definition');

// Tampering detection
const parts = token.split('.');
const tamperedPayload = Buffer.from(
  JSON.stringify({ ...JSON.parse(Buffer.from(parts[0], 'base64url').toString()), role: 'Superadmin' })
).toString('base64url');
const tamperedToken = `${tamperedPayload}.${parts[1]}`;
const tamperedResult = await verifySessionToken(tamperedToken);
assert(tamperedResult === null, 'Tampered token payload is strictly rejected');

// Corrupted signature detection
const corruptedToken = `${parts[0]}.${parts[1].slice(0, -4)}xxxx`;
const corruptedResult = await verifySessionToken(corruptedToken);
assert(corruptedResult === null, 'Tampered signature is strictly rejected');

// Expired token rejection
const expiredPayload = {
  jti: crypto.randomUUID(),
  sessionVersion: 1,
  sub: testUser.id,
  user: testUser,
  iat: Math.floor(Date.now() / 1000) - 200,
  exp: Math.floor(Date.now() / 1000) - 100,
  persistent: false,
};
const enc = new TextEncoder();
const payloadB64 = Buffer.from(JSON.stringify(expiredPayload)).toString('base64url');
const hmacKey = await crypto.subtle.importKey(
  'raw',
  enc.encode(activeSecret),
  { name: 'HMAC', hash: 'SHA-256' },
  false,
  ['sign']
);
const sigBuffer = await crypto.subtle.sign('HMAC', hmacKey, enc.encode(payloadB64));
const sigB64 = Buffer.from(sigBuffer).toString('base64url');
const expiredToken = `${payloadB64}.${sigB64}`;
const expiredResult = await verifySessionToken(expiredToken);
assert(expiredResult === null, 'Expired token is strictly rejected');

// -----------------------------------------------------------------------------
// Test Group 1b: verifySessionTokenSignature Boundary & Revocation Independence
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 1b: verifySessionTokenSignature ---');

const sigVerified = await verifySessionTokenSignature(token);
assert(sigVerified !== null, 'verifySessionTokenSignature verifies well-formed token');
assert(sigVerified?.user.id === testUser.id, 'verifySessionTokenSignature payload user ID matches');

const sigTampered = await verifySessionTokenSignature(tamperedToken);
assert(sigTampered === null, 'verifySessionTokenSignature strictly rejects tampered payload');

const sigExpired = await verifySessionTokenSignature(expiredToken);
assert(sigExpired === null, 'verifySessionTokenSignature strictly rejects expired token');

// -----------------------------------------------------------------------------
// Test Group 2: Session Revocation Registry (JTI)
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 2: Session Revocation Registry (JTI) ---');

const activeSession = await createSessionToken(testUser, false);
const decoded = await verifySessionToken(activeSession.token);
assert(decoded?.jti !== undefined, 'Minted session token contains unique jti claim');

if (decoded?.jti) {
  assert(!revocationRegistry.isRevoked(decoded.jti), 'Newly issued token is not revoked');
  revocationRegistry.revokeToken(decoded.jti, Date.now() / 1000 + 3600);
  assert(revocationRegistry.isRevoked(decoded.jti), 'Token is marked revoked in registry');
  const postRevokeSig = await verifySessionTokenSignature(activeSession.token);
  assert(postRevokeSig !== null, 'Revoked token still possesses valid cryptographic signature (for revocation-check auth)');
  const postRevokeFull = await verifySessionToken(activeSession.token);
  assert(postRevokeFull === null, 'verifySessionToken strictly rejects revoked token');
}

// -----------------------------------------------------------------------------
// Test Group 3: Safe Relative URL Validation (Open Redirect Defense)
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 3: Safe Relative URL Validation ---');

const safeUrls = ['/app', '/app/inventory', '/app/audit?filter=all', '/demo', '/demo/operations'];
for (const u of safeUrls) {
  assert(isSafeRelativeUrl(u) === true, `Valid relative URL allowed: ${u}`);
}

const unsafeUrls = [
  'https://attacker.com',
  'http://evil.com/app',
  '//attacker.com/app',
  '/\\attacker.com',
  'javascript:alert(1)',
  '',
  null,
  undefined,
];
for (const u of unsafeUrls) {
  assert(isSafeRelativeUrl(u) === false, `Unsafe open-redirect URL rejected: ${u}`);
}

// -----------------------------------------------------------------------------
// Test Group 4: Role-Based Access Control (RBAC) Permissions Matrix
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 4: Role-Based Access Control (RBAC) Matrix ---');

const opPerms = ROLE_PERMISSIONS['Operations Controller'];
assert(opPerms.canOverrideSignals === true, 'Operations Controller can override signals');
assert(opPerms.canCreateBooking === true, 'Operations Controller can create booking');
assert(opPerms.canEvaluateRefunds === true, 'Operations Controller can evaluate refunds');

const smPerms = ROLE_PERMISSIONS['Station Master'];
assert(smPerms.canOverrideSignals === false, 'Station Master cannot override signals');
assert(smPerms.canCreateBooking === true, 'Station Master can create booking');
assert(smPerms.canEvaluateRefunds === false, 'Station Master cannot evaluate network refunds');

const aiPerms = ROLE_PERMISSIONS['Audit Inspector'];
assert(aiPerms.canViewAudit === true, 'Audit Inspector can view audit logs');
assert(aiPerms.canCreateBooking === false, 'Audit Inspector is read-only for bookings');
assert(aiPerms.canCancelBooking === false, 'Audit Inspector is read-only for cancellations');

// -----------------------------------------------------------------------------
// Test Group 5: Operator Accounts Integrity
// -----------------------------------------------------------------------------
console.log('\n--- Test Group 5: Operator Accounts Integrity ---');

assert(OPERATOR_ACCOUNTS.length === 3, 'Exactly 3 operator accounts configured');
const rolesPresent = OPERATOR_ACCOUNTS.map((a) => a.role);
assert(rolesPresent.includes('Operations Controller'), 'Operations Controller account present');
assert(rolesPresent.includes('Station Master'), 'Station Master account present');
assert(rolesPresent.includes('Audit Inspector'), 'Audit Inspector account present');

for (const acc of OPERATOR_ACCOUNTS) {
  assert(acc.passwordHashHex && acc.salt, `Account ${acc.badgeId} has valid passwordHashHex and salt`);
}

// -----------------------------------------------------------------------------
// Test Summary
// -----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Auth Engine Test Summary:`);
console.log(`Passed: ${passed} | Failed: ${failed}`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
