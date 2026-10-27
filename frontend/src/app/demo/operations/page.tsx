'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
  ArrowRight,
  Check,
  Sparkles,
  Sun,
  Moon,
  Train,
  Users,
  Radio,
  FileCheck2,
  RefreshCw,
  LogOut,
  User,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { UserRole } from '@/lib/types';
import { ROLE_DEFINITIONS } from '@/lib/auth';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RailwayNetworkMap } from '@/components/network/RailwayNetworkMap';
import {
  JOURNEYS,
  BOOKINGS,
  AUDIT_LOGS,
} from '@/lib/mock-data';

function DemoOperationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme, userRole, setUserRole } = useTheme();

  // Read role from query param, falling back to ThemeContext or default
  const queryRole = searchParams.get('role') as UserRole | null;
  const initialRole: UserRole =
    queryRole && queryRole in ROLE_DEFINITIONS
      ? queryRole
      : userRole && userRole in ROLE_DEFINITIONS
      ? userRole
      : 'Operations Controller';

  const [activeRole, setActiveRole] = useState<UserRole>(initialRole);
  const [timeStr, setTimeStr] = useState<string>('');
  const [simulatedFeedback, setSimulatedFeedback] = useState<string | null>(null);
  const [manifestFilter, setManifestFilter] = useState<'ALL' | 'CONFIRMED' | 'RAC' | 'WAITLIST'>('ALL');
  const [lastVerificationTime, setLastVerificationTime] = useState<string>('2026-10-25 17:00:00 IST');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Sync role changes with theme context and query params without page reload
  const handleRoleSwitch = (newRole: UserRole) => {
    setActiveRole(newRole);
    setUserRole(newRole);
    router.replace(`/demo/operations?role=${encodeURIComponent(newRole)}`, { scroll: false });
  };

  // Simulated live IST clock
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

  // Clear simulated feedback toast
  useEffect(() => {
    if (simulatedFeedback) {
      const timer = setTimeout(() => setSimulatedFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [simulatedFeedback]);

  // Handle client-side simulated invariant audit run (no API calls)
  const handleSimulateVerification = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      const now = new Date();
      const formatted = `${now.toISOString().replace('T', ' ').substring(0, 19)} IST`;
      setLastVerificationTime(formatted);
      setSimulatedFeedback(
        'Formal Invariant Assertion Complete: Verified INV-01 (Capacity Bounds) and INV-08 (Unique Active Booking) across all 5 journeys with 100.0% compliance.'
      );
    }, 400);
  };

  const roleDef = ROLE_DEFINITIONS[activeRole];

  const rolesConfig: { role: UserRole; icon: React.ComponentType<{ className?: string }> }[] = [
    { role: 'Operations Controller', icon: Activity },
    { role: 'Station Master', icon: Building2 },
    { role: 'Audit Inspector', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-[#F4F0E7] dark:bg-[#171815] text-[#242521] dark:text-[#F0E9DC] transition-colors flex flex-col justify-between">
      {/* 1. Prominent Top Demo Mode Banner */}
      <div className="bg-[#E9663B] dark:bg-[#F0784D] text-white dark:text-[#171815] px-4 py-2 font-mono text-xs font-bold tracking-wider uppercase text-center flex items-center justify-center gap-2 shadow-xs">
        <Sparkles className="h-4 w-4 shrink-0" />
        <span>DEMO MODE — SIMULATED DATA — READ ONLY</span>
        <span className="hidden md:inline">• Standalone Showcase (No backend service or credentials required)</span>
      </div>

      {/* 2. Top Header Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/90 dark:bg-[#242521]/90 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Perspective indicator */}
          <div className="flex items-center justify-between md:justify-start gap-3">
            <Link href="/" className="flex items-center gap-2 group" aria-label="RailSync Home">
              <RailSyncLogo variant="compact" size="sm" />
            </Link>

            <span className="text-[#D9D0C1] dark:text-[#353731] font-mono">•</span>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-[#5E6059] dark:text-[#A39F93]">
                Operations Showcase
              </span>
              <span className="rounded-full border border-[#E9663B]/30 bg-[#E9663B]/10 px-2 py-0.5 text-[10px] font-mono font-bold text-[#E9663B] dark:text-[#F0784D]">
                SIMULATED
              </span>
            </div>
          </div>

          {/* Role Switcher Tabs */}
          <div className="flex items-center justify-center gap-1.5 p-1 rounded-xl bg-[#E6DFD3]/60 dark:bg-[#171815] border border-[#D9D0C1] dark:border-[#353731] overflow-x-auto">
            {rolesConfig.map(({ role, icon: Icon }) => {
              const isSelected = activeRole === role;
              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-[#FAF8F4] dark:bg-[#242521] text-[#E9663B] dark:text-[#F0784D] shadow-xs border border-[#D9D0C1]/50 dark:border-[#353731]'
                      : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
                  }`}
                  aria-label={`Switch to ${role} perspective`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{role}</span>
                </button>
              );
            })}
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center justify-end gap-3">
            {/* Clock */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-2.5 py-1 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
              <Clock className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
              <span suppressHydrationWarning>{timeStr || '--:--:--'} IST</span>
            </div>

            {/* Offline Mock Status */}
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#4A685F]/30 bg-[#4A685F]/10 px-2 py-1 text-[11px] font-mono font-bold text-[#4A685F] dark:text-[#88A69A]"
              title="Autonomous Demo Fixtures: Completely operational without Java, MySQL, or Supabase"
            >
              <div className="h-2 w-2 rounded-full bg-[#4A685F] dark:bg-[#88A69A] animate-pulse motion-reduce:animate-none" />
              <span>SYNTHETIC FIXTURES ACTIVE</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-1.5 text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:border-[#E9663B]/40 transition-colors shadow-xs cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-[#F0784D]" /> : <Moon className="h-4 w-4 text-[#242521]" />}
            </button>

            {/* Exit Demo button */}
            <Link
              href="/demo"
              className="flex items-center gap-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] px-2.5 py-1.5 text-xs font-mono font-semibold text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:border-[#E9663B]/40 transition-colors shadow-xs"
              title="Return to Demo Role Selection"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Exit Demo</span>
            </Link>

            {/* Link to Real Operator Sign In */}
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-[#E9663B]/40 bg-[#E9663B]/10 px-3 py-1.5 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:bg-[#E9663B]/20 transition-colors shadow-xs"
              title="Sign in with verified operator credentials"
            >
              <User className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Operator Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Main Showcase Canvas */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 py-6 w-full space-y-6">
        {/* Feedback Alert Toast (Simulated Action) */}
        {simulatedFeedback && (
          <div className="rounded-xl border border-[#4A685F]/40 bg-[#4A685F]/15 dark:bg-[#88A69A]/20 p-3.5 text-xs font-mono text-[#3D564F] dark:text-[#88A69A] flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#4A685F] dark:text-[#88A69A]" />
              <span>{simulatedFeedback}</span>
            </div>
            <button
              onClick={() => setSimulatedFeedback(null)}
              className="font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Active Perspective Context Strip */}
        <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-5 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[#E9663B]/10 text-[#E9663B] dark:text-[#F0784D] border border-[#E9663B]/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                  {roleDef.stationCode}
                </span>
                <span className="text-xs font-mono text-[#5E6059] dark:text-[#A39F93]">
                  {roleDef.division}
                </span>
                <span className="text-[#D9D0C1] dark:text-[#353731] font-mono">•</span>
                <span className="text-xs font-mono font-semibold text-[#4A685F] dark:text-[#88A69A]">
                  Active Simulated Perspective
                </span>
              </div>
              <h1 className="font-display font-black uppercase tracking-tight text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">
                {roleDef.title} Workspace
              </h1>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans max-w-3xl">
                {roleDef.description}
              </p>
            </div>

            {/* Simulated Permissions Badge List */}
            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase font-bold">
                Simulated Perspective Scope
              </span>
              <div className="flex flex-wrap gap-1.5">
                {roleDef.simulatedPermissions.map((perm) => (
                  <span
                    key={perm}
                    className="rounded bg-[#F4F0E7] dark:bg-[#171815] border border-[#D9D0C1] dark:border-[#353731] px-2.5 py-1 text-[11px] font-mono text-[#5E6059] dark:text-[#A39F93]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* ROLE 1: OPERATIONS CONTROLLER SHOWCASE                        */}
        {/* ============================================================== */}
        {activeRole === 'Operations Controller' && (
          <div className="space-y-6">
            {/* Top Incident Advisory Banner */}
            <div className="relative overflow-hidden rounded-2xl border border-[#C83C2A]/30 bg-gradient-to-r from-[#C83C2A]/10 via-[#FAF8F4] to-[#FAF8F4] dark:from-[#F45846]/15 dark:via-[#242521] dark:to-[#242521] p-4 backdrop-blur-md shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#C83C2A]/15 dark:bg-[#F45846]/20 p-2 text-[#C83C2A] dark:text-[#F45846] border border-[#C83C2A]/30 animate-pulse motion-reduce:animate-none">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#C83C2A] dark:text-[#F45846]">
                        Simulated Incident Advisory C-01
                      </span>
                      <StatusBadge status="ACTIVE" size="sm" />
                    </div>
                    <p className="text-sm font-bold text-[#242521] dark:text-[#F0E9DC] mt-0.5">
                      Interlocking Signal Malfunction at Kanpur Central (CNB) Outer
                    </p>
                    <p className="text-xs text-[#5E6059] dark:text-[#A39F93] mt-0.5 font-sans">
                      Train 12301 delayed +45m. Manual pilot caution orders active. Downstream cascade propagating to PRYJ.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSimulatedFeedback(
                        'Simulated Action Dispatched: Caution Order C-01 issued for Train 12301 at CNB Outer. No operational database altered.'
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#C83C2A]/35 bg-[#C83C2A]/10 px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#C83C2A] dark:text-[#F45846] hover:bg-[#C83C2A]/20 transition-colors shrink-0 cursor-pointer"
                  >
                    <span>Simulate Hold Order</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Total Bookings"
                value="248"
                subtitle="Simulated load dataset"
                icon={Activity}
                accentColor="orange"
                trendValue="+12% from last run"
                trendType="positive"
              />
              <KpiCard
                title="Confirmed Seats"
                value="1,842"
                subtitle="78% of fleet capacity"
                icon={Users}
                accentColor="green"
                trendValue="78% Capacity"
                trendType="positive"
              />
              <KpiCard
                title="Waitlist Entries"
                value="286"
                subtitle="Priority queues active"
                icon={Clock}
                accentColor="amber"
                trendValue="+5% queue length"
                trendType="alert"
              />
              <KpiCard
                title="Active Disruptions"
                value="3"
                subtitle="Simulation mode"
                icon={AlertTriangle}
                accentColor="rose"
                trendValue="SIMULATION"
                trendType="negative"
              />
            </div>

            {/* 2-Column Section: Schematic Map + Train Services & Activity */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <RailwayNetworkMap />
              </div>

              <div className="lg:col-span-5 space-y-6">
                {/* Train Services Corridor Table */}
                <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
                    <div className="flex items-center gap-2">
                      <Train className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                      <h3 className="font-display font-bold text-base tracking-wide text-[#242521] dark:text-[#F0E9DC] uppercase">
                        Train Services
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65]">
                      5 Scheduled
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="border-b border-[#D9D0C1] dark:border-[#353731] text-[#8C887D] dark:text-[#726F65] uppercase text-[10px]">
                        <tr>
                          <th className="pb-2">Train</th>
                          <th className="pb-2">Route</th>
                          <th className="pb-2 text-right">Occupancy</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E6DFD3] dark:divide-[#272823]">
                        {JOURNEYS.map((j) => (
                          <tr key={j.journeyId} className="hover:bg-[#F4F0E7]/60 dark:hover:bg-[#171815]/60 transition-colors">
                            <td className="py-2.5 font-bold text-[#242521] dark:text-[#F0E9DC]">
                              <div>{j.trainNumber}</div>
                              <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93] font-sans font-normal truncate max-w-[100px]">
                                {j.trainName.split(' ')[0]}
                              </div>
                            </td>
                            <td className="py-2.5 text-[#5E6059] dark:text-[#A39F93]">
                              <span className="text-[#E9663B] dark:text-[#F0784D] font-bold">{j.sourceStation}</span>
                              <span className="mx-1">→</span>
                              <span>{j.destStation}</span>
                            </td>
                            <td className="py-2.5 text-right">
                              <div className="inline-flex flex-col items-end gap-1">
                                <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">{j.occupancyPct}%</span>
                                <div className="w-16 h-1.5 rounded-full bg-[#E6DFD3] dark:bg-[#171815] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      j.occupancyPct >= 95
                                        ? 'bg-[#C83C2A] dark:bg-[#F45846]'
                                        : j.occupancyPct >= 85
                                        ? 'bg-[#4A685F] dark:bg-[#88A69A]'
                                        : 'bg-[#E9663B] dark:bg-[#F0784D]'
                                    }`}
                                    style={{ width: `${Math.min(j.occupancyPct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Operations Feed */}
                <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <h3 className="font-display font-bold text-base tracking-wide text-[#242521] dark:text-[#F0E9DC] uppercase">
                        Recent Activity (Simulated)
                      </h3>
                    </div>
                  </div>

                  <div className="space-y-2.5 font-mono text-xs">
                    {AUDIT_LOGS.slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="rounded-xl border border-[#E6DFD3] dark:border-[#272823] bg-[#F4F0E7]/60 dark:bg-[#171815]/60 p-2.5 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">
                            {entry.operation.replace('_', ' ')}
                          </span>
                          <span suppressHydrationWarning className="text-[10px] text-[#8C887D] dark:text-[#726F65]">
                            {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#5E6059] dark:text-[#A39F93] font-sans line-clamp-1">
                          {entry.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ROLE 2: STATION MASTER SHOWCASE                                */}
        {/* ============================================================== */}
        {activeRole === 'Station Master' && (
          <div className="space-y-6">
            {/* Station Status Header Card */}
            <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#E9663B]/10 p-2.5 text-[#E9663B] dark:text-[#F0784D] border border-[#E9663B]/30">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xl text-[#242521] dark:text-[#F0E9DC]">
                        Kanpur Central [CNB]
                      </span>
                      <StatusBadge status="ACTIVE" size="sm" />
                    </div>
                    <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-mono">
                      North Central Railway Division • 10 Platforms • Relay Interlock Room Active
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setSimulatedFeedback(
                        'Simulated Action: Station public address announcement dispatched for Train 12301 platform 4 arrival.'
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E9663B]/35 bg-[#E9663B]/10 px-3.5 py-2 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:bg-[#E9663B]/20 transition-colors cursor-pointer"
                  >
                    <Radio className="h-3.5 w-3.5" />
                    <span>Broadcast Platform Announcement</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Station KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Departing Services"
                value="4"
                subtitle="Within current shift"
                icon={Train}
                accentColor="orange"
                trendValue="Nominal"
                trendType="positive"
              />
              <KpiCard
                title="Platform Berth Occ."
                value="96%"
                subtitle="CNB station quota"
                icon={Users}
                accentColor="green"
                trendValue="96% Capacity"
                trendType="positive"
              />
              <KpiCard
                title="Local Waitlist Queue"
                value="42"
                subtitle="CNB boarding quota"
                icon={Clock}
                accentColor="amber"
                trendValue="Priority WL-01"
                trendType="alert"
              />
              <KpiCard
                title="Signal Interlock"
                value="Caution"
                subtitle="Outer block caution"
                icon={AlertTriangle}
                accentColor="rose"
                trendValue="15 km/h"
                trendType="negative"
              />
            </div>

            {/* Passenger Manifest & Berth Allocation Table */}
            <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#D9D0C1] dark:border-[#353731] pb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-[#242521] dark:text-[#F0E9DC] uppercase tracking-wide">
                    Passenger Manifest & Allocation Ledger
                  </h3>
                  <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans">
                    Deterministic synthetic booking dossier used for station platform checking and waitlist reconciliation
                  </p>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#E6DFD3]/60 dark:bg-[#171815] border border-[#D9D0C1] dark:border-[#353731]">
                  {(['ALL', 'CONFIRMED', 'RAC', 'WAITLIST'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setManifestFilter(filter)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        manifestFilter === filter
                          ? 'bg-[#FAF8F4] dark:bg-[#242521] text-[#E9663B] dark:text-[#F0784D] shadow-xs'
                          : 'text-[#5E6059] dark:text-[#A39F93]'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-[#D9D0C1] dark:border-[#353731] text-[#8C887D] dark:text-[#726F65] uppercase text-[10px]">
                    <tr>
                      <th className="pb-2.5">PNR / Passenger</th>
                      <th className="pb-2.5">Train</th>
                      <th className="pb-2.5">Class / Coach / Berth</th>
                      <th className="pb-2.5">Status</th>
                      <th className="pb-2.5 text-right">Fare</th>
                      <th className="pb-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD3] dark:divide-[#272823]">
                    {BOOKINGS.filter((b) => manifestFilter === 'ALL' || b.status === manifestFilter).map((b) => (
                      <tr key={b.pnr} className="hover:bg-[#F4F0E7]/60 dark:hover:bg-[#171815]/60 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">{b.pnr}</div>
                          <div className="text-[11px] text-[#5E6059] dark:text-[#A39F93] font-sans">
                            {b.passengerName} ({b.passengerAge}{b.passengerGender})
                          </div>
                        </td>
                        <td className="py-3 text-[#5E6059] dark:text-[#A39F93]">
                          <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">{b.trainNumber}</div>
                          <div className="text-[10px]">{b.sourceStation} → {b.destStation}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">
                            {b.travelClass} {b.coach ? `• Coach ${b.coach}` : ''}
                          </div>
                          <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">
                            {b.berthNumber ? `Berth ${b.berthNumber} (${b.berthType})` : b.waitlistNumber ? `WL #${b.waitlistNumber}` : `RAC #${b.racNumber}`}
                          </div>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={b.status} size="sm" />
                        </td>
                        <td className="py-3 text-right font-bold text-[#242521] dark:text-[#F0E9DC]">
                          ₹{b.fareAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() =>
                              setSimulatedFeedback(
                                `Simulated Passenger Dossier Verification: PNR ${b.pnr} identity validated for ${b.passengerName}. Invariant checks passed.`
                              )
                            }
                            className="inline-flex items-center gap-1 rounded bg-[#F4F0E7] dark:bg-[#171815] border border-[#D9D0C1] dark:border-[#353731] px-2 py-1 text-[10px] font-mono hover:border-[#E9663B]/40 transition-colors cursor-pointer"
                          >
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* ROLE 3: AUDIT INSPECTOR SHOWCASE                               */}
        {/* ============================================================== */}
        {activeRole === 'Audit Inspector' && (
          <div className="space-y-6">
            {/* Relational Invariant Compliance Card */}
            <div className="rounded-2xl border border-[#4A685F]/40 bg-gradient-to-r from-[#4A685F]/10 via-[#FAF8F4] to-[#FAF8F4] dark:from-[#88A69A]/15 dark:via-[#242521] dark:to-[#242521] p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-[#4A685F]/15 dark:bg-[#88A69A]/20 p-2.5 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-xl text-[#242521] dark:text-[#F0E9DC]">
                        Relational Invariant Verification Engine
                      </span>
                      <StatusBadge status="PASS" size="sm" />
                    </div>
                    <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-mono">
                      Target Proof Suite: INV-01, INV-08, R-11 / R-12 Concurrency Latches • Last Run: {lastVerificationTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSimulateVerification}
                    disabled={isVerifying}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#4A685F] hover:bg-[#3D564F] dark:bg-[#88A69A] dark:hover:bg-[#77968A] px-4 py-2 text-xs font-display font-bold uppercase tracking-wider text-white dark:text-[#171815] transition-all cursor-pointer shadow-sm"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>{isVerifying ? 'Verifying...' : 'Run Invariant Verification'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Inspector KPIs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                title="Invariant Compliance"
                value="100.0%"
                subtitle="All formal proofs verified"
                icon={ShieldCheck}
                accentColor="green"
                trendValue="0 Anomalies"
                trendType="positive"
              />
              <KpiCard
                title="Concurrency Violations"
                value="0"
                subtitle="Cross-class thread safety"
                icon={Check}
                accentColor="green"
                trendValue="Safe"
                trendType="positive"
              />
              <KpiCard
                title="Verified Assertions"
                value="283+"
                subtitle="JUnit & MySQL test suites"
                icon={FileCheck2}
                accentColor="orange"
                trendValue="Passing"
                trendType="positive"
              />
              <KpiCard
                title="Audit Ledger Entries"
                value="5,072"
                subtitle="Immutable operation log"
                icon={Clock}
                accentColor="amber"
                trendValue="Syncd"
                trendType="neutral"
              />
            </div>

            {/* Formal Invariant Specifications Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#4A685F] dark:text-[#88A69A]">
                    INV-01
                  </span>
                  <StatusBadge status="PASS" size="sm" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#242521] dark:text-[#F0E9DC]">
                  Capacity Upper Bound
                </h4>
                <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                  Sum of confirmed seats never exceeds coach physical capacity across any travel class (1A, 2A, 3A, SL, CC).
                </p>
              </div>

              <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#4A685F] dark:text-[#88A69A]">
                    INV-08
                  </span>
                  <StatusBadge status="PASS" size="sm" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#242521] dark:text-[#F0E9DC]">
                  Unique Active Booking
                </h4>
                <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                  Strict uniqueness on (passenger_id, journey_id, active_status). Precludes duplicate concurrent seat reservations.
                </p>
              </div>

              <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#E9663B] dark:text-[#F0784D]">
                    R-11 / R-12
                  </span>
                  <StatusBadge status="PASS" size="sm" />
                </div>
                <h4 className="font-display font-bold text-sm text-[#242521] dark:text-[#F0E9DC]">
                  Cross-Class Concurrency Latches
                </h4>
                <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                  Row-level mutex locks guarantee race safety during simultaneous booking, cancellation, and promotion cascades.
                </p>
              </div>
            </div>

            {/* Audit Log Ledger Table */}
            <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                  <h3 className="font-display font-bold text-base text-[#242521] dark:text-[#F0E9DC] uppercase tracking-wide">
                    Immutable Audit Inspection Trail
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
                  Showing {AUDIT_LOGS.length} Logged Transactions
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="border-b border-[#D9D0C1] dark:border-[#353731] text-[#8C887D] dark:text-[#726F65] uppercase text-[10px]">
                    <tr>
                      <th className="pb-2.5">ID / Timestamp</th>
                      <th className="pb-2.5">Operation</th>
                      <th className="pb-2.5">Actor / Role</th>
                      <th className="pb-2.5">Invariant Status</th>
                      <th className="pb-2.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD3] dark:divide-[#272823]">
                    {AUDIT_LOGS.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F4F0E7]/60 dark:hover:bg-[#171815]/60 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">{log.id}</div>
                          <div className="text-[10px] text-[#8C887D] dark:text-[#726F65]">
                            {new Date(log.timestamp).toLocaleTimeString('en-US', {
                              hour12: false,
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="py-3 font-bold text-[#242521] dark:text-[#F0E9DC]">
                          {log.operation}
                        </td>
                        <td className="py-3 text-[#5E6059] dark:text-[#A39F93]">
                          <div>{log.actor}</div>
                          <div className="text-[10px] text-[#8C887D] dark:text-[#726F65]">{log.userRole}</div>
                        </td>
                        <td className="py-3">
                          <StatusBadge status={log.invariantStatus} size="sm" />
                        </td>
                        <td className="py-3 text-[#5E6059] dark:text-[#A39F93] font-sans max-w-sm">
                          {log.details}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Global Invariant Targets Footer Banner */}
        <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[#4A685F]/15 dark:bg-[#88A69A]/20 p-2 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display font-bold text-sm text-[#242521] dark:text-[#F0E9DC] uppercase tracking-wide">
                  Autonomous Demo Mode Specification Guarantee
                </div>
                <p className="text-xs text-[#5E6059] dark:text-[#A39F93] mt-0.5 font-sans">
                  This showcase runs entirely within the client application using canonical synthetic fixtures. No database mutation or authenticated credential is created.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E9663B]/40 bg-[#E9663B]/10 px-3.5 py-2 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:bg-[#E9663B]/20 transition-colors"
              >
                <span>Launch Production Login</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-[#D9D0C1] dark:border-[#353731] py-4 px-6 text-center text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
        RailSync Public Demo Mode • Deterministic Synthetic Fixtures • Feature Branch: <code>feature/m1.3-schema-consolidation</code>
      </footer>
    </div>
  );
}

export default function DemoOperationsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F0E7] dark:bg-[#171815] flex items-center justify-center font-mono text-sm text-[#5E6059] dark:text-[#A39F93]">
          Loading Access Operations Showcase...
        </div>
      }
    >
      <DemoOperationsContent />
    </Suspense>
  );
}
