import { Map as MapIcon, Github, ExternalLink, Rocket } from 'lucide-react';
import { Button } from '../ui/Button';

const ROADMAP: { title: string; items: string[] }[] = [
  {
    title: 'IA & datos',
    items: ['Integración OpenAI / Claude API', 'Endpoint propio de generación', 'Guardado en Supabase / Firebase', 'Dashboard de métricas en tiempo real'],
  },
  {
    title: 'Colaboración',
    items: ['Login y multiusuario', 'Versionado de procesos', 'Comentarios', 'Modo presentación'],
  },
  {
    title: 'Interoperabilidad',
    items: ['Exportación BPMN real', 'Integración Miro', 'Integración Notion', 'Integración Obsidian', 'Integración Google Drive', 'Integración n8n'],
  },
];

const DEPLOY = [
  {
    icon: Github,
    title: 'GitHub Pages',
    steps: ['npm run build con BASE_PATH=/<repo>/', 'El workflow .github/workflows/deploy.yml publica /dist', 'Activa Pages → Source: GitHub Actions'],
  },
  {
    icon: Rocket,
    title: 'Vercel',
    steps: ['Importa el repo en Vercel', 'Framework: Vite (autodetectado)', 'Build: npm run build · Output: dist'],
  },
];

export function RoadmapPanel() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <MapIcon size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Roadmap & Deploy</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="mb-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">Desplegar</h3>
        <div className="space-y-2.5">
          {DEPLOY.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.title} className="rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon size={16} className="text-brand-300" />
                  <span className="text-[13px] font-semibold">{d.title}</span>
                </div>
                <ol className="ml-1 space-y-1 text-[11.5px] gen-text-secondary">
                  {d.steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-brand-400">{i + 1}.</span>
                      {s}
                    </li>
                  ))}
                </ol>
              </div>
            );
          })}
        </div>

        <h3 className="mb-2 mt-5 text-[12px] font-bold uppercase tracking-wider text-brand-300">Roadmap futuro</h3>
        <div className="space-y-3">
          {ROADMAP.map((group) => (
            <div key={group.title}>
              <div className="mb-1 text-[12px] font-semibold text-brand-200">{group.title}</div>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((it) => (
                  <span key={it} className="rounded-full border border-[var(--gen-border)] bg-white/[0.03] px-2.5 py-1 text-[11px] gen-text-secondary">
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <a href="https://pages.github.com/" target="_blank" rel="noreferrer" className="mt-5 block">
          <Button variant="secondary" size="sm" className="w-full" rightIcon={<ExternalLink size={14} />}>
            Documentación GitHub Pages
          </Button>
        </a>
      </div>
    </div>
  );
}
