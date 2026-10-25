'use client';

import React from 'react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export function StatusBadge({ status, size = 'sm', showDot = true }: StatusBadgeProps) {
  const norm = status.toUpperCase();

  let colorClasses =
    'bg-[#E6DFD3]/60 dark:bg-[#272823] text-[#5E6059] dark:text-[#A39F93] border-[#D9D0C1] dark:border-[#353731]';
  let dotColor = 'bg-[#8C887D] dark:bg-[#726F65]';
  let pulse = false;

  switch (norm) {
    case 'CONFIRMED':
    case 'ON_TIME':
    case 'RESOLVED':
    case 'PASS':
    case 'ONLINE':
      colorClasses =
        'bg-[#4A685F]/12 text-[#3D564F] dark:bg-[#88A69A]/15 dark:text-[#88A69A] border-[#4A685F]/30 dark:border-[#88A69A]/30';
      dotColor = 'bg-[#4A685F] dark:bg-[#88A69A]';
      break;
    case 'WAITLIST':
    case 'DELAYED':
    case 'INVESTIGATING':
    case 'WARNING':
    case 'MODERATE':
      colorClasses =
        'bg-[#E9663B]/10 text-[#C5532E] dark:bg-[#F0784D]/15 dark:text-[#F0784D] border-[#E9663B]/30 dark:border-[#F0784D]/35';
      dotColor = 'bg-[#E9663B] dark:bg-[#F0784D]';
      break;
    case 'RAC':
    case 'BOARDING':
    case 'MITIGATED':
    case 'MINOR':
      colorClasses =
        'bg-[#3D6875]/12 text-[#2D505B] dark:bg-[#78A3AF]/15 dark:text-[#78A3AF] border-[#3D6875]/30 dark:border-[#78A3AF]/30';
      dotColor = 'bg-[#3D6875] dark:bg-[#78A3AF]';
      break;
    case 'CRITICAL':
    case 'FAIL':
    case 'ACTIVE':
      colorClasses =
        'bg-[#C83C2A]/12 text-[#A82B1B] dark:bg-[#F45846]/18 dark:text-[#F45846] border-[#C83C2A]/35 dark:border-[#F45846]/40';
      dotColor = 'bg-[#C83C2A] dark:bg-[#F45846]';
      pulse = true;
      break;
    case 'MAJOR':
      colorClasses =
        'bg-[#C57613]/12 text-[#A25F0B] dark:bg-[#E6962C]/18 dark:text-[#E6962C] border-[#C57613]/35 dark:border-[#E6962C]/35';
      dotColor = 'bg-[#C57613] dark:bg-[#E6962C]';
      break;
    case 'CANCELLED':
    case 'DEPARTED':
    case 'ZERO-SEAT':
      colorClasses =
        'bg-[#8C887D]/12 text-[#5E6059] dark:bg-[#726F65]/20 dark:text-[#A39F93] border-[#D9D0C1] dark:border-[#353731]';
      dotColor = 'bg-[#8C887D] dark:bg-[#726F65]';
      break;
    default:
      colorClasses =
        'bg-[#E6DFD3]/60 dark:bg-[#272823] text-[#5E6059] dark:text-[#A39F93] border-[#D9D0C1] dark:border-[#353731]';
      dotColor = 'bg-[#8C887D] dark:bg-[#726F65]';
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium border rounded-full font-mono tracking-wide ${sizeClasses} ${colorClasses} transition-colors`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColor}`} />
        </span>
      )}
      {norm}
    </span>
  );
}
