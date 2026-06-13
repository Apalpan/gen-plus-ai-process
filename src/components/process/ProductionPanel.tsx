import { useMemo } from 'react';
import { Factory, Gauge, Timer, Hourglass, Activity, TrendingUp, AlertOctagon, Crosshair, Lightbulb } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { runProduction } from '../../lib/productionScience';
import { Field, Input } from '../ui/Field';
import { cn } from '../../lib/cn';

function Kpi({ icon: Icon, label, value, hint, tone = 'brand' }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: 'brand' | 'green' | 'amber' | 'cyan' }) {
  const c = { brand: 'text-brand-400', green: 'text-accent-green', amber: 'text-accent-amber', cyan: 'text-accent-cyan' };
  return (
    <div className="rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={c[tone]} />
        <span className="text-[10.5px] font-semibold gen-text-muted">{label}</span>
      </div>
      <div className="mt-1 text-[17px] font-bold leading-none tracking-tight">{value}</div>
      {hint && <div className="mt-0.5 text-[10px] gen-text-muted">{hint}</div>}
    </div>
  );
}

/** Capa de Producción (PPI / Operations Science) dentro de Medir. */
export function ProductionPanel() {
  const process = useProcessStore((s) => s.process);
  const patchProcess = useProcessStore((s) => s.patchProcess);
  const selectNode = useProcessStore((s) => s.selectNode);
  const r = useMemo(() => runProduction(process), [process]);

  const effColor = r.flowEfficiency >= 40 ? 'green' : r.flowEfficiency >= 20 ? 'amber' : 'brand';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-3">
        <Factory size={15} className="text-brand-400" />
        <h3 className="text-[13px] font-bold tracking-tight">Sistema de producción</h3>
        <span className="ml-auto rounded-full bg-brand-500/12 px-2 py-0.5 text-[10.5px] font-bold text-brand-300">{r.score} PScore</span>
      </div>
      <p className="px-4 pb-1 pt-0.5 text-[11px] gen-text-muted">{r.bandLabel}. Completa touch/wait time por nodo para medir el flujo real.</p>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <Field label="Unidad de flujo" hint="Qué fluye por el sistema (RFI, consulta, plano, lote…).">
          <Input value={process.unitOfFlow ?? ''} onChange={(e) => patchProcess({ unitOfFlow: e.target.value })} placeholder="Ej. Consulta técnica" className="!py-2 !text-[12.5px]" />
        </Field>

        <div className="mt-1 grid grid-cols-2 gap-2">
          <Kpi icon={Timer} label="Cycle Time" value={r.cycleTime} hint="entrada → salida" tone="brand" />
          <Kpi icon={TrendingUp} label="Throughput" value={r.throughput} hint="Little: TH=WIP/CT" tone="green" />
          <Kpi icon={Activity} label="Touch time" value={r.touchTime} hint="trabajo real" tone="cyan" />
          <Kpi icon={Hourglass} label="Wait time" value={r.waitTime} hint="espera / cola" tone="amber" />
          <Kpi icon={Gauge} label="Eficiencia de flujo" value={`${r.flowEfficiency}%`} hint="touch / (touch+wait)" tone={effColor} />
          <Kpi icon={Factory} label="WIP" value={`${r.wip}`} hint={`${r.queues} cola(s)`} tone="brand" />
        </div>

        {r.bottleneck && (
          <button
            onClick={() => r.bottleneck && selectNode(r.bottleneck.nodeId)}
            className="mt-3 flex w-full items-start gap-2.5 rounded-card border border-accent-red/30 bg-accent-red/[0.07] p-3 text-left transition-colors hover:bg-accent-red/[0.12]"
          >
            <AlertOctagon size={16} className="mt-0.5 shrink-0 text-accent-red" />
            <div>
              <div className="text-[12.5px] font-semibold text-accent-red">Cuello de botella: {r.bottleneck.title}</div>
              <div className="text-[11px] gen-text-muted">{r.bottleneck.reason}</div>
            </div>
            <Crosshair size={12} className="ml-auto mt-1 shrink-0 text-[var(--gen-text-muted)]" />
          </button>
        )}

        {/* 5 palancas */}
        <div className="mt-4 mb-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">5 palancas de optimización</div>
        <div className="space-y-1.5">
          {r.levers.map((l) => (
            <div key={l.lever} className="rounded-btn bg-white/[0.03] px-3 py-2">
              <div className="text-[12px] font-semibold">{l.label}</div>
              <div className="text-[10.5px] gen-text-muted">{l.question}</div>
              <div className="mt-0.5 text-[11px] leading-snug text-brand-200">{l.finding}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 mb-2 flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          <Lightbulb size={13} /> Insights
        </div>
        <ul className="space-y-1.5 pb-2">
          {r.insights.map((t, i) => (
            <li key={i} className="flex gap-2 text-[11.5px] leading-snug gen-text-secondary">
              <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400')} />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
