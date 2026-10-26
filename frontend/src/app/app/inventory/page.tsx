'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Train,
  RefreshCw,
  Server,
  Users,
  Clock,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { JOURNEYS } from '@/lib/mock-data';
import { JourneyInventory } from '@/lib/types';

interface SeatAllocationItem {
  allocationId: number;
  bookingId: number;
  journeySeatId: number;
  passengerId: number;
  allocatedAt: string;
}

interface WaitlistQueueItem {
  waitlistId: number;
  bookingId: number;
  position: number;
  createdAt: string;
}

interface JavaClassInventory {
  journeyClassId: number;
  classCode: string;
  totalSeats: number;
  baseFareInr: number;
  availableSeats: number;
  confirmedCount: number;
  waitlistCount: number;
  allocations: SeatAllocationItem[];
  waitlist: WaitlistQueueItem[];
}

export default function InventoryPage() {
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>(JOURNEYS[0].journeyId);
  const [showZeroSeatClasses, setShowZeroSeatClasses] = useState<boolean>(true);

  // Live Java Simulator Inventory State
  const [javaInventory, setJavaInventory] = useState<JavaClassInventory[] | null>(null);
  const [loadingJava, setLoadingJava] = useState<boolean>(true);
  const [javaError, setJavaError] = useState<string | null>(null);

  const fetchJavaInventory = useCallback(async () => {
    setLoadingJava(true);
    setJavaError(null);
    try {
      const res = await fetch('/api/inventory', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('HTTP ' + res.status);
      }
      const data: JavaClassInventory[] = await res.json();
      setJavaInventory(data);
    } catch (err) {
      setJavaError(err instanceof Error ? err.message : 'Backend unavailable');
      setJavaInventory(null);
    } finally {
      setLoadingJava(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initFetch = async () => {
      try {
        const res = await fetch('/api/inventory', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data: JavaClassInventory[] = await res.json();
        if (mounted) {
          setJavaInventory(data);
          setLoadingJava(false);
        }
      } catch (err) {
        if (mounted) {
          setJavaError(err instanceof Error ? err.message : 'Offline');
          setLoadingJava(false);
        }
      }
    };
    initFetch();
    return () => {
      mounted = false;
    };
  }, []);

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



  return (
    <div className="space-y-6">
      <PageHeader
        title="Fleet & Capacity Inventory"
        subtitle="Real-time capacity tracking, derived class occupancy, and zero-seat class handling (INV-01 / R-14)"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Inventory' },
        ]}
        actions={
          <button
            onClick={fetchJavaInventory}
            disabled={loadingJava}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] px-3.5 py-1.5 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/50 transition-colors shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D] ${loadingJava ? 'animate-spin' : ''}`} />
            <span>Refresh Simulator Inventory</span>
          </button>
        }
      />

      {/* Live Java In-Memory Inventory Card (Tier 1 Integration) */}
      <div className="rounded-2xl border border-[#E9663B]/30 bg-gradient-to-r from-[#E9663B]/10 via-[#FAF8F4] to-[#FAF8F4] dark:via-[#242521] dark:to-[#242521] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="h-5 w-5 text-[#E9663B] dark:text-[#F0784D]" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-[#242521] dark:text-[#F0E9DC]">
                  Java Simulator Real-Time Inventory (Train 12951, Journey 101)
                </span>
                {javaInventory ? (
                  <span className="rounded-full bg-[#4A685F]/20 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    INV-01 ENFORCED
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-mono font-bold">
                    SIMULATOR OFFLINE
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] mt-0.5 font-sans">
                Physical seats and bounded waitlist queues managed directly by InMemoryBookingService (In-memory, non-persistent).
              </p>
            </div>
          </div>
          <button
            onClick={fetchJavaInventory}
            disabled={loadingJava}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] px-2.5 py-1 text-xs font-mono text-[#242521] dark:text-[#F0E9DC] hover:text-[#E9663B] transition-colors cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 ${loadingJava ? 'animate-spin' : ''}`} />
            <span>Poll /api/inventory</span>
          </button>
        </div>

        {javaInventory ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {javaInventory.map((jc) => (
              <div
                key={jc.journeyClassId}
                className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] px-2 py-0.5 text-xs font-mono font-bold border border-[#E9663B]/30">
                      Class {jc.classCode}
                    </span>
                    <span className="text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
                      ₹{jc.baseFareInr.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC]">
                    {jc.availableSeats} / {jc.totalSeats} Avail
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono border-y border-[#D9D0C1] dark:border-[#353731] py-2">
                  <div>
                    <span className="text-[10px] text-[#8C887D] dark:text-[#726F65] block uppercase">Total</span>
                    <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">{jc.totalSeats}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#4A685F] dark:text-[#88A69A] block uppercase">Confirmed</span>
                    <span className="font-bold text-[#4A685F] dark:text-[#88A69A]">{jc.confirmedCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#E9663B] dark:text-[#F0784D] block uppercase">Waitlist</span>
                    <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{jc.waitlistCount}</span>
                  </div>
                </div>

                {/* Seat Allocations Snapshot */}
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8C887D] dark:text-[#726F65] block mb-1">
                    Confirmed Allocations ({jc.allocations.length})
                  </span>
                  {jc.allocations.length === 0 ? (
                    <span className="text-[11px] text-[#8C887D] dark:text-[#726F65] italic block">No active allocations</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {jc.allocations.map((a) => (
                        <span
                          key={a.allocationId}
                          className="rounded bg-[#4A685F]/15 text-[#4A685F] dark:text-[#88A69A] px-2 py-0.5 text-[10px] font-mono border border-[#4A685F]/30"
                          title={`Allocated to Passenger ${a.passengerId} at ${a.allocatedAt}`}
                        >
                          Seat #{a.journeySeatId} (P#{a.passengerId})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waitlist Queue Snapshot */}
                {jc.waitlistCount > 0 && (
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#E9663B] dark:text-[#F0784D] block mb-1">
                      Waitlist Priority Queue ({jc.waitlist.length})
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {jc.waitlist.map((w) => (
                        <span
                          key={w.waitlistId}
                          className="rounded bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] px-2 py-0.5 text-[10px] font-mono border border-[#E9663B]/30"
                        >
                          WL Pos #{w.position} (Booking #{w.bookingId})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] p-4 text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
            Java Simulator is not currently running on port 8080 ({javaError || 'Offline'}). Showing static mock fleet data below.
          </div>
        )}
      </div>

      {/* Train Selector Pills */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-mono uppercase text-[#8C887D] dark:text-[#726F65] mr-2 flex items-center gap-1.5">
            <Train className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
            Fleet Reference:
          </span>
          {JOURNEYS.map((j) => {
            const isSelected = selectedJourney.journeyId === j.journeyId;
            return (
              <button
                key={j.journeyId}
                onClick={() => setSelectedJourneyId(j.journeyId)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all flex items-center gap-2 cursor-pointer ${
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
              <Users className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
              Physical Train Occupancy (R-09 Enforced)
            </span>
            <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">
              {derivedStats.totalBooked} / {derivedStats.totalCapacity} Berths ({derivedStats.occupancyPct.toFixed(1)}%)
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#E6DFD3] dark:bg-[#171815]">
            <div
              className={`h-full transition-all duration-500 ${
                derivedStats.occupancyPct >= 100
                  ? 'bg-[#C83C2A] dark:bg-[#F45846]'
                  : derivedStats.occupancyPct >= 90
                  ? 'bg-[#E9663B] dark:bg-[#F0784D]'
                  : 'bg-[#4A685F] dark:bg-[#88A69A]'
              }`}
              style={{ width: `${Math.min(derivedStats.occupancyPct, 100)}%` }}
            />
          </div>
        </div>

        {/* Class Capacity Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedClasses.map((c) => (
            <div
              key={c.travelClass}
              className={`rounded-xl border p-4 backdrop-blur-sm space-y-3 transition-colors ${
                c.totalSeats === 0
                  ? 'border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7]/60 dark:bg-[#171815]/60 opacity-75'
                  : 'border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-[#E6DFD3] dark:bg-[#171815] px-2 py-0.5 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                  Class {c.travelClass}
                </span>
                <span className="text-xs font-mono text-[#8C887D] dark:text-[#726F65]">
                  {c.totalSeats > 0 ? `${c.occupancyPct.toFixed(1)}% Full` : 'Zero Capacity (R-14)'}
                </span>
              </div>

              <div className="text-2xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC]">
                {c.bookedSeats}{' '}
                <span className="text-sm font-normal text-[#8C887D] dark:text-[#726F65]">/ {c.totalSeats} seats</span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-[#5E6059] dark:text-[#A39F93]">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#E9663B] dark:text-[#F0784D]" />
                  <span>WL: {c.waitlistCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Layers className="h-3 w-3 text-[#3D6875] dark:text-[#78A3AF]" />
                  <span>RAC: {c.racCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
