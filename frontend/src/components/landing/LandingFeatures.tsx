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
  Train,
} from 'lucide-react';
import { MotionFade } from '@/components/ui/MotionWrapper';

type PillarTab = 'reservation' | 'inventory' | 'disruption' | 'refund';

export function LandingFeatures() {
  const [activeTab, setActiveTab] = useState<PillarTab>('reservation');

  return (
    <section id="features" className="relative isolate scroll-mt-24 py-20 sm:py-28 border-t border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/80 dark:bg-[#1B1D19]/80 transition-colors duration-500 overflow-hidden">
      {/* =========================================================================
          BACKGROUND SYSTEM:
          Layer A — Ambient Lighting (Muted Rail Green & Signal Orange Radial Light Pools)
          Layer B — Extended Railway Engineering Schematic (Mainline, Turnout Crossover, Sleepers & Station Nodes)
          Layer C — Section Tonal Depth & Edge Transition Blends
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Layer A1: Ambient Rail Green Upper Light Field */}
        <div className="absolute -right-24 top-16 h-[550px] w-[750px] rounded-full bg-[#4A685F]/12 dark:bg-[#88A69A]/9 blur-[160px] transition-colors duration-500" />
        
        {/* Layer A2: Ambient Signal Orange Lower Light Field */}
        <div className="absolute -left-24 bottom-24 h-[500px] w-[700px] rounded-full bg-[#E9663B]/10 dark:bg-[#F0784D]/8 blur-[150px] transition-colors duration-500" />

        {/* Layer A3: Central Subtle Depth Luster */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[650px] w-[850px] rounded-full bg-[#8C887D]/5 dark:bg-[#41433B]/6 blur-[180px] transition-colors duration-500" />

        {/* Layer B1: Precision Engineering Dot-Matrix Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#8C887D_1px,transparent_1px)] dark:bg-[radial-gradient(#41433B_1.2px,transparent_1px)] [background-size:28px_28px] opacity-22 dark:opacity-15 transition-opacity duration-500" />

        {/* Layer B2: Railway Schematic Track Alignment SVG (Visible at a glance, Low-Contrast) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-22 dark:opacity-15 transition-opacity duration-500"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1600 900"
        >
          <defs>
            {/* Sleeper Tie Pattern along mainline track */}
            <pattern id="features-sleeper-pattern" width="24" height="20" patternUnits="userSpaceOnUse">
              <line x1="12" y1="2" x2="12" y2="18" stroke="currentColor" strokeWidth="1" opacity="0.6" />
            </pattern>
          </defs>

          {/* Primary Mainline Tracks (Upper Corridor) */}
          <path
            d="M -100 190 C 350 190, 650 310, 1150 310 L 1750 310"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="text-[#8C887D] dark:text-[#726F65]"
          />
          <path
            d="M -100 214 C 350 214, 650 334, 1150 334 L 1750 334"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="text-[#8C887D] dark:text-[#726F65]"
          />

          {/* Sleepers along mainline */}
          <path
            d="M -100 202 C 350 202, 650 322, 1150 322 L 1750 322"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeDasharray="2 18"
            className="text-[#8C887D] dark:text-[#726F65]"
            opacity="0.35"
          />

          {/* Turnout Crossover Siding Track (Sweeping Divergence) */}
          <path
            d="M 420 202 C 600 202, 780 110, 1180 110 L 1750 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="5 5"
            className="text-[#E9663B] dark:text-[#F0784D]"
          />
          <path
            d="M 440 220 C 620 220, 800 128, 1200 128 L 1750 128"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="5 5"
            className="text-[#E9663B] dark:text-[#F0784D]"
            opacity="0.6"
          />

          {/* Lower Secondary Relief Line */}
          <path
            d="M -100 560 C 450 560, 750 440, 1250 440 L 1750 440"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            className="text-[#4A685F] dark:text-[#88A69A]"
            opacity="0.65"
          />
          <path
            d="M -100 582 C 450 582, 750 462, 1250 462 L 1750 462"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            className="text-[#4A685F] dark:text-[#88A69A]"
            opacity="0.65"
          />

          {/* Station / Waypoint Route Nodes */}
          {/* Node 1: Main Diverge Latch */}
          <g transform="translate(420, 202)">
            <circle cx="0" cy="0" r="4.5" fill="#E9663B" />
            <circle cx="0" cy="0" r="9" fill="none" stroke="#E9663B" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />
            <text x="14" y="-8" fill="currentColor" fontSize="8" fontFamily="monospace" letterSpacing="1.5" className="text-[#8C887D] dark:text-[#726F65]">
              SW-01 // MAINLINE DIVERGE
            </text>
          </g>

          {/* Node 2: Interlock Signal Latch */}
          <g transform="translate(780, 110)">
            <circle cx="0" cy="0" r="4" fill="#4A685F" />
            <circle cx="0" cy="0" r="8" fill="none" stroke="#4A685F" strokeWidth="1" opacity="0.7" />
            <text x="12" y="16" fill="currentColor" fontSize="8" fontFamily="monospace" letterSpacing="1.5" className="text-[#8C887D] dark:text-[#726F65]">
              SIG-04 // INTERLOCK ACTIVE
            </text>
          </g>

          {/* Node 3: Relief Line Convergence */}
          <g transform="translate(750, 440)">
            <circle cx="0" cy="0" r="3.5" fill="#E9663B" />
            <circle cx="0" cy="0" r="7" fill="none" stroke="#E9663B" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
            <text x="12" y="-6" fill="currentColor" fontSize="8" fontFamily="monospace" letterSpacing="1.5" className="text-[#8C887D] dark:text-[#726F65]">
              RELIEF // CNB AUTOMATIC
            </text>
          </g>
        </svg>

        {/* Layer B3: Background Telemetry Coordinates */}
        <div className="hidden xl:block absolute left-8 top-12 font-mono text-[9px] uppercase tracking-widest text-[#8C887D]/45 dark:text-[#726F65]/45 select-none space-y-1">
          <div>{"SCHEMATIC // DIVISION-NORTH • INTERLOCK-ACTIVE"}</div>
          <div>{"BLOCK SECTION: CNB-PRYJ AUTOMATIC SIGNAL"}</div>
          <div>{"ALIGNMENT: 1-IN-12 HIGH SPEED CROSSOVER"}</div>
        </div>
        <div className="hidden xl:block absolute right-8 top-12 font-mono text-[9px] uppercase tracking-widest text-[#8C887D]/45 dark:text-[#726F65]/45 select-none text-right space-y-1">
          <div>{"SPEC: INV-01 THROUGH INV-08"}</div>
          <div>{"FAILSAFE: HARD RELATIONAL BOUNDS"}</div>
          <div>{"HEADWAY: 180s FIXED TIME INTERVAL"}</div>
        </div>

        {/* Layer C: Gentle Edge Fades for Section Rhythm */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#F4F0E7]/60 dark:from-[#171815]/60 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#F4F0E7]/60 dark:from-[#171815]/60 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-20">
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
          <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#242521] max-w-3xl mx-auto shadow-xs">
            <button
              onClick={() => setActiveTab('reservation')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all cursor-pointer ${
                activeTab === 'reservation'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:bg-[#FAF8F4] dark:hover:bg-[#171815]'
              }`}
            >
              <Ticket className="h-4 w-4" />
              <span>1. Reservation & Waitlist</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all cursor-pointer ${
                activeTab === 'inventory'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:bg-[#FAF8F4] dark:hover:bg-[#171815]'
              }`}
            >
              <TrainTrack className="h-4 w-4" />
              <span>2. Train Fleet & Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('disruption')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all cursor-pointer ${
                activeTab === 'disruption'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:bg-[#FAF8F4] dark:hover:bg-[#171815]'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              <span>3. Disruption Cascade</span>
            </button>

            <button
              onClick={() => setActiveTab('refund')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-display font-bold uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all cursor-pointer ${
                activeTab === 'refund'
                  ? 'bg-[#E9663B] text-white dark:bg-[#F0784D] dark:text-[#171815] shadow-xs'
                  : 'text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:bg-[#FAF8F4] dark:hover:bg-[#171815]'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>4. Refund Evaluation</span>
            </button>
          </div>

          {/* Active Tab Showcase Panel with Localized Ambient Depth Glow */}
          <div className="relative group">
            {/* Localized Atmospheric Glow behind Active Panel */}
            <div className="absolute -inset-2 sm:-inset-4 rounded-3xl bg-gradient-to-br from-[#E9663B]/10 via-[#4A685F]/5 to-[#4A685F]/10 dark:from-[#F0784D]/12 dark:via-[#4A685F]/4 dark:to-[#88A69A]/12 blur-2xl pointer-events-none -z-10 transition-colors duration-500" />
            
            <div className="rounded-3xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 sm:p-10 shadow-xl backdrop-blur-xs relative z-10 transition-colors duration-300">
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

                {/* Visual Coach Formation Schematic */}
                <div className="lg:col-span-6 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-5 font-mono text-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-2 text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    <span>EXPRESS RAKE FORMATION (TRAIN 12301)</span>
                    <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">94.29% OCCUPANCY</span>
                  </div>

                  {/* Horizontal Train Schematic */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
                    <div className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#E9663B] text-white text-[10px] font-bold flex items-center gap-1 shadow-xs">
                      <Train className="h-3 w-3" />
                      <span>LOCO WAP-7</span>
                    </div>
                    <span className="text-[#8C887D]">•</span>
                    <div className="shrink-0 px-2 py-1.5 rounded-lg bg-[#FAF8F4] dark:bg-[#242521] border border-[#D9D0C1] dark:border-[#353731] text-[10px] text-center">
                      <div className="font-bold text-[#E9663B] dark:text-[#F0784D]">H1</div>
                      <div className="text-[8px] text-[#5E6059] dark:text-[#A39F93]">1A (100%)</div>
                    </div>
                    <span className="text-[#8C887D] dark:text-[#726F65]">•</span>
                    <div className="shrink-0 px-2 py-1.5 rounded-lg bg-[#FAF8F4] dark:bg-[#242521] border border-[#D9D0C1] dark:border-[#353731] text-[10px] text-center">
                      <div className="font-bold text-[#E9663B] dark:text-[#F0784D]">A1</div>
                      <div className="text-[8px] text-[#5E6059] dark:text-[#A39F93]">2A (100%)</div>
                    </div>
                    <span className="text-[#8C887D] dark:text-[#726F65]">•</span>
                    <div className="shrink-0 px-2 py-1.5 rounded-lg bg-[#FAF8F4] dark:bg-[#242521] border border-[#D9D0C1] dark:border-[#353731] text-[10px] text-center">
                      <div className="font-bold text-[#4A685F] dark:text-[#88A69A]">B1-B4</div>
                      <div className="text-[8px] text-[#5E6059] dark:text-[#A39F93]">3A (93.8%)</div>
                    </div>
                    <span className="text-[#8C887D] dark:text-[#726F65]">•</span>
                    <div className="shrink-0 px-2 py-1.5 rounded-lg bg-[#FAF8F4] dark:bg-[#242521] border border-[#D9D0C1] dark:border-[#353731] text-[10px] text-center">
                      <div className="font-bold text-[#5E6059] dark:text-[#A39F93]">PC</div>
                      <div className="text-[8px] text-[#5E6059] dark:text-[#A39F93]">Pantry</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <span>AC First Class (1A)</span>
                      <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">24 / 24 Seats (100%)</span>
                    </div>
                    <div className="w-full bg-[#D9D0C1] dark:bg-[#272823] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#E9663B] h-full rounded-full" style={{ width: '100%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>AC 2-Tier (2A)</span>
                      <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">96 / 96 Seats (100%)</span>
                    </div>
                    <div className="w-full bg-[#D9D0C1] dark:bg-[#272823] h-2 rounded-full overflow-hidden">
                      <div className="bg-[#E9663B] h-full rounded-full" style={{ width: '100%' }} />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span>AC 3-Tier (3A)</span>
                      <span className="font-bold text-[#4A685F] dark:text-[#88A69A]">360 / 384 Seats (93.75%)</span>
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
                    <span className="font-bold flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C83C2A] dark:bg-[#F45846] animate-pulse" />
                      ACTIVE INCIDENT
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="rounded-xl border border-[#C83C2A]/30 bg-[#C83C2A]/10 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#C83C2A] dark:text-[#F45846]">ORIGIN: KANPUR CENTRAL (CNB)</span>
                        <span className="text-[10px] font-bold text-[#C83C2A]">+45 MIN DELAY</span>
                      </div>
                      <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93] pt-0.5">
                        Track circuit glitch • Audio-frequency fail-safe red aspect restriction
                      </div>
                    </div>

                    {/* Downstream propagation visual connector */}
                    <div className="flex items-center justify-center gap-2 text-[10px] text-[#8C887D] dark:text-[#726F65]">
                      <div className="h-4 w-[1px] bg-[#D9D0C1] dark:bg-[#353731]" />
                      <span>Cascade Propagation (15 min Headway Blocks)</span>
                      <div className="h-4 w-[1px] bg-[#D9D0C1] dark:bg-[#353731]" />
                    </div>

                    <div className="rounded-xl border border-[#C57613]/30 bg-[#C57613]/10 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#C57613] dark:text-[#E6962C]">DOWNSTREAM 1: PRAYAGRAJ JN (PRYJ)</span>
                        <span className="text-[10px] font-bold text-[#C57613]">+35 MIN DELAY</span>
                      </div>
                      <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93] pt-0.5">
                        Platform headway hold: Train 12301 delayed behind preceding local rake
                      </div>
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
        </div>

        {/* How It Works Sequence with Interconnected Railway Route Progression Line */}
        <div id="how-it-works" className="scroll-mt-24 pt-10 space-y-12">
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

          {/* Sequential Cards with Continuous Railway Route Pipeline & Waypoint Stations */}
          <div className="relative isolate space-y-6">
            {/* Ambient Lighting Field behind Transaction Sequence */}
            <div className="absolute -inset-6 rounded-3xl bg-gradient-to-r from-[#E9663B]/8 via-[#4A685F]/8 to-[#8C887D]/6 blur-2xl pointer-events-none -z-10 transition-colors duration-500" />

            {/* Desktop Continuous Railway Route Progression Pipeline Header */}
            <div className="hidden md:flex items-center justify-between px-6 py-3 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7]/90 dark:bg-[#171815]/90 text-[10px] font-mono shadow-xs backdrop-blur-xs relative z-10">
              {/* Station 01 */}
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E9663B] opacity-75 motion-reduce:hidden" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#E9663B]" />
                </span>
                <span className="font-bold text-[#E9663B] dark:text-[#F0784D] tracking-wider uppercase">
                  STATION 01 // INGESTION [NDLS]
                </span>
              </div>

              {/* Connecting Track Corridor 1 -> 2 */}
              <div className="flex-1 mx-6 flex items-center justify-center relative">
                {/* Parallel rail tracks */}
                <div className="absolute inset-x-0 h-[8px] flex flex-col justify-between opacity-40">
                  <div className="h-[1px] w-full bg-[#D9D0C1] dark:bg-[#353731]" />
                  <div className="h-[1px] w-full bg-[#D9D0C1] dark:bg-[#353731]" />
                </div>
                {/* Active signal gradient line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-[#E9663B] to-[#4A685F] opacity-80" />
                <span className="relative z-10 px-2 py-0.5 rounded text-[8px] bg-[#FAF8F4] dark:bg-[#242521] border border-[#D9D0C1] dark:border-[#353731] text-[#E9663B] dark:text-[#F0784D] font-mono font-bold tracking-widest flex items-center gap-1 shadow-xs">
                  <span>NON-BLOCKING LATCH</span>
                  <span>→</span>
                </span>
              </div>

              {/* Station 02 */}
              <div className="flex items-center gap-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4A685F] dark:bg-[#88A69A]" />
                <span className="font-bold text-[#4A685F] dark:text-[#88A69A] tracking-wider uppercase">
                  STATION 02 // INVARIANT [CNB]
                </span>
              </div>

              {/* Connecting Track Corridor 2 -> 3 */}
              <div className="flex-1 mx-6 flex items-center justify-center relative">
                {/* Parallel rail tracks */}
                <div className="absolute inset-x-0 h-[8px] flex flex-col justify-between opacity-40">
                  <div className="h-[1px] w-full bg-[#D9D0C1] dark:bg-[#353731]" />
                  <div className="h-[1px] w-full bg-[#D9D0C1] dark:bg-[#353731]" />
                </div>
                {/* Active signal gradient line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-[#4A685F] to-[#8C887D] opacity-80" />
                <span className="relative z-10 px-2 py-0.5 rounded text-[8px] bg-[#FAF8F4] dark:bg-[#242521] border border-[#D9D0C1] dark:border-[#353731] text-[#4A685F] dark:text-[#88A69A] font-mono font-bold tracking-widest flex items-center gap-1 shadow-xs">
                  <span>ACID VERIFY</span>
                  <span>→</span>
                </span>
              </div>

              {/* Station 03 */}
              <div className="flex items-center gap-2.5">
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#8C887D] dark:bg-[#726F65]" />
                <span className="font-bold text-[#242521] dark:text-[#F0E9DC] tracking-wider uppercase">
                  STATION 03 // AUDIT [PRYJ]
                </span>
              </div>
            </div>

            {/* Mobile Railway Route Track Spine (Dedicated vertical track with sleepers along left) */}
            <div className="block md:hidden absolute top-6 bottom-6 left-3 w-6 pointer-events-none z-0">
              {/* Soft vertical ambient glow */}
              <div className="absolute inset-y-0 left-2 w-3 bg-gradient-to-b from-[#E9663B]/20 via-[#4A685F]/20 to-[#8C887D]/15 blur-md" />
              <svg className="h-full w-6 overflow-visible" xmlns="http://www.w3.org/2000/svg">
                {/* Vertical parallel rails */}
                <line x1="6" y1="0" x2="6" y2="100%" stroke="currentColor" strokeWidth="1.5" className="text-[#D9D0C1] dark:text-[#353731]" />
                <line x1="18" y1="0" x2="18" y2="100%" stroke="currentColor" strokeWidth="1.5" className="text-[#D9D0C1] dark:text-[#353731]" />
                {/* Horizontal cross sleepers */}
                <line x1="12" y1="0" x2="12" y2="100%" stroke="currentColor" strokeWidth="14" strokeDasharray="2 16" className="text-[#D9D0C1] dark:text-[#353731]" opacity="0.6" />
                {/* Active route spine */}
                <line x1="12" y1="0" x2="12" y2="100%" stroke="url(#mobile-seq-track-gradient)" strokeWidth="2.5" strokeDasharray="6 4" />
                <defs>
                  <linearGradient id="mobile-seq-track-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#E9663B" />
                    <stop offset="50%" stopColor="#4A685F" />
                    <stop offset="100%" stopColor="#8C887D" />
                  </linearGradient>
                </defs>
                {/* Stage dots */}
                <circle cx="12" cy="15%" r="4" fill="#E9663B" />
                <circle cx="12" cy="50%" r="4" fill="#4A685F" />
                <circle cx="12" cy="85%" r="4" fill="#8C887D" />
              </svg>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 pl-9 md:pl-0">
              <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 space-y-3 shadow-xs hover:border-[#E9663B]/50 transition-colors">
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

              <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 space-y-3 shadow-xs hover:border-[#4A685F]/50 transition-colors">
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

              <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 space-y-3 shadow-xs hover:border-[#242521] dark:hover:border-[#F0E9DC]/40 transition-colors">
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
      </div>
    </section>
  );
}
