'use client';

import React, { useState, useMemo } from 'react';
import {
  Train,
  CheckCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { JOURNEYS } from '@/lib/mock-data';
import { JourneyInventory, TravelClass } from '@/lib/types';

export default function InventoryPage() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(JOURNEYS[0].journeyId);
  const [showZeroSeatClasses, setShowZeroSeatClasses] = useState<boolean>(true);

  // Find selected journey
  const selectedJourney: JourneyInventory = useMemo(() => {
    return JOURNEYS.find((j) => j.journeyId === selectedJourneyId) || JOURNEYS[0];
  }, [selectedJourneyId]);

  // Derived calculations directly from class breakdown
  const derivedStats = useMemo(() => {
    const totalCapacity = selectedJourney.classes.reduce((sum, c) => sum + c.totalSeats, 0);
    const totalBooked = selectedJourney.classes.reduce((sum, c) => sum + c.bookedSeats, 0);
    const availableSeats = Math.max(totalCapacity - totalBooked, 0);
    const totalWaitlist = selectedJourney.classes.reduce((sum, c) => sum + c.waitlistCount, 0);
    const totalRac = selectedJourney.classes.reduce((sum, c) => sum + c.racCount, 0);
    const occupancyPct = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;

    return {
      totalCapacity,
      totalBooked,
      availableSeats,
      totalWaitlist,
      totalRac,
      occupancyPct: parseFloat(occupancyPct.toFixed(2)),
    };
  }, [selectedJourney]);

  // Filtered classes according to zero-seat visibility preference
  const displayedClasses = useMemo(() => {
    if (showZeroSeatClasses) {
      return selectedJourney.classes;
    }
    return selectedJourney.classes.filter((c) => c.totalSeats > 0);
  }, [selectedJourney, showZeroSeatClasses]);

  // Simulated coach layout for realistic train composition
  const coachComposition: Record<TravelClass, string[]> = {
    '1A': ['H1'],
    '2A': ['A1', 'A2'],
    '3A': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6'],
    'SL': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
    'CC': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'],
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet & Capacity Inventory"
        subtitle="Real-time capacity tracking, derived class occupancy, and zero-seat class handling (INV-01 / R-14)"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Inventory' },
        ]}
      />

      {/* Train Selector Pills */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-[#8C887D] dark:text-[#726F65] mr-2 flex items-center gap-1.5">
            <Train className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
            Select Train:
          </span>
          {JOURNEYS.map((j) => {
            const isSelected = selectedJourney.journeyId === j.journeyId;
            return (
              <button
                key={j.journeyId}
                onClick={() => setSelectedJourneyId(j.journeyId)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/40 shadow-xs'
                    : 'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26] hover:text-[#242521] dark:hover:text-[#F0E9DC] border border-transparent'
                }`}
                aria-pressed={isSelected}
              >
                <span>{j.trainNumber}</span>
                <span className="text-[11px] text-[#8C887D] dark:text-[#726F65] hidden sm:inline">
                  {j.trainName.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toggle Zero-Seat Display */}
        <label className="flex items-center gap-2 text-xs font-mono text-[#5E6059] dark:text-[#A39F93] cursor-pointer self-start sm:self-auto">
          <input
            type="checkbox"
            checked={showZeroSeatClasses}
            onChange={(e) => setShowZeroSeatClasses(e.target.checked)}
            className="rounded border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] text-[#E9663B] dark:text-[#F0784D] focus:ring-[#E9663B]"
          />
          <span>Show Zero-Seat Classes (R-14)</span>
        </label>
      </div>

      {/* Selected Journey Capacity Console */}
      <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-5 shadow-sm space-y-6">
        {/* Journey Identity & Top Stats */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-2xl font-bold font-mono text-[#E9663B] dark:text-[#F0784D]">
                {selectedJourney.trainNumber}
              </span>
              <h2 className="text-xl font-bold text-[#242521] dark:text-[#F0E9DC]">{selectedJourney.trainName}</h2>
              <StatusBadge status={selectedJourney.status} size="sm" />
              {selectedJourney.delayMinutes > 0 && (
                <span className="text-amber-400 text-xs font-mono font-bold">
                  +{selectedJourney.delayMinutes}m delay
                </span>
              )}
            </div>
            <p className="text-xs text-[#8C887D] dark:text-[#726F65] mt-1 font-mono">
              Corridor: <span className="text-[#242521] dark:text-[#F0E9DC] font-semibold">{selectedJourney.sourceStation}</span> → <span className="text-[#242521] dark:text-[#F0E9DC] font-semibold">{selectedJourney.destStation}</span> • Departure: {selectedJourney.departureTime} • Arrival: {selectedJourney.arrivalTime}
            </p>
          </div>

          {/* Derived KPI Numbers */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-2.5 text-right min-w-[110px]">
              <span className="text-[#8C887D] dark:text-[#726F65] block text-[10px] uppercase">Derived Occupancy</span>
              <span className="text-xl font-bold text-[#242521] dark:text-[#F0E9DC]">
                {derivedStats.occupancyPct.toFixed(2)}%
              </span>
            </div>
            <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-2.5 text-right min-w-[120px]">
              <span className="text-[#8C887D] dark:text-[#726F65] block text-[10px] uppercase">Seats Reserved</span>
              <span className="text-xl font-bold text-[#E9663B] dark:text-[#F0784D]">
                {derivedStats.totalBooked} <span className="text-[#8C887D] dark:text-[#726F65] font-normal">/ {derivedStats.totalCapacity}</span>
              </span>
            </div>
            <div className="rounded-lg border border-[#4A685F]/30 bg-[#4A685F]/10 p-2.5 text-right min-w-[110px]">
              <span className="text-[#4A685F] dark:text-[#88A69A] block text-[10px] uppercase">Available Berths</span>
              <span className="text-xl font-bold text-[#4A685F] dark:text-[#88A69A]">
                {derivedStats.availableSeats}
              </span>
            </div>
          </div>
        </div>

        {/* Aggregate Capacity Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#8C887D] dark:text-[#726F65] flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#4A685F] dark:text-[#88A69A]" />
              Physical Coach Upper Bound (INV-01 Specification)
            </span>
            <span className="text-[#5E6059] dark:text-[#A39F93]">
              <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{derivedStats.totalBooked}</span> reserved • <span className="font-bold text-[#4A685F] dark:text-[#88A69A]">{derivedStats.availableSeats}</span> free berths
            </span>
          </div>
          <div className="h-3.5 w-full rounded-full bg-[#F4F0E7] dark:bg-[#171815] overflow-hidden border border-[#D9D0C1] dark:border-[#353731] p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                derivedStats.occupancyPct >= 100
                  ? 'bg-[#C83C2A] dark:bg-[#F45846]'
                  : derivedStats.occupancyPct >= 90
                  ? 'bg-[#C57613] dark:bg-[#E6962C]'
                  : 'bg-[#4A685F] dark:bg-[#88A69A]'
              }`}
              style={{ width: `${Math.min(derivedStats.occupancyPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Class Capacity Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8C887D] dark:text-[#726F65]">
              Class-by-Class Breakdown & Waitlist Queues
            </h3>
            <span className="text-[11px] font-mono text-[#8C887D] dark:text-[#726F65]">
              Showing {displayedClasses.length} travel classes
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedClasses.map((cls) => {
              const isZeroSeat = cls.totalSeats === 0;
              const isFull = !isZeroSeat && cls.bookedSeats >= cls.totalSeats;

              // Safe occupancy formatting to avoid division by zero
              const classOccupancyPct = isZeroSeat
                ? '0.00%'
                : `${((cls.bookedSeats / cls.totalSeats) * 100).toFixed(2)}%`;

              const available = Math.max(cls.totalSeats - cls.bookedSeats, 0);

              return (
                <div
                  key={cls.travelClass}
                  className={`rounded-xl border p-4.5 space-y-3 transition-all ${
                    isZeroSeat
                      ? 'border-dashed border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] opacity-75'
                      : isFull
                      ? 'border-[#C83C2A]/30 bg-[#C83C2A]/10'
                      : 'border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2.5 py-1 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] border border-[#D9D0C1] dark:border-[#353731]">
                      Class {cls.travelClass}
                    </span>

                    {isZeroSeat ? (
                      <span className="rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2 py-0.5 text-[10px] font-mono font-medium text-[#8C887D] dark:text-[#726F65] border border-[#D9D0C1] dark:border-[#353731]">
                        ZERO-SEAT (0 SEATS)
                      </span>
                    ) : isFull ? (
                      <span className="rounded bg-[#C83C2A]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#A82B1B] dark:text-[#F45846] border border-[#C83C2A]/30">
                        FULL (WL ONLY)
                      </span>
                    ) : (
                      <span className="rounded bg-[#4A685F]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#3D564F] dark:text-[#88A69A] border border-[#4A685F]/30">
                        {available} SEATS FREE
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-[#8C887D] dark:text-[#726F65]">
                      <span>Occupancy:</span>
                      <span className={`font-bold ${isZeroSeat ? 'text-[#8C887D] dark:text-[#726F65]' : isFull ? 'text-[#C83C2A] dark:text-[#F45846]' : 'text-[#242521] dark:text-[#F0E9DC]'}`}>
                        {classOccupancyPct}
                      </span>
                    </div>

                    <div className="flex justify-between text-[#8C887D] dark:text-[#726F65] text-[11px]">
                      <span>Booked / Capacity:</span>
                      <span className="text-[#242521] dark:text-[#F0E9DC] font-semibold">
                        {cls.bookedSeats} / {cls.totalSeats} berths
                      </span>
                    </div>

                    <div className="h-2 w-full rounded-full bg-[#E6DFD3] dark:bg-[#272823] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isZeroSeat
                            ? 'bg-transparent'
                            : isFull
                            ? 'bg-[#C83C2A] dark:bg-[#F45846]'
                            : 'bg-[#4A685F] dark:bg-[#88A69A]'
                        }`}
                        style={{
                          width: isZeroSeat ? '0%' : `${Math.min((cls.bookedSeats / cls.totalSeats) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-2.5 text-[11px] font-mono">
                    {isZeroSeat ? (
                      <div className="text-[#8C887D] dark:text-[#726F65] italic flex items-center gap-1.5">
                        <Info className="h-3 w-3" />
                        <span>R-14 view contract: safe 0.00% without division error</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-[#8C887D] dark:text-[#726F65]">
                          Waitlist: <span className="font-bold text-[#C57613] dark:text-[#E6962C]">{cls.waitlistCount}</span>
                        </span>
                        <span className="text-[#8C887D] dark:text-[#726F65]">
                          RAC: <span className="font-bold text-[#3D6875] dark:text-[#78A3AF]">{cls.racCount}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {!isZeroSeat && coachComposition[cls.travelClass] && (
                    <div className="flex items-center gap-1 text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] pt-1 border-t border-[#E6DFD3] dark:border-[#272823]">
                      <span>Rake Coaches:</span>
                      <span className="text-[#8C887D] dark:text-[#726F65]">
                        {coachComposition[cls.travelClass].join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4 text-xs font-mono text-[#5E6059] dark:text-[#A39F93] space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-bold text-[#242521] dark:text-[#F0E9DC]">
              <CheckCircle className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
              R-14 Relational Invariant: Zero-Seat Class Handling
            </span>
            <StatusBadge status="PASS" size="sm" />
          </div>
          <p className="text-[#8C887D] dark:text-[#726F65] font-sans leading-relaxed">
            In railway schedules, trains such as the Rajdhani or Shatabdi do not configure Sleeper (SL) or Chair Car (CC) coaches. As proven in the M1.4 R-14 MySQL suite, queries against unconfigured classes evaluate to exactly <code className="text-[#E9663B] dark:text-[#F0784D] bg-[#E6DFD3] dark:bg-[#171815] px-1 py-0.5 rounded">0.00%</code> occupancy without throwing division-by-zero runtime exceptions or corrupting aggregation calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
