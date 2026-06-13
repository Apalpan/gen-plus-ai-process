import { Layers, Square, Box } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { cn } from '../../lib/cn';

const MODES: { id: 'basic' | '2d' | '3d'; label: string; icon: LucideIcon }[] = [
  { id: 'basic', label: 'Básico', icon: Layers },
  { id: '2d', label: '2D', icon: Square },
  { id: '3d', label: '3D', icon: Box },
];

export function ViewSwitcher() {
  const viewMode = useProcessStore((s) => s.viewMode);
  const setViewMode = useProcessStore((s) => s.setViewMode);

  return (
    <div className="flex items-center gap-0.5 rounded-btn-lg border border-[var(--gen-border)] bg-ink-850/90 p-1 shadow-elevated backdrop-blur">
      {MODES.map((m) => {
        const Icon = m.icon;
        const active = viewMode === m.id;
        return (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            title={`Vista ${m.label}`}
            className={cn(
              'flex h-8 items-center gap-1.5 rounded-btn px-2.5 text-[12px] font-semibold transition-all duration-150',
              active ? 'bg-brand-500 text-oncolor shadow-[0_4px_12px_rgba(33,101,255,0.35)]' : 'text-brand-100 hover:bg-white/[0.08]',
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}
