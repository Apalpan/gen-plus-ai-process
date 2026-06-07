import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  interactive?: boolean;
  raised?: boolean;
}

export function Card({ children, className, interactive, raised, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'gen-surface rounded-card p-4',
        raised && 'shadow-elevated',
        interactive &&
          'cursor-pointer transition-all duration-150 ease-out hover:border-brand-400/45 hover:shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon, action }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="mt-0.5 text-brand-300 shrink-0">{icon}</div>}
        <div className="min-w-0">
          <h3 className="font-semibold text-[15px] leading-tight truncate">{title}</h3>
          {subtitle && <p className="gen-text-muted text-[12.5px] mt-0.5 leading-snug">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
