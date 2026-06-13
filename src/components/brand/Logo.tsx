import { cn } from '../../lib/cn';

const BASE = import.meta.env.BASE_URL;

/** Brand icon mark — the GEN+ blue "+" on a navy rounded square. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <rect width="64" height="64" rx="15" fill="#0E2046" />
      <rect x="26.5" y="13" width="11" height="38" rx="3.5" fill="#2165FF" />
      <rect x="13" y="26.5" width="38" height="11" rx="3.5" fill="#2165FF" />
    </svg>
  );
}

/** Official GEN+ wordmark lockup (theme-aware) + "AI Process". */
export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <img src={`${BASE}gen-logo.png`} alt="GEN+" className="h-[18px] w-auto dark:hidden" />
      <img src={`${BASE}gen-logo-white.png`} alt="GEN+" className="hidden h-[18px] w-auto dark:block" />
      {!compact && (
        <>
          <span className="h-4 w-px bg-[var(--gen-border-strong)]" />
          <span className="font-sans text-[14px] font-semibold tracking-tight gen-text-secondary">AI Process</span>
        </>
      )}
    </div>
  );
}
