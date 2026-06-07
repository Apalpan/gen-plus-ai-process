import { useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, FileJson, FileText, GitBranch, Image, Terminal, Workflow, BookOpen, LayoutDashboard, Copy, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { toJSON } from '../../lib/jsonExporter';
import { toMarkdown } from '../../lib/markdownExporter';
import { toMermaid } from '../../lib/mermaidExporter';
import { codexPrompt, dashboardPrompt, n8nPrompt, obsidianPrompt } from '../../lib/prompts';
import { downloadText, copyToClipboard, slugify } from '../../lib/download';
import type { ProcessMap } from '../../types/process';

interface Item {
  id: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  ext: string;
  mime: string;
  make: (p: ProcessMap) => string;
}

const ITEMS: Item[] = [
  { id: 'json', label: 'JSON (ProcessMap)', desc: 'Contrato de dominio completo.', icon: FileJson, ext: 'json', mime: 'application/json', make: toJSON },
  { id: 'md-tec', label: 'Markdown técnico', desc: '12 secciones + RACI.', icon: FileText, ext: 'md', mime: 'text/markdown', make: (p) => toMarkdown(p, 'technical') },
  { id: 'md-exe', label: 'Markdown ejecutivo', desc: 'Versión resumida.', icon: FileText, ext: 'md', mime: 'text/markdown', make: (p) => toMarkdown(p, 'executive') },
  { id: 'mermaid', label: 'Mermaid flowchart', desc: 'Diagrama por carriles.', icon: GitBranch, ext: 'mmd', mime: 'text/plain', make: toMermaid },
  { id: 'codex', label: 'Prompt Codex / Claude Code', desc: 'Implementar en software.', icon: Terminal, ext: 'md', mime: 'text/markdown', make: codexPrompt },
  { id: 'n8n', label: 'Prompt n8n', desc: 'Construir automatizaciones.', icon: Workflow, ext: 'md', mime: 'text/markdown', make: n8nPrompt },
  { id: 'obsidian', label: 'Prompt Obsidian', desc: 'Documentar en el vault.', icon: BookOpen, ext: 'md', mime: 'text/markdown', make: obsidianPrompt },
  { id: 'dashboard', label: 'Prompt Dashboard', desc: 'Convertir en dashboard.', icon: LayoutDashboard, ext: 'md', mime: 'text/markdown', make: dashboardPrompt },
];

function Row({ item }: { item: Item }) {
  const process = useProcessStore((s) => s.process);
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
          if (await copyToClipboard(item.make(process))) {
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
        onClick={() => downloadText(`${slugify(process.title)}.${item.ext}`, item.make(process), item.mime)}
        className="flex h-8 w-8 items-center justify-center rounded-btn text-brand-200 hover:bg-white/[0.08]"
        title="Descargar"
      >
        <Download size={15} />
      </button>
    </div>
  );
}

export function ExportPanel() {
  const process = useProcessStore((s) => s.process);

  const exportPng = async () => {
    const el = document.querySelector('.react-flow__viewport') as HTMLElement | null;
    const wrapper = document.querySelector('.react-flow') as HTMLElement | null;
    const target = wrapper ?? el;
    if (!target) return;
    try {
      const dataUrl = await toPng(target, { backgroundColor: '#040F20', pixelRatio: 2 });
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
        <Download size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Exportaciones</h2>
      </div>
      <p className="px-4 pb-1 pt-1 text-[12px] gen-text-muted">Descarga o copia el proceso en cualquier formato.</p>

      <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-2">
        <button
          onClick={exportPng}
          className="flex w-full items-center gap-3 rounded-card border border-brand-400/30 bg-brand-500/[0.08] p-3 text-left transition-colors hover:bg-brand-500/[0.14]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-brand-500/20 text-brand-300">
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
