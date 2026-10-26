import { NextResponse } from 'next/server';

export function getJavaBackendUrl(): string {
  // Server-only environment variable with fallback
  return process.env.RAILSYNC_JAVA_API_URL || 'http://localhost:8080';
}

export function backendUnavailableResponse(url: string, error?: unknown) {
  return NextResponse.json(
    {
      error: 'BACKEND_UNAVAILABLE',
      message: 'RailSync Java in-memory simulator is unreachable at ' + url + '. Ensure RailSyncServer is running.',
      tier: 'Tier 1 (Java In-Memory)',
      details: error instanceof Error ? error.message : undefined,
    },
    { status: 503 }
  );
}
