import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#1C1D19] px-3.5 py-2 text-sm text-[#242521] dark:text-[#F0E9DC] placeholder:text-[#8C887D] dark:placeholder:text-[#726F65] shadow-xs transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] dark:focus-visible:ring-[#F0784D] focus-visible:border-transparent',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-[#C83C2A] dark:border-[#F45846] focus-visible:ring-[#C83C2A] dark:focus-visible:ring-[#F45846]',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
