import { useEffect, useRef, useState } from 'react';
import { Plus, Activity, GitBranch, FileText, CheckCircle2, Zap, Flag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../../store/useProcessStore';
import type { EdgeType, NodeType } from '../../../types/process';
import { cn } from '../../../lib/cn';

const OPTIONS: { type: NodeType; label: string; icon: LucideIcon; color: string }[] = [
  { type: 'activity', label: 'Actividad', icon: Activity, color: '#4D84FF' },
  { type: 'decision', label: 'Decisión', icon: GitBranch, color: '#F5A623' },
  { type: 'document', label: 'Documento', icon: FileText, color: '#22D3EE' },
  { type: 'approval', label: 'Aprobación', icon: CheckCircle2, color: '#F5A623' },
  { type: 'automation', label: 'Automatización', icon: Zap, color: '#8B5CF6' },
  { type: 'end', label: 'Fin', icon: Flag, color: '#1E5CE8' },
];

/**
 * Quick-add control: "+" attached to a node that spawns a connected next step.
 * Used as the default right-side adder and as the Sí/No branch adders on decisions.
 */
export function QuickAdd({
  sourceId,
  edgeType = 'sequence',
  className,
  variant = 'plus',
  tone = '#4D84FF',
  branchLabel,
}: {
  sourceId: string;
  edgeType?: EdgeType;
  className?: string;
  variant?: 'plus' | 'branch';
  tone?: string;
  branchLabel?: string;
}) {
  const add = useProcessStore((s) => s.addConnectedNode);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const choose = (type: NodeType) => {
    add(sourceId, type, edgeType);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('nodrag nopan absolute z-20', className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          // Most common path: one click adds an activity. Shift/alt opens the picker.
          if (e.shiftKey || e.altKey) setOpen((o) => !o);
          else if (open) setOpen(false);
          else add(sourceId, 'activity', edgeType);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        title={variant === 'branch' ? `Agregar paso "${branchLabel}" (clic = actividad · clic derecho = elegir tipo)` : 'Agregar siguiente paso (clic = actividad · clic derecho = elegir tipo)'}
        className={cn(
          'flex items-center justify-center gap-1 rounded-full font-bold text-oncolor shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition-all duration-150 hover:scale-110 active:scale-95',
          variant === 'branch' ? 'h-6 px-2 text-[10px]' : 'h-6 w-6 text-[13px]',
        )}
        style={{ background: tone }}
      >
        {variant === 'branch' && branchLabel ? (
          <>
            <span>{branchLabel}</span>
            <Plus size={11} strokeWidth={3} />
          </>
        ) : (
          <Plus size={14} strokeWidth={3} />
        )}
      </button>

      {open && (
        <div className="absolute left-1/2 top-[calc(100%+6px)] z-30 w-40 -translate-x-1/2 overflow-hidden rounded-btn border border-[var(--gen-border)] bg-ink-850 p-1 shadow-elevated">
          {OPTIONS.map((o) => {
            const Icon = o.icon;
            return (
              <button
                key={o.type}
                onClick={(e) => {
                  e.stopPropagation();
                  choose(o.type);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] font-medium text-white transition-colors hover:bg-white/[0.08]"
              >
                <Icon size={13} style={{ color: o.color }} />
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
