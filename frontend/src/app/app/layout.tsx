import React, { Suspense } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shell/AppShell';
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  revocationRegistry,
} from '@/lib/auth-server';

async function SessionAuthGuard({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    redirect('/login?redirect=/app');
  }

  // Ensure registry is synchronized with persistent disk state in Node runtime
  revocationRegistry.reload();

  const session = await verifySessionToken(token);
  if (!session) {
    redirect('/login?redirect=/app&error=session_invalidated');
  }

  return <AppShell>{children}</AppShell>;
}

export default function OperationsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFCF7] dark:bg-[#191918]" />}>
      <SessionAuthGuard>{children}</SessionAuthGuard>
    </Suspense>
  );
}
