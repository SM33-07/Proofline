'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral' | 'alert';
  trendValue?: string;
  icon: LucideIcon;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'orange' | 'green';
}

export function KpiCard({
  title,
  value,
  subtitle,
  trend,
  trendType = 'neutral',
  trendValue,
  icon: Icon,
  accentColor = 'orange',
}: KpiCardProps) {
  const accentStyles = {
    orange: {
      border: 'hover:border-[#E9663B]/60 dark:hover:border-[#F0784D]/60',
      iconBg: 'bg-[#E9663B]/10 text-[#E9663B] dark:bg-[#F0784D]/15 dark:text-[#F0784D] border-[#E9663B]/25 dark:border-[#F0784D]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(233,102,59,0.12)]',
    },
    green: {
      border: 'hover:border-[#4A685F]/60 dark:hover:border-[#88A69A]/60',
      iconBg: 'bg-[#4A685F]/10 text-[#4A685F] dark:bg-[#88A69A]/15 dark:text-[#88A69A] border-[#4A685F]/25 dark:border-[#88A69A]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(74,104,95,0.12)]',
    },
    cyan: {
      border: 'hover:border-[#E9663B]/60 dark:hover:border-[#F0784D]/60',
      iconBg: 'bg-[#E9663B]/10 text-[#E9663B] dark:bg-[#F0784D]/15 dark:text-[#F0784D] border-[#E9663B]/25 dark:border-[#F0784D]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(233,102,59,0.12)]',
    },
    emerald: {
      border: 'hover:border-[#4A685F]/60 dark:hover:border-[#88A69A]/60',
      iconBg: 'bg-[#4A685F]/10 text-[#4A685F] dark:bg-[#88A69A]/15 dark:text-[#88A69A] border-[#4A685F]/25 dark:border-[#88A69A]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(74,104,95,0.12)]',
    },
    amber: {
      border: 'hover:border-[#C57613]/60 dark:hover:border-[#E6962C]/60',
      iconBg: 'bg-[#C57613]/10 text-[#C57613] dark:bg-[#E6962C]/15 dark:text-[#E6962C] border-[#C57613]/25 dark:border-[#E6962C]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(197,118,19,0.12)]',
    },
    rose: {
      border: 'hover:border-[#C83C2A]/60 dark:hover:border-[#F45846]/60',
      iconBg: 'bg-[#C83C2A]/10 text-[#C83C2A] dark:bg-[#F45846]/15 dark:text-[#F45846] border-[#C83C2A]/25 dark:border-[#F45846]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(200,60,42,0.12)]',
    },
    indigo: {
      border: 'hover:border-[#E9663B]/60 dark:hover:border-[#F0784D]/60',
      iconBg: 'bg-[#E9663B]/10 text-[#E9663B] dark:bg-[#F0784D]/15 dark:text-[#F0784D] border-[#E9663B]/25 dark:border-[#F0784D]/30',
      glow: 'group-hover:shadow-[0_4px_20px_rgba(233,102,59,0.12)]',
    },
  }[accentColor] || {
    border: 'hover:border-[#E9663B]/60 dark:hover:border-[#F0784D]/60',
    iconBg: 'bg-[#E9663B]/10 text-[#E9663B] dark:bg-[#F0784D]/15 dark:text-[#F0784D] border-[#E9663B]/25 dark:border-[#F0784D]/30',
    glow: 'group-hover:shadow-[0_4px_20px_rgba(233,102,59,0.12)]',
  };

  const trendPill = {
    positive: 'bg-[#4A685F]/12 text-[#3D564F] dark:bg-[#88A69A]/15 dark:text-[#88A69A] border-[#4A685F]/25 dark:border-[#88A69A]/30',
    negative: 'bg-[#C83C2A]/12 text-[#A82B1B] dark:bg-[#F45846]/15 dark:text-[#F45846] border-[#C83C2A]/25 dark:border-[#F45846]/30',
    alert: 'bg-[#C57613]/12 text-[#A25F0B] dark:bg-[#E6962C]/15 dark:text-[#E6962C] border-[#C57613]/25 dark:border-[#E6962C]/30',
    neutral: 'bg-[#E6DFD3]/60 dark:bg-[#272823] text-[#5E6059] dark:text-[#A39F93] border-[#D9D0C1] dark:border-[#353731]',
  }[trendType];

  const TrendIcon =
    trendType === 'positive'
      ? TrendingUp
      : trendType === 'negative'
      ? TrendingDown
      : Minus;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-4.5 shadow-sm transition-all duration-200 ${accentStyles.border} ${accentStyles.glow}`}
    >
      <div className="flex items-start justify-between">
        <span className="text-[11px] font-mono font-medium uppercase tracking-wider text-[#5E6059] dark:text-[#A39F93]">
          {title}
        </span>
        <div className={`rounded-lg border p-2 ${accentStyles.iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-2 flex items-baseline justify-between">
        <div className="text-2xl font-bold font-mono tracking-tight text-[#242521] dark:text-[#F0E9DC]">
          {value}
        </div>
        {trendValue && (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold ${trendPill}`}
          >
            <TrendIcon className="h-3 w-3" />
            <span>{trendValue}</span>
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center justify-between border-t border-[#E6DFD3] dark:border-[#272823] pt-2 text-xs">
          {subtitle && <span className="text-[#5E6059] dark:text-[#A39F93] font-sans">{subtitle}</span>}
          {trend && <span className="text-[#8C887D] dark:text-[#726F65] font-mono text-[11px]">{trend}</span>}
        </div>
      )}
    </div>
  );
}
