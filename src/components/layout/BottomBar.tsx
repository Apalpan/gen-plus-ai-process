import { Circle, GitBranch, Gauge, ShieldAlert, Workflow, CheckCircle2 } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { cn } from '../../lib/cn';

function scoreColor(score: number) {
  if (score >= 91) return 'text-accent-green';
  if (score >= 71) return 'text-brand-300';
  if (score >= 41) return 'text-accent-amber';
  return 'text-accent-red';
}

export function BottomBar() {
  const process = useProcessStore((s) => s.process);
  const health = useProcessStore((s) => s.health)();
  const setSection = useProcessStore((s) => s.setSection);

  const activities = process.nodes.filter((n) => !['start', 'end'].includes(n.type)).length;

  return (
    <footer className="flex h-9 shrink-0 items-center gap-4 border-t border-[var(--gen-border)] bg-ink-850/70 px-4 text-[12px]">
      <div className="flex items-center gap-1.5 gen-text-secondary min-w-0">
        <GitBranch size={13} className="text-brand-400 shrink-0" />
        <span className="truncate">{process.title}</span>
        <span className="gen-text-muted">· {process.maturityLevel}</span>
      </div>

      <div className="flex items-center gap-1.5 text-accent-green">
        <CheckCircle2 size={13} />
        <span>Guardado local</span>
      </div>

      <div className="ml-auto flex items-center gap-4 gen-text-muted">
        <span className="flex items-center gap-1.5">
          <Circle size={11} className="text-brand-300" /> {process.nodes.length} nodos
        </span>
        <span className="hidden items-center gap-1.5 sm:flex">{activities} actividades</span>
        <button onClick={() => setSection('metrics')} className="flex items-center gap-1.5 hover:text-brand-200 transition-colors">
          <Gauge size={13} /> {process.metrics.length}
        </button>
        <button onClick={() => setSection('risks')} className="flex items-center gap-1.5 hover:text-brand-200 transition-colors">
          <ShieldAlert size={13} /> {process.risks.length}
        </button>
        <button onClick={() => setSection('automations')} className="flex items-center gap-1.5 hover:text-brand-200 transition-colors">
          <Workflow size={13} /> {process.automations.length}
        </button>
        <button
          onClick={() => setSection('health')}
          className={cn('flex items-center gap-1.5 font-semibold transition-colors hover:opacity-80', scoreColor(health.score))}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          Score {health.score}
        </button>
      </div>
    </footer>
  );
}
