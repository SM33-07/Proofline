'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Train,
  Sparkles,
} from 'lucide-react';
import { MotionFade } from '@/components/ui/MotionWrapper';
import { useTheme } from '@/components/ThemeContext';
import Grainient from '@/components/backgrounds/Grainient';
import Aurora from '@/components/backgrounds/Aurora';

// Initial Signal & Graphite palettes for WebGL backgrounds
const GRAINIENT_DARK = ['#171815', '#2A1D17', '#4E2B1E', '#7D3E24', '#3F5950'];
const GRAINIENT_LIGHT = ['#F4F0E7', '#EFE6DA', '#E5CEBD', '#D4AF96', '#BACDC5'];
const AURORA_DARK = ['#E9663B', '#4A685F', '#E9663B'];
const AURORA_LIGHT = ['#E9663B', '#668078', '#E9663B'];

export function LandingHero() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <section className="relative isolate overflow-hidden pt-24 pb-16 sm:pt-32 sm:pb-24 lg:pt-36 lg:pb-28 transition-colors duration-500">
      {/* =========================================================================
          BACKGROUND SYSTEM:
          Layer A — Atmospheric Lighting (Aurora Horizon Ribbon + Bounded Grainient Surface)
          Layer B — Railway Engineering Linework (Coordinate Grid, Parallel Tracks & Telemetry)
          Layer C — Section Depth & Tonal Transitions
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {/* Layer A1: Restrained Aurora Horizon Ribbon (Transparent WebGL Atmosphere) */}
        <div
          className="absolute top-0 inset-x-0 h-[380px] sm:h-[440px] pointer-events-none overflow-hidden opacity-80 dark:opacity-75 transition-opacity duration-500"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0) 100%)',
          }}
        >
          <Aurora
            colorStops={isDark ? AURORA_DARK : AURORA_LIGHT}
            amplitude={0.45}
            blend={0.5}
            height={0.35}
            speed={0.18}
            glow={0.5}
            scale={1.1}
            brightness={0.85}
            layers={2}
            direction="top"
            mouseInteraction={false}
            intro={true}
            opacity={isDark ? 0.65 : 0.55}
            lightMode={!isDark}
            paused={false}
            dpr={1.25}
          />
        </div>

        {/* Layer A2: Bounded Grainient Surface (Contained behind editorial headline column) */}
        <div
          className="absolute -top-8 -left-8 sm:left-0 lg:left-4 w-[680px] max-w-[95vw] h-[620px] pointer-events-none overflow-hidden rounded-3xl opacity-75 dark:opacity-70 transition-opacity duration-500"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 80%)',
            maskImage: 'radial-gradient(ellipse at 30% 35%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.7) 45%, rgba(0,0,0,0) 80%)',
          }}
        >
          <Grainient
            colors={isDark ? GRAINIENT_DARK : GRAINIENT_LIGHT}
            type="linear"
            angle={55}
            bands={1}
            speed={0.12}
            flow={0.3}
            scale={1.2}
            softness={1}
            silk={0.25}
            grainAmount={0.04}
            grainSize={1.2}
            grainAnimated={false}
            contrast={1.1}
            saturation={0.85}
            variation={0}
            interactive={false}
            stir={0}
            clickSwirl={false}
            intro={true}
            lightMode={!isDark}
            dpr={1.25}
          />
        </div>

        {/* Layer A3: Ambient Color Fields (Signal Orange top-left & Rail Green center-right) */}
        <div className="absolute left-1/12 top-0 -translate-y-1/3 h-[520px] w-[750px] rounded-full bg-[#E9663B]/10 dark:bg-[#F0784D]/8 blur-[150px] transition-colors duration-500" />
        <div className="absolute right-1/12 top-1/3 h-[420px] w-[650px] rounded-full bg-[#4A685F]/8 dark:bg-[#88A69A]/7 blur-[140px] transition-colors duration-500" />

        {/* Layer B1: Engineering Coordinate Dot-Matrix Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#8C887D_1px,transparent_1px)] dark:bg-[radial-gradient(#41433B_1px,transparent_1px)] [background-size:28px_28px] opacity-25 dark:opacity-20 transition-opacity duration-500" />

        {/* Layer B2: Subtle Railway Track Engineering Linework with Cross Sleepers */}
        <svg
          className="absolute inset-0 h-full w-full opacity-15 dark:opacity-10 transition-opacity duration-500"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="hero-track-grid" width="140" height="140" patternUnits="userSpaceOnUse">
              {/* Parallel Track Rails */}
              <line x1="0" y1="70" x2="140" y2="70" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 8" />
              <line x1="70" y1="0" x2="70" y2="140" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 8" />
              {/* Sleeper Cross-ties */}
              <line x1="30" y1="66" x2="30" y2="74" stroke="currentColor" strokeWidth="1" />
              <line x1="110" y1="66" x2="110" y2="74" stroke="currentColor" strokeWidth="1" />
              <line x1="66" y1="30" x2="74" y2="30" stroke="currentColor" strokeWidth="1" />
              <line x1="66" y1="110" x2="74" y2="110" stroke="currentColor" strokeWidth="1" />
              {/* Route Node Intersection */}
              <circle cx="70" cy="70" r="1.8" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-track-grid)" className="text-[#8C887D] dark:text-[#726F65]" />
        </svg>

        {/* Layer B3: Restrained Railway Telemetry Coordinates (Subtle background details) */}
        <div className="hidden xl:block absolute left-8 top-14 font-mono text-[9px] uppercase tracking-widest text-[#8C887D]/40 dark:text-[#726F65]/40 select-none space-y-1">
          <div>{"TRK-01 // NDLS 28°36'N 77°13'E"}</div>
          <div>CORRIDOR: NORTHERN MAIN LINE</div>
          <div>ELEV: 214M • ALIGN: NOMINAL</div>
        </div>

        <div className="hidden xl:block absolute right-8 top-14 font-mono text-[9px] uppercase tracking-widest text-[#8C887D]/40 dark:text-[#726F65]/40 select-none text-right space-y-1">
          <div>TELEMETRY: R-11 / R-13 LATCH</div>
          <div>RAKE: 12301 HWH RAJDHANI</div>
          <div>STATUS: STEADY CONCURRENCY</div>
        </div>

        {/* Layer C: Soft bottom gradient transition into next section */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#FAF8F4]/30 dark:to-[#171815]/40 pointer-events-none" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Editorial Split Hero Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          
          {/* Left Column: Editorial Headline, Narrative, and CTAs (5 cols) */}
          <MotionFade className="lg:col-span-5 flex flex-col justify-between space-y-6 sm:space-y-8 py-2 z-10">
            <div className="space-y-5">
              {/* Eyebrow badge matching brand board with railway divider */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-[#E9663B]/30 bg-[#E9663B]/10 px-3.5 py-1 text-xs font-mono font-semibold text-[#E9663B] dark:text-[#F0784D] shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D] animate-ping motion-reduce:animate-none" />
                <span className="uppercase tracking-widest text-[10px] sm:text-[11px]">
                  Indian Railways Simulation Prototype • M1.4
                </span>
              </div>

              {/* Bold Condensed Editorial Headline with Natural Responsive Wrapping */}
              <h1 className="font-display font-black uppercase tracking-tight text-[#242521] dark:text-[#F0E9DC] text-4xl sm:text-6xl xl:text-7xl leading-[0.95] text-balance transition-colors duration-300">
                Smarter Rail Travel <br className="hidden sm:inline" />
                <span className="text-[#E9663B] dark:text-[#F0784D]">
                  For a Connected India
                </span>
              </h1>

              {/* Supporting narrative description */}
              <p className="text-sm sm:text-base text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed max-w-xl transition-colors duration-300">
                An operational simulation testbed for high-concurrency seat reservation, disruption cascades, and relational invariant guarantees. Engineered to benchmark thread-safe transactions against peak Indian Railways load.
              </p>

              {/* Primary & Secondary CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/demo"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-7 py-3.5 text-sm font-display font-extrabold uppercase tracking-wider text-white dark:text-[#171815] shadow-md hover:shadow-[0_8px_25px_rgba(233,102,59,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Launch Simulator</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#features"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/80 dark:bg-[#242521]/80 backdrop-blur-xs px-6 py-3.5 text-sm font-display font-bold uppercase tracking-wider text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/60 dark:hover:border-[#F0784D]/60 hover:text-[#E9663B] dark:hover:text-[#F0784D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all shadow-xs active:scale-[0.99]"
                >
                  <span>Explore Features</span>
                </a>
              </div>
            </div>

            {/* Bottom Stat Strip & Disclaimer */}
            <div className="pt-6 border-t border-[#D9D0C1] dark:border-[#353731] space-y-3 transition-colors duration-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">5</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Scheduled Trains</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">6</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Travel Classes</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl sm:text-3xl text-[#242521] dark:text-[#F0E9DC]">29</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Test Scenarios</div>
                </div>
                <div className="space-y-0.5">
                  <div className="font-display font-black text-2xl sm:text-3xl text-[#4A685F] dark:text-[#88A69A]">100%</div>
                  <div className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] uppercase">Mock Data Spec</div>
                </div>
              </div>
              <div className="text-[10px] font-mono text-[#5E6059] dark:text-[#A39F93]">
                * Prototype simulation environment • Runs against isolated typed in-memory contracts
              </div>
            </div>
          </MotionFade>

          {/* Right Column: Immersive Locomotive Visual Showcase (7 cols) */}
          <MotionFade delay={0.15} className="lg:col-span-7 relative flex justify-center">
            {/* Soft Ambient Glow behind the Locomotive */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#E9663B]/15 via-transparent to-[#4A685F]/15 dark:from-[#F0784D]/15 dark:to-[#88A69A]/15 blur-2xl -z-10" />

            {/* Locomotive Showcase Container - Immersive photographic frame matching reference composition */}
            <div className="relative w-full h-[480px] sm:h-[550px] lg:h-[600px] rounded-2xl lg:rounded-3xl overflow-hidden border border-[#D9D0C1]/80 dark:border-[#353731] shadow-2xl bg-[#171815] transition-colors duration-500 group">
              
              {/* Light Mode Locomotive Asset: Daylight Indian Railways WAP-7 locomotive on curved tracks (First Attachment) */}
              <div
                className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
                  isDark ? 'opacity-0 pointer-events-none' : 'opacity-100'
                }`}
              >
                <Image
                  src="/images/locomotive_light.webp?v=wap7-guman"
                  alt="Daylight Indian Railways WAP-7 locomotive on curved tracks with green scenery"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Dark Mode Locomotive Asset: Cinematic night-time Indian Railways locomotive with illuminated headlights (Second Attachment) */}
              <div
                className={`absolute inset-0 transition-opacity duration-600 ease-in-out ${
                  isDark ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              >
                <Image
                  src="/images/locomotive_dark.webp?v=wap7-night"
                  alt="Cinematic night-time Indian Railways locomotive with illuminated headlights and dark surroundings"
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-center"
                />
              </div>

              {/* Atmospheric bottom vignette for route curve and annotation contrast */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 sm:h-52 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10" />

              {/* Distinctive Vertical Translucent Signal Orange Glass Panel (Aligned to left edge) */}
              <div
                className="absolute inset-y-0 left-0 w-24 sm:w-32 lg:w-36 z-20 flex flex-col justify-between p-3 sm:p-4 select-none
                bg-[#E9663B]/70 dark:bg-[#F0784D]/60
                backdrop-blur-md
                border-r border-white/25 dark:border-white/20
                shadow-[4px_0_24px_rgba(0,0,0,0.25)]
                transition-colors duration-500"
              >
                {/* Top Brand Label */}
                <div className="space-y-0.5">
                  <div className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-white drop-shadow-xs">
                    Indian
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-mono tracking-[0.2em] uppercase font-bold text-white drop-shadow-xs">
                    Railways
                  </div>
                  <div className="text-[7.5px] sm:text-[8px] font-mono tracking-widest text-white/80 uppercase pt-0.5 hidden sm:block">
                    Concurrency Lab
                  </div>
                </div>

                {/* Center Graphic Accent */}
                <div className="hidden sm:flex flex-col items-center gap-1.5 opacity-60">
                  <div className="h-8 w-[1px] bg-white/60" />
                  <Sparkles className="h-3 w-3 text-white" />
                  <div className="h-8 w-[1px] bg-white/60" />
                </div>

                {/* Bottom Core Pillars: Reserve, Track, Resolve */}
                <div className="space-y-1">
                  <div className="font-display font-black text-sm sm:text-base uppercase tracking-wider leading-none text-white drop-shadow-xs">
                    Reserve
                  </div>
                  <div className="font-display font-black text-sm sm:text-base uppercase tracking-wider leading-none text-white drop-shadow-xs">
                    Track
                  </div>
                  <div className="font-display font-black text-sm sm:text-base uppercase tracking-wider leading-none text-white drop-shadow-xs">
                    Resolve
                  </div>
                  <div className="pt-2 text-[7.5px] sm:text-[8.5px] font-mono tracking-wider text-white/90 uppercase font-semibold">
                    Safer • Faster
                  </div>
                </div>
              </div>

              {/* Top Bar: Floating Telemetry Glass Pill (Offset past the vertical panel) */}
              <div className="absolute top-3.5 sm:top-5 left-27 sm:left-36 lg:left-40 right-3.5 sm:right-5 z-20 flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-black/60 dark:bg-black/75 border border-white/15 px-3 py-1.5 text-xs font-mono text-white backdrop-blur-md shadow-sm">
                  <Train className="h-3.5 w-3.5 text-[#E9663B] dark:text-[#F0784D]" />
                  <span className="font-bold">Train 12301 Howrah Rajdhani</span>
                  <span className="text-[#88A69A] hidden md:inline font-semibold">• 94.3% Rake Occupancy</span>
                </div>

                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-black/60 dark:bg-black/75 border border-white/15 px-2.5 py-1 text-[10px] font-mono text-white/95 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#88A69A] animate-pulse" />
                  <span>ACTIVE RAKE</span>
                </div>
              </div>

              {/* Bottom Telemetry & Supporting Railway Route Overlay (Offset past the vertical panel) */}
              <div className="absolute bottom-3.5 sm:bottom-5 left-27 sm:left-36 lg:left-40 right-3.5 sm:right-5 z-20 space-y-2">
                {/* Delicate Route Schematic SVG connecting HWH to NDLS */}
                <div className="hidden sm:block">
                  <svg viewBox="0 0 460 62" className="w-full h-13 overflow-visible drop-shadow-md">
                    {/* Background track line */}
                    <path
                      d="M 15 42 C 120 42, 180 16, 320 16 L 440 16"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.35)"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                    {/* Highlighted active route segment */}
                    <path
                      d="M 15 42 C 120 42, 180 16, 250 16"
                      fill="none"
                      stroke="#E9663B"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* Station points */}
                    <circle cx="15" cy="42" r="4.5" fill="#FFFFFF" stroke="#E9663B" strokeWidth="2" />
                    <text x="15" y="58" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold" className="drop-shadow-xs">HWH (16:50)</text>

                    <circle cx="170" cy="25" r="3.5" fill="#E9663B" stroke="#FFFFFF" strokeWidth="1" />
                    <text x="145" y="40" fill="#F0E9DC" fontSize="8" fontFamily="monospace" className="drop-shadow-xs">PRYJ (+35m)</text>

                    {/* Animated moving train indicator at Kanpur */}
                    <circle cx="250" cy="16" r="7" fill="rgba(233, 102, 59, 0.5)" className="animate-ping motion-reduce:animate-none" />
                    <circle cx="250" cy="16" r="4.5" fill="#E9663B" stroke="#FFFFFF" strokeWidth="2" />
                    <text x="210" y="7" fill="#F0784D" fontSize="9" fontFamily="monospace" fontWeight="bold" className="drop-shadow-xs">CNB (Caution +45m)</text>

                    <circle cx="440" cy="16" r="4.5" fill="#FFFFFF" stroke="#88A69A" strokeWidth="2" />
                    <text x="400" y="31" fill="#FFFFFF" fontSize="9" fontFamily="monospace" fontWeight="bold" className="drop-shadow-xs">NDLS (10:05)</text>
                  </svg>
                </div>

                {/* Bottom Status Annotations */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-mono text-white/95">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#88A69A] animate-pulse" />
                    <span className="font-semibold">Headway Latch: Nominal</span>
                    <span className="text-white/40">•</span>
                    <span className="hidden md:inline">R-11 / R-12 Spec: Latch Target</span>
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-white/70">
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
