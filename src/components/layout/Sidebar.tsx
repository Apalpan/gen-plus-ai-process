import {
  Sparkles,
  LayoutTemplate,
  Library,
  Gauge,
  ShieldAlert,
  Workflow,
  HeartPulse,
  Download,
  Map as MapIcon,
  Settings,
  Home,
  Plus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import type { Section } from '../../store/useProcessStore';
import { LogoMark } from '../brand/Logo';
import { cn } from '../../lib/cn';

const items: { id: Section; label: string; icon: LucideIcon }[] = [
  { id: 'builder', label: 'Constructor IA', icon: Sparkles },
  { id: 'templates', label: 'Plantillas', icon: LayoutTemplate },
  { id: 'library', label: 'Mis procesos', icon: Library },
  { id: 'metrics', label: 'Métricas', icon: Gauge },
  { id: 'risks', label: 'Riesgos', icon: ShieldAlert },
  { id: 'automations', label: 'Automatizaciones', icon: Workflow },
  { id: 'health', label: 'Health Check', icon: HeartPulse },
  { id: 'export', label: 'Exportar', icon: Download },
  { id: 'roadmap', label: 'Roadmap', icon: MapIcon },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

function RailButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group relative flex h-11 w-11 items-center justify-center rounded-btn outline-none transition-all duration-150 ease-out',
        'focus-visible:shadow-focus',
        active
          ? 'bg-brand-500/18 text-brand-200 border border-brand-400/40'
          : 'text-[var(--gen-text-muted)] hover:text-brand-100 hover:bg-white/[0.06] border border-transparent',
      )}
    >
      <Icon size={19} strokeWidth={2} />
      {active && <span className="absolute -left-2 h-5 w-1 rounded-full bg-brand-400" />}
      <span className="pointer-events-none absolute left-[52px] z-50 whitespace-nowrap rounded-btn bg-ink-800 px-2.5 py-1.5 text-[12px] font-medium text-brand-100 opacity-0 shadow-elevated border border-[var(--gen-border)] transition-opacity duration-120 group-hover:opacity-100">
        {label}
      </span>
    </button>
  );
}

export function Sidebar() {
  const section = useProcessStore((s) => s.section);
  const setSection = useProcessStore((s) => s.setSection);
  const setView = useProcessStore((s) => s.setView);
  const newBlank = useProcessStore((s) => s.newBlank);

  return (
    <aside className="flex w-16 shrink-0 flex-col items-center gap-1 border-r border-[var(--gen-border)] bg-ink-850/60 py-3">
      <button
        onClick={() => setView('home')}
        title="Inicio"
        aria-label="Inicio"
        className="mb-1 flex h-11 w-11 items-center justify-center rounded-btn hover:bg-white/[0.06] transition-colors"
      >
        <LogoMark size={28} />
      </button>

      <RailButton label="Ir al inicio" icon={Home} onClick={() => setView('home')} />
      <RailButton label="Nuevo proceso" icon={Plus} onClick={newBlank} />

      <div className="my-1.5 h-px w-7 bg-[var(--gen-border)]" />

      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <RailButton
            key={it.id}
            label={it.label}
            icon={it.icon}
            active={section === it.id}
            onClick={() => setSection(it.id)}
          />
        ))}
      </nav>
    </aside>
  );
}
