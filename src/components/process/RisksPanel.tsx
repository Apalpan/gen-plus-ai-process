import { ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/Field';
import { riskSeverityColor } from '../../lib/processSchema';
import type { Risk } from '../../types/process';

function Stepper({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <span className="mb-1 block text-[10.5px] gen-text-muted">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`h-6 w-6 rounded-md text-[11px] font-semibold transition-colors ${
              n <= value ? 'bg-brand-500 text-white' : 'bg-white/[0.06] text-[var(--gen-text-muted)] hover:bg-white/[0.12]'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function RiskCard({ risk }: { risk: Risk }) {
  const patchRisk = useProcessStore((s) => s.patchRisk);
  const deleteRisk = useProcessStore((s) => s.deleteRisk);
  const severity = risk.severity ?? risk.probability * risk.impact;

  return (
    <div className="rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: riskSeverityColor(severity) }} />
          <Input value={risk.name} onChange={(e) => patchRisk(risk.id, { name: e.target.value })} className="!py-1 !text-[13px] !font-semibold" />
        </div>
        <button onClick={() => deleteRisk(risk.id)} className="shrink-0 text-[var(--gen-text-muted)] hover:text-accent-red" aria-label="Eliminar riesgo">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-3 items-end gap-2">
        <Stepper label="Prob." value={risk.probability} onChange={(v) => patchRisk(risk.id, { probability: v })} />
        <Stepper label="Impacto" value={risk.impact} onChange={(v) => patchRisk(risk.id, { impact: v })} />
        <div>
          <span className="mb-1 block text-[10.5px] gen-text-muted">Severidad</span>
          <span className="inline-flex h-6 items-center rounded-md px-2 text-[12px] font-bold text-white" style={{ background: riskSeverityColor(severity) }}>
            {severity}
          </span>
        </div>
      </div>

      <div className="mt-2">
        <span className="mb-1 block text-[10.5px] gen-text-muted">Mitigación</span>
        <Textarea rows={2} value={risk.mitigation} onChange={(e) => patchRisk(risk.id, { mitigation: e.target.value })} className="!text-[12px]" />
      </div>
    </div>
  );
}

export function RisksPanel() {
  const risks = useProcessStore((s) => s.process.risks);
  const addRisk = useProcessStore((s) => s.addRisk);
  const sorted = [...risks].sort((a, b) => (b.severity ?? 0) - (a.severity ?? 0));

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <ShieldAlert size={16} className="text-accent-red" />
        <h2 className="text-[14px] font-bold tracking-tight">Riesgos</h2>
        <span className="ml-auto text-[11px] gen-text-muted">{risks.length}</span>
      </div>
      <p className="px-4 pb-1 pt-1 text-[12px] gen-text-muted">Matriz de probabilidad × impacto con mitigación obligatoria.</p>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4 pt-2">
        {sorted.map((r) => (
          <RiskCard key={r.id} risk={r} />
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={addRisk} leftIcon={<Plus size={15} />}>
          Agregar riesgo
        </Button>
      </div>
    </div>
  );
}
