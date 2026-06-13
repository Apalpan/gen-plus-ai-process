import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { GitBranch, Trash2 } from 'lucide-react';
import type { ProcessMap, ProcessNodeData } from '../../../types/process';
import { useProcessStore } from '../../../store/useProcessStore';
import { EditableTitle } from './EditableTitle';
import { QuickAdd } from './QuickAdd';
import { cn } from '../../../lib/cn';

interface Data {
  node: ProcessNodeData;
  process: ProcessMap;
}

const AMBER = '#F5A623';

function DecisionNodeImpl({ data, selected }: NodeProps<Data>) {
  const n = data.node;
  const deleteNode = useProcessStore((s) => s.deleteNode);

  return (
    <div className="group relative" style={{ width: 200, height: 158 }}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2" style={{ background: AMBER, top: 70 }} />
      <Handle id="yes" type="source" position={Position.Right} className="!h-3 !w-3 !border-2" style={{ background: '#16a34a', top: 70 }} />
      <Handle id="no" type="source" position={Position.Bottom} className="!h-3 !w-3 !border-2" style={{ background: '#dc2626', left: 100 }} />

      {/* diamond */}
      <div
        className="absolute left-1/2 top-[70px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[16px] border-2 transition-all duration-150 group-hover:-translate-y-[calc(50%+2px)]"
        style={{
          width: 118,
          height: 118,
          borderColor: selected ? '#4D84FF' : `${AMBER}aa`,
          background: `linear-gradient(135deg, ${AMBER}26 0%, var(--node-base) 70%)`,
          boxShadow: selected ? '0 0 0 3px rgba(77,132,255,0.4)' : '0 10px 24px rgba(0,0,0,0.28)',
        }}
      />

      {/* upright content */}
      <div className="pointer-events-none absolute left-0 top-0 flex h-[140px] w-full flex-col items-center justify-center px-9 text-center">
        <span className="mb-0.5 flex h-5 w-5 items-center justify-center rounded-md" style={{ background: `${AMBER}26`, color: AMBER }}>
          <GitBranch size={12} strokeWidth={2.4} />
        </span>
        <EditableTitle id={n.id} title={n.title} className="pointer-events-auto max-w-[104px] text-[11.5px] font-semibold leading-tight text-white" />
        {n.code && <span className="mt-0.5 font-mono text-[8.5px] text-brand-300">{n.code}</span>}
      </div>

      {/* labels */}
      <span className="pointer-events-none absolute right-[2px] top-[54px] text-[10px] font-bold text-accent-green">Sí</span>
      <span className="pointer-events-none absolute bottom-[14px] left-[108px] text-[10px] font-bold text-accent-red">No</span>

      {/* delete */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(n.id);
        }}
        className="nodrag absolute right-7 top-2 z-20 hidden h-5 w-5 items-center justify-center rounded-full bg-accent-red text-oncolor shadow-md group-hover:flex"
        title="Eliminar"
      >
        <Trash2 size={11} />
      </button>

      {/* branch quick-adds */}
      <QuickAdd
        sourceId={n.id}
        edgeType="decision_yes"
        variant="branch"
        branchLabel="Sí"
        tone="#16a34a"
        className={cn('-right-2 top-[58px] opacity-0 transition-opacity group-hover:opacity-100')}
      />
      <QuickAdd
        sourceId={n.id}
        edgeType="decision_no"
        variant="branch"
        branchLabel="No"
        tone="#dc2626"
        className={cn('-bottom-2 left-[84px] opacity-0 transition-opacity group-hover:opacity-100')}
      />
    </div>
  );
}

export const DecisionNode = memo(DecisionNodeImpl);
