import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { FileText, FileCheck2, User, Trash2 } from 'lucide-react';
import type { ProcessMap, ProcessNodeData } from '../../../types/process';
import { useProcessStore } from '../../../store/useProcessStore';
import { EditableTitle } from './EditableTitle';
import { QuickAdd } from './QuickAdd';
import { cn } from '../../../lib/cn';

interface Data {
  node: ProcessNodeData;
  process: ProcessMap;
}

/** Documento / evidencia: forma de página con esquina doblada (distinta del resto). */
function DocumentNodeImpl({ data, selected }: NodeProps<Data>) {
  const n = data.node;
  const isEvidence = n.type === 'evidence';
  const color = isEvidence ? '#22D3EE' : '#0EA5C4';
  const Icon = isEvidence ? FileCheck2 : FileText;
  const deleteNode = useProcessStore((s) => s.deleteNode);

  return (
    <div className="group relative w-[188px] select-none">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-[var(--gen-bg)]" style={{ background: color }} />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-[var(--gen-bg)]" style={{ background: color }} />

      {/* página con esquina doblada (clip-path) */}
      <div
        className={cn('relative px-3 py-2.5 transition-all duration-150 group-hover:-translate-y-0.5')}
        style={{
          background: `linear-gradient(180deg, ${color}1f 0%, var(--node-base) 60%)`,
          border: `1.5px solid ${selected ? '#4D84FF' : `${color}99`}`,
          borderRadius: 12,
          clipPath: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 0 100%)',
          boxShadow: selected ? '0 0 0 3px rgba(77,132,255,0.4)' : '0 10px 26px rgba(0,0,0,0.3)',
        }}
      >
        {/* triángulo del doblez */}
        <div className="absolute right-0 top-0 h-[18px] w-[18px]" style={{ background: `${color}55`, clipPath: 'polygon(0 0, 100% 100%, 0 100%)' }} />

        <div className="mb-1 flex items-center gap-1.5">
          <span className="flex h-[22px] w-[22px] items-center justify-center rounded-md" style={{ background: `${color}26`, color }}>
            <Icon size={13} strokeWidth={2.2} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
            {isEvidence ? 'Evidencia' : 'Documento'}
          </span>
        </div>

        <EditableTitle id={n.id} title={n.title} className="!text-left text-[13px] font-semibold leading-snug text-white" />

        {/* renglones de "página" */}
        <div className="mt-2 space-y-1">
          <div className="h-1 w-3/4 rounded-full" style={{ background: `${color}40` }} />
          <div className="h-1 w-1/2 rounded-full" style={{ background: `${color}2e` }} />
        </div>

        {n.responsible && (
          <div className="mt-2 flex items-center gap-1 text-[10.5px] gen-text-muted">
            <User size={11} className="text-brand-300" />
            <span className="truncate">{n.responsible}</span>
          </div>
        )}
      </div>

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

      <QuickAdd sourceId={n.id} tone={color} className="-right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  );
}

export const DocumentNode = memo(DocumentNodeImpl);
