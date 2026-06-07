import { useState } from 'react';
import { Gauge, Plus, Trash2, List, Network } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Field';
import { metricStatus } from '../../lib/processSchema';
import type { Metric, MetricCategory } from '../../types/process';
import { cn } from '../../lib/cn';

const STATUS_TONE = { on: 'green', warn: 'amber', crit: 'red', unknown: 'neutral' } as const;
const STATUS_LABEL = { on: 'En meta', warn: 'Alerta', crit: 'Crítico', unknown: 's/d' } as const;

const CAUSAL: { cat: MetricCategory; label: string; color: string }[] = [
  { cat: 'controllable_factor', label: 'Factores controlables', color: '#F5A623' },
  { cat: 'production_objective', label: 'Obj. producción', color: '#34D399' },
  { cat: 'project_objective', label: 'Obj. proyecto', color: '#22D3EE' },
  { cat: 'client_objective', label: 'Obj. cliente', color: '#1E5CE8' },
];

function MetricCard({ metric }: { metric: Metric }) {
  const patchMetric = useProcessStore((s) => s.patchMetric);
  const deleteMetric = useProcessStore((s) => s.deleteMetric);
  const status = metricStatus(metric);

  return (
    <div className="rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-brand-200">{metric.code}</span>
            <span className="truncate text-[13px] font-semibold">{metric.name}</span>
          </div>
          <p className="mt-1 text-[11px] gen-text-muted">{metric.formula}</p>
        </div>
        <button onClick={() => deleteMetric(metric.id)} className="shrink-0 text-[var(--gen-text-muted)] hover:text-accent-red" aria-label="Eliminar métrica">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>
        {metric.leadingOrLagging && <Badge tone="neutral">{metric.leadingOrLagging}</Badge>}
        {metric.frequency && <span className="text-[11px] gen-text-muted">{metric.frequency}</span>}
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10.5px] gen-text-muted">Meta</span>
          <Input value={metric.target} onChange={(e) => patchMetric(metric.id, { target: e.target.value })} className="!py-1.5 !text-[12px]" />
        </label>
        <label className="block">
          <span className="mb-1 block text-[10.5px] gen-text-muted">Actual</span>
          <Input value={metric.currentValue ?? ''} onChange={(e) => patchMetric(metric.id, { currentValue: e.target.value })} className="!py-1.5 !text-[12px]" />
        </label>
      </div>
      {metric.owner && <p className="mt-1.5 text-[11px] gen-text-muted">Dueño: {metric.owner}</p>}
    </div>
  );
}

function MetricGraph() {
  const metrics = useProcessStore((s) => s.process.metrics);
  const byCat = (cat: MetricCategory) => metrics.filter((m) => m.category === cat);
  const others = metrics.filter((m) => !CAUSAL.some((c) => c.cat === m.category));

  return (
    <div>
      <p className="mb-3 text-[12px] gen-text-muted">
        Cadena causal: una mejora en factores controlables impacta producción, proyecto y, finalmente, los objetivos del cliente.
      </p>
      <div className="space-y-3">
        {CAUSAL.map((c, i) => {
          const items = byCat(c.cat);
          return (
            <div key={c.cat} className="relative">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: c.color }}>
                  {c.label}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pl-4">
                {items.length === 0 && <span className="text-[11px] gen-text-muted">—</span>}
                {items.map((m) => {
                  const status = metricStatus(m);
                  return (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-btn border bg-white/[0.03] px-2.5 py-1.5"
                      style={{ borderColor: `${c.color}33` }}
                    >
                      <span className="truncate text-[12px] font-medium">{m.name}</span>
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', status === 'on' ? 'bg-accent-green' : status === 'warn' ? 'bg-accent-amber' : status === 'crit' ? 'bg-accent-red' : 'bg-white/30')} />
                    </div>
                  );
                })}
              </div>
              {i < CAUSAL.length - 1 && (
                <div className="ml-1 mt-1 flex items-center gap-1 text-[10px] text-brand-300/70">
                  <span className="h-3 w-px bg-brand-400/30" />
                  impacta ↑
                </div>
              )}
            </div>
          );
        })}
        {others.length > 0 && (
          <div>
            <div className="mb-1.5 mt-2 text-[12px] font-bold uppercase tracking-wider gen-text-muted">Otros indicadores</div>
            <div className="grid grid-cols-2 gap-1.5">
              {others.map((m) => (
                <div key={m.id} className="rounded-btn border border-[var(--gen-border)] bg-white/[0.03] px-2.5 py-1.5">
                  <span className="text-[11.5px] font-medium">{m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function MetricsPanel() {
  const metrics = useProcessStore((s) => s.process.metrics);
  const addMetric = useProcessStore((s) => s.addMetric);
  const [tab, setTab] = useState<'list' | 'graph'>('list');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Gauge size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Métricas conectadas</h2>
        <span className="ml-auto text-[11px] gen-text-muted">{metrics.length}</span>
      </div>

      <div className="mx-4 mt-3 flex rounded-btn bg-ink-900/60 p-1">
        <button onClick={() => setTab('list')} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors', tab === 'list' ? 'bg-brand-500/20 text-brand-100' : 'gen-text-muted')}>
          <List size={14} /> Lista
        </button>
        <button onClick={() => setTab('graph')} className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium transition-colors', tab === 'graph' ? 'bg-brand-500/20 text-brand-100' : 'gen-text-muted')}>
          <Network size={14} /> Metric Graph
        </button>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {tab === 'list' ? (
          <>
            {metrics.map((m) => (
              <MetricCard key={m.id} metric={m} />
            ))}
            <Button variant="secondary" size="sm" className="w-full" onClick={addMetric} leftIcon={<Plus size={15} />}>
              Agregar métrica
            </Button>
          </>
        ) : (
          <MetricGraph />
        )}
      </div>
    </div>
  );
}
