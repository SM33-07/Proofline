'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  ArrowUpRight,
  Database,
  Code2,
  GraduationCap,
  Compass,
} from 'lucide-react';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';

function LinkedInIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

function GitHubIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer className="relative isolate border-t border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#151613] pt-12 pb-14 text-xs font-mono text-[#5E6059] dark:text-[#A39F93] transition-colors duration-500 overflow-hidden">
      {/* =========================================================================
          BACKGROUND DECORATIVE SYSTEM:
          Terminal Railway Buffer Stop Motif, Engineering Coordinate Grid & Glow
          ========================================================================= */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Soft Terminal Ambient Dual Light Glow */}
        <div className="absolute top-0 left-1/4 -translate-x-1/2 -translate-y-1/2 h-[220px] w-[500px] rounded-full bg-[#E9663B]/8 dark:bg-[#F0784D]/7 blur-[120px] transition-colors duration-500" />
        <div className="absolute top-1/3 right-10 h-[240px] w-[550px] rounded-full bg-[#4A685F]/8 dark:bg-[#668078]/7 blur-[130px] transition-colors duration-500" />

        {/* Technical Coordinate & Track Line Blueprint SVG */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15 dark:opacity-20 transition-opacity duration-500"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="footer-fine-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.6" className="text-[#D9D0C1] dark:text-[#353731]" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-fine-grid)" />

          {/* Coordinate markings & crosshairs */}
          <g className="text-[#8C887D] dark:text-[#726F65]">
            <circle cx="80" cy="60" r="2" fill="currentColor" opacity="0.6" />
            <circle cx="1160" cy="60" r="2" fill="currentColor" opacity="0.6" />
            <path d="M72 60H88M80 52V68" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
            <path d="M1152 60H1168M1160 52V68" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
          </g>
        </svg>

        {/* Top Converging Terminating Buffer Stop SVG */}
        <svg
          className="absolute top-0 inset-x-0 w-full h-14 opacity-25 dark:opacity-20 transition-opacity duration-500"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1200 56"
        >
          {/* Converging terminating parallel tracks */}
          <line x1="0" y1="10" x2="480" y2="10" stroke="currentColor" strokeWidth="1.4" className="text-[#D9D0C1] dark:text-[#353731]" />
          <line x1="0" y1="24" x2="480" y2="24" stroke="currentColor" strokeWidth="1.4" className="text-[#D9D0C1] dark:text-[#353731]" />
          
          <line x1="1200" y1="10" x2="720" y2="10" stroke="currentColor" strokeWidth="1.4" className="text-[#D9D0C1] dark:text-[#353731]" />
          <line x1="1200" y1="24" x2="720" y2="24" stroke="currentColor" strokeWidth="1.4" className="text-[#D9D0C1] dark:text-[#353731]" />

          {/* Central Buffer Stop Bumper Unit */}
          <g transform="translate(600, 17)">
            <line x1="-90" y1="0" x2="-15" y2="0" stroke="currentColor" strokeWidth="12" strokeDasharray="2 10" className="text-[#D9D0C1] dark:text-[#353731]" opacity="0.5" />
            <line x1="15" y1="0" x2="90" y2="0" stroke="currentColor" strokeWidth="12" strokeDasharray="2 10" className="text-[#D9D0C1] dark:text-[#353731]" opacity="0.5" />
            
            <rect x="-16" y="-10" width="32" height="20" rx="2" fill="none" stroke="#E9663B" strokeWidth="1.4" opacity="0.8" />
            <line x1="-16" y1="-10" x2="16" y2="10" stroke="#E9663B" strokeWidth="1" opacity="0.7" />
            <line x1="-16" y1="10" x2="16" y2="-10" stroke="#E9663B" strokeWidth="1" opacity="0.7" />
            <circle cx="0" cy="0" r="2" fill="#E9663B" />
          </g>
        </svg>

        {/* Bottom edge grounding vignette */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/5 dark:from-black/25 to-transparent" />
      </div>

      {/* Refined Top Technical Telemetry Rail Separator */}
      <div className="pointer-events-none relative z-10 flex items-center justify-between px-6 pb-8 text-[9px] font-mono text-[#8C887D]/50 dark:text-[#726F65]/50 select-none">
        <span className="hidden sm:inline">KM 000.0 // TERMINUS • BUFFER STOP 01-A</span>
        <span className="h-[1px] flex-1 mx-4 bg-[#D9D0C1]/60 dark:bg-[#353731]/60" />
        <span className="font-bold tracking-widest uppercase">RAILSYNC · ACADEMIC CAPSTONE SPECIFICATION</span>
        <span className="h-[1px] flex-1 mx-4 bg-[#D9D0C1]/60 dark:bg-[#353731]/60" />
        <span className="hidden sm:inline">MANIPAL UNIVERSITY JAIPUR • DEPT OF CSE</span>
      </div>

      {/* Main Content Area: 3-Column Editorial Layout */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-start">
          
          {/* =========================================================================
              COLUMN A: Project Identity and Developer (lg:col-span-5)
              ========================================================================= */}
          <div className="space-y-6 lg:col-span-5">
            <div className="space-y-4">
              {/* Uppercase Eyebrow Badge */}
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-[#E9663B]/30 dark:border-[#F0784D]/30 bg-[#E9663B]/10 dark:bg-[#F0784D]/10 text-[10px] font-mono font-bold tracking-wider text-[#E9663B] dark:text-[#F0784D] uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E9663B] dark:bg-[#F0784D] animate-pulse" />
                <span>RAILSYNC · ACADEMIC PROJECT</span>
              </div>

              {/* Logo & Wordmark */}
              <div>
                <Link href="/" className="inline-flex items-center group" aria-label="RailSync Home">
                  <RailSyncLogo variant="full" size="md" showTagline={false} />
                </Link>
              </div>

              {/* Prominent Editorial Heading */}
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-[#242521] dark:text-[#F0E9DC] leading-snug">
                Engineering reliable railway reservations.
              </h2>

              {/* Concise Description */}
              <p className="text-sm font-sans text-[#5E6059] dark:text-[#A39F93] leading-relaxed max-w-lg">
                A railway reservation and refund management system exploring concurrency control, relational integrity, transactional workflows, and auditable operations.
              </p>
            </div>

            {/* Dedicated Developer Area Card */}
            <div className="rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/80 dark:bg-[#1D1F1C]/80 backdrop-blur-sm p-4 sm:p-5 space-y-3.5 shadow-xs transition-colors">
              <div className="flex items-center justify-between border-b border-[#D9D0C1]/60 dark:border-[#353731]/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#E9663B]" />
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C887D] dark:text-[#726F65]">
                    DEVELOPER PROFILE
                  </span>
                </div>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#E9663B]/10 dark:bg-[#F0784D]/10 text-[#E9663B] dark:text-[#F0784D] border border-[#E9663B]/20">
                  REG: 2502051952
                </span>
              </div>

              <div>
                <h3 className="font-display font-bold text-base sm:text-lg text-[#242521] dark:text-[#F0E9DC]">
                  Soham More
                </h3>
                <p className="text-xs font-sans text-[#5E6059] dark:text-[#A39F93]">
                  School of Computer Science & Engineering • Manipal University Jaipur
                </p>
              </div>

              {/* Social and Repository External Links */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href="https://www.linkedin.com/in/soham-more-muj/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-white dark:bg-[#242521] hover:bg-[#F4F0E7] dark:hover:bg-[#2A2C27] hover:border-[#E9663B] dark:hover:border-[#E9663B] text-xs font-mono font-semibold text-[#242521] dark:text-[#F0E9DC] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B]"
                  aria-label="Soham More LinkedIn Profile (opens in new tab)"
                >
                  <LinkedInIcon className="h-4 w-4 text-[#0A66C2] group-hover:scale-105 transition-transform" />
                  <span>LinkedIn</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#8C887D] dark:text-[#726F65] group-hover:text-[#E9663B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>

                <a
                  href="https://github.com/SM33-07/RailSync"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-white dark:bg-[#242521] hover:bg-[#F4F0E7] dark:hover:bg-[#2A2C27] hover:border-[#E9663B] dark:hover:border-[#E9663B] text-xs font-mono font-semibold text-[#242521] dark:text-[#F0E9DC] transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B]"
                  aria-label="RailSync GitHub Repository (opens in new tab)"
                >
                  <GitHubIcon className="h-4 w-4 text-[#242521] dark:text-[#F0E9DC] group-hover:scale-105 transition-transform" />
                  <span>GitHub Repository</span>
                  <ArrowUpRight className="h-3.5 w-3.5 text-[#8C887D] dark:text-[#726F65] group-hover:text-[#E9663B] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              </div>
            </div>
          </div>

          {/* =========================================================================
              COLUMN B: Explore RailSync (lg:col-span-3)
              ========================================================================= */}
          <div className="space-y-4 lg:col-span-3">
            <div className="flex items-center gap-2 border-b border-[#D9D0C1]/60 dark:border-[#353731]/60 pb-2">
              <Compass className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8C887D] dark:text-[#726F65]">
                EXPLORE RAILSYNC
              </h3>
            </div>

            <nav className="flex flex-col space-y-1.5 text-xs font-mono" aria-label="Explore RailSync Navigation">
              {/* Simulator Access */}
              <Link
                href="/demo"
                className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-[#D9D0C1] dark:hover:border-[#353731] hover:bg-white/80 dark:hover:bg-[#1D1F1C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B]"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-[#E9663B] dark:text-[#F0784D] group-hover:underline">
                    Simulator Access
                  </span>
                  <span className="text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    Station Master & Engine Demo
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#E9663B] opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>

              <div className="h-[1px] bg-[#D9D0C1]/40 dark:bg-[#353731]/40 mx-2" />

              {/* Bookings Ledger */}
              <Link
                href="/app/bookings"
                className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-[#D9D0C1] dark:hover:border-[#353731] hover:bg-white/80 dark:hover:bg-[#1D1F1C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B]"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-[#242521] dark:text-[#F0E9DC] group-hover:text-[#E9663B] dark:group-hover:text-[#F0784D] transition-colors">
                    Bookings Ledger
                  </span>
                  <span className="text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    PNR Records & Invariant Check
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8C887D] dark:text-[#726F65] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[#E9663B] transition-all" />
              </Link>

              <div className="h-[1px] bg-[#D9D0C1]/40 dark:bg-[#353731]/40 mx-2" />

              {/* Fleet Capacity */}
              <Link
                href="/app/inventory"
                className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-[#D9D0C1] dark:hover:border-[#353731] hover:bg-white/80 dark:hover:bg-[#1D1F1C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B]"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-[#242521] dark:text-[#F0E9DC] group-hover:text-[#E9663B] dark:group-hover:text-[#F0784D] transition-colors">
                    Fleet Capacity
                  </span>
                  <span className="text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    Berth Inventory & Rake Layout
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8C887D] dark:text-[#726F65] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[#E9663B] transition-all" />
              </Link>

              <div className="h-[1px] bg-[#D9D0C1]/40 dark:bg-[#353731]/40 mx-2" />

              {/* Audit Specifications */}
              <Link
                href="/app/audit"
                className="group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-[#D9D0C1] dark:hover:border-[#353731] hover:bg-white/80 dark:hover:bg-[#1D1F1C] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B]"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-[#242521] dark:text-[#F0E9DC] group-hover:text-[#E9663B] dark:group-hover:text-[#F0784D] transition-colors">
                    Audit Specifications
                  </span>
                  <span className="text-[10px] text-[#8C887D] dark:text-[#726F65]">
                    Tamper-Evident Event Log
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-[#8C887D] dark:text-[#726F65] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:text-[#E9663B] transition-all" />
              </Link>
            </nav>
          </div>

          {/* =========================================================================
              COLUMN C: Academic Information Cards (lg:col-span-4)
              ========================================================================= */}
          <div className="space-y-4 md:col-span-2 lg:col-span-4">
            <div className="flex items-center justify-between border-b border-[#D9D0C1]/60 dark:border-[#353731]/60 pb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#4A685F] dark:text-[#88A69A]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#8C887D] dark:text-[#726F65]">
                  ACADEMIC INFORMATION
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65] px-1.5 py-0.5 rounded bg-[#D9D0C1]/30 dark:bg-[#353731]/50">
                CSE CURRICULUM
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3.5">
              {/* Card 1 — RDBMS */}
              <div className="relative overflow-hidden rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/90 dark:bg-[#1D1F1C]/90 p-4 shadow-xs hover:border-[#4A685F]/50 dark:hover:border-[#4A685F]/60 transition-all group">
                {/* Decorative Relational Watermark SVG */}
                <svg
                  className="pointer-events-none absolute -right-2 -bottom-2 h-20 w-20 text-[#4A685F]/10 dark:text-[#4A685F]/15 group-hover:text-[#4A685F]/20 transition-colors"
                  viewBox="0 0 100 100"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="50" cy="22" r="7" fill="currentColor" />
                  <circle cx="22" cy="72" r="7" fill="currentColor" />
                  <circle cx="78" cy="72" r="7" fill="currentColor" />
                  <path d="M50 29L26 67M50 29L74 67M29 72H71" stroke="currentColor" strokeWidth="1.8" />
                </svg>

                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#4A685F]/10 dark:bg-[#4A685F]/20 text-[#4A685F] dark:text-[#88A69A]">
                        <Database className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#4A685F]/30 bg-[#4A685F]/10 text-[#4A685F] dark:text-[#88A69A]">
                        CSC2131
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65]">
                      COURSE MODULE
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm sm:text-base text-[#242521] dark:text-[#F0E9DC] leading-snug">
                      Relational Database Management Systems
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-[#D9D0C1]/60 dark:border-[#353731]/60 space-y-1 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] font-sans">
                        Faculty Guide:
                      </span>
                      <span className="font-mono font-semibold text-[#242521] dark:text-[#F0E9DC]">
                        Ms. Stuti Pandey
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] font-sans">
                        Institution:
                      </span>
                      <span className="text-[#5E6059] dark:text-[#A39F93] font-sans text-right">
                        Manipal University Jaipur
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2 — OOPS */}
              <div className="relative overflow-hidden rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/90 dark:bg-[#1D1F1C]/90 p-4 shadow-xs hover:border-[#E9663B]/50 dark:hover:border-[#E9663B]/60 transition-all group">
                {/* Decorative Class/Object Hierarchy Watermark SVG */}
                <svg
                  className="pointer-events-none absolute -right-2 -bottom-2 h-20 w-20 text-[#E9663B]/10 dark:text-[#E9663B]/15 group-hover:text-[#E9663B]/20 transition-colors"
                  viewBox="0 0 100 100"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect x="32" y="14" width="36" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="10" y="60" width="34" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
                  <rect x="56" y="60" width="34" height="20" rx="3" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M50 34V48M50 48H27V60M50 48H73V60" stroke="currentColor" strokeWidth="1.8" />
                </svg>

                <div className="relative z-10 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#E9663B]/10 dark:bg-[#E9663B]/20 text-[#E9663B] dark:text-[#F0784D]">
                        <Code2 className="h-4 w-4" />
                      </div>
                      <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#E9663B]/30 bg-[#E9663B]/10 text-[#E9663B] dark:text-[#F0784D]">
                        CSC2104
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65]">
                      COURSE MODULE
                    </span>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm sm:text-base text-[#242521] dark:text-[#F0E9DC] leading-snug">
                      Object-Oriented Programming
                    </h4>
                  </div>

                  <div className="pt-2 border-t border-[#D9D0C1]/60 dark:border-[#353731]/60 space-y-1 text-xs">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] font-sans">
                        Faculty Guide:
                      </span>
                      <span className="font-mono font-semibold text-[#242521] dark:text-[#F0E9DC]">
                        Mrs. Shikha Sharma
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[#8C887D] dark:text-[#726F65] text-[11px] font-sans">
                        Institution:
                      </span>
                      <span className="text-[#5E6059] dark:text-[#A39F93] font-sans text-right">
                        Manipal University Jaipur
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            BOTTOM CLOSING STRIP: Restrained Final Identity & Disclaimers
            ========================================================================= */}
        <div className="border-t border-[#D9D0C1] dark:border-[#353731] pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-[11px] text-[#8C887D] dark:text-[#726F65]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-sans">
            <span className="font-semibold text-[#242521] dark:text-[#F0E9DC] font-mono">
              RailSync · 2026–2027
            </span>
            <span>•</span>
            <span className="text-[#5E6059] dark:text-[#A39F93]">Manipal University Jaipur</span>
            <span className="hidden sm:inline">•</span>
            <span className="text-[#8C887D] dark:text-[#726F65]">Department of Computer Science & Engineering</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[#4A685F] dark:text-[#88A69A] flex items-center gap-1.5 font-medium">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              Academic simulation — not a live railway reservation service.
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
