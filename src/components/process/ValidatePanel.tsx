import { useMemo, useState } from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, XCircle, Crosshair, GraduationCap, ChevronDown } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { runFlowValidation } from '../../lib/flowQuality';
import { ScoreRing } from './HealthScore';
import { cn } from '../../lib/cn';

const ICON = {
  pass: <CheckCircle2 size={14} className="text-accent-green" />,
  warn: <AlertTriangle size={14} className="text-accent-amber" />,
  fail: <XCircle size={14} className="text-accent-red" />,
};

const RULES = [
  'Todo flujo tiene inicio y fin.',
  'Cada paso tiene responsable por rol (no nombre propio).',
  'Cada decisión es una pregunta con dos caminos (Sí / No).',
  'Actividad = verbo + objeto ("Registrar consulta").',
  'Cada paso deja una salida; el cierre deja evidencia.',
  'Cada métrica tiene fórmula, meta y frecuencia.',
];

/** Paso 3 — Validar: reglas pedagógicas AEC/Lean sobre el flujo. */
export function ValidatePanel() {
  const process = useProcessStore((s) => s.process);
  const selectNode = useProcessStore((s) => s.selectNode);
  const report = useMemo(() => runFlowValidation(process), [process]);
  const [showRules, setShowRules] = useState(false);

  const color = report.score >= 90 ? '#34D399' : report.score >= 70 ? '#4D84FF' : report.score >= 40 ? '#F5A623' : '#F87171';
  const fails = report.issues.filter((i) => i.severity === 'fail');
  const warns = report.issues.filter((i) => i.severity === 'warn');

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <ShieldCheck size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Validar el flujo</h2>
      </div>
      <p className="px-4 pb-1 pt-1 text-[12px] gen-text-muted">La app revisa la calidad del flujo y te enseña a corregirlo.</p>

      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="flex items-center gap-3 rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3">
          <ScoreRing score={report.score} color={color} size={56} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider gen-text-muted">Calidad del flujo</div>
            <div className="text-[14px] font-bold" style={{ color }}>
              {report.passed}/{report.total} reglas OK
            </div>
            <div className="text-[11px] gen-text-muted">
              {fails.length} críticas · {warns.length} mejoras
            </div>
          </div>
        </div>

        {report.issues.length === 0 ? (
          <div className="mt-3 rounded-btn bg-accent-green/10 px-3 py-2.5 text-[12.5px] font-medium text-accent-green">
            ✓ El flujo cumple las reglas. Pasa a Medir.
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {[...fails, ...warns].map((it) => (
              <button
                key={it.id}
                onClick={() => it.nodeId && selectNode(it.nodeId)}
                className={cn(
                  'flex w-full items-start gap-2.5 rounded-btn border bg-white/[0.03] px-3 py-2 text-left transition-colors',
                  it.nodeId ? 'hover:bg-white/[0.07]' : 'cursor-default',
                  it.severity === 'fail' ? 'border-accent-red/30' : 'border-[var(--gen-border)]',
                )}
              >
                <span className="mt-0.5 shrink-0">{ICON[it.severity]}</span>
                <div className="min-w-0">
                  <div className="text-[12.5px] font-semibold leading-snug">{it.rule}</div>
                  <div className="text-[11px] gen-text-muted">{it.detail}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-brand-300">→ {it.fix}</div>
                </div>
                {it.nodeId && <Crosshair size={12} className="ml-auto mt-1 shrink-0 text-[var(--gen-text-muted)]" />}
              </button>
            ))}
          </div>
        )}

        {/* Reglas GEN+ (enseña mientras corrige) */}
        <button
          onClick={() => setShowRules((v) => !v)}
          className="mt-4 flex w-full items-center gap-2 rounded-btn bg-white/[0.03] px-3 py-2 text-left text-[12px] font-semibold text-brand-200 hover:bg-white/[0.06]"
        >
          <GraduationCap size={14} />
          Reglas GEN+ de un buen flujo
          <ChevronDown size={14} className={cn('ml-auto transition-transform', showRules && 'rotate-180')} />
        </button>
        {showRules && (
          <ul className="mt-1.5 space-y-1 pl-1">
            {RULES.map((r, i) => (
              <li key={i} className="flex gap-2 text-[11.5px] leading-snug gen-text-secondary">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
