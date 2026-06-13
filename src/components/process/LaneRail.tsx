import { useEffect, useRef, useState } from 'react';
import { useViewport, useReactFlow } from 'reactflow';
import { Crosshair } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { LANE_HEIGHT, laneWidth } from '../../lib/processEngine';
import { LANE_COLORS } from '../../lib/processSchema';
import { cn } from '../../lib/cn';

/**
 * Rail de carriles: encabezados siempre visibles, anclados a la izquierda del
 * viewport y siguiendo el zoom/pan. Renombra (doble clic), cambia color (punto),
 * aísla el swimlane (clic) y enfoca (icono).
 */
export function LaneRail() {
  const lanes = useProcessStore((s) => s.process.lanes);
  const process = useProcessStore((s) => s.process);
  const patchLane = useProcessStore((s) => s.patchLane);
  const highlightLaneId = useProcessStore((s) => s.highlightLaneId);
  const setHighlightLane = useProcessStore((s) => s.setHighlightLane);
  const { y, zoom } = useViewport();
  const { fitBounds } = useReactFlow();

  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = (id: string, fallback: string) => {
    patchLane(id, { name: draft.trim() || fallback });
    setEditing(null);
  };

  const cycleColor = (id: string, current: string) => {
    const i = LANE_COLORS.indexOf(current);
    patchLane(id, { color: LANE_COLORS[(i + 1) % LANE_COLORS.length] });
  };

  const focusLane = (laneId: string, idx: number) => {
    setHighlightLane(laneId);
    fitBounds({ x: 0, y: idx * LANE_HEIGHT, width: laneWidth(process), height: LANE_HEIGHT }, { padding: 0.08, duration: 400 });
  };

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-0">
      {lanes.map((lane, i) => {
        const top = i * LANE_HEIGHT * zoom + y;
        const active = highlightLaneId === lane.id;
        const dim = highlightLaneId !== null && !active;
        const count = process.nodes.filter((n) => n.laneId === lane.id).length;
        return (
          <div
            key={lane.id}
            onClick={() => setHighlightLane(lane.id)}
            className={cn(
              'pointer-events-auto group/lane absolute left-3 flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 transition-all duration-150',
              dim && 'opacity-45',
            )}
            style={{ top: top + 6, background: active ? `${lane.color}1f` : 'transparent', boxShadow: active ? `inset 3px 0 0 ${lane.color}` : undefined }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                cycleColor(lane.id, lane.color);
              }}
              title="Cambiar color"
              className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/10 transition-transform hover:scale-125"
              style={{ background: lane.color }}
            />
            {editing === lane.id ? (
              <input
                ref={inputRef}
                value={draft}
                autoFocus
                onChange={(e) => setDraft(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                onBlur={() => commit(lane.id, lane.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                  if (e.key === 'Escape') setEditing(null);
                }}
                className="w-40 rounded border border-brand-400/60 bg-ink-900/85 px-1.5 py-0.5 text-[14px] font-extrabold uppercase tracking-wide outline-none"
                style={{ color: lane.color }}
              />
            ) : (
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setDraft(lane.name);
                  setEditing(lane.id);
                }}
                title="Doble clic para renombrar"
                className="max-w-[260px] truncate text-[14px] font-extrabold uppercase tracking-wide [text-shadow:0_1px_3px_rgba(0,0,0,0.35)]"
                style={{ color: lane.color }}
              >
                {lane.name}
              </span>
            )}
            {lane.ownerRole && <span className="hidden text-[11px] font-medium gen-text-muted md:inline">· {lane.ownerRole}</span>}
            <span className="rounded-full bg-white/[0.08] px-1.5 text-[10px] font-bold gen-text-muted">{count}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                focusLane(lane.id, i);
              }}
              title="Enfocar carril"
              className="flex h-5 w-5 items-center justify-center rounded text-[var(--gen-text-muted)] opacity-0 transition-all hover:bg-white/[0.1] hover:text-brand-200 group-hover/lane:opacity-100"
            >
              <Crosshair size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
