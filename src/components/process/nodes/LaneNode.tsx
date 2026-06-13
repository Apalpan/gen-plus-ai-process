import { memo } from 'react';
import type { NodeProps } from 'reactflow';
import type { Lane } from '../../../types/process';
import { useProcessStore } from '../../../store/useProcessStore';
import { cn } from '../../../lib/cn';

interface LaneNodeData {
  lane: Lane;
  width: number;
  height: number;
}

function LaneNodeImpl({ data }: NodeProps<LaneNodeData>) {
  const { lane, width, height } = data;
  const highlightLaneId = useProcessStore((s) => s.highlightLaneId);
  const setHighlightLane = useProcessStore((s) => s.setHighlightLane);
  const active = highlightLaneId === lane.id;
  const dim = highlightLaneId !== null && !active;

  return (
    <div
      style={{ width, height }}
      onClick={() => setHighlightLane(lane.id)}
      className={cn('relative cursor-pointer overflow-hidden rounded-xl transition-opacity duration-200', dim && 'opacity-40')}
    >
      <div
        className="absolute inset-0 rounded-xl border"
        style={{
          background: active
            ? `linear-gradient(90deg, ${lane.color}24 0%, ${lane.color}0c 50%, transparent 100%)`
            : `linear-gradient(90deg, ${lane.color}12 0%, ${lane.color}05 40%, transparent 100%)`,
          borderColor: active ? `${lane.color}55` : `${lane.color}22`,
        }}
      />
      {/* franja de color a la izquierda */}
      <div className="absolute left-0 top-0 h-full rounded-l-xl" style={{ width: active ? 5 : 3, background: lane.color }} />
      {/* línea divisoria inferior sutil */}
      <div className="absolute bottom-0 left-0 h-px w-full" style={{ background: `${lane.color}1a` }} />
    </div>
  );
}

export const LaneNode = memo(LaneNodeImpl);
