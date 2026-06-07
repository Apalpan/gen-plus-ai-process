import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import {
  Play,
  Flag,
  Activity,
  GitBranch,
  FileText,
  Server,
  Gauge,
  AlertTriangle,
  Zap,
  CheckCircle2,
  ArrowLeftRight,
  FileCheck2,
  Clock,
  User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { NodeType, ProcessMap, ProcessNodeData } from '../../../types/process';
import { NODE_TYPE_META } from '../../../lib/processSchema';
import { cn } from '../../../lib/cn';

const ICONS: Record<NodeType, LucideIcon> = {
  start: Play,
  end: Flag,
  activity: Activity,
  decision: GitBranch,
  document: FileText,
  system: Server,
  metric: Gauge,
  risk: AlertTriangle,
  automation: Zap,
  approval: CheckCircle2,
  handoff: ArrowLeftRight,
  evidence: FileCheck2,
};

interface ProcessNodeFlowData {
  node: ProcessNodeData;
  process: ProcessMap;
  isSelected?: boolean;
}

function ProcessNodeImpl({ data }: NodeProps<ProcessNodeFlowData>) {
  const n = data.node;
  const meta = NODE_TYPE_META[n.type];
  const Icon = ICONS[n.type];
  const isPill = n.type === 'start' || n.type === 'end';
  const isDecision = n.type === 'decision';

  const metricCount = n.metricIds?.length ?? 0;
  const riskCount = n.riskIds?.length ?? 0;
  const docCount = (n.documents?.length ?? 0) + (n.outputs?.length ?? 0);

  return (
    <div
      className={cn(
        'group relative w-[196px] select-none rounded-card border bg-ink-700/80 backdrop-blur-sm transition-all duration-150 ease-out',
        'hover:-translate-y-0.5 hover:shadow-glow',
        data.isSelected ? 'shadow-focus' : 'shadow-[0_10px_28px_rgba(0,0,0,0.32)]',
      )}
      style={{
        borderColor: data.isSelected ? '#4D84FF' : meta.ring,
        background: `linear-gradient(180deg, ${meta.tint} 0%, var(--node-base) 64%)`,
      }}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5" />
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5" />

      {/* top accent strip */}
      <div className="h-1 w-full rounded-t-card" style={{ background: meta.color, opacity: isPill ? 0.95 : 0.8 }} />

      <div className={cn('px-3 py-2.5', isPill && 'py-3')}>
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span
              className={cn('flex items-center justify-center rounded-md', isDecision && 'rotate-45')}
              style={{ background: `${meta.color}22`, color: meta.color, width: 22, height: 22 }}
            >
              <span className={cn(isDecision && '-rotate-45')}>
                <Icon size={13} strokeWidth={2.2} />
              </span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
              {meta.label}
            </span>
          </div>
          {n.code && (
            <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[9.5px] text-brand-200">{n.code}</span>
          )}
        </div>

        <div className={cn('text-[13px] font-semibold leading-snug text-white', isPill && 'text-center')}>
          {n.title}
        </div>

        {isDecision && n.condition && (
          <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-accent-amber/90">{n.condition}</div>
        )}

        {!isPill && (n.responsible || n.sla) && (
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

        {(metricCount > 0 || riskCount > 0 || docCount > 0 || n.priority === 'critical') && (
          <div className="mt-2 flex flex-wrap gap-1">
            {n.priority === 'critical' && (
              <span className="rounded-full bg-accent-red/20 px-1.5 py-0.5 text-[9.5px] font-bold text-accent-red">CRÍTICO</span>
            )}
            {metricCount > 0 && (
              <span className="rounded-full bg-accent-green/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-accent-green">
                {metricCount} mét
              </span>
            )}
            {riskCount > 0 && (
              <span className="rounded-full bg-accent-red/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-accent-red">
                {riskCount} rgo
              </span>
            )}
            {docCount > 0 && (
              <span className="rounded-full bg-accent-cyan/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-accent-cyan">
                {docCount} out
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export const ProcessNode = memo(ProcessNodeImpl);
