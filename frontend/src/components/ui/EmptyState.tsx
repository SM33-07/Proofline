'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionText, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] p-12 text-center shadow-xs">
      <div className="mb-4 rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] p-4 text-[#E9663B] dark:text-[#F0784D]">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="font-display font-bold uppercase tracking-wide text-base text-[#242521] dark:text-[#F0E9DC]">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-[#5E6059] dark:text-[#A39F93] font-sans">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center rounded-xl bg-[#E9663B] hover:bg-[#D5542A] dark:bg-[#F0784D] dark:hover:bg-[#F78D65] px-4 py-2 text-xs font-display font-bold uppercase tracking-wider text-white dark:text-[#171815] transition-colors shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
