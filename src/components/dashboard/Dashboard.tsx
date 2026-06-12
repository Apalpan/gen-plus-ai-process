import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Gauge,
  Sparkles,
  ShieldAlert,
  UserX,
  Zap,
  Clock,
  ArrowRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { runHealthCheck } from '../../lib/health';
import { aiFirstScore, automationPotential } from '../../lib/aiFirst';
import { STATUS_META } from '../../lib/processSchema';
import { Badge } from '../ui/Badge';

function Kpi({ icon: Icon, label, value, hint, tone = 'brand' }: { icon: LucideIcon; label: string; value: string; hint?: string; tone?: 'brand' | 'green' | 'amber' | 'red' }) {
  const colors = { brand: 'text-brand-400', green: 'text-accent-green', amber: 'text-accent-amber', red: 'text-accent-red' };
  return (
    <div className="gen-surface rounded-card p-4">
      <div className="flex items-center gap-2">
        <Icon size={15} className={colors[tone]} />
        <span className="text-[11.5px] font-semibold gen-text-muted">{label}</span>
      </div>
      <div className="mt-1.5 text-[24px] font-bold leading-none tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-[11px] gen-text-muted">{hint}</div>}
    </div>
  );
}

function ActionCard({ title, desc, onClick, icon: Icon }: { title: string; desc: string; onClick: () => void; icon: LucideIcon }) {
  return (
    <button
      onClick={onClick}
      className="gen-surface group flex items-start gap-3 rounded-card p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400/45 hover:shadow-glow focus-visible:shadow-focus"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-brand-500/15 text-brand-300">
        <Icon size={17} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13.5px] font-semibold">
          {title}
          <ArrowRight size={13} className="opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-[11.5px] leading-snug gen-text-muted">{desc}</span>
      </span>
    </button>
  );
}

/** Dashboard: estado del sistema de procesos de la empresa. */
export function Dashboard() {
  const library = useProcessStore((s) => s.library);
  const setSection = useProcessStore((s) => s.setSection);
  const openFromLibrary = useProcessStore((s) => s.openFromLibrary);

  const procs = library.map((s) => s.process);
  const total = procs.length;
  const withMetrics = procs.filter((p) => p.metrics.length > 0).length;
  const highAuto = procs.filter((p) => automationPotential(p) >= 50).length;
  const noOwner = procs.filter((p) =>
    p.nodes.some((n) => ['activity', 'approval', 'handoff'].includes(n.type) && !n.responsible?.trim()),
  ).length;
  const criticalRisk = procs.filter((p) => p.risks.some((r) => (r.severity ?? r.probability * r.impact) >= 15)).length;
  const avgAIFirst = total ? Math.round(procs.reduce((s, p) => s + aiFirstScore(p), 0) / total) : 0;
  const automatableNodes = procs.reduce((s, p) => s + Math.round((automationPotential(p) / 100) * p.nodes.filter((n) => ['activity', 'approval', 'handoff', 'decision'].includes(n.type)).length), 0);
  const savings = automatableNodes * 6; // estimación: ~6 h/mes por actividad automatizable

  const byArea = new Map<string, number>();
  procs.forEach((p) => {
    const a = p.area?.trim() || p.tags[0] || 'Sin área';
    byArea.set(a, (byArea.get(a) ?? 0) + 1);
  });

  const recent = [...library].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 animate-fade-up">
      <div className="mb-1 flex items-center gap-2 text-brand-400">
        <LayoutDashboard size={18} />
        <span className="text-[12px] font-bold uppercase tracking-wider">Dashboard</span>
      </div>
      <h1 className="font-display text-[24px] font-bold tracking-tight">Tu sistema de procesos</h1>
      <p className="mt-1 text-[13.5px] gen-text-secondary">
        Mapea tu proceso. Mide su desempeño. Rediséñalo con IA. Impleméntalo con agentes y automatizaciones.
      </p>

      {/* Acciones */}
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard icon={Plus} title="Mapea un nuevo proceso" desc="Descríbelo en lenguaje natural y conviértelo en mapa." onClick={() => setSection('capture')} />
        <ActionCard icon={FolderKanban} title="Optimiza un proceso existente" desc="Abre un proceso guardado y llévalo a AI First." onClick={() => setSection('processes')} />
        <ActionCard icon={Gauge} title="Revisa procesos sin métricas" desc={`${total - withMetrics} proceso(s) aún no se miden.`} onClick={() => setSection('processes')} />
        <ActionCard icon={Zap} title="Detecta automatizaciones rápidas" desc="Quick wins con alto impacto y bajo esfuerzo." onClick={() => setSection('aifirst')} />
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi icon={FolderKanban} label="Procesos mapeados" value={String(total)} />
        <Kpi icon={Gauge} label="Con métricas" value={`${withMetrics}/${total}`} tone="green" />
        <Kpi icon={Zap} label="Alto potencial de automatización" value={String(highAuto)} tone="brand" hint="≥ 50% automatizable" />
        <Kpi icon={UserX} label="Sin responsable" value={String(noOwner)} tone={noOwner ? 'amber' : 'green'} hint="Actividades sin dueño" />
        <Kpi icon={ShieldAlert} label="Riesgos críticos" value={String(criticalRisk)} tone={criticalRisk ? 'red' : 'green'} />
        <Kpi icon={Sparkles} label="AI First promedio" value={`${avgAIFirst}`} tone="brand" hint="Score 0–100" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recientes */}
        <div className="gen-surface rounded-card p-4 lg:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
            <Clock size={14} /> Últimos procesos editados
          </div>
          {recent.length === 0 ? (
            <p className="text-[12.5px] gen-text-muted">
              Aún no hay procesos guardados. Empieza con <button onClick={() => setSection('capture')} className="font-semibold text-brand-400 hover:underline">Nuevo mapa</button>.
            </p>
          ) : (
            <div className="space-y-1.5">
              {recent.map((s) => {
                const st = STATUS_META[s.process.status ?? 'mapeado'];
                const h = runHealthCheck(s.process).score;
                const ai = aiFirstScore(s.process);
                return (
                  <button
                    key={s.id}
                    onClick={() => openFromLibrary(s.id)}
                    className="flex w-full items-center gap-3 rounded-btn bg-white/[0.03] px-3 py-2 text-left transition-colors hover:bg-white/[0.07]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{s.title}</span>
                    <span className="hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline" style={{ background: `${st.color}22`, color: st.color }}>
                      {st.label}
                    </span>
                    <span className="text-[11px] gen-text-muted">Salud {h}</span>
                    <span className="text-[11px] text-brand-300">AI {ai}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Por área + ahorro */}
        <div className="space-y-4">
          <div className="gen-surface rounded-card p-4">
            <div className="mb-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">Procesos por área</div>
            {byArea.size === 0 && <p className="text-[12px] gen-text-muted">—</p>}
            <div className="space-y-1.5">
              {Array.from(byArea.entries()).slice(0, 6).map(([a, n]) => (
                <div key={a} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12px]">{a}</span>
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(n / total) * 100}%` }} />
                  </div>
                  <span className="w-4 text-right text-[11px] gen-text-muted">{n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="gen-surface rounded-card p-4">
            <div className="mb-1 text-[12px] font-bold uppercase tracking-wider text-brand-300">Ahorro potencial estimado</div>
            <div className="text-[24px] font-bold tracking-tight">{savings} h/mes</div>
            <p className="mt-1 text-[11px] leading-snug gen-text-muted">
              Estimado sobre actividades automatizables (~6 h/mes c/u). Valídalo en el paso AI First.
            </p>
            <Badge tone="violet" className="mt-2">No automatices caos: primero rediseña</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
