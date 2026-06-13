import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';
import { X } from 'lucide-react';
import { useProcessStore } from '../../../store/useProcessStore';
import type { ProcessEdgeData } from '../../../types/process';

interface GenEdgeData {
  edge: ProcessEdgeData;
  label?: string;
  color: string;
}

/** Custom edge: smooth path + arrow, Sí/No label pill, hover-to-delete control. */
export function GenEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<GenEdgeData>) {
  const deleteEdge = useProcessStore((s) => s.deleteEdge);
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 14,
  });

  const color = data?.color ?? '#4D84FF';
  const label = data?.label;

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          className="group/edge nodrag nopan absolute flex items-center gap-1"
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`, pointerEvents: 'all' }}
        >
          {label ? (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-oncolor shadow-sm"
              style={{ background: color }}
            >
              {label}
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full opacity-0 transition-opacity group-hover/edge:opacity-100" style={{ background: color }} />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data?.edge) deleteEdge(data.edge.id);
            }}
            title="Eliminar conexión"
            className="hidden h-4 w-4 items-center justify-center rounded-full bg-accent-red text-oncolor shadow-md group-hover/edge:flex"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
