import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const base =
  'w-full rounded-btn bg-ink-900/60 border border-[var(--gen-border)] px-3 py-2.5 text-sm text-white ' +
  'placeholder:text-[var(--gen-text-muted)] outline-none transition-all duration-150 ease-out ' +
  'hover:border-brand-400/40 focus:border-brand-400/70 focus-visible:shadow-focus';

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-[12px] font-semibold gen-text-secondary mb-1.5 tracking-tight">
      {children}
    </label>
  );
}

export function Field({ label, children, hint }: { label?: string; children: ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      {label && <Label>{label}</Label>}
      {children}
      {hint && <p className="gen-text-muted text-[11.5px] mt-1">{hint}</p>}
    </div>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(base, 'min-h-[44px]', props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(base, 'resize-none leading-relaxed', props.className)} />;
}

export function Select({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(base, 'min-h-[44px] appearance-none bg-[length:16px] bg-no-repeat pr-9', props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236A98FF' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 12px center',
      }}
    >
      {children}
    </select>
  );
}
