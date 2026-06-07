import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { Lane } from '../../../types/process';

interface LaneNodeData {
  lane: Lane;
  width: number;
  height: number;
}

function LaneNodeImpl({ data }: NodeProps<LaneNodeData>) {
  const { lane, width, height } = data;
  return (
    <div
      style={{ width, height }}
      className="pointer-events-none relative overflow-hidden rounded-xl"
    >
      <div
        className="absolute inset-0 rounded-xl border"
        style={{
          background: `linear-gradient(90deg, ${lane.color}14 0%, ${lane.color}05 40%, transparent 100%)`,
          borderColor: `${lane.color}26`,
        }}
      />
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: lane.color }} />
      <div className="absolute left-4 top-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ background: lane.color }} />
        <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: lane.color }}>
          {lane.name}
        </span>
        {lane.ownerRole && (
          <span className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10.5px] gen-text-muted">{lane.ownerRole}</span>
        )}
      </div>
    </div>
  );
}

export const LaneNode = memo(LaneNodeImpl);
