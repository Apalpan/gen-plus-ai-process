import { motion } from 'framer-motion';
import { Sparkles, Workflow, Gauge, PenLine, Rocket, ShieldCheck, ArrowRight, Play } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';

const STEPS: { icon: LucideIcon; label: string }[] = [
  { icon: PenLine, label: 'Capturar' },
  { icon: Workflow, label: 'Mapear' },
  { icon: ShieldCheck, label: 'Validar' },
  { icon: Gauge, label: 'Medir' },
  { icon: Sparkles, label: 'AI First' },
  { icon: Rocket, label: 'Implementar' },
];

/* ---------- Diagrama de proceso animado (pieza central) ---------- */
function NodeRect({ x, y, w, h, color, label }: { x: number; y: number; w: number; h: number; color: string; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} fill="#0a2148" stroke={`${color}66`} strokeWidth={1.2} />
      <rect x={x} y={y} width={w} height={3.5} rx={2} fill={color} />
      <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle" fontSize="10.5" fontWeight={600} fill="#E9F0FF">
        {label}
      </text>
    </g>
  );
}
function Pill({ x, y, w, h, color, label }: { x: number; y: number; w: number; h: number; color: string; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={color} />
      <text x={x + w / 2} y={y + h / 2 + 3.5} textAnchor="middle" fontSize="10" fontWeight={700} fill="#fff">
        {label}
      </text>
    </g>
  );
}
const flow = 'animate-dash-flow';

function ProcessDiagram() {
  return (
    <svg viewBox="0 0 480 270" className="h-auto w-full" aria-hidden>
      <defs>
        <marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#6A98FF" />
        </marker>
        <marker id="ahg" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#34D399" />
        </marker>
      </defs>

      {/* connectors */}
      <path d="M92,82 H110" stroke="#6A98FF" strokeWidth={2} strokeDasharray="5 5" className={flow} markerEnd="url(#ah)" fill="none" />
      <path d="M204,82 H222" stroke="#6A98FF" strokeWidth={2} strokeDasharray="5 5" className={flow} markerEnd="url(#ah)" fill="none" />
      <path d="M316,82 H344" stroke="#6A98FF" strokeWidth={2} strokeDasharray="5 5" className={flow} markerEnd="url(#ah)" fill="none" />
      {/* Sí → down to Medir */}
      <path d="M372,112 V150 H314" stroke="#34D399" strokeWidth={2} strokeDasharray="5 5" className={flow} markerEnd="url(#ahg)" fill="none" />
      {/* No → feedback to Mapear (dashed, faint) */}
      <path d="M372,52 V34 H268 V58" stroke="#F87171" strokeWidth={1.6} strokeDasharray="3 5" className={flow} fill="none" opacity={0.75} />
      {/* Medir → Implementar → Fin */}
      <path d="M222,174 H204" stroke="#6A98FF" strokeWidth={2} strokeDasharray="5 5" className={flow} markerEnd="url(#ah)" fill="none" />
      <path d="M110,174 H92" stroke="#6A98FF" strokeWidth={2} strokeDasharray="5 5" className={flow} markerEnd="url(#ah)" fill="none" />

      {/* labels Sí/No */}
      <text x={384} y={132} fontSize="9" fontWeight={700} fill="#34D399">Sí</text>
      <text x={384} y={46} fontSize="9" fontWeight={700} fill="#F87171">No</text>

      {/* nodes — fila superior */}
      <Pill x={16} y={64} w={76} h={36} color="#16a34a" label="Inicio" />
      <NodeRect x={110} y={58} w={94} h={48} color="#4D84FF" label="Capturar" />
      <NodeRect x={222} y={58} w={94} h={48} color="#2165FF" label="Mapear" />
      {/* diamond decisión */}
      <g>
        <rect x={344} y={54} width={56} height={56} rx={10} transform="rotate(45 372 82)" fill="#0a2148" stroke="#F5A62399" strokeWidth={1.2} />
        <text x={372} y={86} textAnchor="middle" fontSize="9.5" fontWeight={600} fill="#F5A623">¿OK?</text>
      </g>
      {/* fila inferior */}
      <NodeRect x={222} y={150} w={94} h={48} color="#22D3EE" label="Medir" />
      <NodeRect x={110} y={150} w={94} h={48} color="#8B5CF6" label="Optimizar" />
      <Pill x={16} y={156} w={76} h={36} color="#1E5CE8" label="Listo" />

      {/* puntos de flujo pulsantes */}
      <circle cx={156} cy={82} r={3} fill="#6A98FF" className="animate-node-pulse" />
      <circle cx={268} cy={174} r={3} fill="#22D3EE" className="animate-node-pulse" style={{ animationDelay: '1.1s' }} />
    </svg>
  );
}

function StatChip({ label, value, tone, className, delay }: { label: string; value: string; tone: string; className?: string; delay?: string }) {
  return (
    <div className={`absolute flex animate-float items-center gap-2 rounded-btn border border-white/10 bg-ink-800/90 px-2.5 py-1.5 shadow-elevated backdrop-blur ${className}`} style={{ animationDelay: delay }}>
      <span className="h-2 w-2 rounded-full" style={{ background: tone }} />
      <span className="text-[10.5px] font-medium gen-text-muted">{label}</span>
      <span className="text-[12px] font-bold" style={{ color: tone }}>{value}</span>
    </div>
  );
}

export function Home() {
  const setView = useProcessStore((s) => s.setView);
  const setSection = useProcessStore((s) => s.setSection);
  const loadTemplate = useProcessStore((s) => s.loadTemplate);

  const start = () => {
    setSection('capture');
    setView('app');
  };

  return (
    <div className="dark relative min-h-screen w-screen overflow-y-auto bg-ink-900 text-white">
      {/* fondo */}
      <div className="pointer-events-none absolute inset-0 bg-gen-hero opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dots [background-size:24px_24px] opacity-40" />
      <div className="pointer-events-none absolute inset-0 [background:radial-gradient(circle_at_72%_30%,rgba(77,132,255,0.22),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900/20 via-ink-900/55 to-ink-900" />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6">
        <header className="flex items-center justify-between py-5">
          <Logo />
          <Button variant="secondary" size="sm" onClick={() => loadTemplate('tpl_rfi')} leftIcon={<Play size={15} />}>
            Ver un caso
          </Button>
        </header>

        {/* hero 2 columnas */}
        <main className="grid flex-1 items-center gap-12 py-8 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-400/25 bg-brand-500/10 px-3 py-1.5 text-[12px] font-semibold text-brand-200"
            >
              <span className="h-1.5 w-1.5 animate-node-pulse rounded-full bg-brand-400" />
              Mapea · Mide · Opera con IA
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="font-display text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[52px]"
            >
              Mapea cómo trabajas,
              <br />
              <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">opéralo con IA.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-5 max-w-lg text-[15px] leading-relaxed text-[var(--gen-text-secondary)]"
            >
              De una idea en lenguaje natural a un proceso claro, medible y listo para agentes y automatizaciones.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Button size="lg" onClick={start} leftIcon={<Sparkles size={18} />} rightIcon={<ArrowRight size={18} />}>
                Mapear mi proceso
              </Button>
              <Button size="lg" variant="secondary" onClick={() => loadTemplate('tpl_coordinacion')}>
                Probar un ejemplo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-[11.5px] gen-text-muted"
            >
              <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent-green" /> Sin tarjeta</span>
              <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-brand-300" /> 2D · 3D · Básico</span>
              <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-accent-violet" /> Exporta a Markdown, JSON, n8n</span>
            </motion.div>
          </div>

          {/* diagrama */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="gen-glow-ring rounded-card-lg border border-white/10 bg-ink-850/60 p-5 backdrop-blur">
              <div className="mb-3 flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-red/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent-amber/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-accent-green/70" />
                <span className="ml-2 text-[10.5px] font-medium gen-text-muted">Proceso · vista 2D</span>
              </div>
              <ProcessDiagram />
            </div>
            <StatChip label="Salud" value="92" tone="#34D399" className="-right-3 -top-3" delay="0s" />
            <StatChip label="AI First" value="78" tone="#4D84FF" className="-left-3 top-1/3" delay="0.8s" />
            <StatChip label="Ahorro" value="−120 h/mes" tone="#8B5CF6" className="-bottom-3 right-6" delay="1.4s" />
          </motion.div>
        </main>

        {/* tubería de 6 pasos */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
          className="border-t border-white/[0.06] py-8"
        >
          <p className="mb-5 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">El flujo, en 6 pasos</p>
          <div className="relative mx-auto max-w-3xl">
            <div className="absolute left-6 right-6 top-5 hidden h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent lg:block" />
            <div className="grid grid-cols-3 gap-x-2 gap-y-6 lg:grid-cols-6">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={s.label} className="group flex flex-col items-center text-center">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-brand-400/35 bg-ink-800 text-brand-300 transition-all duration-150 group-hover:-translate-y-0.5 group-hover:border-brand-400/70 group-hover:text-brand-200">
                      <Icon size={17} />
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-oncolor">{i + 1}</span>
                    </div>
                    <span className="mt-2 text-[12px] font-semibold">{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
