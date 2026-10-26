import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9663B] dark:focus-visible:ring-[#F0784D] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98] select-none';

    const variantStyles = {
      default:
        'bg-[#E9663B] text-white hover:bg-[#D5542A] dark:bg-[#F0784D] dark:text-[#171815] dark:hover:bg-[#F78D65] font-display font-bold uppercase tracking-wider shadow-sm hover:shadow-[0_4px_16px_rgba(233,102,59,0.3)]',
      destructive:
        'bg-[#C83C2A] text-white hover:bg-[#A93223] dark:bg-[#F45846] dark:hover:bg-[#E04634] shadow-sm',
      outline:
        'border border-[#D9D0C1] dark:border-[#353731] bg-transparent text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/60 dark:hover:border-[#F0784D]/60 hover:bg-[#FAF8F4] dark:hover:bg-[#242521]',
      secondary:
        'border border-[#D9D0C1] dark:border-[#353731] bg-[#FAF8F4] dark:bg-[#242521] text-[#242521] dark:text-[#F0E9DC] hover:border-[#E9663B]/50 hover:bg-[#F4F0E7] dark:hover:bg-[#1D1E1A] shadow-xs',
      ghost:
        'text-[#5E6059] dark:text-[#A39F93] hover:bg-[#F4F0E7] dark:hover:bg-[#242521] hover:text-[#242521] dark:hover:text-[#F0E9DC]',
      link:
        'text-[#E9663B] dark:text-[#F0784D] underline-offset-4 hover:underline p-0 h-auto',
    }[variant];

    const sizeStyles = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-xs',
      lg: 'h-12 rounded-xl px-6 text-base font-semibold',
      icon: 'h-9 w-9 p-0',
    }[size];

    const combinedClassName = cn(baseStyles, variantStyles, sizeStyles, className);

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<{ className?: string }>, {
        className: cn(combinedClassName, (children as React.ReactElement<{ className?: string }>).props.className),
        ...props,
      });
    }

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
