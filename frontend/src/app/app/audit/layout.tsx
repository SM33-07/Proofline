import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  revocationRegistry,
} from '@/lib/auth-server';

async function AuditAuthGuard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login?redirect=/app/audit');
  }

  revocationRegistry.reload();
  const session = await verifySessionToken(token);
  if (!session) {
    redirect('/login?redirect=/app/audit&error=session_invalidated');
  }

  if (session.user.role !== 'Audit Inspector') {
    redirect('/app?error=unauthorized_audit_access');
  }

  return <>{children}</>;
}

export default function AuditLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="p-6">Loading audit records...</div>}>
      <AuditAuthGuard>{children}</AuditAuthGuard>
    </Suspense>
  );
}
