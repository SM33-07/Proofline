'use client';

import React from 'react';
import { Download, X, CheckSquare } from 'lucide-react';

interface SelectionBarProps {
  selectedCount: number;
  totalCount: number;
  onClear: () => void;
  onExport: () => void;
  entityName?: string;
}

export function SelectionBar({
  selectedCount,
  totalCount,
  onClear,
  onExport,
  entityName = 'records',
}: SelectionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-3 rounded-2xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4]/95 dark:bg-[#242521]/95 px-4 py-2.5 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="flex items-center gap-2 text-xs font-mono text-[#242521] dark:text-[#F0E9DC]">
        <CheckSquare className="h-4 w-4 text-[#E9663B] dark:text-[#F0784D]" />
        <span className="font-bold text-[#E9663B] dark:text-[#F0784D]">{selectedCount}</span>
        <span className="text-[#5E6059] dark:text-[#A39F93]">of {totalCount} {entityName} selected</span>
      </div>

      <div className="h-4 w-px bg-[#D9D0C1] dark:bg-[#353731]" />

      <button
        onClick={onExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D9D0C1] dark:border-[#353731] bg-[#F4F0E7] dark:bg-[#171815] px-3 py-1.5 text-xs font-mono font-bold text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B] transition-colors"
      >
        <Download className="h-3.5 w-3.5" />
        <span>Export CSV</span>
      </button>

      <button
        onClick={onClear}
        className="rounded-lg p-1.5 text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#171815] transition-colors"
        title="Deselect all"
        aria-label="Clear selection"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
