'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Sun,
  Moon,
  Clock,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';

interface HeaderProps {
  onMenuToggle: () => void;
}

export function OperationsHeader({ onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme, userRole } = useTheme();
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/90 dark:bg-[#242521]/90 px-4 sm:px-6 backdrop-blur-md transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="rounded-lg p-2 text-[#5E6059] hover:bg-[#F4F0E7] dark:text-[#A39F93] dark:hover:bg-[#171815] lg:hidden cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs font-mono font-semibold uppercase text-[#5E6059] dark:text-[#A39F93]">
            Operations Console
          </span>
          <span className="hidden sm:inline text-[#D9D0C1] dark:text-[#353731] font-mono">•</span>
          <div className="flex items-center gap-1.5 rounded-full border border-[#E9663B]/30 bg-[#E9663B]/10 px-2.5 py-0.5 text-[11px] font-mono font-bold text-[#E9663B] dark:text-[#F0784D]">
            <Sparkles className="h-3 w-3" />
            <span>DEMO SIMULATION</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-2.5 py-1 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
          <Clock className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
          <span suppressHydrationWarning>{timeStr || '--:--:--'} IST</span>
        </div>

        {/* Invariant Health Status Target */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#4A685F]/30 bg-[#4A685F]/10 px-2.5 py-1 text-[11px] font-mono text-[#4A685F] dark:text-[#88A69A]">
          <Shield className="h-3 w-3 text-[#4A685F] dark:text-[#88A69A]" />
          <span>INV-01 / INV-08: TARGET BOUNDS</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-1.5 text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:border-[#E9663B]/40 transition-colors shadow-xs cursor-pointer"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4 text-[#F0784D]" />
          ) : (
            <Moon className="h-4 w-4 text-[#242521]" />
          )}
        </button>

        {/* Role Tag & Link to Switch */}
        <Link
          href="/demo"
          className="flex items-center gap-2 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-2.5 py-1 hover:border-[#E9663B]/40 transition-colors"
          title="Click to switch simulation role perspective"
        >
          <div className="h-2 w-2 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
          <span className="text-xs font-mono font-semibold text-[#242521] dark:text-[#F0E9DC]">{userRole}</span>
        </Link>
      </div>
    </header>
  );
}
