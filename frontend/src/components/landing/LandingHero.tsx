'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Train,
} from 'lucide-react';
import { MotionFade } from '@/components/ui/MotionWrapper';

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24">
      {/* Warm atmospheric backdrop gradient */}
      <div className="pointer-events-none absolute left-1/4 top-0 -translate-y-1/3 h-[500px] w-[800px] rounded-full bg-[#E9663B]/6 dark:bg-[#F0784D]/5 blur-[140px]" />
      <div className="pointer-events-none absolute right-1/4 top-1/2 h-[350px] w-[600px] rounded-full bg-[#4A685F]/6 dark:bg-[#88A69A]/5 blur-[130px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Asymmetric Editorial Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Editorial Headline, Narrative, and CTAs (5 cols) */}
          <MotionFade className="lg:col-span-5 flex flex-col justify-between space-y-6 sm:space-y-8 py-2">
            <div className="space-y-5">
              {/* Eyebrow badge matching brand board */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E9663B]/30 bg-[#E9663B]/10 px-3.5 py-1 text-xs font-mono font-semibold text-[#E9663B] dark:text-[#F0784D] shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D] animate-ping" />
                <span className="uppercase tracking-widest text-[10px] sm:text-[11px]">
                  Indian Railways Simulation Prototype • M1.4
                </span>
              </div>

              {/* Bold Condensed Editorial Headline */}
              <h1 className="font-display font-black uppercase tracking-tight text-[#242521] dark:text-[#F0E9DC] text-5xl sm:text-6xl xl:text-7xl leading-[0.92]">
                Smarter Rail Travel <br />
                <span className="text-[#E9663B] dark:text-[#F0784D]">
                  For a Connected India
                </span>
              </h1>

              {/* Supporting narrative description */}
              <p className="text-sm sm:text-base text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
                An operational simulation testbed for high-concurrency seat reservation, disruption cascades, and relational invariant guarantees. Engineered to benchmark thread-safe transactions against peak Indian Railways load.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-7 py-3.5 text-sm font-display font-extrabold uppercase tracking-wider text-white dark:text-[#171815] shadow-md hover:shadow-[0_6px_20px_rgba(233,102,59,0.35)] transition-all cursor-pointer"
                >
                  <span>Launch Simulator</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] px-6 py-3.5 text-sm font-display font-bold uppercase tracking-wider text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/50 dark:hover:border-[#F0784D]/50 transition-colors shadow-xs"
                >
                  <span>Explore Features</span>
                </a>
              </div>
            </div>

            {/* Bottom Stat Strip & Disclaimer */}
            <div className="pt-6 border-t border-[#D9D0C1] dark:border-[#353731] space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl text-[#242521] dark:text-[#F0E9DC]">5</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Scheduled Trains</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl text-[#242521] dark:text-[#F0E9DC]">6</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Travel Classes</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl text-[#242521] dark:text-[#F0E9DC]">29</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Test Scenarios</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl text-[#4A685F] dark:text-[#88A69A]">100%</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Mock Data Spec</div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65]">
                * Prototype simulation environment • Runs against isolated typed in-memory contracts
              </div>
            </div>
          </MotionFade>

          {/* Right Column: Dominant Locomotive Visual Showcase (7 cols) */}
          <MotionFade delay={0.15} className="lg:col-span-7 flex">
            <div className="relative w-full rounded-3xl border border-[#D9D0C1] dark:border-[#353731] overflow-hidden shadow-2xl bg-[#171815] min-h-[440px] sm:min-h-[500px] flex flex-col justify-between">
              {/* Locomotive Image as the Hero Visual */}
              <Image
                src="/images/locomotive_hero.jpg"
                alt="Indian Railways WAP-7 electric locomotive on mainline tracks"
                fill
                priority
                className="object-cover object-center brightness-[0.95] dark:brightness-[0.88]"
              />

              {/* Atmospheric subtle vignette overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#171815]/90 via-[#171815]/20 to-[#171815]/40" />

              {/* Top Bar inside the Hero Image */}
              <div className="relative z-10 p-4 sm:p-6 flex items-start justify-between">
                <div className="inline-flex items-center gap-2 rounded-xl bg-[#171815]/80 border border-white/15 px-3.5 py-1.5 text-xs font-mono text-white backdrop-blur-md shadow-sm">
                  <Train className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
                  <span className="font-bold">Train 12301 Howrah Rajdhani</span>
                  <span className="text-[#88A69A] hidden sm:inline">• 94.3% Rake Occupancy</span>
                </div>
              </div>

              {/* Vertical Signal Orange Translucent Banner Accent matching Brand Board */}
              <div className="absolute top-0 right-4 sm:right-8 bottom-0 w-24 sm:w-36 bg-gradient-to-b from-[#E9663B]/85 to-[#E9663B]/65 dark:from-[#F0784D]/85 dark:to-[#F0784D]/65 backdrop-blur-xs flex flex-col justify-between p-3.5 sm:p-5 text-white border-x border-white/20 select-none z-10">
                <div className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-white/95">
                  INDIAN RAILWAYS
                </div>
                <div className="space-y-1">
                  <div className="font-display font-black text-xs sm:text-sm uppercase tracking-wider leading-tight">
                    Reserve
                  </div>
                  <div className="font-display font-black text-xs sm:text-sm uppercase tracking-wider leading-tight">
                    Track
                  </div>
                  <div className="font-display font-black text-xs sm:text-sm uppercase tracking-wider leading-tight">
                    Resolve
                  </div>
                </div>
              </div>

              {/* Bottom Telemetry & Route Curve Overlay */}
              <div className="relative z-10 p-4 sm:p-6 mr-28 sm:mr-44 space-y-3">
                {/* Route Curve SVG connecting HWH to NDLS */}
                <div className="hidden sm:block">
                  <svg viewBox="0 0 460 70" className="w-full h-16 overflow-visible">
                    {/* Background track line */}
                    <path
                      d="M 15 50 C 120 50, 180 18, 320 18 L 440 18"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.3)"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                    {/* Highlighted active route */}
                    <path
                      d="M 15 50 C 120 50, 180 18, 250 18"
                      fill="none"
                      stroke="#E9663B"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Station points */}
                    <circle cx="15" cy="50" r="4.5" fill="#FFFFFF" stroke="#E9663B" strokeWidth="2" />
                    <text x="15" y="68" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">HWH (16:50)</text>

                    <circle cx="170" cy="30" r="3.5" fill="#E9663B" />
                    <text x="150" y="46" fill="#F0E9DC" fontSize="8" fontFamily="monospace">PRYJ (+35m)</text>

                    {/* Animated moving train indicator at Kanpur */}
                    <circle cx="250" cy="18" r="7" fill="rgba(233, 102, 59, 0.4)" className="animate-ping motion-reduce:animate-none" />
                    <circle cx="250" cy="18" r="4.5" fill="#E9663B" stroke="#FFFFFF" strokeWidth="1.5" />
                    <text x="230" y="8" fill="#E9663B" fontSize="9" fontFamily="monospace" fontWeight="bold">CNB (Caution +45m)</text>

                    <circle cx="440" cy="18" r="4.5" fill="#FFFFFF" stroke="#88A69A" strokeWidth="2" />
                    <text x="405" y="36" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold">NDLS (10:05)</text>
                  </svg>
                </div>

                {/* Bottom Status Annotations */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-white/90">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#88A69A] animate-pulse" />
                    <span>Headway Latch: Nominal</span>
                    <span className="text-white/40">•</span>
                    <span>R-11 / R-12 Spec: Latch Target</span>
                  </div>
                  <div className="text-[10px] text-white/60">
                    Simulated Route View
                  </div>
                </div>
              </div>
            </div>
          </MotionFade>
        </div>
      </div>
    </section>
  );
}
