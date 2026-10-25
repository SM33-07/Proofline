'use client';

import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';

export function LandingFooter() {
  return (
    <footer className="border-t border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] py-12 text-xs font-mono text-[#5E6059] dark:text-[#A39F93] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group" aria-label="RailSync Home">
            <RailSyncLogo variant="compact" size="xs" />
            <span className="text-[#D9D0C1] dark:text-[#353731]">•</span>
            <span className="text-[11px] text-[#5E6059] dark:text-[#A39F93]">
              Railway Operations & Concurrency Integrity Platform
            </span>
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-xs font-mono">
            <Link href="/demo" className="text-[#E9663B] dark:text-[#F0784D] hover:underline font-bold">
              Simulator Access
            </Link>
            <Link href="/app/bookings" className="hover:text-[#242521] dark:hover:text-[#F0E9DC] transition-colors">
              Bookings Ledger
            </Link>
            <Link href="/app/inventory" className="hover:text-[#242521] dark:hover:text-[#F0E9DC] transition-colors">
              Fleet Capacity
            </Link>
            <Link href="/app/audit" className="hover:text-[#242521] dark:hover:text-[#F0E9DC] transition-colors">
              Audit Specifications
            </Link>
          </div>
        </div>

        <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[11px] text-[#8C887D] dark:text-[#726F65]">
          <p>
            RailSync Prototype • Feature Branch: <code className="text-[#242521] dark:text-[#F0E9DC]">feature/m1.3-schema-consolidation</code> • Java Tier 1 & MySQL Tier 2 Isolated.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[#4A685F] dark:text-[#88A69A] flex items-center gap-1 font-bold">
              <Shield className="h-3.5 w-3.5" />
              Prototype Simulation Mode
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
