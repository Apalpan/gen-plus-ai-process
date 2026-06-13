import { useEffect, useRef, useState } from 'react';
import { useViewport, useReactFlow } from 'reactflow';
import { Crosshair, GripVertical } from 'lucide-react';
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
            className={cn('pointer-events-auto absolute left-2.5 transition-opacity', dim && 'opacity-45')}
            style={{ top: top + 8 }}
          >
            <div
              onClick={() => setHighlightLane(lane.id)}
              className={cn(
                'flex items-center gap-2 rounded-btn border px-2.5 py-1.5 shadow-elevated backdrop-blur transition-all duration-150 cursor-pointer',
                active ? 'bg-ink-800' : 'bg-ink-850/92 hover:bg-ink-800',
              )}
              style={{ borderColor: active ? lane.color : `${lane.color}40`, boxShadow: active ? `0 0 0 1px ${lane.color}, 0 12px 28px rgba(0,0,0,0.3)` : undefined }}
            >
              <GripVertical size={13} className="text-[var(--gen-text-muted)]" />
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
                  className="w-36 rounded border border-brand-400/60 bg-ink-900/80 px-1.5 py-0.5 text-[12.5px] font-bold uppercase tracking-wider text-white outline-none"
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
                  className="max-w-[220px] truncate text-[13px] font-bold uppercase tracking-wider"
                  style={{ color: lane.color }}
                >
                  {lane.name}
                </span>
              )}
              {lane.ownerRole && <span className="hidden rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] gen-text-muted sm:inline">{lane.ownerRole}</span>}
              <span className="rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold gen-text-muted">{count}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  focusLane(lane.id, i);
                }}
                title="Enfocar carril"
                className="flex h-5 w-5 items-center justify-center rounded text-[var(--gen-text-muted)] transition-colors hover:bg-white/[0.1] hover:text-brand-200"
              >
                <Crosshair size={12} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
