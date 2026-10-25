'use client';

import React from 'react';

export interface RailSyncLogoProps {
  variant?: 'full' | 'compact' | 'symbol' | 'icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  themeForce?: 'light' | 'dark';
}

export function RailSyncSymbol({
  className = 'h-8 w-8',
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="RailSync Symbol"
    >
      {/* Upper curved loop of the R */}
      <path
        d="M16 10H36C45.9411 10 52 16.0589 52 24C52 31.9411 45.9411 38 36 38H16V10Z"
        className="fill-[#242521] dark:fill-[#F0E9DC] transition-colors"
      />
      {/* Inner cutout of the loop */}
      <path
        d="M26 19H34C37.866 19 41 21.2386 41 24C41 26.7614 37.866 29 34 29H26V19Z"
        className="fill-[#F4F0E7] dark:fill-[#171815] transition-colors"
      />

      {/* Railway Track on the left stem/diagonal (Left rail, right rail, 4 sleepers) */}
      {/* Left rail */}
      <line
        x1="12"
        y1="10"
        x2="12"
        y2="54"
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-[#242521] dark:stroke-[#F0E9DC] transition-colors"
      />
      {/* Right rail */}
      <line
        x1="22"
        y1="10"
        x2="22"
        y2="54"
        strokeWidth="4"
        strokeLinecap="round"
        className="stroke-[#242521] dark:stroke-[#F0E9DC] transition-colors"
      />
      {/* Railway Sleepers / Track Ties */}
      <line
        x1="8"
        y1="18"
        x2="26"
        y2="18"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="stroke-[#242521] dark:stroke-[#F0E9DC] transition-colors"
      />
      <line
        x1="8"
        y1="28"
        x2="26"
        y2="28"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="stroke-[#242521] dark:stroke-[#F0E9DC] transition-colors"
      />
      <line
        x1="8"
        y1="38"
        x2="26"
        y2="38"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="stroke-[#242521] dark:stroke-[#F0E9DC] transition-colors"
      />
      <line
        x1="8"
        y1="48"
        x2="26"
        y2="48"
        strokeWidth="3.5"
        strokeLinecap="round"
        className="stroke-[#242521] dark:stroke-[#F0E9DC] transition-colors"
      />

      {/* Dynamic Signal Orange Diagonal Leg */}
      <path
        d="M31 34L48 54H58L38 31L31 34Z"
        className="fill-[#E9663B] dark:fill-[#F0784D] transition-colors"
      />
    </svg>
  );
}

export function RailSyncAppIcon({
  size = 40,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative flex items-center justify-center rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] shadow-sm shrink-0 transition-colors ${className}`}
    >
      <RailSyncSymbol size={size * 0.72} className="w-auto h-auto" />
    </div>
  );
}

export function RailSyncLogo({
  variant = 'full',
  size = 'md',
  showTagline = false,
  className = '',
}: RailSyncLogoProps) {
  const sizeMap = {
    xs: { iconSize: 22, textClass: 'text-sm', badgeClass: 'text-[9px] px-1 py-0.2' },
    sm: { iconSize: 28, textClass: 'text-base', badgeClass: 'text-[10px] px-1.5 py-0.5' },
    md: { iconSize: 34, textClass: 'text-lg', badgeClass: 'text-[10px] px-1.5 py-0.5' },
    lg: { iconSize: 42, textClass: 'text-2xl', badgeClass: 'text-xs px-2 py-0.5' },
    xl: { iconSize: 52, textClass: 'text-3xl', badgeClass: 'text-xs px-2.5 py-0.5' },
  }[size];

  if (variant === 'symbol') {
    return <RailSyncSymbol size={sizeMap.iconSize} className={className} />;
  }

  if (variant === 'icon') {
    return <RailSyncAppIcon size={sizeMap.iconSize + 6} className={className} />;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <RailSyncAppIcon size={sizeMap.iconSize + 6} />
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display font-extrabold tracking-tight ${sizeMap.textClass}`}>
            <span className="text-[#242521] dark:text-[#F0E9DC] transition-colors">Rail</span>
            <span className="text-[#E9663B] dark:text-[#F0784D] transition-colors">Sync</span>
          </span>
          {variant === 'full' && (
            <span className={`rounded font-mono font-bold uppercase tracking-wider border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] text-[#5E6059] dark:text-[#A39F93] ${sizeMap.badgeClass}`}>
              v1.0
            </span>
          )}
        </div>
        {showTagline && (
          <span className="text-[9px] font-mono tracking-widest text-[#8C887D] dark:text-[#726F65] uppercase mt-0.5">
            Reserve • Track • Resolve
          </span>
        )}
      </div>
    </div>
  );
}
