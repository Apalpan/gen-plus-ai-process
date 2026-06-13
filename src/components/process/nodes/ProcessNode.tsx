import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import {
  Activity,
  FileText,
  Server,
  Gauge,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ArrowLeftRight,
  FileCheck2,
  Hourglass,
  Shield,
  Clock,
  User,
  Trash2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeType, ProcessMap, ProcessNodeData } from '../../../types/process';
import { NODE_TYPE_META } from '../../../lib/processSchema';
import { useProcessStore } from '../../../store/useProcessStore';
import { EditableTitle } from './EditableTitle';
import { QuickAdd } from './QuickAdd';
import { cn } from '../../../lib/cn';

const ICONS: Partial<Record<NodeType, LucideIcon>> = {
  activity: Activity,
  document: FileText,
  system: Server,
  metric: Gauge,
  risk: AlertTriangle,
  automation: Zap,
  approval: CheckCircle2,
  handoff: ArrowLeftRight,
  evidence: FileCheck2,
  queue: Hourglass,
  buffer: Shield,
};

interface ProcessNodeFlowData {
  node: ProcessNodeData;
  process: ProcessMap;
  isSelected?: boolean;
}

function ProcessNodeImpl({ data }: NodeProps<ProcessNodeFlowData>) {
  const n = data.node;
  const meta = NODE_TYPE_META[n.type];
  const Icon = ICONS[n.type] ?? Activity;
  const deleteNode = useProcessStore((s) => s.deleteNode);

  const metricCount = n.metricIds?.length ?? 0;
  const riskCount = n.riskIds?.length ?? 0;
  const docCount = (n.documents?.length ?? 0) + (n.outputs?.length ?? 0);

  return (
    <div
      className={cn(
        'group relative w-[200px] select-none rounded-card border bg-ink-700/80 backdrop-blur-sm transition-all duration-150 ease-out',
        'hover:-translate-y-0.5 hover:shadow-glow',
        data.isSelected ? 'shadow-focus' : 'shadow-[0_10px_28px_rgba(0,0,0,0.32)]',
      )}
      style={{
        borderColor: data.isSelected ? '#4D84FF' : meta.ring,
        background: `linear-gradient(180deg, ${meta.tint} 0%, var(--node-base) 64%)`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[var(--gen-bg)]" style={{ background: meta.color }} />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-[var(--gen-bg)]" style={{ background: meta.color }} />

      <div className="h-1 w-full rounded-t-card" style={{ background: meta.color, opacity: 0.85 }} />

      <div className="px-3 py-2.5">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="flex items-center justify-center rounded-md" style={{ background: `${meta.color}22`, color: meta.color, width: 22, height: 22 }}>
              <Icon size={13} strokeWidth={2.2} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          {n.code && <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[9.5px] text-brand-200">{n.code}</span>}
        </div>

        <EditableTitle id={n.id} title={n.title} className="!text-left text-[13px] font-semibold leading-snug text-white" />

        {(n.responsible || n.sla) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] gen-text-muted">
            {n.responsible && (
              <span className="flex items-center gap-1 truncate">
                <User size={11} className="shrink-0 text-brand-300" />
                <span className="truncate">{n.responsible}</span>
              </span>
            )}
            {n.sla && (
              <span className="flex items-center gap-1">
                <Clock size={11} className="text-brand-300" />
                {n.sla}
              </span>
            )}
          </div>
        )}

        {!n.responsible && ['activity', 'approval', 'handoff'].includes(n.type) && (
          <div className="mt-2 text-[10px] font-medium text-accent-amber">⚠ Sin responsable</div>
        )}

        {(metricCount > 0 || riskCount > 0 || docCount > 0 || n.priority === 'critical') && (
          <div className="mt-2 flex flex-wrap gap-1">
            {n.priority === 'critical' && <span className="rounded-full bg-accent-red/20 px-1.5 py-0.5 text-[9.5px] font-bold text-accent-red">CRÍTICO</span>}
            {metricCount > 0 && <span className="rounded-full bg-accent-green/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-accent-green">{metricCount} mét</span>}
            {riskCount > 0 && <span className="rounded-full bg-accent-red/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-accent-red">{riskCount} rgo</span>}
            {docCount > 0 && <span className="rounded-full bg-accent-cyan/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-accent-cyan">{docCount} out</span>}
          </div>
        )}
      </div>

      {/* delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(n.id);
        }}
        className="nodrag absolute -right-2 -top-2 z-20 hidden h-5 w-5 items-center justify-center rounded-full bg-accent-red text-oncolor shadow-md group-hover:flex"
        title="Eliminar"
      >
        <Trash2 size={11} />
      </button>

      {/* quick add next step */}
      <QuickAdd sourceId={n.id} tone={meta.color} className="-right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export const ProcessNode = memo(ProcessNodeImpl);
