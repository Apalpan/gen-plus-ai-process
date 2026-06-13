import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { Play, Flag, Trash2 } from 'lucide-react';
import type { ProcessMap, ProcessNodeData } from '../../../types/process';
import { useProcessStore } from '../../../store/useProcessStore';
import { EditableTitle } from './EditableTitle';
import { QuickAdd } from './QuickAdd';
import { cn } from '../../../lib/cn';

interface Data {
  node: ProcessNodeData;
  process: ProcessMap;
  isSelected?: boolean;
}

function TerminalNodeImpl({ data }: NodeProps<Data>) {
  const n = data.node;
  const deleteNode = useProcessStore((s) => s.deleteNode);
  const isStart = n.type === 'start';
  const color = isStart ? '#16a34a' : '#1E5CE8';
  const Icon = isStart ? Play : Flag;

  return (
    <div className="group relative">
      {!isStart && <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2" style={{ background: color }} />}
      {isStart && <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2" style={{ background: color }} />}

      <div
        className={cn(
          'flex h-[44px] items-center gap-2 rounded-full px-4 font-bold text-oncolor shadow-[0_8px_20px_rgba(0,0,0,0.28)] transition-all duration-150 group-hover:-translate-y-0.5',
          data.isSelected && 'ring-2 ring-offset-2 ring-offset-transparent',
        )}
        style={{ background: `linear-gradient(180deg, ${color} 0%, ${color}cc 100%)`, boxShadow: data.isSelected ? `0 0 0 3px ${color}66` : undefined }}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
          <Icon size={13} fill="currentColor" />
        </span>
        <EditableTitle id={n.id} title={n.title} className="max-w-[140px] text-[13px] leading-tight" />
      </div>

      {/* delete on hover/select */}
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

      {isStart && (
        <QuickAdd sourceId={n.id} tone={color} className="-right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </div>
  );
}

export const TerminalNode = memo(TerminalNodeImpl);
