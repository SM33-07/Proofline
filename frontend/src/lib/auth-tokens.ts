import { UserRole } from './types';

export const SESSION_COOKIE_NAME = 'railsync_session';
export const MIN_SECRET_LENGTH = 32;

export interface RolePermissions {
  canViewDashboard: boolean;
  canViewInventory: boolean;
  canViewBookings: boolean;
  canCreateBooking: boolean;
  canCancelBooking: boolean;
  canViewDisruptions: boolean;
  canEvaluateRefunds: boolean;
  canViewAudit: boolean;
  canExportAudit: boolean;
  canOverrideSignals: boolean;
}

export interface AuthenticatedUser {
  id: string;
  badgeId: string;
  email: string;
  name: string;
  role: UserRole;
  division: string;
  stationCode: string;
  accessTier: 'DISPATCHER_OPERATOR' | 'STATION_OPERATOR' | 'SYSTEM_AUDITOR';
  permissions: RolePermissions;
}

export interface SessionPayload {
  jti: string;
  sessionVersion: number;
  sub: string;
  user: AuthenticatedUser;
  iat: number;
  exp: number;
  persistent: boolean;
}

let revocationStoreHealthy = true;

export function setRevocationStoreHealth(healthy: boolean): void {
  revocationStoreHealthy = healthy;
}

export function isRevocationStoreHealthy(): boolean {
  return revocationStoreHealthy;
}

// Universal cross-runtime revocation store using globalThis
export interface GlobalRevocationState {
  revokedJtis: Record<string, number>;
  userVersions: Record<string, number>;
}

declare global {
  var __railsync_revocation_state: GlobalRevocationState | undefined;
}

if (!globalThis.__railsync_revocation_state) {
  globalThis.__railsync_revocation_state = {
    revokedJtis: {},
    userVersions: {},
  };
}

export function isSessionRevoked(jti: string): boolean {
  const state = globalThis.__railsync_revocation_state;
  if (!state) return false;
  const exp = state.revokedJtis[jti];
  if (!exp) return false;
  const now = Math.floor(Date.now() / 1000);
  return exp > now;
}

export function getUserSessionVersion(userId: string): number {
  const state = globalThis.__railsync_revocation_state;
  if (!state) return 1;
  return state.userVersions[userId] || 1;
}

export function revokeTokenInStore(jti: string, exp: number): void {
  if (!globalThis.__railsync_revocation_state) {
    globalThis.__railsync_revocation_state = { revokedJtis: {}, userVersions: {} };
  }
  globalThis.__railsync_revocation_state.revokedJtis[jti] = exp;
}

export function bumpUserVersionInStore(userId: string): void {
  if (!globalThis.__railsync_revocation_state) {
    globalThis.__railsync_revocation_state = { revokedJtis: {}, userVersions: {} };
  }
  const cur = globalThis.__railsync_revocation_state.userVersions[userId] || 1;
  globalThis.__railsync_revocation_state.userVersions[userId] = cur + 1;
}

// Fail-closed secret configuration
let testSessionSecretOverride: string | null = null;

export function setTestSessionSecretOverride(secret: string | null): void {
  testSessionSecretOverride = secret;
}

export function getSigningSecret(): string {
  if (testSessionSecretOverride !== null) {
    if (!testSessionSecretOverride || testSessionSecretOverride.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `CONFIGURATION_ERROR: Session signing secret must be at least ${MIN_SECRET_LENGTH} characters. System fails closed.`
      );
    }
    return testSessionSecretOverride;
  }

  const secret = process.env.RAILSYNC_SESSION_SECRET;
  if (!secret || secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error(
      `CONFIGURATION_ERROR: RAILSYNC_SESSION_SECRET is missing, empty, or below minimum length (${MIN_SECRET_LENGTH} characters). System fails closed.`
    );
  }
  return secret.trim();
}

export function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const secret = getSigningSecret();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    if (!isRevocationStoreHealthy()) {
      // Fail closed when revocation store is unavailable
      return null;
    }
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const sigBytes = base64UrlDecode(sigB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const dec = new TextDecoder();
    const payload = JSON.parse(dec.decode(payloadBytes)) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= now) {
      return null;
    }

    if (payload.jti && isSessionRevoked(payload.jti)) {
      return null;
    }

    const currentVersion = getUserSessionVersion(payload.sub);
    if (payload.sessionVersion && payload.sessionVersion < currentVersion) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify cryptographic signature, format, and expiration of a session token
 * without asserting revocation state. Used by authoritative revocation inspection
 * endpoints to authenticate the caller before checking registry status.
 */
export async function verifySessionTokenSignature(token: string): Promise<SessionPayload | null> {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    const enc = new TextEncoder();
    const key = await getHmacKey();
    const sigBytes = base64UrlDecode(sigB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      sigBytes as unknown as BufferSource,
      enc.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const dec = new TextDecoder();
    const payload = JSON.parse(dec.decode(payloadBytes)) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isSafeRelativeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return false;
  }
  if (/[\r\n\t\\]/.test(trimmed)) return false;
  if (trimmed.includes(':')) return false;
  return true;
}
