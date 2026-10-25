import { UserRole } from './types';

/**
 * Authentication & Session Model
 *
 * PROTOTYPE ARCHITECTURE vs. PRODUCTION SPECIFICATION:
 * ----------------------------------------------------
 * 1. PROTOTYPE SIMULATION CONTEXT (Current Implementation):
 *    - Role selection (Operations Controller, Station Master, Audit Inspector)
 *      is a client-side simulation perspective used to test UI views and workflows.
 *    - It is NOT a security boundary and does NOT represent real authorization.
 *    - Selection is persisted to localStorage (railsync_role) for ergonomic demo review.
 *
 * 2. PROPOSED PRODUCTION AUTHENTICATION SPECIFICATION (Future Implementation):
 *    - Authentication must be handled by an enterprise IAM provider (e.g., OIDC / OAuth 2.0 / SAML)
 *      issuing cryptographically signed HttpOnly session cookies or JWTs.
 *    - User identity and role assignments must be resolved server-side from a dedicated
 *      directory or credentials store (separate from the canonical 15-table RailSync schema).
 *    - All API mutations (booking, cancellation, signal override) must enforce role-based
 *      access control (RBAC) in server middleware before executing transactions.
 *    - Relational database privileges must be enforced at the MySQL connection pool level
 *      (e.g., railsync_app vs railsync_audit vs railsync_admin as verified in R-15 preflight).
 *    - Client-side role selection dropdowns will be strictly prohibited in production.
 */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  division: string;
  stationCode: string;
  accessTier: 'SIMULATOR_READ_ONLY' | 'DISPATCHER_OPERATOR' | 'SYSTEM_AUDITOR';
  isDemoSession: true;
}

export const DEFAULT_DEMO_USER: SessionUser = {
  id: 'OP-4091',
  name: 'R. K. Verma',
  email: 'controller.ndls@railsync.internal',
  role: 'Operations Controller',
  division: 'Northern Railway',
  stationCode: 'NDLS',
  accessTier: 'SIMULATOR_READ_ONLY',
  isDemoSession: true,
};

export const ROLE_DEFINITIONS: Record<
  UserRole,
  {
    title: string;
    division: string;
    stationCode: string;
    description: string;
    scope: string;
    primaryViews: string[];
    simulatedPermissions: string[];
  }
> = {
  'Operations Controller': {
    title: 'Operations Controller',
    division: 'Northern Railway Control Room',
    stationCode: 'NDLS',
    description: 'Monitors mainline passenger throughput, rake capacity, and multi-corridor transit health across trunk lines.',
    scope: 'Network-wide corridor topology & active rakes',
    primaryViews: ['Dashboard', 'Train Inventory', 'Disruptions'],
    simulatedPermissions: ['Read fleet telemetry', 'Simulate hold orders', 'View capacity bounds'],
  },
  'Station Master': {
    title: 'Station Master',
    division: 'North Central Railway (Kanpur Division)',
    stationCode: 'CNB',
    description: 'Oversees platform berth allocations, local waitlist priority progression, and active signal cascade advisories.',
    scope: 'Division & station interlock operations',
    primaryViews: ['Bookings & Waitlist', 'Disruptions'],
    simulatedPermissions: ['Inspect PNR dossiers', 'Acknowledge caution orders', 'Review platform queues'],
  },
  'Audit Inspector': {
    title: 'Audit Inspector',
    division: 'Safety & Relational Invariant Wing',
    stationCode: 'HQ-AUDIT',
    description: 'Inspects relational consistency constraints, multi-threaded concurrency safety latches, and cancellation refund ledgers.',
    scope: 'Formal specification verification & transaction audit trail',
    primaryViews: ['Audit & Invariants', 'Bookings Ledger'],
    simulatedPermissions: ['Review INV-01 / INV-08 proofs', 'Inspect R-11/R-12 race logs', 'Export audit records'],
  },
};

export function getDemoSession(): SessionUser {
  if (typeof window !== 'undefined') {
    const savedRole = localStorage.getItem('railsync_role') as UserRole | null;
    if (savedRole && (savedRole in ROLE_DEFINITIONS)) {
      const def = ROLE_DEFINITIONS[savedRole];
      return {
        ...DEFAULT_DEMO_USER,
        role: savedRole,
        division: def.division,
        stationCode: def.stationCode,
      };
    }
  }
  return DEFAULT_DEMO_USER;
}
