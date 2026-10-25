'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  AlertTriangle,
  TrainTrack,
  ShieldCheck,
  Server,
  UserCheck,
  X,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { UserRole } from '@/lib/types';
import { DEFAULT_DEMO_USER } from '@/lib/auth';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/app', icon: LayoutDashboard },
  { name: 'Bookings & Waitlist', href: '/app/bookings', icon: Ticket, badge: '142 WL' },
  { name: 'Train Inventory', href: '/app/inventory', icon: TrainTrack },
  { name: 'Disruptions', href: '/app/disruptions', icon: AlertTriangle, badgeAlert: '3 Active' },
  { name: 'Audit & Invariants', href: '/app/audit', icon: ShieldCheck, badgeSuccess: 'INV-08' },
];

const ROLES: UserRole[] = [
  'Operations Controller',
  'Station Master',
  'Audit Inspector',
];

export function CompactSidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { userRole, setUserRole } = useTheme();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-0 max-lg:-translate-x-full'
        }`}
      >
        {/* Top Header with Clickable Logo navigating to / */}
        <div className="flex h-16 items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] px-4">
          <Link
            href="/"
            className="flex items-center gap-2 group"
            onClick={onClose}
            aria-label="RailSync Home"
          >
            <RailSyncLogo variant="compact" size="sm" />
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5E6059] hover:bg-[#F4F0E7] dark:text-[#A39F93] dark:hover:bg-[#171815] lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Operational Views Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#8C887D] dark:text-[#726F65] font-mono">
              Operational Views
            </div>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs font-mono font-medium transition-all ${
                      isActive
                        ? 'bg-[#E9663B]/10 dark:bg-[#F0784D]/15 text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/30 dark:border-[#F0784D]/35 shadow-xs'
                        : 'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`h-4 w-4 transition-colors ${
                          isActive
                            ? 'text-[#E9663B] dark:text-[#F0784D]'
                            : 'text-[#8C887D] group-hover:text-[#242521] dark:group-hover:text-[#F0E9DC]'
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-[#E6DFD3] dark:bg-[#171815] px-2 py-0.5 text-[10px] font-mono text-[#5E6059] dark:text-[#A39F93] border border-[#D9D0C1] dark:border-[#353731]">
                        {item.badge}
                      </span>
                    )}
                    {item.badgeAlert && (
                      <span className="rounded-full bg-[#C83C2A]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#C83C2A] dark:text-[#F45846] border border-[#C83C2A]/30">
                        {item.badgeAlert}
                      </span>
                    )}
                    {item.badgeSuccess && (
                      <span className="rounded-full bg-[#4A685F]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30">
                        {item.badgeSuccess}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Simulation Role Selector */}
          <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-4">
            <div className="mb-2 flex items-center justify-between px-3">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C887D] dark:text-[#726F65] font-mono flex items-center gap-1.5">
                <UserCheck className="h-3 w-3 text-[#E9663B] dark:text-[#F0784D]" />
                Simulator Perspective
              </span>
              <Link
                href="/demo"
                className="text-[10px] font-mono text-[#E9663B] dark:text-[#F0784D] hover:underline flex items-center gap-0.5"
                title="Manage simulation role & context"
              >
                <span>Roles</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </Link>
            </div>
            <div className="space-y-1">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRole(role)}
                  className={`w-full text-left rounded-lg px-3 py-1.5 text-xs font-mono transition-colors flex items-center justify-between cursor-pointer ${
                    userRole === role
                      ? 'bg-[#E9663B]/10 dark:bg-[#F0784D]/15 text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/30'
                      : 'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
                  }`}
                >
                  <span>{role}</span>
                  {userRole === role && (
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User Context & Sandbox Tag */}
        <div className="border-t border-[#D9D0C1] dark:border-[#353731] p-3 bg-[#F4F0E7]/60 dark:bg-[#171815]/60">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-2.5 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-bold font-mono text-xs border border-[#E9663B]/30">
              RV
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#242521] dark:text-[#F0E9DC] truncate">{DEFAULT_DEMO_USER.name}</p>
              <p className="text-[10px] text-[#5E6059] dark:text-[#A39F93] font-mono truncate">{userRole}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] px-1">
            <span className="flex items-center gap-1">
              <Server className="h-3 w-3 text-[#4A685F] dark:text-[#88A69A]" />
              Isolated Backend
            </span>
            <span className="text-[#C57613] dark:text-[#E6962C] font-semibold">Demo Sandbox</span>
          </div>
        </div>
      </aside>
    </>
  );
}
