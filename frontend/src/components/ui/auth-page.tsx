'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  ShieldAlert,
  Loader2,
  ArrowRight,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';
import { RailSyncLogo } from '@/components/brand/RailSyncLogo';
import { Button } from './button';
import { Input } from './input';
// import { cn } from '@/lib/utils';

export function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, toggleTheme, setUserRole } = useTheme();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Validation & server response states
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);

  // Quick fill helper for academic testing
  const handleQuickFill = (badge: string, pass: string) => {
    setIdentifier(badge);
    setPassword(pass);
    setIdentifierError(null);
    setPasswordError(null);
    setAuthError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIdentifierError(null);
    setPasswordError(null);
    setAuthError(null);
    setAuthSuccess(null);

    let hasClientError = false;

    const trimmed = identifier.trim();
    if (!trimmed) {
      setIdentifierError('Enterprise email address or badge ID is required.');
      hasClientError = true;
    } else {
      // Reconciled identifier format: valid email OR valid badge ID format (e.g. OP-4091, SM-1042, AI-9001)
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
      const isBadge = /^[A-Za-z]{2,4}-?\d{3,5}$/i.test(trimmed);
      if (!isEmail && !isBadge) {
        setIdentifierError('Please enter a valid enterprise email or badge ID (e.g., OP-4091 or controller.ndls@railsync.internal).');
        hasClientError = true;
      }
    }

    if (!password) {
      setPasswordError('Password is required.');
      hasClientError = true;
    }

    if (hasClientError) return;

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: trimmed,
          email: trimmed,
          password,
          rememberMe,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setAuthSuccess(data.message || 'Authenticated successfully. Redirecting to operations console...');
        if (data.user?.role) {
          setUserRole(data.user.role);
        }

        // Validate safe relative redirect destination
        const redirectParam = searchParams?.get('redirect');
        const target =
          redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
            ? redirectParam
            : data.redirectTo || '/app';

        setTimeout(() => {
          router.push(target);
          router.refresh();
        }, 300);
      } else {
        setAuthError(data.error || 'Authentication failed. Please verify credentials.');
      }
    } catch {
      setAuthError('Unable to connect to the authentication server. Please check your network connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative min-h-[100dvh] w-full lg:grid lg:grid-cols-2 bg-[#F4F0E7] dark:bg-[#171815] text-[#242521] dark:text-[#F0E9DC] transition-colors selection:bg-[#E9663B]/20">
      {/* ============================================================= */}
      {/* LEFT PANEL: Authentic Railway Hero Visual                      */}
      {/* Fills exactly 50% on desktop (hidden on mobile)                */}
      {/* ============================================================= */}
      <div className="relative hidden h-full w-full flex-col justify-between overflow-hidden p-8 sm:p-12 lg:flex select-none">
        {/* Full-panel Background Photograph */}
        <div className="absolute inset-0 z-0">
          {/* Light Mode Asset: Daylight Indian Railways WAP-7 locomotive */}
          <Image
            src="/images/locomotive_light.webp"
            alt="Daylight Indian Railways WAP-7 electric locomotive on curved tracks"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-center dark:hidden"
          />
          {/* Dark Mode Asset: Cinematic night-time Indian Railways locomotive */}
          <Image
            src="/images/locomotive_dark.webp"
            alt="Cinematic night-time Indian Railways locomotive with illuminated headlights"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="hidden object-cover object-center dark:block"
          />
          {/* Restrained directional overlay: transparent at center, legible at top and bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/60" />
        </div>

        {/* Top: RailSync Brand Wordmark */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0784D] rounded-xl"
            aria-label="RailSync Home"
          >
            <RailSyncLogo variant="full" size="sm" showTagline={false} />
          </Link>
        </div>

        {/* Bottom: Editorial statement & simulator description */}
        <div className="relative z-10 space-y-3 max-w-md">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold uppercase tracking-tight text-white leading-tight">
            Railway operations.<br />Precisely managed.
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#A39F93] leading-relaxed">
            A high-throughput railway reservation simulator and refund engine enforcing serializable transaction locks, capacity bounds, and canonical invariants.
          </p>
        </div>
      </div>

      {/* ============================================================= */}
      {/* MOBILE COMPACT HERO (Visible only on < lg viewports)          */}
      {/* ============================================================= */}
      <div className="relative h-44 sm:h-52 w-full overflow-hidden lg:hidden select-none">
        <Image
          src="/images/locomotive_light.webp"
          alt="Indian Railways locomotive"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center dark:hidden"
        />
        <Image
          src="/images/locomotive_dark.webp"
          alt="Indian Railways locomotive"
          fill
          priority
          sizes="100vw"
          className="hidden object-cover object-center dark:block"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#171815] via-[#171815]/60 to-black/40" />
        <div className="relative z-10 flex h-full flex-col justify-between p-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <RailSyncLogo variant="compact" size="xs" />
          </Link>
          <p className="font-display text-lg font-bold uppercase tracking-wide text-white">
            Railway operations. Precisely managed.
          </p>
        </div>
      </div>

      {/* ============================================================= */}
      {/* RIGHT PANEL: Minimalist Authentication Interface               */}
      {/* Sits directly on the graphite/paper background without cards   */}
      {/* ============================================================= */}
      <div className="relative flex min-h-full w-full flex-col justify-between p-6 sm:p-10 lg:p-12 overflow-y-auto">
        {/* Top Header: Home Navigation & Theme Toggle */}
        <header className="flex items-center justify-between w-full max-w-sm sm:max-w-md mx-auto">
          <Button variant="ghost" size="sm" asChild className="text-xs font-mono -ms-2">
            <Link href="/" aria-label="Return to RailSync Homepage">
              <ChevronLeft className="size-4 me-1" />
              <span>Home</span>
            </Link>
          </Button>

          <button
            onClick={toggleTheme}
            className="rounded-full border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-2 text-[#5E6059] dark:text-[#A39F93] hover:text-[#242521] dark:hover:text-[#F0E9DC] hover:border-[#E9663B]/50 dark:hover:border-[#F0784D]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] transition-all shadow-xs cursor-pointer"
            title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {theme === 'dark' ? (
              <Sun className="size-4 text-[#F0784D]" />
            ) : (
              <Moon className="size-4 text-[#242521]" />
            )}
          </button>
        </header>

        {/* Center: Left-aligned Minimalist Form */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-6 space-y-6">
          {/* Header Typography */}
          <div className="space-y-1.5 text-left">
            <h1 className="font-display font-black uppercase tracking-tight text-3xl sm:text-4xl text-[#242521] dark:text-[#F0E9DC]">
              Sign in to RailSync
            </h1>
            <p className="text-xs sm:text-sm text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
              Enterprise operator credentials for railway controllers, station masters, and invariant audit inspectors.
            </p>
          </div>

          {/* Authentication Failure Feedback Banner */}
          {authError && (
            <div
              role="alert"
              className="rounded-xl border border-[#C83C2A]/40 dark:border-[#F45846]/40 bg-[#C83C2A]/10 dark:bg-[#F45846]/10 p-3.5 text-xs text-[#C83C2A] dark:text-[#F45846] space-y-1 text-left transition-all"
            >
              <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-[11px]">
                <ShieldAlert className="size-4 shrink-0" />
                <span>Authentication Failure</span>
              </div>
              <p className="font-sans pl-6 text-xs">{authError}</p>
            </div>
          )}

          {/* Authentication Success Feedback Banner */}
          {authSuccess && (
            <div
              role="status"
              className="rounded-xl border border-[#4A685F]/40 dark:border-[#88A69A]/40 bg-[#4A685F]/10 dark:bg-[#88A69A]/10 p-3.5 text-xs text-[#4A685F] dark:text-[#88A69A] space-y-1 text-left transition-all"
            >
              <div className="flex items-center gap-2 font-mono font-bold uppercase tracking-wider text-[11px]">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Access Granted</span>
              </div>
              <p className="font-sans pl-6 text-xs">{authSuccess}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
            {/* Identifier Field (Email or Badge ID) */}
            <div className="space-y-1.5">
              <label
                htmlFor="identifier"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#5E6059] dark:text-[#A39F93]"
              >
                Enterprise Email / Badge ID
              </label>
              <div className="relative">
                <Input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="OP-4091 or controller.ndls@railsync.internal"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (identifierError) setIdentifierError(null);
                    if (authError) setAuthError(null);
                  }}
                  error={Boolean(identifierError)}
                  className="ps-10 font-mono text-xs bg-transparent border-[#D9D0C1] dark:border-[#353731]"
                  aria-describedby={identifierError ? 'identifier-error' : undefined}
                  disabled={isSubmitting}
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 text-[#8C887D] dark:text-[#726F65]">
                  <Mail className="size-4" aria-hidden="true" />
                </div>
              </div>
              {identifierError && (
                <p id="identifier-error" role="alert" className="text-[11px] font-mono text-[#C83C2A] dark:text-[#F45846]">
                  {identifierError}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-mono font-semibold uppercase tracking-wider text-[#5E6059] dark:text-[#A39F93]"
              >
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                    if (authError) setAuthError(null);
                  }}
                  error={Boolean(passwordError)}
                  className="ps-10 pe-10 font-mono text-xs bg-transparent border-[#D9D0C1] dark:border-[#353731]"
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  disabled={isSubmitting}
                />
                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 text-[#8C887D] dark:text-[#726F65]">
                  <Lock className="size-4" aria-hidden="true" />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 flex items-center justify-center pe-3.5 text-[#8C887D] dark:text-[#726F65] hover:text-[#242521] dark:hover:text-[#F0E9DC] cursor-pointer focus-visible:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" role="alert" className="text-[11px] font-mono text-[#C83C2A] dark:text-[#F45846]">
                  {passwordError}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="size-3.5 rounded border-[#D9D0C1] dark:border-[#353731] text-[#E9663B] dark:text-[#F0784D] focus:ring-[#E9663B] cursor-pointer accent-[#E9663B] dark:accent-[#F0784D]"
                />
                <span className="text-xs text-[#5E6059] dark:text-[#A39F93] font-sans">
                  Remember session (7 days persistence)
                </span>
              </label>
            </div>

            {/* Primary Action Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full mt-3 font-display text-xs font-bold tracking-wider uppercase bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin me-2" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Operations</span>
                  <ArrowRight className="size-4 ms-2" />
                </>
              )}
            </Button>
          </form>

          {/* Academic Evaluation Accounts Box: Strictly guarded; hidden in production */}
          {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_TEST_HELPERS === 'true' && (
            <div className="rounded-xl border border-[#D9D0C1]/80 dark:border-[#353731]/80 bg-[#FAF8F4]/90 dark:bg-[#242521]/90 p-3.5 text-xs space-y-2 text-left shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#5E6059] dark:text-[#A39F93] flex items-center gap-1.5">
                  <KeyRound className="size-3.5 text-[#E9663B] dark:text-[#F0784D]" />
                  Academic Evaluation Credentials (Development Fixtures Only)
                </span>
                <span className="text-[10px] font-mono text-[#8C887D] dark:text-[#726F65]">Click to pre-fill</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => handleQuickFill('OP-4091', 'ControllerPass@123')}
                  className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] p-1.5 hover:border-[#E9663B] dark:hover:border-[#F0784D] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] transition-all text-left cursor-pointer"
                >
                  <div className="font-bold text-[#E9663B] dark:text-[#F0784D]">Controller</div>
                  <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">OP-4091</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('SM-1042', 'StationPass@123')}
                  className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] p-1.5 hover:border-[#E9663B] dark:hover:border-[#F0784D] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] transition-all text-left cursor-pointer"
                >
                  <div className="font-bold text-[#4A685F] dark:text-[#88A69A]">Station Master</div>
                  <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">SM-1042</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('AI-9001', 'AuditPass@123')}
                  className="rounded-lg border border-[#D9D0C1] dark:border-[#353731] p-1.5 hover:border-[#E9663B] dark:hover:border-[#F0784D] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] transition-all text-left cursor-pointer"
                >
                  <div className="font-bold text-[#C57613] dark:text-[#E6962C]">Audit Inspector</div>
                  <div className="text-[10px] text-[#5E6059] dark:text-[#A39F93]">AI-9001</div>
                </button>
              </div>
            </div>
          )}

          {/* Discreet Demo Access Divider & Link */}
          <div className="pt-4 border-t border-[#D9D0C1]/60 dark:border-[#353731]/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="text-[#5E6059] dark:text-[#A39F93]">
              Evaluating without operator credentials?
            </span>
            <Link
              href="/demo"
              className="font-mono text-xs font-semibold text-[#E9663B] dark:text-[#F0784D] hover:underline inline-flex items-center gap-1 shrink-0"
            >
              <span>Explore Demo Access</span>
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* Bottom: Unobtrusive Academic Disclaimer */}
        <footer className="w-full max-w-sm sm:max-w-md mx-auto text-center pt-4 text-[11px] font-mono text-[#8C887D] dark:text-[#726F65]">
          RailSync Academic Simulator • CSC2104 / CSC2131 • Manipal University Jaipur
        </footer>
      </div>
    </main>
  );
}
