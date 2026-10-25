'use client';

import React from 'react';
import Link from 'next/link';
import { Database, Cpu, ArrowRight, ShieldCheck } from 'lucide-react';
import { MotionFade } from '@/components/ui/MotionWrapper';

export function LandingArchitecture() {
  return (
    <section id="architecture" className="scroll-mt-24 py-20 sm:py-28 border-t border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
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
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
                <span>Bounded Priority Queues with graceful shutdown (R-13)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
                <span>Thread-safe cross-class concurrent booking latch (R-11)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D]" />
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
                <span className="h-1.5 w-1.5 rounded-full bg-[#4A685F] dark:bg-[#88A69A]" />
                <span>Strict physical capacity check constraints (INV-01)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4A685F] dark:bg-[#88A69A]" />
                <span>Uniqueness constraints on active passenger reservations (INV-08)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4A685F] dark:bg-[#88A69A]" />
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
              className="inline-flex items-center gap-2 rounded-xl bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-6 py-3 text-xs font-display font-extrabold uppercase tracking-wider text-white dark:text-[#171815] shadow-xs cursor-pointer"
            >
              <span>Launch Simulator</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/app/audit"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#D9D0C1] dark:border-[#353731] px-5 py-3 text-xs font-display font-bold uppercase tracking-wider text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/40 transition-colors"
            >
              <span>Audit Specs</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
