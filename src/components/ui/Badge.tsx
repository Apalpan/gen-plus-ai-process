import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'brand' | 'green' | 'amber' | 'red' | 'violet' | 'cyan' | 'neutral';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-200 border-brand-400/30',
  green: 'bg-accent-green/15 text-accent-green border-accent-green/30',
  amber: 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
  red: 'bg-accent-red/15 text-accent-red border-accent-red/30',
  violet: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
  cyan: 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30',
  neutral: 'bg-white/[0.06] text-[var(--gen-text-secondary)] border-white/10',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
  icon,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-none',
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
