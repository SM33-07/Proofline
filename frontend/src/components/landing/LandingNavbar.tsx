'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { ArrowRight, Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';

const NAV_LINKS = [
  { name: 'Features', href: '#features' },
  { name: 'How It Works', href: '#how-it-works' },
  { name: 'Architecture', href: '#architecture' },
  { name: 'Audit Specs', href: '/app/audit' },
];

export function LandingNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setIsScrolled(latest > 40);
  });

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center w-full px-3 sm:px-6 pt-3 pointer-events-none transition-colors">
      <motion.header
        initial={false}
        animate={{
          maxWidth: isScrolled ? '920px' : '1280px',
          borderRadius: isScrolled ? '9999px' : '18px',
          y: 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
        className={`pointer-events-auto relative w-full transition-all duration-300 ${
          isScrolled
            ? 'rounded-full border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/92 dark:bg-[#242521]/92 backdrop-blur-xl px-4 sm:px-6 py-2 shadow-lg shadow-black/5 dark:shadow-black/30'
            : 'rounded-2xl border border-[#D9D0C1]/80 dark:border-[#353731]/80 bg-[#F4F0E7]/90 dark:bg-[#171815]/90 backdrop-blur-md px-4 sm:px-7 py-3 shadow-xs'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          {/* Brand Logo - Links to / */}
          <Link
            href="/"
            className="flex items-center gap-2 group shrink-0"
            aria-label="RailSync Home"
            onClick={() => setMobileOpen(false)}
          >
            <RailSyncLogo
              variant={isScrolled ? 'compact' : 'full'}
              size="sm"
              showTagline={!isScrolled}
            />
          </Link>

          {/* Center Editorial Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono tracking-wider uppercase text-[#5E6059] dark:text-[#A39F93]">
            {NAV_LINKS.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="relative py-1 hover:text-[#E9663B] dark:hover:text-[#F0784D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] rounded transition-colors group"
              >
                <span>{link.name}</span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#E9663B] dark:bg-[#F0784D] transition-all duration-200 group-hover:w-full" />
              </a>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-full border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-2 text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:border-[#E9663B]/50 dark:hover:border-[#F0784D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all shadow-xs cursor-pointer"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-[#F0784D]" />
              ) : (
                <Moon className="h-4 w-4 text-[#242521]" />
              )}
            </button>

            {/* Secondary Action: Explore Demo */}
            <Link
              href="/demo"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] px-3.5 py-1.5 text-xs font-mono font-semibold text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:border-[#E9663B]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-colors cursor-pointer"
            >
              <span>Explore Demo</span>
            </Link>

            {/* Primary Action CTA: Access Operations */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-4.5 py-1.5 text-xs font-display font-extrabold uppercase tracking-wider text-white dark:text-[#171815] shadow-xs hover:shadow-[0_4px_16px_rgba(233,102,59,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] active:scale-[0.98] transition-all cursor-pointer"
            >
              <span>Access Operations</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Mobile menu toggle & theme icon */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] p-1.5 text-[#5E6059] dark:text-[#A39F93]"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-[#F0784D]" /> : <Moon className="h-4 w-4 text-[#242521]" />}
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-lg p-1.5 text-[#5E6059] dark:text-[#A39F93] hover:bg-[#FAF8F4] dark:hover:bg-[#242521] cursor-pointer"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Animated Mobile Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden border-t border-[#D9D0C1] dark:border-[#353731] pt-3 md:hidden font-mono text-xs space-y-2.5"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-[#242521] dark:text-[#F0E9DC] hover:text-[#E9663B] dark:hover:text-[#F0784D] py-1.5 px-1 rounded-md"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-2 border-t border-[#D9D0C1] dark:border-[#353731] flex flex-col gap-2">
                <Link
                  href="/demo"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D9D0C1] dark:border-[#353731] py-2 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]"
                >
                  <span>Explore Demo</span>
                </Link>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E9663B] dark:bg-[#F0784D] py-2.5 text-xs font-display font-bold uppercase tracking-wider text-white dark:text-[#171815]"
                >
                  <span>Access Operations</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </div>
  );
}
