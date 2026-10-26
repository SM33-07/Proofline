import fs from 'fs';
import path from 'path';
import {
  UserRole,
} from './types';
import {
  MIN_SECRET_LENGTH,
  RolePermissions,
  AuthenticatedUser,
  SessionPayload,
  getSigningSecret,
  revokeTokenInStore,
  bumpUserVersionInStore,
  getUserSessionVersion,
  isSessionRevoked,
  base64UrlEncode,
} from './auth-tokens';

export * from './auth-tokens';

export const PBKDF2_ITERATIONS = 600000;

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  'Operations Controller': {
    canViewDashboard: true,
    canViewInventory: true,
    canViewBookings: true,
    canCreateBooking: true,
    canCancelBooking: true,
    canViewDisruptions: true,
    canEvaluateRefunds: true,
    canViewAudit: false,
    canExportAudit: false,
    canOverrideSignals: true,
  },
  'Station Master': {
    canViewDashboard: true,
    canViewInventory: true,
    canViewBookings: true,
    canCreateBooking: true,
    canCancelBooking: true,
    canViewDisruptions: true,
    canEvaluateRefunds: false,
    canViewAudit: false,
    canExportAudit: false,
    canOverrideSignals: false,
  },
  'Audit Inspector': {
    canViewDashboard: true,
    canViewInventory: true,
    canViewBookings: true,
    canCreateBooking: false,
    canCancelBooking: false,
    canViewDisruptions: true,
    canEvaluateRefunds: true,
    canViewAudit: true,
    canExportAudit: true,
    canOverrideSignals: false,
  },
};

export interface OperatorRecord {
  id: string;
  badgeId: string;
  email: string;
  name: string;
  role: UserRole;
  division: string;
  stationCode: string;
  accessTier: 'DISPATCHER_OPERATOR' | 'STATION_OPERATOR' | 'SYSTEM_AUDITOR';
  salt: string;
  passwordHashHex: string;
  envPasswordKey?: string;
}

// Development and demonstration accounts (600,000 iteration PBKDF2-HMAC-SHA256)
export const OPERATOR_ACCOUNTS: OperatorRecord[] = [
  {
    id: 'OP-4091',
    badgeId: 'OP-4091',
    email: 'controller.ndls@railsync.internal',
    name: 'R. K. Verma',
    role: 'Operations Controller',
    division: 'Northern Railway Control Room',
    stationCode: 'NDLS',
    accessTier: 'DISPATCHER_OPERATOR',
    salt: 'railsync_salt_op_4091_ndls_v2',
    passwordHashHex: '8b26b4c73b914da7a885a8426d6b8a4098dea763963dce23476a11152115625b', // ControllerPass@123
    envPasswordKey: 'RAILSYNC_CONTROLLER_PASSWORD',
  },
  {
    id: 'SM-1042',
    badgeId: 'SM-1042',
    email: 'master.cnb@railsync.internal',
    name: 'S. P. Shukla',
    role: 'Station Master',
    division: 'North Central Railway (Kanpur Division)',
    stationCode: 'CNB',
    accessTier: 'STATION_OPERATOR',
    salt: 'railsync_salt_sm_1042_cnb_v2',
    passwordHashHex: '44315fd47f51ad96e2e1f73c6b61c30d71e3716086a55490d2647bd30c6e488a', // StationPass@123
    envPasswordKey: 'RAILSYNC_STATION_PASSWORD',
  },
  {
    id: 'AI-9001',
    badgeId: 'AI-9001',
    email: 'inspector.hq@railsync.internal',
    name: 'Dr. V. Ramanathan',
    role: 'Audit Inspector',
    division: 'Safety & Relational Invariant Wing',
    stationCode: 'HQ-AUDIT',
    accessTier: 'SYSTEM_AUDITOR',
    salt: 'railsync_salt_ai_9001_hq_v2',
    passwordHashHex: '7f4d87228f0e7e7593dd19fdce8f2fb100f1c874fd9183b4ce6759fd13defb10', // AuditPass@123
    envPasswordKey: 'RAILSYNC_AUDIT_PASSWORD',
  },
];

const DUMMY_SALT = 'railsync_salt_dummy_constant_time_v2';
const DUMMY_HASH_HEX = 'b5790d7adfe9e5c9b504ae961cda0651a26077ebe8c13c707b3c7ea21497d998';

let testBackendSecretOverride: string | null = null;

export function setTestBackendSecretOverride(secret: string | null): void {
  testBackendSecretOverride = secret;
}

export function getBackendSecret(): string {
  if (testBackendSecretOverride !== null) {
    if (!testBackendSecretOverride || testBackendSecretOverride.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `CONFIGURATION_ERROR: Gateway backend secret must be at least ${MIN_SECRET_LENGTH} characters. System fails closed.`
      );
    }
    return testBackendSecretOverride;
  }

  const secret = process.env.RAILSYNC_BACKEND_SECRET;
  if (!secret || secret.trim().length < MIN_SECRET_LENGTH) {
    throw new Error(
      `CONFIGURATION_ERROR: RAILSYNC_BACKEND_SECRET is missing, empty, or below minimum length (${MIN_SECRET_LENGTH} characters). System fails closed.`
    );
  }
  return secret.trim();
}

export function timingSafeEqualString(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let mismatch = a.length === b.length ? 0 : 1;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const charA = i < a.length ? a.charCodeAt(i) : 0;
    const charB = i < b.length ? b.charCodeAt(i) : 0;
    mismatch |= charA ^ charB;
  }
  return mismatch === 0;
}

export async function derivePbkdf2Hash(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    true,
    ['sign']
  );

  const exported = await crypto.subtle.exportKey('raw', derivedKey);
  const bytes = new Uint8Array(exported);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function verifyOperatorPassword(
  password: string,
  account: OperatorRecord
): Promise<boolean> {
  // Strict Environment Override: When configured, a mismatch MUST NOT fall through to the default hash.
  if (account.envPasswordKey && process.env[account.envPasswordKey]) {
    const override = process.env[account.envPasswordKey]!;
    return timingSafeEqualString(password, override);
  }

  try {
    const computedHex = await derivePbkdf2Hash(password, account.salt);
    return timingSafeEqualString(computedHex, account.passwordHashHex);
  } catch {
    return false;
  }
}

export async function performDummyPasswordVerification(password: string): Promise<boolean> {
  try {
    const computed = await derivePbkdf2Hash(password, DUMMY_SALT);
    return timingSafeEqualString(computed, DUMMY_HASH_HEX);
  } catch {
    return false;
  }
}

class SessionRevocationRegistry {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), 'data', 'revoked_sessions.json');
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.revokedJtis) {
          for (const [jti, exp] of Object.entries(parsed.revokedJtis)) {
            revokeTokenInStore(jti, exp as number);
          }
        }
        if (parsed.userVersions) {
          for (const [userId, ver] of Object.entries(parsed.userVersions)) {
            if (globalThis.__railsync_revocation_state) {
              globalThis.__railsync_revocation_state.userVersions[userId] = ver as number;
            }
          }
        }
      }
    } catch {
      // Memory store is active
    }
  }

  private save(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      // Merge with existing disk file to prevent lost updates across concurrent workers
      const currentMem = globalThis.__railsync_revocation_state || { revokedJtis: {}, userVersions: {} };
      const mergedState = {
        revokedJtis: { ...currentMem.revokedJtis },
        userVersions: { ...currentMem.userVersions },
      };

      if (fs.existsSync(this.filePath)) {
        try {
          const raw = fs.readFileSync(this.filePath, 'utf-8');
          const disk = JSON.parse(raw);
          if (disk.revokedJtis) {
            mergedState.revokedJtis = { ...disk.revokedJtis, ...mergedState.revokedJtis };
          }
          if (disk.userVersions) {
            for (const [uid, ver] of Object.entries(disk.userVersions)) {
              mergedState.userVersions[uid] = Math.max(
                Number(ver) || 1,
                mergedState.userVersions[uid] || 1
              );
            }
          }
        } catch {
          // If disk read failed or was empty, proceed with memory state
        }
      }

      // Update global memory state with merged values
      if (globalThis.__railsync_revocation_state) {
        globalThis.__railsync_revocation_state.revokedJtis = mergedState.revokedJtis;
        globalThis.__railsync_revocation_state.userVersions = mergedState.userVersions;
      }

      // Atomic write via temp file + replace to prevent partial reads
      const tempPath = this.filePath + '.tmp.' + Math.random().toString(36).slice(2);
      fs.writeFileSync(tempPath, JSON.stringify(mergedState, null, 2), 'utf-8');
      try {
        if (fs.existsSync(this.filePath)) {
          fs.unlinkSync(this.filePath);
        }
        fs.renameSync(tempPath, this.filePath);
      } catch {
        fs.writeFileSync(this.filePath, JSON.stringify(mergedState, null, 2), 'utf-8');
        try { fs.unlinkSync(tempPath); } catch {}
      }
    } catch {
      // In-memory remains authoritative
    }
  }

  public revokeToken(jti: string, exp: number): void {
    revokeTokenInStore(jti, exp);
    this.save();
  }

  public isRevoked(jti: string): boolean {
    return isSessionRevoked(jti);
  }

  public getUserVersion(userId: string): number {
    return getUserSessionVersion(userId);
  }

  public bumpUserVersion(userId: string): void {
    bumpUserVersionInStore(userId);
    this.save();
  }

  public reload(): void {
    this.load();
  }
}

export const revocationRegistry = new SessionRevocationRegistry();



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

export async function createSessionToken(
  user: AuthenticatedUser,
  persistent: boolean
): Promise<{ token: string; expiresAt: Date; maxAgeSeconds: number; jti: string }> {
  const now = Math.floor(Date.now() / 1000);
  const maxAgeSeconds = persistent ? 7 * 24 * 3600 : 8 * 3600;
  const exp = now + maxAgeSeconds;
  const jti = crypto.randomUUID();
  const sessionVersion = revocationRegistry.getUserVersion(user.id);

  const payload: SessionPayload = {
    jti,
    sessionVersion,
    sub: user.id,
    user,
    iat: now,
    exp,
    persistent,
  };

  const enc = new TextEncoder();
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = base64UrlEncode(enc.encode(payloadJson));

  const key = await getHmacKey();
  const sigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  const sigB64 = base64UrlEncode(sigBuffer);

  const token = payloadB64 + '.' + sigB64;
  return {
    token,
    expiresAt: new Date(exp * 1000),
    maxAgeSeconds,
    jti,
  };
}

export function findOperatorByIdentifier(identifier: string): OperatorRecord | null {
  const norm = identifier.trim().toLowerCase();
  for (const acc of OPERATOR_ACCOUNTS) {
    if (acc.email.toLowerCase() === norm || acc.badgeId.toLowerCase() === norm) {
      return acc;
    }
  }
  return null;
}

export function buildAuthenticatedUser(account: OperatorRecord): AuthenticatedUser {
  return {
    id: account.id,
    badgeId: account.badgeId,
    email: account.email,
    name: account.name,
    role: account.role,
    division: account.division,
    stationCode: account.stationCode,
    accessTier: account.accessTier,
    permissions: ROLE_PERMISSIONS[account.role],
  };
}

export function generateJavaBackendHeaders(user?: AuthenticatedUser): Record<string, string> {
  const backendSecret = getBackendSecret();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + backendSecret,
  };
  if (user) {
    headers['X-RailSync-User'] = user.badgeId;
    headers['X-RailSync-Role'] = user.role;
  }
  return headers;
}
