import { PenLine, Workflow, Gauge, Sparkles, Rocket, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import type { Section } from '../../store/useProcessStore';
import { cn } from '../../lib/cn';

const STEPS: { id: Section; n: number; label: string; icon: LucideIcon }[] = [
  { id: 'capture', n: 1, label: 'Capturar', icon: PenLine },
  { id: 'map', n: 2, label: 'Mapear', icon: Workflow },
  { id: 'metrics', n: 3, label: 'Medir', icon: Gauge },
  { id: 'aifirst', n: 4, label: 'AI First', icon: Sparkles },
  { id: 'implement', n: 5, label: 'Implementar', icon: Rocket },
];

/** Stepper del flujo de producción: el usuario siempre sabe en qué paso está. */
export function StepBar() {
  const section = useProcessStore((s) => s.section);
  const setSection = useProcessStore((s) => s.setSection);
  const process = useProcessStore((s) => s.process);

  const done: Record<Section, boolean> = {
    capture: process.nodes.length > 0,
    map: process.nodes.length > 0 && process.nodes.filter((n) => n.responsible).length > 0,
    metrics: process.metrics.length > 0,
    aifirst: (process.roadmap?.length ?? 0) > 0,
    implement: process.status === 'en_implementacion' || process.status === 'implementado',
    dashboard: false,
    processes: false,
    settings: false,
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-1 border-b border-[var(--gen-border)] bg-ink-850/50 px-3 backdrop-blur">
      {STEPS.map((st, i) => {
        const active = section === st.id;
        const completed = done[st.id] && !active;
        const Icon = st.icon;
        return (
          <div key={st.id} className="flex items-center">
            {i > 0 && <span className="mx-1 h-px w-4 bg-[var(--gen-border)] sm:w-7" />}
            <button
              onClick={() => setSection(st.id)}
              aria-current={active ? 'step' : undefined}
              className={cn(
                'flex h-9 items-center gap-2 rounded-btn px-2.5 text-[12.5px] font-semibold transition-all duration-150 ease-out focus-visible:shadow-focus',
                active
                  ? 'bg-brand-500/15 text-brand-100 border border-brand-400/40'
                  : 'text-[var(--gen-text-muted)] hover:bg-white/[0.05] hover:text-brand-100 border border-transparent',
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full text-[10.5px] font-bold',
                  active ? 'bg-brand-500 text-oncolor' : completed ? 'bg-accent-green/20 text-accent-green' : 'bg-white/[0.08] text-[var(--gen-text-muted)]',
                )}
              >
                {completed ? <Check size={11} strokeWidth={3} /> : st.n}
              </span>
              <Icon size={14} className="hidden md:block" />
              <span className="hidden sm:inline">{st.label}</span>
            </button>
          </div>
        );
      })}
      <span className="ml-auto hidden truncate text-[11.5px] gen-text-muted lg:block">
        Mapea → Mide → Rediseña con IA → Implementa
      </span>
    </div>
  );
}
