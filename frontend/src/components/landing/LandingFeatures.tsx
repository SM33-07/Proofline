'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Ticket,
  TrainTrack,
  AlertTriangle,
  Receipt,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { MotionFade } from '@/components/ui/MotionWrapper';

type PillarTab = 'reservation' | 'inventory' | 'disruption' | 'refund';

export function LandingFeatures() {
  const [activeTab, setActiveTab] = useState<PillarTab>('reservation');

  return (
    <section id="features" className="scroll-mt-24 py-20 sm:py-28 border-t border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/50 dark:bg-[#171815]/50 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Section Header */}
        <MotionFade className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E9663B]/30 bg-[#E9663B]/10 px-3.5 py-1 text-xs font-mono font-semibold text-[#E9663B] dark:text-[#F0784D]">
            OPERATIONAL CAPABILITIES
          </div>
          <h2 className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl lg:text-5xl text-[#242521] dark:text-[#F0E9DC]">
            Engineered for Railway Integrity
          </h2>
          <p className="text-sm sm:text-base text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
            From high-throughput concurrency latching to explainable cancellation audits, each subsystem is modeled against formal invariants and verified in deterministic test harnesses.
          </p>
        </MotionFade>

        {/* Interactive Tabbed Workflow Preview */}
        <div className="space-y-6">
          {/* Tab Navigation Pill Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#242521] max-w-3xl mx-auto">
            <button
              onClick={() => setActiveTab('reservation')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'reservation'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
              }`}
            >
              <Ticket className="h-4 w-4" />
              <span>1. Reservation & Waitlist</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
              }`}
            >
              <TrainTrack className="h-4 w-4" />
              <span>2. Train Fleet & Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('disruption')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'disruption'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>3. Disruption Cascade</span>
            </button>

            <button
              onClick={() => setActiveTab('refund')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'refund'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC]'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>4. Refund Evaluation</span>
            </button>
          </div>

          {/* Active Tab Showcase Panel */}
          <div className="rounded-3xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 sm:p-10 shadow-lg">
            {activeTab === 'reservation' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#E9663B]/10 border border-[#E9663B]/30 px-2.5 py-1 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D]">
                    SPECIFICATION R-11 / R-13
                  </div>
                  <h3 className="font-display font-black uppercase text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">
                    Deterministic Seat Allocation & Waitlist Priority
                  </h3>
                  <p className="text-sm text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                    Eliminates concurrency race conditions during simultaneous booking bursts. Bounded thread-isolated queues process passenger requests and promote waitlist berths sequentially upon cancellations.
                  </p>
                  <ul className="space-y-2 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>Thread-safe cross-class concurrent booking latch (1A, 2A, 3A, SL)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>Automated RAC (Reservation Against Cancellation) promotion pipeline</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>Single Active Booking constraint (INV-08) verified on active PNRs</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/app/bookings"
                      className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:underline"
                    >
                      <span>Explore Live Bookings Ledger</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Visual Workflow Diagram */}
                <div className="lg:col-span-6 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-2 text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    <span>PNR STATE PROGRESSION LIFECYCLE</span>
                    <span className="text-[#4A685F] dark:text-[#88A69A]">DETERMINISTIC FSM</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">1. CONFIRMED (CNF)</div>
                        <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">Coach B2 / Berth 34 (Lower Berth)</div>
                      </div>
                      <span className="rounded bg-[#4A685F] text-white px-2 py-0.5 text-[9px] font-bold">INV-01 COMPLIANT</span>
                    </div>

                    <div className="rounded-xl border border-[#C57613]/30 bg-[#C57613]/10 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">2. RAC (Reservation Against Cancellation)</div>
                        <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">Coach B2 / Berth 37 (Side Lower Split)</div>
                      </div>
                      <span className="rounded bg-[#C57613] text-white px-2 py-0.5 text-[9px] font-bold">AUTO-PROMOTING</span>
                    </div>

                    <div className="rounded-xl border border-[#E9663B]/30 bg-[#E9663B]/10 p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-[#242521] dark:text-[#F0E9DC]">3. WAITLIST (WL-01 to WL-N)</div>
                        <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">Priority Queue • Timestamp ordered</div>
                      </div>
                      <span className="rounded bg-[#E9663B] text-white px-2 py-0.5 text-[9px] font-bold">R-13 BOUNDED QUEUE</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#4A685F]/10 border border-[#4A685F]/30 px-2.5 py-1 text-xs font-mono font-bold text-[#4A685F] dark:text-[#88A69A]">
                    SPECIFICATION R-14 / INV-01
                  </div>
                  <h3 className="font-display font-black uppercase text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">
                    Rake Fleet Topology & Zero-Seat Precision
                  </h3>
                  <p className="text-sm text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                    Maintains coach configuration layouts and physical seat limits across express rakes. Handles zero-seat classes gracefully according to canonical view contracts without division-by-zero errors.
                  </p>
                  <ul className="space-y-2 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>Physical coach upper bounds strictly verified (INV-01)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>Safe zero-seat division contracts tested in R-14 test harness</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>Multi-class rake aggregation across 1A, 2A, 3A, SL, and CC</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/app/inventory"
                      className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:underline"
                    >
                      <span>Inspect Train Inventory</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-2 text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    <span>RAKE CAPACITY BREAKDOWN (TRAIN 12301)</span>
                    <span className="text-[#4A685F] dark:text-[#88A69A]">94.29% OCCUPANCY</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>AC First Class (1A)</span>
                      <span className="font-bold">24 / 24 Seats (100%)</span>
                    </div>
                    <div className="w-full bg-[#D9D0C1] dark:bg-[#272823] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#E9663B] h-full rounded-full" style={{ width: '100%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>AC 2-Tier (2A)</span>
                      <span className="font-bold">96 / 96 Seats (100%)</span>
                    </div>
                    <div className="w-full bg-[#D9D0C1] dark:bg-[#272823] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#E9663B] h-full rounded-full" style={{ width: '100%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>AC 3-Tier (3A)</span>
                      <span className="font-bold">360 / 384 Seats (93.75%)</span>
                    </div>
                    <div className="w-full bg-[#D9D0C1] dark:bg-[#272823] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#4A685F] dark:bg-[#88A69A] h-full rounded-full" style={{ width: '93.75%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1 text-[#8C887D] dark:text-[#726F65]">
                      <span>AC Chair Car (CC) - Zero Seat Contract</span>
                      <span className="font-bold">0 / 0 Seats (0.00% Safe)</span>
                    </div>
                    <div className="w-full bg-[#D9D0C1] dark:bg-[#272823] h-2 rounded-full overflow-hidden">
                      <div className="bg-transparent h-full rounded-full" style={{ width: '0%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'disruption' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#C83C2A]/10 border border-[#C83C2A]/30 px-2.5 py-1 text-xs font-mono font-bold text-[#C83C2A] dark:text-[#F45846]">
                    INCIDENT ENGINE C-01 TO C-04
                  </div>
                  <h3 className="font-display font-black uppercase text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">
                    Headway Modeling & Disruption Cascades
                  </h3>
                  <p className="text-sm text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                    Simulates railway incidents such as track circuit signal failures, rake coach defects, and speed restrictions with automated headway tracking and downstream delay projections.
                  </p>
                  <ul className="space-y-2 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#C83C2A] dark:text-[#F45846]" />
                      <span>Block-section hold orders with automated cascade estimation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#C83C2A] dark:text-[#F45846]" />
                      <span>Manual pilot caution order speed caps (15 km/h interlock rules)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#C83C2A] dark:text-[#F45846]" />
                      <span>Downstream station advisory alerts for PRYJ, DDU, and CNB</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/app/disruptions"
                      className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:underline"
                    >
                      <span>Simulate Incident Cascades</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-2 text-[10px] text-[#C83C2A] dark:text-[#F45846]">
                    <span>INCIDENT C-01 CASCADE SIMULATION</span>
                    <span>ACTIVE</span>
                  </div>

                  <div className="space-y-2">
                    <div className="rounded-lg border border-[#C83C2A]/30 bg-[#C83C2A]/10 p-2.5">
                      <div className="font-bold text-[#C83C2A] dark:text-[#F45846]">ORIGIN: KANPUR CENTRAL (CNB)</div>
                      <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">Track circuit glitch • Audio-frequency fail-safe red aspect (+45m)</div>
                    </div>
                    <div className="text-center text-[10px] text-[#8C887D] dark:text-[#726F65]">↓ Cascade Propagation (15 min Headway Blocks)</div>
                    <div className="rounded-lg border border-[#C57613]/30 bg-[#C57613]/10 p-2.5">
                      <div className="font-bold text-[#C57613] dark:text-[#E6962C]">DOWNSTREAM 1: PRAYAGRAJ JN (PRYJ)</div>
                      <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">Platform headway delay: +35 min • Train 12301 affected</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'refund' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6 space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-lg bg-[#E9663B]/10 border border-[#E9663B]/30 px-2.5 py-1 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D]">
                    EXPLAINABLE DECISION RULES
                  </div>
                  <h3 className="font-display font-black uppercase text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">
                    Deterministic Refund Calculation Engine
                  </h3>
                  <p className="text-sm text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                    Provides an auditable mathematical decision rule for every cancellation. Strict time-to-departure thresholds govern clerkage charges, deduction percentages, and refund amounts.
                  </p>
                  <ul className="space-y-2 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>&gt;48 hours before departure: Flat clerkage deduction (Rule R-01)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>48 to 12 hours before departure: 25% fare deduction (Rule R-02)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                      <span>12 to 4 hours before departure: 50% fare deduction (Rule R-03)</span>
                    </li>
                  </ul>
                  <div className="pt-2">
                    <Link
                      href="/app/bookings"
                      className="inline-flex items-center gap-2 text-xs font-mono font-bold text-[#E9663B] dark:text-[#F0784D] hover:underline"
                    >
                      <span>Test Cancellation Dossier</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>

                <div className="lg:col-span-6 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-5 font-mono text-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-2 text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    <span>EXPLAINABLE REFUND LEDGER</span>
                    <span className="text-[#4A685F] dark:text-[#88A69A]">AUDIT TRACEABLE</span>
                  </div>

                  <table className="w-full text-left text-[11px]">
                    <thead className="border-b border-[#D9D0C1] dark:border-[#353731] text-[#8C887D] dark:text-[#726F65]">
                      <tr>
                        <th className="pb-1.5">Rule</th>
                        <th className="pb-1.5">Window</th>
                        <th className="pb-1.5 text-right">Deduction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9D0C1]/50 dark:divide-[#353731]/50 text-[#242521] dark:text-[#F0E9DC]">
                      <tr>
                        <td className="py-2 font-bold text-[#E9663B] dark:text-[#F0784D]">R-01</td>
                        <td className="py-2">&gt; 48 Hours</td>
                        <td className="py-2 text-right">Flat Clerkage (₹60)</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-[#E9663B] dark:text-[#F0784D]">R-02</td>
                        <td className="py-2">48h to 12h</td>
                        <td className="py-2 text-right">25% Fare Bound</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-[#E9663B] dark:text-[#F0784D]">R-03</td>
                        <td className="py-2">12h to 4h</td>
                        <td className="py-2 text-right">50% Fare Bound</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-bold text-[#C83C2A] dark:text-[#F45846]">R-04</td>
                        <td className="py-2">&lt; 4 Hours</td>
                        <td className="py-2 text-right">100% (No Refund)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How It Works Sequence */}
        <div id="how-it-works" className="scroll-mt-24 pt-10 space-y-10">
          <MotionFade className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#4A685F]/30 bg-[#4A685F]/10 px-3.5 py-1 text-xs font-mono font-semibold text-[#4A685F] dark:text-[#88A69A]">
              SYSTEM SEQUENCE
            </div>
            <h3 className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl text-[#242521] dark:text-[#F0E9DC]">
              How RailSync Processes High-Volume Transactions
            </h3>
            <p className="text-sm text-[#5E6059] dark:text-[#A39F93] font-sans">
              Three-phase pipeline that decouples high-frequency memory latching from relational persistence.
            </p>
          </MotionFade>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-3xl text-[#E9663B] dark:text-[#F0784D]">01</span>
                <span className="font-mono text-[10px] uppercase font-bold text-[#8C887D] dark:text-[#726F65] border border-[#D9D0C1] dark:border-[#353731] px-2 py-0.5 rounded">
                  STAGE 1
                </span>
              </div>
              <h4 className="font-display font-bold text-lg uppercase text-[#242521] dark:text-[#F0E9DC]">
                Concurrency Ingestion
              </h4>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                Multi-threaded booking bursts enter bounded priority queues. The Java concurrency engine acquires non-blocking latches on isolated seat pools.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-3xl text-[#4A685F] dark:text-[#88A69A]">02</span>
                <span className="font-mono text-[10px] uppercase font-bold text-[#8C887D] dark:text-[#726F65] border border-[#D9D0C1] dark:border-[#353731] px-2 py-0.5 rounded">
                  STAGE 2
                </span>
              </div>
              <h4 className="font-display font-bold text-lg uppercase text-[#242521] dark:text-[#F0E9DC]">
                Relational Invariant Gate
              </h4>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                Stored procedures check physical coach bounds (INV-01) and active reservation uniqueness (INV-08). Any overbooking race condition is rejected.
              </p>
            </div>

            <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-display font-black text-3xl text-[#242521] dark:text-[#F0E9DC]">03</span>
                <span className="font-mono text-[10px] uppercase font-bold text-[#8C887D] dark:text-[#726F65] border border-[#D9D0C1] dark:border-[#353731] px-2 py-0.5 rounded">
                  STAGE 3
                </span>
              </div>
              <h4 className="font-display font-bold text-lg uppercase text-[#242521] dark:text-[#F0E9DC]">
                Headway & Audit Resolution
              </h4>
              <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                The incident cascade engine projects downstream timetable headway adjustments and commits an immutable entry into the audit ledger.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
