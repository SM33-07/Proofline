'use client';

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AUDIT_LOGS } from '@/lib/mock-data';

export default function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOperation, setSelectedOperation] = useState<string>('ALL');

  const filteredLogs = AUDIT_LOGS.filter((entry) => {
    const matchesSearch =
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.invariantRule && entry.invariantRule.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesOp =
      selectedOperation === 'ALL' || entry.operation === selectedOperation;

    return matchesSearch && matchesOp;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Ledger & Invariant Verifications"
        subtitle="Immutable transaction ledger, concurrency safety assertions, and canonical invariant compliance"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Audit & Invariants' },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-4 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#4A685F] dark:text-[#88A69A]">
              INV-01 Capacity Upper Bound
            </span>
            <StatusBadge status="PASS" size="sm" />
          </div>
          <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans">
            Specification target across all trains. Confirmed passenger count &le; coach physical seating capacity.
          </p>
          <div className="text-[10px] font-mono text-[#4A685F] dark:text-[#88A69A]/80">Target Constraint (0 Violations Allowed)</div>
        </div>

        <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-4 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#4A685F] dark:text-[#88A69A]">
              INV-08 Single Active Booking
            </span>
            <StatusBadge status="PASS" size="sm" />
          </div>
          <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans">
            Constraint target on (passenger_id, journey_id, active_status). Evaluated in test harness.
          </p>
          <div className="text-[10px] font-mono text-[#4A685F] dark:text-[#88A69A]/80">Uniqueness Target Bound</div>
        </div>

        <div className="rounded-xl border border-[#E9663B]/30 bg-cyan-950/15 p-4 backdrop-blur-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase text-[#E9663B] dark:text-[#F0784D]">
              R-11 / R-12 Concurrency
            </span>
            <StatusBadge status="PASS" size="sm" />
          </div>
          <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans">
            50 concurrent threads simulated across classes 2A and 3A. Lock latching prevents data corruption.
          </p>
          <div className="text-[10px] font-mono text-[#E9663B] dark:text-[#F0784D]/80">Zero Race Condition Failures</div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C887D] dark:text-[#726F65]" />
          <input
            type="text"
            placeholder="Search audit trail by actor, rule, transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] h-10 pl-9 pr-4 text-xs text-[#242521] dark:text-[#F0E9DC] placeholder-[#8C887D] dark:placeholder-[#726F65] focus:border-[#E9663B] focus:outline-none focus:ring-1 focus:ring-[#E9663B]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedOperation}
            onChange={(e) => setSelectedOperation(e.target.value)}
            className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] py-1.5 px-3 text-xs font-mono text-[#242521] dark:text-[#F0E9DC] focus:border-[#E9663B] focus:outline-none"
          >
            <option value="ALL">All Operations</option>
            <option value="SEAT_RESERVATION">Seat Reservations</option>
            <option value="WAITLIST_PROMOTION">Waitlist Promotions</option>
            <option value="BOOKING_CANCELLATION">Cancellations</option>
            <option value="INVARIANT_ASSERTION">Invariant Assertions</option>
            <option value="SCHEDULE_RESCHEDULE">Schedule Reschedules</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] backdrop-blur-sm shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="border-b border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] text-[#8C887D] dark:text-[#726F65] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4 sm:px-6">Timestamp & ID</th>
                <th className="py-3 px-4">Operation</th>
                <th className="py-3 px-4">Actor / Role</th>
                <th className="py-3 px-4">Rule / Context</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6DFD3] dark:divide-[#272823]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
                    No audit records match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#F4F0E7]/70 dark:hover:bg-[#171815]/60 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">{entry.id}</div>
                    <div suppressHydrationWarning className="text-[11px] text-[#8C887D] dark:text-[#726F65]">
                      {new Date(entry.timestamp).toLocaleTimeString('en-US')}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{entry.operation}</span>
                    {entry.pnr && (
                      <span className="text-[11px] text-[#8C887D] dark:text-[#726F65] block">PNR: {entry.pnr}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[#242521] dark:text-[#F0E9DC] font-semibold">{entry.actor}</div>
                    <div className="text-[11px] text-[#8C887D] dark:text-[#726F65]">{entry.userRole}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[#5E6059] dark:text-[#A39F93]">
                    {entry.invariantRule ? (
                      <span className="rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2 py-0.5 text-[11px] font-bold text-[#C57613] dark:text-[#E6962C] border border-[#D9D0C1] dark:border-[#353731]">
                        {entry.invariantRule}
                      </span>
                    ) : (
                      <span className="text-[#8C887D] dark:text-[#726F65]">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#5E6059] dark:text-[#A39F93] max-w-md font-sans text-xs">
                    {entry.details}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <StatusBadge status={entry.invariantStatus} size="sm" />
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
