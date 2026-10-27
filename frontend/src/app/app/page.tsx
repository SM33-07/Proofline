'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  Users,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Train,
  X,
} from 'lucide-react';
import { KpiCard } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { RailwayNetworkMap } from '@/components/network/RailwayNetworkMap';
import { JOURNEYS, AUDIT_LOGS } from '@/lib/mock-data';

function AuditAccessNotice() {
  const searchParams = useSearchParams();
  const [dismissed, setDismissed] = useState(false);
  const hasError = searchParams.get('error') === 'unauthorized_audit_access';

  if (dismissed || !hasError) return null;

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#C83C2A]/40 bg-[#C83C2A]/15 p-4 text-xs font-mono text-[#C83C2A] dark:text-[#F45846] backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-bold uppercase tracking-wider text-[11px]">
            Access Denied: Restricted Administrative View
          </p>
          <p className="font-sans text-xs mt-0.5 text-[#5E6059] dark:text-[#F0E9DC]">
            The Audit Ledger &amp; Formal Invariant Verifications (/app/audit) are strictly restricted to the Audit Inspector role. Your operator profile does not possess audit inspection privileges.
          </p>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="rounded p-1 hover:bg-[#C83C2A]/20 transition-colors"
        title="Dismiss notice"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function OperationsOverviewPage() {
  return (
    <div className="space-y-6">
      {/* Access Denied Warning Banner for Role Restrictions */}
      <Suspense fallback={null}>
        <AuditAccessNotice />
      </Suspense>

      {/* Top Banner Alert if Incident Active */}
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
          <Link
            href="/app/disruptions"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#C83C2A]/35 bg-[#C83C2A]/10 px-3.5 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-[#C83C2A] dark:text-[#F45846] hover:bg-[#C83C2A]/20 transition-colors shrink-0 cursor-pointer"
          >
            <span>Inspect Cascade</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
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

      {/* Central 2-Column Section: Schematic Map + Train Services & Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Corridor Route Schematic (7 cols) */}
        <div className="lg:col-span-7">
          <RailwayNetworkMap />
        </div>

        {/* Right Column: Train Services Corridor Table & Recent Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Train Services Summary Table */}
          <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
              <div className="flex items-center gap-2">
                <Train className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                <h3 className="font-display font-bold text-base tracking-wide text-[#242521] dark:text-[#F0E9DC] uppercase">
                  Train Services
                </h3>
              </div>
              <Link
                href="/app/inventory"
                className="text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
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
                        <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93] font-sans font-normal truncate max-w-[100px]">{j.trainName.split(' ')[0]}</div>
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

          {/* Recent Operations Activity Feed */}
          <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                <h3 className="font-display font-bold text-base tracking-wide text-[#242521] dark:text-[#F0E9DC] uppercase">
                  Recent Activity (Simulated)
                </h3>
              </div>
              <Link
                href="/app/audit"
                className="text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:underline flex items-center gap-1"
              >
                <span>Audit</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
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
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    <span>Actor: {entry.actor}</span>
                    <StatusBadge status={entry.invariantStatus} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Invariant Specification Strip */}
      <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#4A685F]/15 dark:bg-[#88A69A]/20 p-2 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-display font-bold text-base text-[#242521] dark:text-[#F0E9DC] uppercase tracking-wide">
                Specification Invariant Targets (Simulation Mode)
              </div>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] mt-0.5 font-sans">
                Formal constraints modeled in RailSync. Runtime verification executes in backend JUnit / MySQL test suites.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#4A685F]/12 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30 px-3 py-1 text-xs font-mono font-bold">
              INV-01: Capacity Bound Target
            </span>
            <span className="rounded-lg bg-[#4A685F]/12 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30 px-3 py-1 text-xs font-mono font-bold">
              INV-08: Unique Active Target
            </span>
            <span className="rounded-lg bg-[#E9663B]/10 text-[#E9663B] dark:text-[#F0784D] border border-[#E9663B]/30 px-3 py-1 text-xs font-mono font-bold">
              R-11 / R-12: Concurrency Latch Target
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
