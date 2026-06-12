import { useState } from 'react';
import { toPng } from 'html-to-image';
import {
  Rocket,
  Download,
  FileJson,
  FileText,
  GitBranch,
  Image,
  Terminal,
  Workflow,
  BookOpen,
  LayoutDashboard,
  Copy,
  Check,
  Flag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { toJSON } from '../../lib/jsonExporter';
import { toMarkdown } from '../../lib/markdownExporter';
import { toMermaid } from '../../lib/mermaidExporter';
import { codexPrompt, dashboardPrompt, n8nPrompt, obsidianPrompt } from '../../lib/prompts';
import { downloadText, copyToClipboard, slugify } from '../../lib/download';
import { runHealthCheck } from '../../lib/health';
import { aiFirstScore } from '../../lib/aiFirst';
import { STATUS_META } from '../../lib/processSchema';
import { Button } from '../ui/Button';
import type { ProcessMap } from '../../types/process';
import type { Integration } from '../../ai/llm';

interface Item {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  ext: string;
  mime: string;
  make: (p: ProcessMap, integrations: Integration[]) => string;
}

const ITEMS: Item[] = [
  { id: 'md-exe', label: 'Markdown ejecutivo', desc: 'Ficha completa: actual, futuro, agentes, roadmap.', icon: FileText, ext: 'md', mime: 'text/markdown', make: (p) => toMarkdown(p, 'executive') },
  { id: 'md-tec', label: 'Markdown técnico', desc: '12 secciones + RACI + detalle por nodo.', icon: FileText, ext: 'md', mime: 'text/markdown', make: (p) => toMarkdown(p, 'technical') },
  { id: 'json', label: 'JSON (ProcessMap)', desc: 'Contrato de dominio completo.', icon: FileJson, ext: 'json', mime: 'application/json', make: toJSON },
  { id: 'mermaid', label: 'Mermaid flowchart', desc: 'Diagrama por carriles.', icon: GitBranch, ext: 'mmd', mime: 'text/plain', make: toMermaid },
  { id: 'codex', label: 'Prompt Claude Code', desc: 'Construir la app/automatización del proceso.', icon: Terminal, ext: 'md', mime: 'text/markdown', make: codexPrompt },
  { id: 'n8n', label: 'Prompt n8n', desc: 'Workflows: triggers, acciones, escalaciones.', icon: Workflow, ext: 'md', mime: 'text/markdown', make: n8nPrompt },
  { id: 'obsidian', label: 'Prompt Notion / Obsidian', desc: 'Documentar el proceso en tu vault.', icon: BookOpen, ext: 'md', mime: 'text/markdown', make: obsidianPrompt },
  { id: 'dashboard', label: 'Prompt Dashboard', desc: 'Convertir métricas en dashboard.', icon: LayoutDashboard, ext: 'md', mime: 'text/markdown', make: dashboardPrompt },
];

function Row({ item }: { item: Item }) {
  const process = useProcessStore((s) => s.process);
  const integrations = useProcessStore((s) => s.integrations);
  const [copied, setCopied] = useState(false);
  const Icon = item.icon;

  return (
    <div className="flex items-center gap-3 rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-brand-500/15 text-brand-300">
        <Icon size={17} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">{item.label}</div>
        <div className="text-[11px] gen-text-muted">{item.desc}</div>
      </div>
      <button
        onClick={async () => {
          if (await copyToClipboard(item.make(process, integrations))) {
            setCopied(true);
            setTimeout(() => setCopied(false), 1400);
          }
        }}
        className="flex h-8 w-8 items-center justify-center rounded-btn text-brand-200 hover:bg-white/[0.08]"
        title="Copiar"
      >
        {copied ? <Check size={15} className="text-accent-green" /> : <Copy size={15} />}
      </button>
      <button
        onClick={() => downloadText(`${slugify(process.title)}.${item.ext}`, item.make(process, integrations), item.mime)}
        className="flex h-8 w-8 items-center justify-center rounded-btn text-brand-200 hover:bg-white/[0.08]"
        title="Descargar"
      >
        <Download size={15} />
      </button>
    </div>
  );
}

/** Paso 5 — Implementar: ficha de implementación + exportaciones. */
export function ImplementPanel() {
  const process = useProcessStore((s) => s.process);
  const patchProcess = useProcessStore((s) => s.patchProcess);
  const saveToLibrary = useProcessStore((s) => s.saveToLibrary);

  const health = runHealthCheck(process).score;
  const ai = aiFirstScore(process);
  const st = STATUS_META[process.status ?? 'mapeado'];
  const inImplementation = process.status === 'en_implementacion' || process.status === 'implementado';

  const markInImplementation = () => {
    patchProcess({ status: inImplementation ? 'implementado' : 'en_implementacion' });
    saveToLibrary();
  };

  const exportPng = async () => {
    const wrapper = document.querySelector('.react-flow') as HTMLElement | null;
    if (!wrapper) return;
    try {
      const bg = getComputedStyle(document.documentElement).getPropertyValue('--gen-bg').trim() || '#ffffff';
      const dataUrl = await toPng(wrapper, { backgroundColor: bg, pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${slugify(process.title)}.png`;
      a.click();
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Rocket size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Implementar</h2>
      </div>
      <p className="px-4 pb-1 pt-1 text-[12px] gen-text-muted">Ficha de implementación lista para tu equipo o tus herramientas.</p>

      <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-2">
        {/* Ficha resumen */}
        <div className="rounded-card border border-brand-400/30 bg-brand-500/[0.06] p-3">
          <div className="text-[13px] font-bold">{process.title}</div>
          <p className="mt-1 line-clamp-2 text-[11.5px] leading-snug gen-text-secondary">{process.objective || process.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-full px-2 py-0.5 font-bold" style={{ background: `${st.color}22`, color: st.color }}>{st.label}</span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 gen-text-muted">Salud {health}</span>
            <span className="rounded-full bg-brand-500/12 px-2 py-0.5 font-semibold text-brand-300">AI First {ai}</span>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 gen-text-muted">
              {process.agents?.length ?? 0} agentes · {process.automations.length} autos · {process.roadmap?.length ?? 0} hitos
            </span>
          </div>
          <Button size="sm" variant={inImplementation ? 'secondary' : 'primary'} className="mt-2.5 w-full" onClick={markInImplementation} leftIcon={<Flag size={14} />}>
            {process.status === 'implementado' ? 'Implementado ✓' : inImplementation ? 'Marcar como implementado' : 'Marcar en implementación'}
          </Button>
        </div>

        {/* PNG */}
        <button
          onClick={exportPng}
          className="flex w-full items-center gap-3 rounded-card border border-[var(--gen-border)] bg-white/[0.03] p-3 text-left transition-colors hover:bg-white/[0.06]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-brand-500/15 text-brand-300">
            <Image size={17} />
          </span>
          <div>
            <div className="text-[13px] font-semibold">PNG del canvas</div>
            <div className="text-[11px] gen-text-muted">Imagen del diagrama actual.</div>
          </div>
        </button>

        {ITEMS.map((it) => (
          <Row key={it.id} item={it} />
        ))}
      </div>
    </div>
  );
}
