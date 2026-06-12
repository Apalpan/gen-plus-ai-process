import { useMemo } from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  AlertTriangle,
  Rocket,
  UserCheck,
  CircleDot,
  Wand2,
  Check,
} from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { runAIFirst, ACTION_META } from '../../lib/aiFirst';
import { ScoreRing } from '../process/HealthScore';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

function scoreColor(score: number) {
  if (score >= 86) return '#34D399';
  if (score >= 71) return '#4D84FF';
  if (score >= 51) return '#22D3EE';
  if (score >= 26) return '#F5A623';
  return '#F87171';
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
      {icon}
      {children}
    </div>
  );
}

/** Paso 4 — Optimizar AI First: proceso actual vs futuro, plan y recomendaciones. */
export function AIFirstView() {
  const process = useProcessStore((s) => s.process);
  const applyAIFirst = useProcessStore((s) => s.applyAIFirst);
  const setSection = useProcessStore((s) => s.setSection);

  const report = useMemo(() => runAIFirst(process), [process]);
  const applied = (process.roadmap?.length ?? 0) > 0;
  const color = scoreColor(report.score);

  if (process.nodes.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-6 py-16 text-center animate-fade-up">
        <Sparkles size={28} className="mx-auto text-brand-400" />
        <h2 className="mt-3 font-display text-[20px] font-bold">Primero mapea tu proceso</h2>
        <p className="mt-1.5 text-[13.5px] gen-text-secondary">AI First significa rediseñar el trabajo, no solo agregar herramientas. Captura tu proceso para analizarlo.</p>
        <Button className="mt-4" onClick={() => setSection('capture')}>Capturar proceso</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 animate-fade-up">
      <div className="mb-1 flex items-center gap-2 text-brand-400">
        <Sparkles size={18} />
        <span className="text-[12px] font-bold uppercase tracking-wider">Paso 4 · Optimizar AI First</span>
      </div>
      <h1 className="font-display text-[24px] font-bold tracking-tight">{process.title}</h1>
      <p className="mt-1 text-[13.5px] gen-text-secondary">No automatices caos. Primero rediseña el proceso; luego implementa agentes y automatizaciones.</p>

      {/* Score header */}
      <div className="gen-surface mt-5 flex flex-wrap items-center gap-5 rounded-card-lg p-5">
        <div className="flex items-center gap-4">
          <ScoreRing score={report.score} color={color} size={72} />
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider gen-text-muted">AI First Score</div>
            <div className="text-[16px] font-bold" style={{ color }}>{report.bandLabel}</div>
            <div className="mt-0.5 max-w-md text-[12px] leading-snug gen-text-secondary">{report.recommendation}</div>
          </div>
        </div>
        <div className="min-w-[180px] flex-1">
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="gen-text-muted">Potencial de automatización</span>
            <span className="font-bold text-accent-violet">{report.automationPotential}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-violet transition-all duration-500" style={{ width: `${report.automationPotential}%` }} />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11.5px] text-brand-300">
            <CircleDot size={12} />
            <span className="font-medium">Siguiente paso: {report.nextStep}</span>
          </div>
        </div>
        <Button onClick={applyAIFirst} leftIcon={applied ? <Check size={16} /> : <Wand2 size={16} />}>
          {applied ? 'Plan generado · Actualizar' : 'Generar plan AI First'}
        </Button>
      </div>

      {/* Actual vs Futuro */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="gen-surface rounded-card p-4">
          <SectionTitle icon={<CircleDot size={14} />}>Proceso actual</SectionTitle>
          <ul className="space-y-1.5">
            {report.currentSummary.map((line, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-snug gen-text-secondary">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/30" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-brand-400/35 bg-brand-500/[0.06] p-4">
          <SectionTitle icon={<Sparkles size={14} />}>Proceso futuro AI First</SectionTitle>
          <ul className="space-y-1.5">
            {report.futureSummary.map((line, i) => (
              <li key={i} className="flex gap-2 text-[12.5px] leading-snug">
                <ArrowRight size={13} className="mt-0.5 shrink-0 text-brand-400" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Clasificación por actividad */}
      <div className="gen-surface mt-4 rounded-card p-4">
        <SectionTitle icon={<UserCheck size={14} />}>Rediseño actividad por actividad</SectionTitle>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {Object.entries(ACTION_META).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-semibold" style={{ background: `${v.color}1f`, color: v.color }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: v.color }} />
              {v.label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
          {report.classifications.map((c) => {
            const meta = ACTION_META[c.action];
            return (
              <div key={c.nodeId} className="flex items-start gap-2.5 rounded-btn bg-white/[0.03] px-3 py-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12.5px] font-semibold">{c.title}</span>
                    <span className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold" style={{ background: `${meta.color}1f`, color: meta.color }}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-snug gen-text-muted">{c.reason}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agentes + Automatizaciones */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="gen-surface rounded-card p-4">
          <SectionTitle icon={<Bot size={14} />}>Agentes IA recomendados</SectionTitle>
          {report.agents.length === 0 && <p className="text-[12px] gen-text-muted">Sin tareas cognitivas claras aún. Detalla las actividades (analizar, redactar, clasificar…).</p>}
          <div className="space-y-2">
            {report.agents.map((a) => (
              <div key={a.id} className="rounded-btn border border-accent-violet/25 bg-accent-violet/[0.06] p-3">
                <div className="flex items-center gap-2">
                  <Bot size={14} className="text-accent-violet" />
                  <span className="text-[13px] font-semibold">{a.name}</span>
                  <Badge tone="violet" className="ml-auto">{a.autonomyLevel}</Badge>
                </div>
                <p className="mt-1 text-[11.5px] leading-snug gen-text-secondary">{a.role}.</p>
                <p className="mt-1 text-[11px] gen-text-muted">
                  Supervisor: {a.supervisor} · KPI: {a.kpi}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="gen-surface rounded-card p-4">
          <SectionTitle icon={<Zap size={14} />}>Automatizaciones recomendadas</SectionTitle>
          {report.automations.length === 0 && <p className="text-[12px] gen-text-muted">Sin tareas repetitivas detectadas en los títulos de actividades.</p>}
          <div className="space-y-1.5">
            {report.automations.map((a) => (
              <div key={a.id} className="rounded-btn bg-white/[0.03] px-3 py-2">
                <div className="text-[12.5px] font-semibold text-accent-cyan">{a.name.replace('Automatizar: ', '')}</div>
                <p className="mt-0.5 text-[11px] gen-text-muted">
                  {a.trigger} → {a.action} {a.humanInTheLoop ? '· requiere validación humana' : ''}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 border-t border-[var(--gen-border)] pt-3">
            <SectionTitle icon={<Zap size={14} />}>Quick wins</SectionTitle>
            <ul className="space-y-1">
              {report.quickWins.map((w, i) => (
                <li key={i} className="flex gap-2 text-[12px] gen-text-secondary">
                  <Check size={13} className="mt-0.5 shrink-0 text-accent-green" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Roadmap 30/60/90 */}
      <div className="gen-surface mt-4 rounded-card p-4">
        <SectionTitle icon={<Rocket size={14} />}>Roadmap 30 / 60 / 90 días</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(['30', '60', '90'] as const).map((tf) => (
            <div key={tf} className="rounded-btn border border-[var(--gen-border)] bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-bold text-brand-300">{tf}</span>
                <span className="text-[12px] font-bold gen-text-secondary">días</span>
              </div>
              <div className="space-y-1.5">
                {report.roadmap.filter((r) => r.timeframe === tf).map((r) => (
                  <div key={r.id} className="rounded-md bg-white/[0.03] px-2.5 py-1.5">
                    <div className="text-[12px] font-medium leading-snug">{r.title}</div>
                    <div className="mt-0.5 flex gap-1.5 text-[9.5px] font-semibold">
                      <span className={r.priority === 'alta' ? 'text-accent-red' : r.priority === 'media' ? 'text-accent-amber' : 'gen-text-muted'}>
                        prioridad {r.priority}
                      </span>
                      <span className="gen-text-muted">· impacto {r.impact} · esfuerzo {r.effort}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Riesgos ocultos + CTA */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="gen-surface rounded-card p-4 lg:col-span-2">
          <SectionTitle icon={<AlertTriangle size={14} />}>Riesgos ocultos del rediseño</SectionTitle>
          <ul className="space-y-1.5">
            {report.hiddenRisks.map((r, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-snug gen-text-secondary">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-accent-amber" />
                {r}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center rounded-card border border-brand-400/35 bg-gen-hero p-4 text-center dark">
          <p className="text-[13px] font-semibold text-white">¿Listo para implementar?</p>
          <p className="mt-1 text-[11.5px] text-white/70">Genera la ficha con prompts para Claude Code, n8n y tu documentación.</p>
          <Button className="mt-3" size="sm" onClick={() => setSection('implement')} rightIcon={<ArrowRight size={15} />}>
            Ir a Implementar
          </Button>
        </div>
      </div>
    </div>
  );
}
