import { cn } from '../../lib/cn';

export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <defs>
        <linearGradient id="genmark" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E5CE8" />
          <stop offset="1" stopColor="#4D84FF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="#06142A" />
      <rect x="6" y="6" width="52" height="52" rx="13" stroke="url(#genmark)" strokeOpacity="0.4" />
      <circle cx="18" cy="20" r="5" fill="#4D84FF" />
      <circle cx="46" cy="20" r="5" fill="#6A98FF" />
      <circle cx="32" cy="45" r="5" fill="#2165FF" />
      <path d="M18 20 H40 a4 4 0 0 1 4 4 V21" stroke="#6A98FF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M18 20 V37 a4 4 0 0 0 4 4 H30" stroke="#4D84FF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M46 20 V37 a4 4 0 0 1 -4 4 H34" stroke="#2165FF" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2.5 select-none', className)}>
      <LogoMark size={30} />
      {!compact && (
        <div className="leading-none">
          <div className="font-display font-bold text-[16px] tracking-tight">
            GEN<span className="text-brand-400">+</span> <span className="font-sans font-semibold text-white/90">AI Process</span>
          </div>
        </div>
      )}
    </div>
  );
}
