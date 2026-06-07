import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-400 active:bg-brand-600 shadow-[0_8px_24px_rgba(33,101,255,0.35)]',
  secondary:
    'bg-ink-700/70 text-brand-100 border border-[var(--gen-border-strong)] hover:bg-ink-700 hover:border-brand-400/50',
  ghost: 'bg-transparent text-brand-100 hover:bg-white/[0.06]',
  subtle: 'bg-white/[0.05] text-brand-100 hover:bg-white/[0.1]',
  danger: 'bg-accent-red/90 text-white hover:bg-accent-red',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-[13px] rounded-btn gap-1.5',
  md: 'h-11 px-4 text-sm rounded-btn gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-btn-lg gap-2.5',
  icon: 'h-11 w-11 rounded-btn justify-center',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', leftIcon, rightIcon, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center font-semibold tracking-tight',
        'transition-all duration-150 ease-out outline-none',
        'focus-visible:shadow-focus disabled:opacity-45 disabled:pointer-events-none',
        'min-h-[44px] sm:min-h-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
});
