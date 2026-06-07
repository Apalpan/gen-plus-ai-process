import { motion } from 'framer-motion';
import { Sparkles, Workflow, Gauge, Zap, FileCheck2, Download, ArrowRight, Play, Github } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';

const VALUES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Workflow, title: 'Proceso lógico', desc: 'Swimlanes, decisiones, roles y handoffs.' },
  { icon: Gauge, title: 'Métricas conectadas', desc: 'Cadena causal de objetivos y factores.' },
  { icon: Zap, title: 'Automatización', desc: 'Triggers, acciones y human-in-the-loop.' },
  { icon: FileCheck2, title: 'Trazabilidad', desc: 'Documentos, evidencia y RACI.' },
  { icon: Download, title: 'Exportación', desc: 'JSON, Markdown, Mermaid, PNG y prompts.' },
];

function HeroDecoration() {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2165FF" stopOpacity="0.0" />
          <stop offset="50%" stopColor="#4D84FF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#2165FF" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      {[
        'M 5,30 C 25,10 45,50 70,30',
        'M 10,60 C 35,80 60,40 90,65',
        'M 0,85 C 30,70 55,95 95,80',
      ].map((d, i) => (
        <path
          key={i}
          d={d.replace(/(\d+),(\d+)/g, (_, x, y) => `${(+x / 100) * 1400},${(+y / 100) * 800}`)}
          fill="none"
          stroke="url(#line)"
          strokeWidth={1.5}
          className="animate-pulse-line"
          style={{ animationDelay: `${i * 0.8}s` }}
        />
      ))}
    </svg>
  );
}

export function Home() {
  const setView = useProcessStore((s) => s.setView);
  const setSection = useProcessStore((s) => s.setSection);
  const loadTemplate = useProcessStore((s) => s.loadTemplate);

  const start = () => {
    setSection('builder');
    setView('app');
  };

  return (
    <div className="relative min-h-screen w-screen overflow-y-auto bg-ink-900 text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 bg-gen-hero opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dots [background-size:26px_26px] opacity-[0.5]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900/30 via-ink-900/60 to-ink-900" />
      <HeroDecoration />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-6">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button variant="ghost" size="sm" leftIcon={<Github size={16} />}>
                <span className="hidden sm:inline">GitHub</span>
              </Button>
            </a>
            <Button variant="secondary" size="sm" onClick={() => { loadTemplate('tpl_obra_example'); }}>
              Ver ejemplo
            </Button>
          </div>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-400/30 bg-brand-500/10 px-3.5 py-1.5 text-[12.5px] font-medium text-brand-200"
          >
            <Sparkles size={14} className="text-brand-400" />
            Figma + Miro + BPMN + Copilot + Métricas, en uno
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
          >
            Mapea procesos complejos
            <br />
            <span className="bg-gradient-to-r from-brand-300 via-brand-200 to-white bg-clip-text text-transparent">
              desde ideas simples.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[var(--gen-text-secondary)] sm:text-base"
          >
            Convierte conversaciones, problemas y coordinaciones en procesos visuales, métricas accionables y
            automatizaciones listas para implementar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
          >
            <Button size="lg" onClick={start} leftIcon={<Sparkles size={18} />} rightIcon={<ArrowRight size={18} />}>
              Crear proceso con IA
            </Button>
            <Button size="lg" variant="secondary" onClick={() => loadTemplate('tpl_obra_example')} leftIcon={<Play size={17} />}>
              Ver ejemplo
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="grid grid-cols-2 gap-3 pb-8 sm:grid-cols-3 lg:grid-cols-5"
        >
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.title}
                className="gen-surface rounded-card p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400/45 hover:shadow-glow"
              >
                <span className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-btn bg-brand-500/15 text-brand-300">
                  <Icon size={18} />
                </span>
                <h3 className="text-[13.5px] font-semibold">{v.title}</h3>
                <p className="mt-1 text-[11.5px] leading-snug gen-text-muted">{v.desc}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
