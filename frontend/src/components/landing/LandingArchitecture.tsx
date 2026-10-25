'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Cpu, ArrowRight, ShieldCheck, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
import { MotionFade } from '@/components/ui/MotionWrapper';

export function LandingArchitecture() {
  return (
    <section id="architecture" className="relative isolate scroll-mt-24 py-20 sm:py-28 border-t border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] transition-colors duration-500 overflow-hidden">
      {/* =========================================================================
          BACKGROUND SYSTEM:
          Layer A — Atmospheric Lighting (Targeted Tier 1 Orange & Tier 2 Rail-Green Light Pools)
          Layer B — Engineering Blueprint Grid, Network Bus Topology, Radar Beacons & Dimension Linework
          Layer C — Tonal Section Depth (#F4F0E7 light, #171815 dark)
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Layer A1: Localized Signal Orange Light Pool under Tier 1 (Java Concurrency) */}
        <div className="absolute left-[5%] lg:left-[12%] top-[48%] -translate-y-1/2 h-[520px] w-[620px] rounded-full bg-[#E9663B]/13 dark:bg-[#F0784D]/11 blur-[150px] transition-colors duration-500" />

        {/* Layer A2: Localized Rail Green Light Pool under Tier 2 (MySQL Persistence) */}
        <div className="absolute right-[5%] lg:right-[12%] top-[50%] -translate-y-1/2 h-[520px] w-[620px] rounded-full bg-[#4A685F]/13 dark:bg-[#88A69A]/11 blur-[150px] transition-colors duration-500" />

        {/* Layer A3: Central IPC Bridge Latch Glow */}
        <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 h-[260px] w-[340px] rounded-full bg-gradient-to-r from-[#E9663B]/12 via-[#4A685F]/10 to-[#4A685F]/12 blur-[90px] transition-colors duration-500" />

        {/* Layer B1: Blueprint Technical Coordinate Grid & Registration Marks */}
        <div className="absolute inset-0 bg-[radial-gradient(#8C887D_1px,transparent_1px)] dark:bg-[radial-gradient(#41433B_1.2px,transparent_1px)] [background-size:28px_28px] opacity-22 dark:opacity-15 transition-opacity duration-500" />
        
        {/* Faint Blueprint Major Grid Lines (112px intervals) */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8C887D10_1px,transparent_1px),linear-gradient(to_bottom,#8C887D10_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#41433B18_1px,transparent_1px),linear-gradient(to_bottom,#41433B18_1px,transparent_1px)] [background-size:112px_112px] opacity-40 transition-opacity duration-500" />

        {/* Layer B2: Network Bus Geometry SVG (Crisp IPC paths, Nodes & Dimension Lines) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-25 dark:opacity-18 transition-opacity duration-500"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1600 900"
          preserveAspectRatio="none"
        >
          {/* Main High-Speed IPC Horizontal Bus Line (Double parallel lines) */}
          <line x1="80" y1="580" x2="1520" y2="580" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 6" className="text-[#8C887D] dark:text-[#726F65]" />
          <line x1="80" y1="592" x2="1520" y2="592" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 6" className="text-[#8C887D] dark:text-[#726F65]" />

          {/* Tier 1 Branch Drops (Signal Orange) */}
          <line x1="420" y1="460" x2="420" y2="700" stroke="#E9663B" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="432" y1="460" x2="432" y2="700" stroke="#E9663B" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

          {/* Tier 2 Branch Drops (Rail Green) */}
          <line x1="1180" y1="460" x2="1180" y2="700" stroke="#4A685F" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="1192" y1="460" x2="1192" y2="700" stroke="#4A685F" strokeWidth="1" strokeDasharray="4 4" opacity="0.6" />

          {/* Central Interconnect Radar Rings around IPC Bridge */}
          <g transform="translate(800, 586)">
            <circle cx="0" cy="0" r="14" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-[#8C887D] dark:text-[#726F65]" />
            <circle cx="0" cy="0" r="28" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 3" className="text-[#E9663B] dark:text-[#F0784D]" opacity="0.75" />
            <circle cx="0" cy="0" r="44" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="6 6" className="text-[#4A685F] dark:text-[#88A69A]" opacity="0.5" />
            {/* Center crosshair */}
            <line x1="-8" y1="0" x2="8" y2="0" stroke="currentColor" strokeWidth="1" className="text-[#E9663B]" />
            <line x1="0" y1="-8" x2="0" y2="8" stroke="currentColor" strokeWidth="1" className="text-[#E9663B]" />
          </g>

          {/* Bus Interconnect Nodes */}
          <circle cx="420" cy="586" r="4.5" fill="#E9663B" />
          <circle cx="420" cy="586" r="9" fill="none" stroke="#E9663B" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />

          <circle cx="1180" cy="586" r="4.5" fill="#4A685F" />
          <circle cx="1180" cy="586" r="9" fill="none" stroke="#4A685F" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />

          {/* Corner Blueprint Crosshairs */}
          <g className="text-[#8C887D] dark:text-[#726F65]" opacity="0.5">
            <path d="M 40 40 L 60 40 M 50 30 L 50 50" stroke="currentColor" strokeWidth="1" />
            <path d="M 1540 40 L 1560 40 M 1550 30 L 1550 50" stroke="currentColor" strokeWidth="1" />
            <path d="M 40 840 L 60 840 M 50 830 L 50 850" stroke="currentColor" strokeWidth="1" />
            <path d="M 1540 840 L 1560 840 M 1550 830 L 1550 850" stroke="currentColor" strokeWidth="1" />
          </g>
        </svg>

        {/* Layer B3: Topology Coordinate Telemetry */}
        <div className="hidden xl:block absolute left-8 top-12 font-mono text-[9px] uppercase tracking-widest text-[#8C887D]/45 dark:text-[#726F65]/45 select-none space-y-1">
          <div>{"BUS-TOPOLOGY // IPC-SOCKET-01 • RING BUFFER"}</div>
          <div>{"IN-MEMORY: NON-BLOCKING LOCK FREE CAS"}</div>
          <div>{"LATENCY: < 0.4MS TIER-1 LATCH SPEC"}</div>
        </div>
        <div className="hidden xl:block absolute right-8 top-12 font-mono text-[9px] uppercase tracking-widest text-[#8C887D]/45 dark:text-[#726F65]/45 select-none text-right space-y-1">
          <div>{"PERSISTENCE: RDBMS ISOLATION LEVEL"}</div>
          <div>{"SERIALIZABLE ACID LEDGER AUDIT"}</div>
          <div>{"INVARIANTS: INV-01 THRU INV-14 BOUNDS"}</div>
        </div>

        {/* Layer C: Subtle Edge Transition Vignettes */}
        <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-[#FAF8F4]/40 dark:from-[#1B1D19]/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#FAF8F4]/40 dark:from-[#151613]/50 to-transparent pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        <MotionFade className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#4A685F]/30 bg-[#4A685F]/10 px-3.5 py-1 text-xs font-mono font-semibold text-[#4A685F] dark:text-[#88A69A]">
            SYSTEM TOPOLOGY
          </div>
          <h2 className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl lg:text-5xl text-[#242521] dark:text-[#F0E9DC]">
            Dual-Tier Decoupled Architecture
          </h2>
          <p className="text-sm sm:text-base text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
            RailSync strictly separates in-memory high-frequency seat scheduling from ACID-compliant relational persistence.
          </p>
        </MotionFade>

        {/* Technical Blueprint Architecture Diagram */}
        <div className="rounded-3xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 sm:p-8 space-y-6 shadow-md font-mono">
          <div className="flex flex-wrap items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-3 text-xs">
            <span className="font-bold text-[#242521] dark:text-[#F0E9DC] tracking-wider uppercase">
              DECOUPLED MEMORY-PERSISTENCE INTERFACE BLUEPRINT
            </span>
            <div className="flex items-center gap-3 text-[10px] text-[#8C887D] dark:text-[#726F65]">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
                Tier 1 (Memory)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4A685F] dark:bg-[#88A69A]" />
                Tier 2 (Relational)
              </span>
            </div>
          </div>

          {/* Interactive Topology Visual Grid */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center text-xs">
            {/* Java In-Memory Engine (Col 1-5) */}
            <div className="md:col-span-5 rounded-2xl border border-[#E9663B]/30 bg-[#F4F0E7] dark:bg-[#171815] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#E9663B] dark:text-[#F0784D]">
                  <Cpu className="h-4 w-4" />
                  <span>TIER 1: JAVA CONCURRENCY</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#E9663B]/10 text-[#E9663B] dark:text-[#F0784D] border border-[#E9663B]/20">
                  Sub-ms Latch
                </span>
              </div>

              <div className="space-y-2 text-[11px] text-[#5E6059] dark:text-[#A39F93]">
                <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#242521] p-2 border border-[#D9D0C1]/60 dark:border-[#353731] flex items-center justify-between">
                  <span>Thread Isolated Queue</span>
                  <span className="text-[#E9663B] font-bold">50 Workers</span>
                </div>
                <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#242521] p-2 border border-[#D9D0C1]/60 dark:border-[#353731] flex items-center justify-between">
                  <span>Cross-Class Lock Latch</span>
                  <span className="text-[#E9663B] font-bold">R-11 Compliant</span>
                </div>
                <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#242521] p-2 border border-[#D9D0C1]/60 dark:border-[#353731] flex items-center justify-between">
                  <span>Graceful Queue Shutdown</span>
                  <span className="text-[#E9663B] font-bold">R-13 Contract</span>
                </div>
              </div>
            </div>

            {/* Connecting Invariant Bridge (Col 6) */}
            <div className="md:col-span-1 flex flex-col items-center justify-center py-2 text-center">
              <div className="hidden md:flex flex-col items-center gap-1.5">
                <div className="h-4 w-[1.5px] bg-[#D9D0C1] dark:bg-[#353731]" />
                <div className="p-2 rounded-full border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#171815] text-[#242521] dark:text-[#F0E9DC] shadow-xs">
                  <ArrowLeftRight className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                </div>
                <span className="text-[9px] uppercase font-bold text-[#8C887D] dark:text-[#726F65]">
                  IPC LATCH
                </span>
                <div className="h-4 w-[1.5px] bg-[#D9D0C1] dark:bg-[#353731]" />
              </div>
              <div className="md:hidden flex items-center gap-2 text-[10px] text-[#8C887D] dark:text-[#726F65]">
                <ArrowLeftRight className="h-3.5 w-3.5 text-[#E9663B]" />
                <span>Inter-Tier IPC Bridge</span>
              </div>
            </div>

            {/* MySQL Relational Persistence (Col 7-11) */}
            <div className="md:col-span-5 rounded-2xl border border-[#4A685F]/30 bg-[#F4F0E7] dark:bg-[#171815] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-[#4A685F] dark:text-[#88A69A]">
                  <Database className="h-4 w-4" />
                  <span>TIER 2: MYSQL PERSISTENCE</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#4A685F]/10 text-[#4A685F] dark:text-[#88A69A] border border-[#4A685F]/20">
                  ACID Stored Proc
                </span>
              </div>

              <div className="space-y-2 text-[11px] text-[#5E6059] dark:text-[#A39F93]">
                <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#242521] p-2 border border-[#D9D0C1]/60 dark:border-[#353731] flex items-center justify-between">
                  <span>Physical Coach Bound Check</span>
                  <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">INV-01 Enforced</span>
                </div>
                <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#242521] p-2 border border-[#D9D0C1]/60 dark:border-[#353731] flex items-center justify-between">
                  <span>Single Active Reservation</span>
                  <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">INV-08 Verified</span>
                </div>
                <div className="rounded-lg bg-[#FAF8F4] dark:bg-[#242521] p-2 border border-[#D9D0C1]/60 dark:border-[#353731] flex items-center justify-between">
                  <span>Zero-Seat Division Safety</span>
                  <span className="text-[#4A685F] dark:text-[#88A69A] font-bold">R-14 Safe Views</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Tier Breakdown Boxes */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Tier 1 Box */}
          <div className="rounded-3xl border border-[#E9663B]/40 bg-[#FAF8F4] dark:bg-[#242521] p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#E9663B]/30 bg-[#E9663B]/10 p-3 text-[#E9663B] dark:text-[#F0784D]">
                  <Cpu className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#E9663B] dark:text-[#F0784D] font-bold tracking-wider">
                    Tier 1 Core
                  </span>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wide text-[#242521] dark:text-[#F0E9DC]">
                    Java In-Memory Concurrency Engine
                  </h3>
                </div>
              </div>
              <span className="rounded bg-[#E9663B]/10 px-2.5 py-1 text-[11px] font-mono text-[#E9663B] dark:text-[#F0784D] font-bold border border-[#E9663B]/20">
                Java 26 OOP
              </span>
            </div>

            <p className="text-xs text-[#5E6059] dark:text-[#A39F93] leading-relaxed font-sans">
              Engineered for sub-millisecond latching during peak booking rushes. Maintains non-blocking waitlist queues, thread-isolated seat pools, and deterministic inventory counters.
            </p>

            <ul className="space-y-2.5 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                <span>Bounded Priority Queues with graceful shutdown (R-13)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                <span>Thread-safe cross-class concurrent booking latch (R-11)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
                <span>Zero external database dependencies during memory simulation</span>
              </li>
            </ul>
          </div>

          {/* Tier 2 Box */}
          <div className="rounded-3xl border border-[#4A685F]/40 bg-[#FAF8F4] dark:bg-[#242521] p-6 sm:p-8 space-y-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-[#4A685F]/30 bg-[#4A685F]/10 p-3 text-[#4A685F] dark:text-[#88A69A]">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#4A685F] dark:text-[#88A69A] font-bold tracking-wider">
                    Tier 2 Core
                  </span>
                  <h3 className="font-display font-bold text-xl uppercase tracking-wide text-[#242521] dark:text-[#F0E9DC]">
                    MySQL 8.0 Relational Persistence
                  </h3>
                </div>
              </div>
              <span className="rounded bg-[#4A685F]/10 px-2.5 py-1 text-[11px] font-mono text-[#4A685F] dark:text-[#88A69A] font-bold border border-[#4A685F]/20">
                Candidate SRS v1.0
              </span>
            </div>

            <p className="text-xs text-[#5E6059] dark:text-[#A39F93] leading-relaxed font-sans">
              Provides transactional durability with stored procedures (<code>book_seat</code>, <code>cancel_booking</code>), normalized rake reporting views (<code>v_journey_occupancy</code>), and schema triggers.
            </p>

            <ul className="space-y-2.5 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                <span>Strict physical capacity check constraints (INV-01)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                <span>Uniqueness constraints on active passenger reservations (INV-08)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                <span>Zero-seat class safe division contracts verified in R-14 preflight</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Demo Disclaimer & Launch Action */}
        <div className="rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase text-[#E9663B] dark:text-[#F0784D]">
              <ShieldCheck className="h-4 w-4" />
              <span>Simulation Environment Disclaimer</span>
            </div>
            <p className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
              RailSync runs as a local prototype for system design evaluation and concurrency benchmarking. Data displayed across dashboards and routes is deterministic demo data and does not connect to live Indian Railways production telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/demo"
              className="inline-flex items-center gap-2 rounded-xl bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-6 py-3 text-xs font-display font-extrabold uppercase tracking-wider text-white dark:text-[#171815] shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/app/audit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D0C1] dark:border-[#353731] px-5 py-3 text-xs font-display font-bold uppercase tracking-wider text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] active:scale-[0.98] transition-all"
            >
              <span>Audit Specs</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
