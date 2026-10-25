'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#D9D0C1] dark:border-[#353731] pb-5 transition-colors">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-[#8C887D] dark:text-[#726F65] font-mono uppercase tracking-wider">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label}>
                {idx > 0 && <ChevronRight className="h-3 w-3 text-[#D9D0C1] dark:text-[#353731]" />}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-[#E9663B] dark:hover:text-[#F0784D] transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[#242521] dark:text-[#F0E9DC] font-bold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 className="font-display font-extrabold uppercase tracking-tight text-3xl sm:text-4xl font-display font-black text-[#242521] dark:text-[#F0E9DC]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs text-[#5E6059] dark:text-[#A39F93] font-sans leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
