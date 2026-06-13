import {
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import type { XY } from '../../types/process';

type Op = 'left' | 'centerH' | 'right' | 'top' | 'middle' | 'bottom' | 'distH' | 'distV';

const OPS: { op: Op; icon: LucideIcon; label: string }[] = [
  { op: 'left', icon: AlignHorizontalJustifyStart, label: 'Alinear izquierda' },
  { op: 'centerH', icon: AlignHorizontalJustifyCenter, label: 'Centrar horizontal' },
  { op: 'right', icon: AlignHorizontalJustifyEnd, label: 'Alinear derecha' },
  { op: 'top', icon: AlignVerticalJustifyStart, label: 'Alinear arriba' },
  { op: 'middle', icon: AlignVerticalJustifyCenter, label: 'Centrar vertical' },
  { op: 'bottom', icon: AlignVerticalJustifyEnd, label: 'Alinear abajo' },
  { op: 'distH', icon: AlignHorizontalSpaceAround, label: 'Distribuir horizontal' },
  { op: 'distV', icon: AlignVerticalSpaceAround, label: 'Distribuir vertical' },
];

export function AlignToolbar({ ids }: { ids: string[] }) {
  const nodes = useProcessStore((s) => s.process.nodes);
  const setNodesPositions = useProcessStore((s) => s.setNodesPositions);

  const apply = (op: Op) => {
    const sel = nodes.filter((n) => ids.includes(n.id));
    if (sel.length < 2) return;
    const xs = sel.map((n) => n.position.x);
    const ys = sel.map((n) => n.position.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const avgX = xs.reduce((a, b) => a + b, 0) / sel.length;
    const avgY = ys.reduce((a, b) => a + b, 0) / sel.length;

    let updates: { id: string; position: XY }[] = [];
    if (op === 'left') updates = sel.map((n) => ({ id: n.id, position: { x: minX, y: n.position.y } }));
    else if (op === 'right') updates = sel.map((n) => ({ id: n.id, position: { x: maxX, y: n.position.y } }));
    else if (op === 'centerH') updates = sel.map((n) => ({ id: n.id, position: { x: avgX, y: n.position.y } }));
    else if (op === 'top') updates = sel.map((n) => ({ id: n.id, position: { x: n.position.x, y: minY } }));
    else if (op === 'bottom') updates = sel.map((n) => ({ id: n.id, position: { x: n.position.x, y: maxY } }));
    else if (op === 'middle') updates = sel.map((n) => ({ id: n.id, position: { x: n.position.x, y: avgY } }));
    else if (op === 'distH') {
      const sorted = [...sel].sort((a, b) => a.position.x - b.position.x);
      const step = (maxX - minX) / (sorted.length - 1);
      updates = sorted.map((n, i) => ({ id: n.id, position: { x: minX + i * step, y: n.position.y } }));
    } else if (op === 'distV') {
      const sorted = [...sel].sort((a, b) => a.position.y - b.position.y);
      const step = (maxY - minY) / (sorted.length - 1);
      updates = sorted.map((n, i) => ({ id: n.id, position: { x: n.position.x, y: minY + i * step } }));
    }
    setNodesPositions(updates);
  };

  return (
    <div className="flex items-center gap-0.5 rounded-btn-lg border border-brand-400/40 bg-ink-850/95 p-1 shadow-elevated backdrop-blur">
      <span className="px-1.5 text-[11px] font-bold text-brand-200">{ids.length}</span>
      {OPS.map((o, i) => {
        const Icon = o.icon;
        return (
          <div key={o.op} className="flex items-center">
            {(i === 6) && <div className="mx-0.5 h-5 w-px bg-[var(--gen-border)]" />}
            <button
              onClick={() => apply(o.op)}
              title={o.label}
              className="flex h-8 w-8 items-center justify-center rounded-btn text-brand-100 transition-colors hover:bg-white/[0.1]"
            >
              <Icon size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
