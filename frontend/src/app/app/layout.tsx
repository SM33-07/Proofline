import React from 'react';
import { AppShell } from '@/components/shell/AppShell';

export default function OperationsAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
