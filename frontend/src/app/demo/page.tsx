'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Building2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Layers,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { UserRole } from '@/lib/types';
import { ROLE_DEFINITIONS } from '@/lib/auth';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';

export default function DemoRoleSelectionPage() {
  const router = useRouter();
  const { userRole, setUserRole } = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>(userRole || 'Operations Controller');

  const handleEnterSimulator = () => {
    setUserRole(selectedRole);
    router.push('/app');
  };

  const rolesList: { role: UserRole; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'Operations Controller', icon: Activity },
    { role: 'Station Master', icon: Building2 },
    { role: 'Audit Inspector', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F4F0E7] dark:bg-[#171815] text-[#242521] dark:text-[#F0E9DC] transition-colors flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/80 dark:bg-[#242521]/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group" aria-label="RailSync Home">
          <RailSyncLogo variant="compact" size="sm" />
        </Link>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#E9663B] dark:text-[#F0784D] hover:underline transition-colors"
          >
            <span>Sign In to Operations</span>
          </Link>
          <span className="text-[#D9D0C1] dark:text-[#353731]">•</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#5E6059] dark:text-[#A39F93] hover:text-[#E9663B] dark:hover:text-[#F0784D] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Landing Page</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-16 w-full space-y-8">
        {/* Editorial Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9663B]/30 bg-[#E9663B]/10 px-3 py-1 text-xs font-mono font-semibold text-[#E9663B] dark:text-[#F0784D]">
            <Layers className="h-3.5 w-3.5" />
            <span className="uppercase tracking-wider">SIMULATOR ACCESS & PERSPECTIVE SELECTION</span>
          </div>
          <h1 className="font-display font-black uppercase tracking-tight text-4xl sm:text-5xl text-[#242521] dark:text-[#F0E9DC]">
            Select Simulation Perspective
          </h1>
          <p className="text-sm text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
            Configure your operations session context. Each perspective highlights a distinct operational workflow modeled against the canonical RailSync data contract.
          </p>
        </div>

        {/* Prototype Boundary Disclaimer Alert */}
        <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-mono font-bold text-[#E9663B] dark:text-[#F0784D]">
            <Info className="h-4 w-4 shrink-0" />
            <span className="uppercase tracking-wider">Prototype Architecture Notice: Simulation vs Real Authentication</span>
          </div>
          <p className="text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed pl-6">
            Role selection is an interactive simulation feature for testing user workflows and view hierarchies. It is <strong>not a security boundary</strong> and does not enforce cryptographic authorization. In production, authentication will be handled by a server-side IAM provider (OIDC/RBAC) with database-enforced privilege isolation.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {rolesList.map(({ role, icon: Icon }) => {
            const def = ROLE_DEFINITIONS[role];
            const isSelected = selectedRole === role;
            return (
              <div
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`cursor-pointer rounded-2xl border p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm relative ${
                  isSelected
                    ? 'border-[#E9663B] dark:border-[#F0784D] bg-[#FAF8F4] dark:bg-[#242521] ring-2 ring-[#E9663B]/20 dark:ring-[#F0784D]/20 shadow-md'
                    : 'border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/70 dark:bg-[#242521]/70 hover:border-[#E9663B]/40 dark:hover:border-[#F0784D]/40'
                }`}
              >
                {/* Selection indicator badge */}
                {isSelected && (
                  <div className="absolute top-4 right-4 rounded-full bg-[#E9663B] dark:bg-[#F0784D] text-white dark:text-[#171815] p-1 shadow-xs">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-xl p-2.5 border transition-colors ${
                        isSelected
                          ? 'border-[#E9663B]/40 bg-[#E9663B]/10 text-[#E9663B] dark:text-[#F0784D]'
                          : 'border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] text-[#5E6059] dark:text-[#A39F93]'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C887D] dark:text-[#726F65]">
                        {def.stationCode}
                      </span>
                      <h3 className="font-display font-bold text-lg uppercase tracking-wide text-[#242521] dark:text-[#F0E9DC]">
                        {role}
                      </h3>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-[#E9663B] dark:text-[#F0784D]">
                    {def.division}
                  </div>

                  <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                    {def.description}
                  </p>
                </div>

                {/* Simulated Scope & Permissions */}
                <div className="pt-3 border-t border-[#D9D0C1] dark:border-[#353731] space-y-2">
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase font-bold">
                    Simulated Scope
                  </div>
                  <div className="text-xs font-mono font-semibold text-[#242521] dark:text-[#F0E9DC]">
                    {def.scope}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {def.simulatedPermissions.map((perm) => (
                      <span
                        key={perm}
                        className="rounded bg-[#F4F0E7] dark:bg-[#171815] border border-[#D9D0C1] dark:border-[#353731] px-2 py-0.5 text-[10px] font-mono text-[#5E6059] dark:text-[#A39F93]"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enter CTA Action Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#D9D0C1] dark:border-[#353731]">
          <div className="flex items-center gap-2 text-xs font-mono text-[#5E6059] dark:text-[#A39F93]">
            <span className="h-2 w-2 rounded-full bg-[#4A685F] dark:bg-[#88A69A]" />
            <span>Active Perspective:</span>
            <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">{selectedRole}</span>
          </div>

          <button
            onClick={handleEnterSimulator}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-8 py-3 text-sm font-display font-extrabold uppercase tracking-wider text-white dark:text-[#171815] shadow-md hover:shadow-[0_4px_16px_rgba(233,102,59,0.35)] transition-all cursor-pointer"
          >
            <span>Enter Simulator Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#D9D0C1] dark:border-[#353731] py-4 text-center text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
        RailSync Simulation Prototype • Feature Branch: <code>feature/m1.3-schema-consolidation</code>
      </footer>
    </div>
  );
}
