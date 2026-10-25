'use client';

import React, { useState } from 'react';
import { CompactSidebar } from './CompactSidebar';
import { OperationsHeader } from './OperationsHeader';
import { MotionFade } from '@/components/ui/MotionWrapper';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F0E7] dark:bg-[#171815] text-[#242521] dark:text-[#F0E9DC] font-sans antialiased selection:bg-[#E9663B] selection:text-white transition-colors">
      <CompactSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <OperationsHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 bg-[#F4F0E7] dark:bg-[#171815] transition-colors">
          <MotionFade className="mx-auto max-w-7xl">
            {children}
          </MotionFade>
        </main>
      </div>
    </div>
  );
}
