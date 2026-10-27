import { NextResponse } from 'next/server';
import {
  pingDatabase,
  getMysqlInventory,
  createMysqlBooking,
  cancelMysqlBooking,
  getMysqlBookings,
  evaluateMysqlRefund,
  DisruptionCasePayload,
} from './mysql-backend';
import { generateJavaBackendHeaders, AuthenticatedUser } from './auth-server';

export type BackendMode = 'memory' | 'mysql';

export function getBackendMode(): BackendMode {
  const mode = (process.env.RAILSYNC_BACKEND || 'memory').trim().toLowerCase();
  if (mode === 'memory' || mode === 'mysql') {
    return mode as BackendMode;
  }
  throw new Error(`UNSUPPORTED_BACKEND_MODE: Invalid RAILSYNC_BACKEND '${process.env.RAILSYNC_BACKEND}'. Must be 'memory' or 'mysql'.`);
}

export function getJavaBackendUrl(): string {
  const url = process.env.RAILSYNC_JAVA_BACKEND_URL || process.env.RAILSYNC_JAVA_API_URL || 'http://localhost:8080'; return url.trim();
}

export function backendUnavailableResponse(mode: BackendMode, details?: unknown) {
  const isMysql = mode === 'mysql';
  return NextResponse.json(
    {
      error: 'BACKEND_UNAVAILABLE',
      message: isMysql
        ? 'RailSync MySQL 8 backend is unreachable. Verify MySQL service connectivity.'
        : `RailSync Java in-memory simulator is unreachable at ${getJavaBackendUrl()}. Ensure RailSyncServer is running.`,
      tier: isMysql ? 'Tier 2 (MySQL 8 InnoDB)' : 'Tier 1 (Java In-Memory)',
      details: details instanceof Error ? details.message : undefined,
    },
    { status: 503 }
  );
}

interface AppError {
  status?: number;
  error?: string;
  message?: string;
  invariant?: string;
}

function getAppError(err: unknown): AppError | null {
  if (typeof err === 'object' && err !== null) {
    return err as AppError;
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. HEALTH DISPATCHER
// ---------------------------------------------------------------------------

export async function handleGetHealth(): Promise<NextResponse> {
  let mode: BackendMode;
  try {
    mode = getBackendMode();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid backend configuration';
    return NextResponse.json(
      {
        status: 'DOWN',
        error: 'UNSUPPORTED_BACKEND_MODE',
        message: msg,
        frontend: 'UP',
      },
      { status: 500 }
    );
  }

  if (mode === 'mysql') {
    const ping = await pingDatabase();
    if (!ping.ok) {
      return NextResponse.json(
        {
          status: 'DOWN',
          backend: 'mysql',
          tier: 'Tier 2 (MySQL 8 InnoDB)',
          frontend: 'UP',
          database: {
            status: 'DOWN',
            error: ping.error || 'Database ping failed',
          },
        },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    return NextResponse.json(
      {
        status: 'UP',
        backend: 'mysql',
        tier: 'Tier 2 (MySQL 8 InnoDB)',
        frontend: 'UP',
        database: {
          status: 'UP',
          engine: 'MySQL 8.0',
          database: ping.database,
        },
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }

  // mode === 'memory' -> Probe Java backend at 8080
  const javaUrl = getJavaBackendUrl();
  try {
    const res = await fetch(`${javaUrl}/api/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        {
          status: 'DOWN',
          backend: 'memory',
          tier: 'Tier 1 (Java In-Memory)',
          frontend: 'UP',
          javaBackend: {
            status: 'DOWN',
            statusCode: res.status,
          },
        },
        { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
      );
    }

    const data = await res.json();
    return NextResponse.json(
      {
        status: 'UP',
        backend: 'memory',
        tier: 'Tier 1 (Java In-Memory)',
        frontend: 'UP',
        javaBackend: data,
      },
      { status: 200, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        status: 'DOWN',
        backend: 'memory',
        tier: 'Tier 1 (Java In-Memory)',
        frontend: 'UP',
        javaBackend: {
          status: 'DOWN',
          error: err instanceof Error ? err.message : 'Java simulator connection failed',
        },
      },
      { status: 503, headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  }
}

// ---------------------------------------------------------------------------
// 2. INVENTORY DISPATCHER
// ---------------------------------------------------------------------------

export async function handleGetInventory(
  journeyClassId?: number,
  user?: AuthenticatedUser
): Promise<NextResponse> {
  const mode = getBackendMode();

  if (mode === 'mysql') {
    try {
      const data = await getMysqlInventory(journeyClassId);
      return NextResponse.json(data, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    } catch (err: unknown) {
      const appErr = getAppError(err);
      if (appErr && appErr.status) {
        return NextResponse.json({ error: appErr.error, message: appErr.message }, { status: appErr.status });
      }
      return backendUnavailableResponse('mysql', err);
    }
  }

  // mode === 'memory'
  const javaUrl = getJavaBackendUrl();
  const targetUrl = journeyClassId
    ? `${javaUrl}/api/inventory?journeyClassId=${journeyClassId}`
    : `${javaUrl}/api/inventory`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: user ? generateJavaBackendHeaders(user) : undefined,
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      status: upstreamRes.status,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    return backendUnavailableResponse('memory', err);
  }
}

// ---------------------------------------------------------------------------
// 3. BOOKINGS DISPATCHER (GET & POST)
// ---------------------------------------------------------------------------

export async function handleGetBookings(
  searchParams: URLSearchParams,
  user?: AuthenticatedUser
): Promise<NextResponse> {
  const mode = getBackendMode();

  if (mode === 'mysql') {
    try {
      const pnr = searchParams.get('pnr') || undefined;
      const idParam = searchParams.get('id');
      const id = idParam ? parseInt(idParam, 10) : undefined;
      const data = await getMysqlBookings(pnr, id);
      return NextResponse.json(data, {
        status: 200,
        headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
      });
    } catch (err: unknown) {
      const appErr = getAppError(err);
      if (appErr && appErr.status) {
        return NextResponse.json({ error: appErr.error, message: appErr.message }, { status: appErr.status });
      }
      return backendUnavailableResponse('mysql', err);
    }
  }

  // mode === 'memory'
  const javaUrl = getJavaBackendUrl();
  const qs = searchParams.toString();
  const targetUrl = qs ? `${javaUrl}/api/bookings?${qs}` : `${javaUrl}/api/bookings`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: 'GET',
      headers: user ? generateJavaBackendHeaders(user) : undefined,
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, {
      status: upstreamRes.status,
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    });
  } catch (err) {
    return backendUnavailableResponse('memory', err);
  }
}

export interface CreateBookingPayload {
  journeyClassId?: number;
  passengerId?: number;
  groupRef?: string | null;
}

export async function handleCreateBooking(
  body: CreateBookingPayload,
  user?: AuthenticatedUser
): Promise<NextResponse> {
  const mode = getBackendMode();

  if (mode === 'mysql') {
    const journeyClassId = Number(body?.journeyClassId);
    const passengerId = Number(body?.passengerId);
    const groupRef = body?.groupRef ? String(body.groupRef) : null;

    if (!journeyClassId || journeyClassId <= 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: "Field 'journeyClassId' is required and must be positive." },
        { status: 400 }
      );
    }
    if (!passengerId || passengerId <= 0) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: "Field 'passengerId' is required and must be positive." },
        { status: 400 }
      );
    }

    try {
      const result = await createMysqlBooking(journeyClassId, passengerId, groupRef);
      return NextResponse.json(result, { status: 201 });
    } catch (err: unknown) {
      const appErr = getAppError(err);
      if (appErr && appErr.status) {
        return NextResponse.json(
          { error: appErr.error, message: appErr.message, invariant: appErr.invariant },
          { status: appErr.status }
        );
      }
      return backendUnavailableResponse('mysql', err);
    }
  }

  // mode === 'memory'
  const javaUrl = getJavaBackendUrl();
  try {
    const upstreamRes = await fetch(`${javaUrl}/api/bookings`, {
      method: 'POST',
      headers: {
        ...(user ? generateJavaBackendHeaders(user) : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    return backendUnavailableResponse('memory', err);
  }
}

// ---------------------------------------------------------------------------
// 4. CANCEL DISPATCHER
// ---------------------------------------------------------------------------

export interface CancelBookingPayload {
  pnr?: string;
}

export async function handleCancelBooking(
  body: CancelBookingPayload,
  user?: AuthenticatedUser
): Promise<NextResponse> {
  const mode = getBackendMode();

  if (mode === 'mysql') {
    const pnr = body?.pnr ? String(body.pnr).trim() : '';
    if (!pnr) {
      return NextResponse.json(
        { error: 'VALIDATION_FAILED', message: "Field 'pnr' is required." },
        { status: 400 }
      );
    }

    try {
      const result = await cancelMysqlBooking(pnr);
      return NextResponse.json(result, { status: 200 });
    } catch (err: unknown) {
      const appErr = getAppError(err);
      if (appErr && appErr.status) {
        return NextResponse.json(
          { error: appErr.error, message: appErr.message, invariant: appErr.invariant },
          { status: appErr.status }
        );
      }
      return backendUnavailableResponse('mysql', err);
    }
  }

  // mode === 'memory'
  const javaUrl = getJavaBackendUrl();
  try {
    const upstreamRes = await fetch(`${javaUrl}/api/bookings/cancel`, {
      method: 'POST',
      headers: {
        ...(user ? generateJavaBackendHeaders(user) : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    return backendUnavailableResponse('memory', err);
  }
}

// ---------------------------------------------------------------------------
// 5. REFUND EVALUATE DISPATCHER
// ---------------------------------------------------------------------------

export async function handleEvaluateRefund(
  body: DisruptionCasePayload,
  user?: AuthenticatedUser
): Promise<NextResponse> {
  const mode = getBackendMode();

  if (mode === 'mysql') {
    try {
      const result = await evaluateMysqlRefund(body);
      return NextResponse.json(result, { status: 200 });
    } catch (err: unknown) {
      const appErr = getAppError(err);
      if (appErr && appErr.status) {
        return NextResponse.json({ error: appErr.error, message: appErr.message }, { status: appErr.status });
      }
      return backendUnavailableResponse('mysql', err);
    }
  }

  // mode === 'memory'
  const javaUrl = getJavaBackendUrl();
  try {
    const upstreamRes = await fetch(`${javaUrl}/api/refund/evaluate`, {
      method: 'POST',
      headers: {
        ...(user ? generateJavaBackendHeaders(user) : {}),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await upstreamRes.json();
    return NextResponse.json(data, { status: upstreamRes.status });
  } catch (err) {
    return backendUnavailableResponse('memory', err);
  }
}

export type { DisruptionCasePayload };


