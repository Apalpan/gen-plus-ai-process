import { Target, Compass, Users, Gauge, ShieldAlert, Workflow, MousePointerClick } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Badge } from '../ui/Badge';
import { Field, Select, Textarea } from '../ui/Field';
import { riskSeverityColor } from '../../lib/processSchema';
import type { MaturityLevel } from '../../types/process';

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
      {icon}
      {children}
    </div>
  );
}

const MATURITY: MaturityLevel[] = ['idea', 'current', 'optimized', 'automatable'];

export function ProcessSummary() {
  const process = useProcessStore((s) => s.process);
  const patchProcess = useProcessStore((s) => s.patchProcess);

  const topRisks = [...process.risks].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0)).slice(0, 3);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-[var(--gen-border)] px-4 py-3">
        <MousePointerClick size={15} className="text-brand-300" />
        <span className="text-[13px] font-semibold">Resumen ejecutivo</span>
        <span className="ml-auto text-[11px] gen-text-muted">Selecciona un nodo para editar</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <p className="text-[13px] leading-relaxed gen-text-secondary">{process.description}</p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Field label="Madurez">
            <Select value={process.maturityLevel} onChange={(e) => patchProcess({ maturityLevel: e.target.value as MaturityLevel })}>
              {MATURITY.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <span className="block text-[12px] font-semibold gen-text-secondary mb-1.5">Tags</span>
            <div className="flex flex-wrap gap-1">
              {process.tags.slice(0, 5).map((t) => (
                <Badge key={t} tone="brand">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <SectionTitle icon={<Target size={14} />}>Objetivo</SectionTitle>
        <Textarea rows={2} value={process.objective} onChange={(e) => patchProcess({ objective: e.target.value })} />

        <SectionTitle icon={<Compass size={14} />}>North Star</SectionTitle>
        <Textarea rows={2} value={process.northStarMetric ?? ''} onChange={(e) => patchProcess({ northStarMetric: e.target.value })} />

        <SectionTitle icon={<Users size={14} />}>Roles / carriles</SectionTitle>
        <div className="space-y-1.5">
          {process.lanes.map((l) => (
            <div key={l.id} className="flex items-center gap-2 rounded-btn bg-white/[0.03] px-2.5 py-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
              <span className="text-[12.5px] font-medium">{l.name}</span>
              {l.ownerRole && <span className="ml-auto text-[11px] gen-text-muted">{l.ownerRole}</span>}
            </div>
          ))}
        </div>

        <SectionTitle icon={<Gauge size={14} />}>Métricas clave</SectionTitle>
        <div className="space-y-1.5">
          {process.metrics.slice(0, 4).map((m) => (
            <div key={m.id} className="rounded-btn bg-white/[0.03] px-2.5 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium">{m.name}</span>
                <Badge tone="green">{m.target}</Badge>
              </div>
              <p className="mt-0.5 text-[11px] gen-text-muted">{m.formula}</p>
            </div>
          ))}
          {process.metrics.length === 0 && <p className="text-[12px] gen-text-muted">Sin métricas. Pídele al Copilot "agrega métricas".</p>}
        </div>

        <SectionTitle icon={<ShieldAlert size={14} />}>Riesgos principales</SectionTitle>
        <div className="space-y-1.5">
          {topRisks.map((r) => (
            <div key={r.id} className="flex items-start gap-2 rounded-btn bg-white/[0.03] px-2.5 py-1.5">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: riskSeverityColor(r.severity ?? 0) }} />
              <div>
                <span className="text-[12.5px] font-medium">{r.name}</span>
                <p className="mt-0.5 text-[11px] gen-text-muted">{r.mitigation}</p>
              </div>
            </div>
          ))}
          {topRisks.length === 0 && <p className="text-[12px] gen-text-muted">Sin riesgos identificados.</p>}
        </div>

        <SectionTitle icon={<Workflow size={14} />}>Automatizaciones</SectionTitle>
        <div className="space-y-1.5 pb-2">
          {process.automations.slice(0, 3).map((a) => (
            <div key={a.id} className="rounded-btn bg-accent-violet/[0.08] px-2.5 py-1.5">
              <span className="text-[12.5px] font-medium text-accent-violet">{a.name}</span>
              <p className="mt-0.5 text-[11px] gen-text-muted">{a.trigger} → {a.action}</p>
            </div>
          ))}
          {process.automations.length === 0 && <p className="text-[12px] gen-text-muted">Sin automatizaciones.</p>}
        </div>
      </div>
    </div>
  );
}
