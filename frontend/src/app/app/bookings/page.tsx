'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Ticket,
  Search,
  Copy,
  Check,
  X,
  MapPin,
  AlertCircle,
  Ban,
  ShieldCheck,
  CheckSquare,
  Square,
  Plus,
  RefreshCw,
  Loader2,
  Server,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectionBar } from '@/components/shell/SelectionBar';
import { BOOKINGS as INITIAL_MOCK_BOOKINGS, STATIONS } from '@/lib/mock-data';
import { BookingRecord, BookingStatus, TravelClass } from '@/lib/types';

interface JavaRawBooking {
  bookingId: number;
  pnr: string;
  journeyClassId: number;
  passengerId: number;
  status: 'CONFIRMED' | 'WAITLIST' | 'WAITLISTED' | 'CANCELLED';
  bookedAt: string;
  fareInr: number;
  groupRef: string | null;
}

const PASSENGER_NAMES: Record<number, { name: string; age: number; gender: 'M' | 'F' | 'O' }> = {
  1001: { name: 'Soham More', age: 24, gender: 'M' },
  1002: { name: 'Stuti Pandey', age: 23, gender: 'F' },
  1003: { name: 'Shikha Sharma', age: 25, gender: 'F' },
  1004: { name: 'Rahul Verma', age: 29, gender: 'M' },
  1005: { name: 'Priya Nair', age: 27, gender: 'F' },
  1006: { name: 'Amit Kumar', age: 34, gender: 'M' },
  1007: { name: 'Sneha Rao', age: 22, gender: 'F' },
  1008: { name: 'Vikram Singh', age: 41, gender: 'M' },
  1009: { name: 'Ananya Sen', age: 31, gender: 'F' },
  1010: { name: 'Rohan Mehta', age: 28, gender: 'M' },
};

function mapJavaBookingToRecord(b: JavaRawBooking): BookingRecord {
  const p = PASSENGER_NAMES[b.passengerId] || {
    name: 'Passenger ' + b.passengerId,
    age: 30,
    gender: 'M',
  };

  const travelClass: TravelClass =
    b.journeyClassId === 1 ? 'SL' : b.journeyClassId === 2 ? '3A' : 'CC';

  const isWaitlisted = b.status === 'WAITLIST' || b.status === 'WAITLISTED';
  const status: BookingStatus =
    b.status === 'CONFIRMED'
      ? 'CONFIRMED'
      : isWaitlisted
      ? 'WAITLIST'
      : 'CANCELLED';

  return {
    pnr: b.pnr,
    passengerName: p.name,
    passengerAge: p.age,
    passengerGender: p.gender,
    trainNumber: '12951',
    trainName: 'Mumbai Rajdhani Express',
    sourceStation: 'MMCT',
    destStation: 'NDLS',
    travelDate: '2026-11-01',
    travelClass: travelClass,
    status: status,
    coach: b.status === 'CONFIRMED' ? (b.journeyClassId === 1 ? 'S1' : 'B1') : undefined,
    berthNumber: b.status === 'CONFIRMED' ? b.bookingId : undefined,
    berthType: 'LOWER',
    waitlistNumber: isWaitlisted ? b.bookingId : undefined,
    bookingTimestamp: b.bookedAt || new Date().toISOString(),
    fareAmount: b.fareInr,
  };
}

export default function BookingsPage() {
  const [dataSource, setDataSource] = useState<'JAVA_SIMULATOR' | 'MOCK'>('JAVA_SIMULATOR');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);
  const [copyFeedbackText, setCopyFeedbackText] = useState<string>('');
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPnrs, setSelectedPnrs] = useState<string[]>([]);

  // Create Reservation Modal
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newPassengerId, setNewPassengerId] = useState<number>(1001);
  const [newJourneyClassId, setNewJourneyClassId] = useState<number>(1);
  const [newGroupRef, setNewGroupRef] = useState<string>('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch bookings from Java backend
  const fetchJavaBookings = useCallback(async () => {
    setIsLoading(true);
    setBackendError(null);
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: JavaRawBooking[] = await res.json();
      const mapped = data.map(mapJavaBookingToRecord);
      setBookings(mapped);
      setDataSource('JAVA_SIMULATOR');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Backend unavailable';
      setBackendError(msg);
      // Fallback to mock if simulator is not reachable
      setBookings(INITIAL_MOCK_BOOKINGS);
      setDataSource('MOCK');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      try {
        const res = await fetch('/api/bookings', { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data: JavaRawBooking[] = await res.json();
        if (mounted) {
          setBookings(data.map(mapJavaBookingToRecord));
          setDataSource('JAVA_SIMULATOR');
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setBackendError(err instanceof Error ? err.message : 'Offline');
          setBookings(INITIAL_MOCK_BOOKINGS);
          setDataSource('MOCK');
          setIsLoading(false);
        }
      }
    };
    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  // Switch to Mock explicitly
  const handleUseMock = () => {
    setDataSource('MOCK');
    setBookings(INITIAL_MOCK_BOOKINGS);
    setSelectedBooking(null);
    setSelectedPnrs([]);
  };

  // Switch to Java explicitly
  const handleUseJava = () => {
    fetchJavaBookings();
  };

  // Station name helper
  const getStationName = (code: string) => {
    const s = STATIONS.find((st) => st.code === code);
    return s ? `${s.name} (${code})` : code;
  };

  // Combined search and filters: AND composition
  const filteredBookings = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchesSearch =
        q === '' ||
        b.pnr.toLowerCase().includes(q) ||
        b.passengerName.toLowerCase().includes(q) ||
        b.trainNumber.toLowerCase().includes(q) ||
        b.trainName.toLowerCase().includes(q) ||
        b.sourceStation.toLowerCase().includes(q) ||
        b.destStation.toLowerCase().includes(q);

      const matchesStatus =
        selectedStatus === 'ALL' || b.status === selectedStatus;

      const matchesClass =
        selectedClass === 'ALL' || b.travelClass === selectedClass;

      return matchesSearch && matchesStatus && matchesClass;
    });
  }, [bookings, searchTerm, selectedStatus, selectedClass]);

  const hasActiveFilters =
    searchTerm.trim() !== '' || selectedStatus !== 'ALL' || selectedClass !== 'ALL';

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedClass('ALL');
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedPnrs.length === filteredBookings.length) {
      setSelectedPnrs([]);
    } else {
      setSelectedPnrs(filteredBookings.map((b) => b.pnr));
    }
  };

  const toggleSelectRow = (pnr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedPnrs.includes(pnr)) {
      setSelectedPnrs(selectedPnrs.filter((id) => id !== pnr));
    } else {
      setSelectedPnrs([...selectedPnrs, pnr]);
    }
  };

  const handleCopyPnr = (pnr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(pnr)
        .then(() => {
          setCopiedPnr(pnr);
          setCopyFeedbackText(`PNR ${pnr} copied to clipboard!`);
          setTimeout(() => {
            setCopiedPnr(null);
            setCopyFeedbackText('');
          }, 2500);
        })
        .catch(() => {
          setCopyFeedbackText(`PNR ${pnr} selected`);
          setTimeout(() => setCopyFeedbackText(''), 2500);
        });
    }
  };

  // Real Cancellation via Next.js Proxy
  const handleCancelBooking = async (pnr: string) => {
    if (dataSource === 'MOCK') {
      // Local Mock fallback
      setBookings((prev) =>
        prev.map((b) => (b.pnr === pnr ? { ...b, status: 'CANCELLED' as BookingStatus } : b))
      );
      if (selectedBooking && selectedBooking.pnr === pnr) {
        setSelectedBooking({ ...selectedBooking, status: 'CANCELLED' });
      }
      setShowCancelConfirm(false);
      setCancellationNotice(`Mock cancellation applied to PNR ${pnr}.`);
      setTimeout(() => setCancellationNotice(null), 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pnr: pnr.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || `HTTP ${res.status}`);
      }

      // Success: refresh real bookings from Java simulator
      setCancellationNotice(
        `PNR ${pnr} cancelled in Java In-Memory Simulator. Head of waitlist promoted (if applicable).`
      );
      setShowCancelConfirm(false);
      await fetchJavaBookings();

      if (selectedBooking && selectedBooking.pnr === pnr) {
        setSelectedBooking({ ...selectedBooking, status: 'CANCELLED' });
      }
      setTimeout(() => setCancellationNotice(null), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Cancellation failed';
      setCancellationNotice(`Cancellation Rejected: ${msg}`);
      setTimeout(() => setCancellationNotice(null), 6000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Real Booking Creation via Next.js Proxy
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const payload = {
        journeyClassId: Number(newJourneyClassId),
        passengerId: Number(newPassengerId),
        groupRef: newGroupRef.trim() || undefined,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.message || data.error || `HTTP ${res.status}`;
        const ruleSuffix = data.ruleCode ? ` [${data.ruleCode}]` : '';
        throw new Error(`${errorMsg}${ruleSuffix}`);
      }

      // Success
      setShowCreateModal(false);
      setNewGroupRef('');
      setCancellationNotice(
        `Booking Created! PNR: ${data.pnr} — Status: ${data.status} (Passenger ${data.passengerId})`
      );
      setTimeout(() => setCancellationNotice(null), 5000);
      await fetchJavaBookings();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Booking creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    setCopyFeedbackText(`Exported ${selectedPnrs.length} booking records (CSV export)`);
    setTimeout(() => setCopyFeedbackText(''), 3000);
  };

  // Derived metrics from current state
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const waitlistCount = bookings.filter((b) => b.status === 'WAITLIST').length;
  const racCount = bookings.filter((b) => b.status === 'RAC').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations & Waitlist Operations"
        subtitle="Manage live seat reservations, inspect allocation dossiers, and test cancellation waitlist promotion"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Bookings' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreateError(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#E9663B] dark:bg-[#F0784D] px-3.5 py-1.5 text-xs font-mono font-bold text-white dark:text-[#171815] hover:bg-[#d85830] transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Reservation</span>
            </button>
            <button
              onClick={dataSource === 'JAVA_SIMULATOR' ? handleUseJava : handleUseMock}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] px-3.5 py-1.5 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/50 transition-colors shadow-xs cursor-pointer"
              title="Refresh reservation state from active data source"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D] ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* Backend Mode Banner & DataSource Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3.5 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-mono">
          <Server className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D] shrink-0" />
          <span className="text-[#8C887D] dark:text-[#726F65]">Data Source:</span>
          {dataSource === 'JAVA_SIMULATOR' ? (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-[#4A685F]/15 px-2 py-0.5 font-bold text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/30">
              <span className="h-1.5 w-1.5 rounded-full bg-[#4A685F] dark:text-[#88A69A]" />
              Tier 1 In-Memory Java Simulator (Port 8080)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2 py-0.5 font-bold text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Mock Benchmark Dataset (Offline Fallback{backendError ? `: ${backendError}` : ''})
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={handleUseJava}
            className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${
              dataSource === 'JAVA_SIMULATOR'
                ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/30'
                : 'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815]'
            }`}
          >
            Java Simulator
          </button>
          <button
            onClick={handleUseMock}
            className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${
              dataSource === 'MOCK'
                ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/30'
                : 'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815]'
            }`}
          >
            Mock Dataset
          </button>
        </div>
      </div>

      {/* Backend / Cancellation Toast Notification */}
      {cancellationNotice && (
        <div className="flex items-center justify-between rounded-xl border border-[#4A685F]/40 bg-[#4A685F]/10 p-3.5 text-xs text-[#3D564F] dark:text-[#88A69A] backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A] shrink-0" />
            <span>{cancellationNotice}</span>
          </div>
          <button
            onClick={() => setCancellationNotice(null)}
            className="rounded p-1 hover:bg-[#4A685F]/20 text-[#4A685F] dark:text-[#88A69A]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Copy Feedback Toast */}
      {copyFeedbackText && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-lg border border-[#4A685F]/40 bg-[#FAF8F4] dark:bg-[#242521] px-4 py-2 text-xs font-mono text-[#3D564F] dark:text-[#88A69A] shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
          <Check className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
          <span>{copyFeedbackText}</span>
        </div>
      )}

      {/* Mini KPI Bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#8C887D] dark:text-[#726F65]">Total Bookings</div>
          <div className="text-xl font-bold font-mono text-[#242521] dark:text-[#F0E9DC] mt-1">{totalCount}</div>
        </div>
        <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#4A685F] dark:text-[#88A69A]">Confirmed</div>
          <div className="text-xl font-bold font-mono text-[#4A685F] dark:text-[#88A69A] mt-1">{confirmedCount}</div>
        </div>
        <div className="rounded-xl border border-[#E9663B]/30 bg-[#E9663B]/10 p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#E9663B] dark:text-[#F0784D]">Waitlist (WL)</div>
          <div className="text-xl font-bold font-mono text-[#E9663B] dark:text-[#F0784D] mt-1">{waitlistCount}</div>
        </div>
        <div className="rounded-xl border border-[#3D6875]/30 bg-[#3D6875]/10 p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#3D6875] dark:text-[#78A3AF]">RAC</div>
          <div className="text-xl font-bold font-mono text-[#3D6875] dark:text-[#78A3AF] mt-1">{racCount}</div>
        </div>
        <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-3.5 shadow-xs">
          <div className="text-[11px] font-mono uppercase text-[#8C887D] dark:text-[#726F65]">Cancelled</div>
          <div className="text-xl font-bold font-mono text-[#5E6059] dark:text-[#A39F93] mt-1">{cancelledCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C887D] dark:text-[#726F65]" />
            <input
              type="text"
              placeholder="Search by PNR, passenger name, train number, station..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] h-10 pl-9 pr-4 text-xs text-[#242521] dark:text-[#F0E9DC] placeholder-[#8C887D] dark:placeholder-[#726F65] focus:border-[#E9663B] focus:outline-none focus:ring-1 focus:ring-[#E9663B]"
              aria-label="Search bookings"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#E6DFD3] dark:bg-[#171815] p-0.5 text-xs">
              {(['ALL', 'CONFIRMED', 'WAITLIST', 'RAC', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-[#E9663B]/15 text-[#E9663B] dark:text-[#F0784D] font-semibold shadow-sm'
                      : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
                  }`}
                  aria-pressed={selectedStatus === st}
                >
                  {st}
                </button>
              ))}
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] h-10 px-3 text-xs font-mono text-[#242521] dark:text-[#F0E9DC] focus:border-[#E9663B] focus:outline-none"
              aria-label="Filter by travel class"
            >
              <option value="ALL">All Classes</option>
              <option value="1A">1A (First AC)</option>
              <option value="2A">2A (Second AC)</option>
              <option value="3A">3A (Third AC)</option>
              <option value="SL">SL (Sleeper)</option>
              <option value="CC">CC (Chair Car)</option>
            </select>
          </div>
        </div>

        {/* Active Filter Chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between border-t border-[#D9D0C1] dark:border-[#353731] pt-2.5 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[#8C887D] dark:text-[#726F65]">Active filters:</span>
              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1 rounded bg-[#F4F0E7] dark:bg-[#171815] px-2 py-0.5 text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                  Query: &quot;{searchTerm}&quot;
                  <button onClick={() => setSearchTerm('')} className="hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedStatus !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded bg-[#F4F0E7] dark:bg-[#171815] px-2 py-0.5 text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                  Status: {selectedStatus}
                  <button onClick={() => setSelectedStatus('ALL')} className="hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedClass !== 'ALL' && (
                <span className="inline-flex items-center gap-1 rounded bg-[#F4F0E7] dark:bg-[#171815] px-2 py-0.5 text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                  Class: {selectedClass}
                  <button onClick={() => setSelectedClass('ALL')} className="hover:text-rose-400">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>

            <button
              onClick={clearAllFilters}
              className="text-xs text-[#E9663B] dark:text-[#F0784D] hover:underline underline-offset-2 cursor-pointer"
            >
              Clear all filters ({filteredBookings.length} matching)
            </button>
          </div>
        )}
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521]">
          <Loader2 className="h-6 w-6 animate-spin text-[#E9663B] dark:text-[#F0784D] mb-2" />
          <p className="text-xs font-mono text-[#5E6059] dark:text-[#A39F93]">Loading reservations from simulator...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={
            dataSource === 'JAVA_SIMULATOR'
              ? 'No bookings yet in Java Simulator'
              : 'No booking records match your criteria'
          }
          description={
            dataSource === 'JAVA_SIMULATOR'
              ? 'The in-memory simulator is running fresh. Click "New Reservation" above to book a ticket and test capacity allocation.'
              : 'Try adjusting your search query, status filters, or travel class filters to broaden the results.'
          }
          actionText={dataSource === 'JAVA_SIMULATOR' ? 'Book New Ticket' : 'Clear All Filters'}
          onAction={dataSource === 'JAVA_SIMULATOR' ? () => setShowCreateModal(true) : clearAllFilters}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] backdrop-blur-sm shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono" role="table">
              <thead className="border-b border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] text-[#8C887D] dark:text-[#726F65] uppercase tracking-wider text-[11px]">
                <tr>
                  <th scope="col" className="py-3 px-3 sm:px-4 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-[#8C887D] dark:text-[#726F65] hover:text-[#E9663B] dark:text-[#F0784D]"
                      aria-label="Select all rows"
                    >
                      {selectedPnrs.length === filteredBookings.length && filteredBookings.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th scope="col" className="py-3 px-3 sm:px-4">PNR</th>
                  <th scope="col" className="py-3 px-3 sm:px-4">Passenger</th>
                  <th scope="col" className="py-3 px-3 sm:px-4 hidden md:table-cell">Train Corridor</th>
                  <th scope="col" className="py-3 px-3 sm:px-4">Class</th>
                  <th scope="col" className="py-3 px-3 sm:px-4">Status</th>
                  <th scope="col" className="py-3 px-3 sm:px-4 hidden sm:table-cell">Coach / Seat</th>
                  <th scope="col" className="py-3 px-3 sm:px-4 hidden lg:table-cell">Fare (INR)</th>
                  <th scope="col" className="py-3 px-3 sm:px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D9D0C1] dark:divide-[#353731]">
                {filteredBookings.map((b) => {
                  const isRowSelected = selectedPnrs.includes(b.pnr);
                  return (
                    <tr
                      key={b.pnr}
                      onClick={() => setSelectedBooking(b)}
                      className={`group cursor-pointer transition-colors ${
                        isRowSelected
                          ? 'bg-[#E9663B]/10 dark:bg-[#F0784D]/10'
                          : 'hover:bg-[#F4F0E7] dark:hover:bg-[#171815]'
                      }`}
                    >
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <button
                          onClick={(e) => toggleSelectRow(b.pnr, e)}
                          className="text-[#8C887D] dark:text-[#726F65] hover:text-[#E9663B] dark:text-[#F0784D]"
                        >
                          {isRowSelected ? (
                            <CheckSquare className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-3 sm:px-4 font-bold text-[#E9663B] dark:text-[#F0784D]">
                        <span className="flex items-center gap-1.5">
                          {b.pnr}
                          <button
                            onClick={(e) => handleCopyPnr(b.pnr, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#242521] dark:hover:text-[#F0E9DC] transition-opacity"
                            title="Copy PNR"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-semibold text-[#242521] dark:text-[#F0E9DC] font-sans">{b.passengerName}</div>
                        <div className="text-[11px] text-[#8C887D] dark:text-[#726F65]">{b.passengerAge}y • {b.passengerGender}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                        <div className="font-semibold text-[#242521] dark:text-[#F0E9DC]">{b.trainNumber} - {b.trainName}</div>
                        <div className="text-[11px] text-[#8C887D] dark:text-[#726F65]">{b.sourceStation} → {b.destStation}</div>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <span className="rounded bg-[#E6DFD3] dark:bg-[#171815] px-2 py-0.5 font-bold text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731]">
                          {b.travelClass}
                        </span>
                      </td>
                      <td className="py-3 px-3 sm:px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell text-[#5E6059] dark:text-[#A39F93]">
                        {b.status === 'CONFIRMED' ? (
                          <span>{b.coach || 'S1'} / Seat {b.berthNumber}</span>
                        ) : b.status === 'WAITLIST' ? (
                          <span className="text-[#E9663B] dark:text-[#F0784D] font-bold">WL #{b.waitlistNumber || 1}</span>
                        ) : (
                          <span className="italic text-[#8C887D] dark:text-[#726F65]">Released</span>
                        )}
                      </td>
                      <td className="py-3 px-3 sm:px-4 hidden lg:table-cell font-bold text-[#242521] dark:text-[#F0E9DC]">
                        ₹{b.fareAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <span className="text-[11px] text-[#E9663B] dark:text-[#F0784D] group-hover:underline">
                          Dossier
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating Selection Bar */}
      <SelectionBar
        selectedCount={selectedPnrs.length}
        totalCount={filteredBookings.length}
        onClear={() => setSelectedPnrs([])}
        onExport={handleExportCsv}
        entityName="bookings"
      />

      {/* New Reservation Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowCreateModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 shadow-2xl backdrop-blur-md space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="h-5 w-5 text-[#E9663B] dark:text-[#F0784D]" />
                <h3 className="text-base font-bold text-[#242521] dark:text-[#F0E9DC]">
                  New Reservation (Java Simulator)
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1 text-[#8C887D] dark:text-[#726F65] hover:bg-[#F4F0E7] dark:hover:bg-[#171815]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Reservation Rejection</span>
                </div>
                <p className="mt-1 font-mono text-[11px]">{createError}</p>
              </div>
            )}

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-[#8C887D] dark:text-[#726F65] uppercase text-[10px] mb-1">
                  Select Passenger (Simulator ID)
                </label>
                <select
                  value={newPassengerId}
                  onChange={(e) => setNewPassengerId(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] h-10 px-3 text-xs font-mono text-[#242521] dark:text-[#F0E9DC] focus:border-[#E9663B] focus:outline-none"
                >
                  {Object.entries(PASSENGER_NAMES).map(([id, info]) => (
                    <option key={id} value={id}>
                      {id}: {info.name} ({info.age}y, {info.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#8C887D] dark:text-[#726F65] uppercase text-[10px] mb-1">
                  Travel Class & Inventory Target
                </label>
                <select
                  value={newJourneyClassId}
                  onChange={(e) => setNewJourneyClassId(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] h-10 px-3 text-xs font-mono text-[#242521] dark:text-[#F0E9DC] focus:border-[#E9663B] focus:outline-none"
                >
                  <option value={1}>Class 1: SL — Sleeper (5 physical seats, ₹550.00)</option>
                  <option value={2}>Class 2: 3A — AC 3-Tier (1 physical seat contention, ₹1450.00)</option>
                  <option value={3}>Class 3: GN — General (0 physical seats waitlist, ₹180.00)</option>
                </select>
                <span className="text-[10px] text-[#8C887D] dark:text-[#726F65] mt-1 block">
                  Tip: Booking 3A multiple times demonstrates FIFO waitlist cascade!
                </span>
              </div>

              <div>
                <label className="block text-[#8C887D] dark:text-[#726F65] uppercase text-[10px] mb-1">
                  Group Reference (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. TOUR-GROUP-A"
                  value={newGroupRef}
                  onChange={(e) => setNewGroupRef(e.target.value)}
                  className="w-full rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] h-10 px-3 text-xs text-[#242521] dark:text-[#F0E9DC] focus:border-[#E9663B] focus:outline-none"
                />
              </div>

              <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] px-3.5 py-2 text-xs font-semibold text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#E9663B] dark:bg-[#F0784D] px-4 py-2 text-xs font-bold text-white dark:text-[#171815] hover:bg-[#d85830] transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Confirm Booking</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Dossier Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => {
            setSelectedBooking(null);
            setShowCancelConfirm(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dossier-title"
        >
          <div
            className="w-full max-w-xl rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-[#8C887D] dark:text-[#726F65] flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
                  Passenger Reservation Dossier
                </span>
                <div className="flex items-center gap-3 mt-1.5">
                  <h3 id="dossier-title" className="text-xl font-bold font-mono text-[#E9663B] dark:text-[#F0784D]">
                    PNR: {selectedBooking.pnr}
                  </h3>
                  <button
                    onClick={(e) => handleCopyPnr(selectedBooking.pnr, e)}
                    className="inline-flex items-center gap-1 rounded bg-[#F4F0E7] dark:bg-[#171815] px-2 py-0.5 text-[11px] font-mono text-[#242521] dark:text-[#F0E9DC] border border-[#D9D0C1] dark:border-[#353731] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26] transition-colors"
                  >
                    {copiedPnr === selectedBooking.pnr ? (
                      <>
                        <Check className="h-3 w-3 text-[#4A685F] dark:text-[#88A69A]" />
                        <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                  <StatusBadge status={selectedBooking.status} size="sm" />
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowCancelConfirm(false);
                }}
                className="rounded-lg p-1.5 text-[#8C887D] dark:text-[#726F65] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] hover:text-[#242521] dark:hover:text-[#F0E9DC] transition-colors"
                aria-label="Close dossier modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dossier Content */}
            <div className="mt-5 space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3.5">
                <div>
                  <span className="text-[#8C887D] dark:text-[#726F65] uppercase text-[10px] block">Passenger Name</span>
                  <span className="font-semibold text-[#242521] dark:text-[#F0E9DC] text-sm font-sans">
                    {selectedBooking.passengerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C887D] dark:text-[#726F65] uppercase text-[10px] block">Demographics</span>
                  <span className="text-[#242521] dark:text-[#F0E9DC]">
                    {selectedBooking.passengerAge} Years • {selectedBooking.passengerGender === 'M' ? 'Male' : selectedBooking.passengerGender === 'F' ? 'Female' : 'Other'}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[#8C887D] dark:text-[#726F65]">
                  <span className="flex items-center gap-1.5 font-sans">
                    <MapPin className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
                    Journey Corridor & Train
                  </span>
                  <span className="font-bold text-[#242521] dark:text-[#F0E9DC]">
                    {selectedBooking.trainNumber} - {selectedBooking.trainName}
                  </span>
                </div>
                <div className="text-[#242521] dark:text-[#F0E9DC] text-sm font-bold flex items-center justify-between border-y border-[#D9D0C1] dark:border-[#353731] py-1.5">
                  <span>{getStationName(selectedBooking.sourceStation)}</span>
                  <span className="text-[#8C887D] dark:text-[#726F65] font-normal">→</span>
                  <span>{getStationName(selectedBooking.destStation)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[#8C887D] dark:text-[#726F65] pt-1 text-[11px]">
                  <div>Date: <span className="text-[#242521] dark:text-[#F0E9DC] font-bold">{selectedBooking.travelDate}</span></div>
                  <div>Class: <span className="text-[#E9663B] dark:text-[#F0784D] font-bold">{selectedBooking.travelClass}</span></div>
                  <div>Fare: <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">₹{selectedBooking.fareAmount}</span></div>
                </div>
              </div>

              <div className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-3.5 space-y-2">
                <span className="text-[#8C887D] dark:text-[#726F65] uppercase text-[10px] block font-mono">
                  Allocation & Invariant State (INV-01 / INV-05)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C887D] dark:text-[#726F65]">Coach / Seat:</span>
                  <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">
                    {selectedBooking.status === 'CANCELLED'
                      ? 'Seat Released (Cancelled)'
                      : selectedBooking.coach
                      ? `${selectedBooking.coach} / Seat ${selectedBooking.berthNumber} (${selectedBooking.berthType})`
                      : `Priority Waitlist Queue #${selectedBooking.waitlistNumber || 1}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C887D] dark:text-[#726F65]">Booking Timestamp:</span>
                  <span suppressHydrationWarning className="text-[#5E6059] dark:text-[#A39F93]">
                    {new Date(selectedBooking.bookingTimestamp).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[#8C887D] dark:text-[#726F65]">Backend Authority:</span>
                  <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">
                    {dataSource === 'JAVA_SIMULATOR' ? 'Live Java In-Memory Service' : 'Mock Benchmark Dataset'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-[#D9D0C1] dark:border-[#353731] pt-4">
              <div>
                {selectedBooking.status !== 'CANCELLED' ? (
                  !showCancelConfirm ? (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#C83C2A]/30 bg-[#C83C2A]/10 px-3.5 py-2 text-xs font-semibold text-[#A82B1B] dark:text-[#F45846] hover:bg-[#C83C2A]/20 transition-colors cursor-pointer"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Cancel Reservation</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCancelBooking(selectedBooking.pnr)}
                        disabled={isSubmitting}
                        className="rounded-lg bg-[#C83C2A] dark:bg-[#F45846] px-3 py-1.5 text-xs font-semibold text-white dark:text-[#171815] hover:bg-[#B33525] dark:hover:bg-[#E04B3A] transition-colors cursor-pointer"
                      >
                        {isSubmitting ? 'Cancelling...' : 'Confirm Cancellation'}
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-3 py-1.5 text-xs text-[#5E6059] dark:text-[#A39F93] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26] transition-colors cursor-pointer"
                      >
                        Abort
                      </button>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-[#8C887D] dark:text-[#726F65] italic flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#4A685F] dark:text-[#88A69A]" />
                    Seat Released (Cancelled)
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowCancelConfirm(false);
                }}
                className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-4 py-2 text-xs font-semibold text-[#242521] dark:text-[#F0E9DC] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26] transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
