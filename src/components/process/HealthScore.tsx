import { useProcessStore } from '../../store/useProcessStore';
import { cn } from '../../lib/cn';

function bandColor(band: string): string {
  switch (band) {
    case 'hardened':
      return '#34D399';
    case 'implementable':
      return '#4D84FF';
    case 'incomplete':
      return '#F5A623';
    default:
      return '#F87171';
  }
}

export function ScoreRing({ score, color, size = 56 }: { score: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={5}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 600ms cubic-bezier(.4,0,.2,1)' }}
      />
      <text x="50%" y="50%" dy="0.35em" textAnchor="middle" className="rotate-90" style={{ transformOrigin: 'center' }} fill="var(--gen-text)" fontSize={size * 0.3} fontWeight={700}>
        {score}
      </text>
    </svg>
  );
}

export function HealthScoreCompact() {
  const health = useProcessStore((s) => s.health)();
  const setSection = useProcessStore((s) => s.setSection);
  const color = bandColor(health.band);

  return (
    <button
      onClick={() => setSection('metrics')}
      className={cn(
        'flex w-full items-center gap-3 border-b border-[var(--gen-border)] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]',
      )}
    >
      <ScoreRing score={health.score} color={color} />
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-wider gen-text-muted">Health Score</div>
        <div className="text-[14px] font-bold" style={{ color }}>
          {health.bandLabel}
        </div>
        <div className="text-[11px] gen-text-muted">
          {health.items.filter((i) => i.severity === 'pass').length}/{health.items.length} checks ok · ver detalle
        </div>
      </div>
    </button>
  );
}
