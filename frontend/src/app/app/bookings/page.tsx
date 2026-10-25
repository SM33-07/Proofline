'use client';

import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Search,
  Copy,
  Check,
  X,
  MapPin,
  RotateCcw,
  AlertCircle,
  Ban,
  ShieldCheck,
  Sparkles,
  CheckSquare,
  Square,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SelectionBar } from '@/components/shell/SelectionBar';
import { BOOKINGS as INITIAL_BOOKINGS, STATIONS } from '@/lib/mock-data';
import { BookingRecord, BookingStatus } from '@/lib/types';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedBooking, setSelectedBooking] = useState<BookingRecord | null>(null);
  const [copiedPnr, setCopiedPnr] = useState<string | null>(null);
  const [copyFeedbackText, setCopyFeedbackText] = useState<string>('');
  const [cancellationNotice, setCancellationNotice] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedPnrs, setSelectedPnrs] = useState<string[]>([]);

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

  // Demo-Only Cancellation Interaction
  const handleDemoCancel = (pnr: string) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.pnr === pnr) {
          return {
            ...b,
            status: 'CANCELLED' as BookingStatus,
          };
        }
        return b;
      })
    );

    if (selectedBooking && selectedBooking.pnr === pnr) {
      setSelectedBooking({
        ...selectedBooking,
        status: 'CANCELLED',
      });
    }

    setShowCancelConfirm(false);
    setCancellationNotice(
      `Demo cancellation applied to PNR ${pnr}. Updated in-memory UI state only; live backend was not modified.`
    );
    setTimeout(() => {
      setCancellationNotice(null);
    }, 5000);
  };

  const handleResetDemoData = () => {
    setBookings(INITIAL_BOOKINGS);
    setSelectedBooking(null);
    setShowCancelConfirm(false);
    setSelectedPnrs([]);
    setCancellationNotice('In-memory booking state has been reset to default mock dataset.');
    setTimeout(() => setCancellationNotice(null), 4000);
  };

  const handleExportCsv = () => {
    setCopyFeedbackText(`Exported ${selectedPnrs.length} booking records (Demo CSV simulation)`);
    setTimeout(() => setCopyFeedbackText(''), 3000);
  };

  // Derived metrics from current in-memory state
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === 'CONFIRMED').length;
  const waitlistCount = bookings.filter((b) => b.status === 'WAITLIST').length;
  const racCount = bookings.filter((b) => b.status === 'RAC').length;
  const cancelledCount = bookings.filter((b) => b.status === 'CANCELLED').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservations & Waitlist Operations"
        subtitle="Search passenger bookings, inspect seat allocations, and test in-memory demo cancellations"
        breadcrumbs={[
          { label: 'Operations', href: '/app' },
          { label: 'Bookings' },
        ]}
        actions={
          <button
            onClick={handleResetDemoData}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] px-3.5 py-1.5 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/50 transition-colors shadow-xs"
            title="Reset in-memory dataset to initial mock data"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
            <span>Reset Demo State</span>
          </button>
        }
      />

      {/* Demo Notification / Toast Feedback */}
      {cancellationNotice && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-300 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
            <span>{cancellationNotice}</span>
          </div>
          <button
            onClick={() => setCancellationNotice(null)}
            className="rounded p-1 hover:bg-amber-500/20 text-amber-400"
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
          <div className="text-[11px] font-mono uppercase text-[#8C887D] dark:text-[#726F65]">Total Sample</div>
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
            {/* Outline Status Filter Tabs from Reference 1 */}
            <div className="flex rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#E6DFD3] dark:bg-[#171815] p-0.5 text-xs">
              {(['ALL', 'CONFIRMED', 'WAITLIST', 'RAC', 'CANCELLED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-mono transition-colors ${
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

            {/* Class Filter Dropdown */}
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

        {/* Active Filter Chips & Reset Bar */}
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
              className="text-xs text-[#E9663B] dark:text-[#F0784D] hover:underline underline-offset-2"
            >
              Clear all filters ({filteredBookings.length} matching)
            </button>
          </div>
        )}
      </div>

      {/* Bookings Table with Checkbox Row Selection from Reference 2 */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No booking records match your criteria"
          description="Try adjusting your search query, status filters, or travel class filters to broaden the results."
          actionText="Clear All Filters"
          onAction={clearAllFilters}
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
                  <th scope="col" className="py-3 px-4 sm:px-6">PNR</th>
                  <th scope="col" className="py-3 px-4">Passenger</th>
                  <th scope="col" className="py-3 px-4">Train & Route</th>
                  <th scope="col" className="py-3 px-4">Class</th>
                  <th scope="col" className="py-3 px-4">Allocation</th>
                  <th scope="col" className="py-3 px-4">Status</th>
                  <th scope="col" className="py-3 px-4 text-right">Fare</th>
                  <th scope="col" className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DFD3] dark:divide-[#272823]">
                {filteredBookings.map((b) => {
                  const isSelected = selectedPnrs.includes(b.pnr);
                  return (
                    <tr
                      key={b.pnr}
                      onClick={() => {
                        setSelectedBooking(b);
                        setShowCancelConfirm(false);
                      }}
                      className={`cursor-pointer transition-colors group ${
                        isSelected ? 'bg-[#E9663B]/10 dark:bg-[#F0784D]/15' : 'hover:bg-[#F4F0E7] dark:hover:bg-[#171815]'
                      }`}
                    >
                      <td className="py-3.5 px-3 sm:px-4 text-center" onClick={(e) => toggleSelectRow(b.pnr, e)}>
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D] mx-auto" />
                        ) : (
                          <Square className="h-4 w-4 text-[#8C887D] dark:text-[#726F65] group-hover:text-[#242521] dark:group-hover:text-[#F0E9DC] mx-auto" />
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{b.pnr}</span>
                          <button
                            onClick={(e) => handleCopyPnr(b.pnr, e)}
                            className="rounded p-1 text-[#8C887D] dark:text-[#726F65] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] hover:text-[#242521] dark:hover:text-[#F0E9DC] transition-colors"
                            title="Copy PNR to clipboard"
                            aria-label={`Copy PNR ${b.pnr}`}
                          >
                            {copiedPnr === b.pnr ? (
                              <Check className="h-3.5 w-3.5 text-[#4A685F] dark:text-[#88A69A]" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#242521] dark:text-[#F0E9DC] font-sans">{b.passengerName}</div>
                        <div className="text-[11px] text-[#8C887D] dark:text-[#726F65] font-sans">
                          {b.passengerAge}y / {b.passengerGender === 'M' ? 'Male' : b.passengerGender === 'F' ? 'Female' : 'Other'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">{b.trainNumber}</div>
                        <div className="text-[11px] text-[#8C887D] dark:text-[#726F65]">
                          {b.sourceStation} → {b.destStation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded bg-[#E6DFD3] dark:bg-[#2A2C26] px-2 py-0.5 text-[#242521] dark:text-[#F0E9DC] font-bold border border-[#D9D0C1] dark:border-[#353731]">
                          {b.travelClass}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {b.status === 'CONFIRMED' && (
                          <div className="text-[#242521] dark:text-[#F0E9DC]">
                            <span className="font-bold text-[#4A685F] dark:text-[#88A69A]">{b.coach}</span>
                            <span className="text-[#8C887D] dark:text-[#726F65]"> - Seat {b.berthNumber}</span>
                            <span className="text-[10px] text-[#8C887D] dark:text-[#726F65] block font-sans">
                              {b.berthType}
                            </span>
                          </div>
                        )}
                        {b.status === 'WAITLIST' && (
                          <div className="font-bold text-[#C57613] dark:text-[#E6962C]">
                            WL-{b.waitlistNumber?.toString().padStart(2, '0')}
                          </div>
                        )}
                        {b.status === 'RAC' && (
                          <div className="font-bold text-[#3D6875] dark:text-[#78A3AF]">
                            RAC-{b.racNumber?.toString().padStart(2, '0')} ({b.coach})
                          </div>
                        )}
                        {b.status === 'CANCELLED' && (
                          <div className="text-[#8C887D] dark:text-[#726F65] italic">Seat Released (Demo)</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-[#242521] dark:text-[#F0E9DC]">
                        ₹{b.fareAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-center">
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

      {/* Floating Bottom Selection Bar from Reference 2 */}
      <SelectionBar
        selectedCount={selectedPnrs.length}
        totalCount={filteredBookings.length}
        onClear={() => setSelectedPnrs([])}
        onExport={handleExportCsv}
        entityName="bookings"
      />

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
                  Allocation & Invariant Check (INV-08)
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C887D] dark:text-[#726F65]">Coach / Seat:</span>
                  <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">
                    {selectedBooking.status === 'CANCELLED'
                      ? 'Seat Released (Cancelled)'
                      : selectedBooking.coach
                      ? `${selectedBooking.coach} / Seat ${selectedBooking.berthNumber} (${selectedBooking.berthType})`
                      : `Priority Waitlist Queue #${selectedBooking.waitlistNumber}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#8C887D] dark:text-[#726F65]">Booking Timestamp:</span>
                  <span suppressHydrationWarning className="text-[#5E6059] dark:text-[#A39F93]">
                    {new Date(selectedBooking.bookingTimestamp).toLocaleString('en-US')}
                  </span>
                </div>
                <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-[#8C887D] dark:text-[#726F65]">Single Active Check (INV-08):</span>
                  <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">SPEC TARGET — Single Active Rule</span>
                </div>
              </div>

              <div className="rounded-lg border border-[#C57613]/30 bg-[#C57613]/10 p-3 text-[11px] text-[#A25F0B] dark:text-[#E6962C] flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-[#C57613] dark:text-[#E6962C] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold uppercase tracking-wider block font-mono">
                    DEMO-ONLY INTERACTION NOTICE
                  </span>
                  <span>
                    Any cancellation performed below updates local in-memory UI state only. The live MySQL database, Java backend service, and physical coach inventory remain completely isolated.
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
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#C83C2A]/30 bg-[#C83C2A]/10 px-3.5 py-2 text-xs font-semibold text-[#A82B1B] dark:text-[#F45846] hover:bg-[#C83C2A]/20 transition-colors"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      <span>Cancel Booking (Demo Only)</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDemoCancel(selectedBooking.pnr)}
                        className="rounded-lg bg-[#C83C2A] dark:bg-[#F45846] px-3 py-1.5 text-xs font-semibold text-white dark:text-[#171815] hover:bg-[#B33525] dark:hover:bg-[#E04B3A] transition-colors"
                      >
                        Confirm Demo Cancellation
                      </button>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-3 py-1.5 text-xs text-[#5E6059] dark:text-[#A39F93] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26] transition-colors"
                      >
                        Abort
                      </button>
                    </div>
                  )
                ) : (
                  <span className="text-xs text-[#8C887D] dark:text-[#726F65] italic flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-[#4A685F] dark:text-[#88A69A]" />
                    Seat Released (Cancelled in Demo State)
                  </span>
                )}
              </div>

              <button
                onClick={() => {
                  setSelectedBooking(null);
                  setShowCancelConfirm(false);
                }}
                className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-4 py-2 text-xs font-semibold text-[#242521] dark:text-[#F0E9DC] hover:bg-[#E6DFD3] dark:hover:bg-[#2A2C26] transition-colors"
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
