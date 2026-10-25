'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  Wrench,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DISRUPTIONS } from '@/lib/mock-data';

export default function DisruptionsPage() {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const filteredIncidents = DISRUPTIONS.filter((inc) => {
    if (filterSeverity === 'ALL') return true;
    return inc.severity === filterSeverity;
  });

  const criticalCount = DISRUPTIONS.filter((d) => d.severity === 'CRITICAL').length;
  const majorCount = DISRUPTIONS.filter((d) => d.severity === 'MAJOR').length;
  const moderateCount = DISRUPTIONS.filter((d) => d.severity === 'MODERATE').length;
  const resolvedCount = DISRUPTIONS.filter((d) => d.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disruption Management & Cascade Resolution"
        subtitle="Simulated incident response, delay propagation models, and automated passenger re-accommodation"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Disruptions' },
        ]}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-[#C83C2A]/30 bg-[#C83C2A]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#C83C2A] dark:text-[#F45846] font-bold">Critical</span>
            <AlertTriangle className="h-4 w-4 text-[#C83C2A] dark:text-[#F45846]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{criticalCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">Requires immediate pilot order</p>
        </div>
        <div className="rounded-xl border border-[#E9663B]/30 bg-[#E9663B]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#E9663B] dark:text-[#F0784D] font-bold">Major</span>
            <Flame className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{majorCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">Speed restrictions applied</p>
        </div>
        <div className="rounded-xl border border-[#C57613]/30 bg-[#C57613]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#C57613] dark:text-[#E6962C] font-bold">Moderate</span>
            <Wrench className="h-4 w-4 text-[#C57613] dark:text-[#E6962C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{moderateCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">HVAC / power inverter checks</p>
        </div>
        <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-[#4A685F] dark:text-[#88A69A] font-bold">Resolved</span>
            <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-2">{resolvedCount}</div>
          <p className="text-[11px] text-[#5E6059] dark:text-[#A39F93] mt-1">Normal traction restored</p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#8C887D] dark:text-[#726F65] mr-2 uppercase text-[11px]">Filter Severity:</span>
          {['ALL', 'CRITICAL', 'MAJOR', 'MODERATE'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`rounded-lg px-3 py-1 transition-colors ${
                filterSeverity === sev
                  ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-semibold border border-[#E9663B]/30'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
          Showing {filteredIncidents.length} incident cases
        </span>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {filteredIncidents.map((inc) => (
          <div
            key={inc.id}
            className={`rounded-xl border p-5 backdrop-blur-sm space-y-4 ${
              inc.severity === 'CRITICAL'
                ? 'border-[#C83C2A]/30 bg-[#C83C2A]/10'
                : inc.severity === 'MAJOR'
                ? 'border-[#C57613]/30 bg-[#C57613]/10'
                : inc.status === 'RESOLVED'
                ? 'border-[#4A685F]/30 bg-[#4A685F]/10'
                : 'border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] shadow-sm'
            }`}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
              <div className="flex items-center gap-3">
                <span className="rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2.5 py-1 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                  Case {inc.code}
                </span>
                <h3 className="text-base font-bold text-[#242521] dark:text-[#F0E9DC]">{inc.title}</h3>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={inc.severity} size="sm" />
                <StatusBadge status={inc.status} size="sm" />
              </div>
            </div>

            <p className="text-xs text-[#5E6059] dark:text-[#A39F93] leading-relaxed font-sans">{inc.description}</p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3.5 text-xs font-mono">
              <div>
                <span className="text-[10px] uppercase text-[#8C887D] dark:text-[#726F65] block">Affected Train</span>
                <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{inc.affectedTrainNumber}</span>
                <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] block">{inc.affectedTrainName}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8C887D] dark:text-[#726F65] block">Location & Delay</span>
                <span className="font-bold text-[#C57613] dark:text-[#E6962C]">
                  Station {inc.locationStation} • +{inc.estimatedDelayMinutes}m delay
                </span>
                <span suppressHydrationWarning className="text-[#8C887D] dark:text-[#726F65] text-[11px] block">
                  Reported: {new Date(inc.reportedAt).toLocaleTimeString('en-US')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#8C887D] dark:text-[#726F65] block">Passengers Impacted</span>
                <span className="font-bold text-[#C83C2A] dark:text-[#F45846]">
                  {inc.passengersImpacted.toLocaleString()} passengers
                </span>
                <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] block">Downstream alert transmitted</span>
              </div>
            </div>

            <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase text-[#8C887D] dark:text-[#726F65] font-semibold">
                  Downstream Delay Propagation Model
                </span>
                <span className="text-[10px] font-mono text-[#E9663B] dark:text-[#F0784D]">Headway Factor: 1.25x</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                {inc.cascadeStations.map((station, idx) => (
                  <React.Fragment key={station}>
                    {idx > 0 && <span className="text-[#8C887D] dark:text-[#726F65]">→</span>}
                    <div className="flex items-center gap-1.5 rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2.5 py-1 text-[#5E6059] dark:text-[#A39F93] border border-[#D9D0C1] dark:border-[#353731]">
                      <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{station}</span>
                      <span className="text-[#C57613] dark:text-[#E6962C] font-semibold">
                        +{Math.max(inc.estimatedDelayMinutes - idx * 10, 5)}m
                      </span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-[#E9663B]/25 bg-[#E9663B]/5 p-3 flex items-start gap-3">
              <div className="rounded p-1 bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] shrink-0">
                <Radio className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold font-mono text-[#E9663B] dark:text-[#F0784D] uppercase tracking-wide">
                  Active Mitigation Protocol
                </span>
                <p className="text-xs text-[#242521] dark:text-[#F0E9DC] mt-0.5 font-sans">{inc.mitigationAction}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
