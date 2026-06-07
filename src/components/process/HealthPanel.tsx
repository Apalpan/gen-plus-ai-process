import { HeartPulse, CheckCircle2, AlertTriangle, XCircle, Square, CheckSquare } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { ScoreRing } from './HealthScore';

const ICON = {
  pass: <CheckCircle2 size={15} className="text-accent-green" />,
  warn: <AlertTriangle size={15} className="text-accent-amber" />,
  fail: <XCircle size={15} className="text-accent-red" />,
};

function bandColor(band: string): string {
  if (band === 'hardened') return '#34D399';
  if (band === 'implementable') return '#4D84FF';
  if (band === 'incomplete') return '#F5A623';
  return '#F87171';
}

export function HealthPanel() {
  const health = useProcessStore((s) => s.health)();
  const checklist = useProcessStore((s) => s.process.implementationChecklist);
  const toggle = useProcessStore((s) => s.toggleChecklist);
  const color = bandColor(health.band);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <HeartPulse size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Process Health Check</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-3 rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3">
          <ScoreRing score={health.score} color={color} size={64} />
          <div>
            <div className="text-[15px] font-bold" style={{ color }}>
              {health.bandLabel}
            </div>
            <p className="text-[11.5px] gen-text-muted">
              0–40 débil · 41–70 incompleto · 71–90 implementable · 91–100 blindado
            </p>
          </div>
        </div>

        <div className="mt-3 space-y-1.5">
          {health.items.map((it) => (
            <div key={it.id} className="flex items-start gap-2.5 rounded-btn bg-white/[0.03] px-3 py-2">
              <span className="mt-0.5 shrink-0">{ICON[it.severity]}</span>
              <div>
                <div className="text-[12.5px] font-medium">{it.label}</div>
                <div className="text-[11px] gen-text-muted">{it.detail}</div>
              </div>
            </div>
          ))}
        </div>

        <h3 className="mb-2 mt-5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          Checklist de implementación
        </h3>
        <div className="space-y-1">
          {checklist.length === 0 && <p className="text-[12px] gen-text-muted">Pídele al Copilot "genera checklist de implementación".</p>}
          {checklist.map((c) => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              className="flex w-full items-start gap-2.5 rounded-btn px-2 py-1.5 text-left transition-colors hover:bg-white/[0.04]"
            >
              <span className="mt-0.5 shrink-0 text-brand-300">
                {c.done ? <CheckSquare size={15} /> : <Square size={15} />}
              </span>
              <span className={`text-[12.5px] ${c.done ? 'text-[var(--gen-text-muted)] line-through' : ''}`}>
                {c.text}
                {c.phase && <span className="ml-1.5 rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] gen-text-muted">{c.phase}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
