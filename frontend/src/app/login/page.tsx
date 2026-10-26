import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthPage } from '@/components/ui/auth-page';

export const metadata: Metadata = {
  title: 'Sign In — RailSync Railway Operations Platform',
  description: 'Enterprise sign-in for the RailSync railway reservation and disruption simulator.',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4F0E7] dark:bg-[#171815]" />}>
      <AuthPage />
    </Suspense>
  );
}
