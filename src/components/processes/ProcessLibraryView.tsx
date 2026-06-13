import { useMemo, useRef, useState } from 'react';
import {
  FolderKanban,
  LayoutTemplate,
  Search,
  Star,
  FolderOpen,
  Copy,
  Trash2,
  Upload,
  Plus,
} from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { templates } from '../../data/templates';
import { runHealthCheck } from '../../lib/health';
import { aiFirstScore, automationPotential } from '../../lib/aiFirst';
import { productionScore } from '../../lib/productionScience';
import { STATUS_META } from '../../lib/processSchema';
import { fromJSON } from '../../lib/jsonExporter';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Field';
import { cn } from '../../lib/cn';
import type { ProcessStatus } from '../../types/process';

/** Módulo Procesos: biblioteca guardada + plantillas. */
export function ProcessLibraryView() {
  const library = useProcessStore((s) => s.library);
  const openFromLibrary = useProcessStore((s) => s.openFromLibrary);
  const duplicateLibraryItem = useProcessStore((s) => s.duplicateLibraryItem);
  const deleteLibraryItem = useProcessStore((s) => s.deleteLibraryItem);
  const toggleFavorite = useProcessStore((s) => s.toggleFavorite);
  const loadTemplate = useProcessStore((s) => s.loadTemplate);
  const loadProcess = useProcessStore((s) => s.loadProcess);
  const setSection = useProcessStore((s) => s.setSection);

  const [tab, setTab] = useState<'saved' | 'templates'>('saved');
  const [q, setQ] = useState('');
  const [areaFilter, setAreaFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState<'todos' | ProcessStatus>('todos');
  const [onlyFav, setOnlyFav] = useState(false);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const areas = useMemo(() => {
    const set = new Set<string>();
    library.forEach((s) => set.add(s.process.area?.trim() || s.process.tags[0] || 'Sin área'));
    return Array.from(set).sort();
  }, [library]);

  const filtered = library.filter((s) => {
    const p = s.process;
    const area = p.area?.trim() || p.tags[0] || 'Sin área';
    if (q && !s.title.toLowerCase().includes(q.toLowerCase())) return false;
    if (areaFilter !== 'todas' && area !== areaFilter) return false;
    if (statusFilter !== 'todos' && (p.status ?? 'mapeado') !== statusFilter) return false;
    if (onlyFav && !p.favorite) return false;
    return true;
  });

  const onImport = async (file: File) => {
    try {
      loadProcess(fromJSON(await file.text()));
      setImportError('');
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Archivo inválido.');
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-6 animate-fade-up">
      <div className="mb-1 flex items-center gap-2 text-brand-400">
        <FolderKanban size={18} />
        <span className="text-[12px] font-bold uppercase tracking-wider">Procesos</span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-bold tracking-tight">Biblioteca de procesos</h1>
          <p className="mt-1 text-[13.5px] gen-text-secondary">Guarda, abre, compara y mejora los procesos de tu empresa.</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} leftIcon={<Upload size={15} />}>
            Importar JSON
          </Button>
          <Button size="sm" onClick={() => setSection('capture')} leftIcon={<Plus size={15} />}>
            Nuevo mapa
          </Button>
        </div>
      </div>
      {importError && <p className="mt-2 text-[12px] text-accent-red">{importError}</p>}

      {/* Tabs */}
      <div className="mt-4 flex w-fit rounded-btn bg-ink-900/60 p-1">
        <button
          onClick={() => setTab('saved')}
          className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors', tab === 'saved' ? 'bg-brand-500/20 text-brand-100' : 'gen-text-muted')}
        >
          <FolderKanban size={14} /> Guardados ({library.length})
        </button>
        <button
          onClick={() => setTab('templates')}
          className={cn('flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-semibold transition-colors', tab === 'templates' ? 'bg-brand-500/20 text-brand-100' : 'gen-text-muted')}
        >
          <LayoutTemplate size={14} /> Plantillas ({templates.length})
        </button>
      </div>

      {tab === 'saved' ? (
        <>
          {/* Filtros */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gen-text-muted)]" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar proceso…" className="!min-h-0 w-56 !py-2 !pl-8 !text-[12.5px]" />
            </div>
            <Select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)} className="!min-h-0 w-40 !py-2 !text-[12.5px]">
              <option value="todas">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'todos' | ProcessStatus)} className="!min-h-0 w-44 !py-2 !text-[12.5px]">
              <option value="todos">Todos los estados</option>
              {Object.entries(STATUS_META).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
            <button
              onClick={() => setOnlyFav(!onlyFav)}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-btn border px-3 text-[12px] font-medium transition-colors',
                onlyFav ? 'border-accent-amber/50 bg-accent-amber/10 text-accent-amber' : 'border-[var(--gen-border)] gen-text-muted hover:bg-white/[0.05]',
              )}
            >
              <Star size={13} fill={onlyFav ? 'currentColor' : 'none'} /> Favoritos
            </button>
          </div>

          {/* Lista */}
          {filtered.length === 0 ? (
            <div className="gen-surface mt-4 rounded-card p-8 text-center">
              <p className="text-[13.5px] gen-text-secondary">
                {library.length === 0 ? 'Aún no guardaste procesos.' : 'Sin resultados con estos filtros.'}
              </p>
              <Button size="sm" className="mt-3" onClick={() => setSection('capture')} leftIcon={<Plus size={15} />}>
                Mapear mi primer proceso
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => {
                const p = s.process;
                const st = STATUS_META[p.status ?? 'mapeado'];
                const health = runHealthCheck(p).score;
                const ai = aiFirstScore(p);
                const auto = automationPotential(p);
                const ps = productionScore(p);
                return (
                  <div key={s.id} className="gen-surface flex flex-col rounded-card p-4 transition-all duration-150 hover:border-brand-400/40">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold">{s.title}</div>
                        <div className="mt-0.5 text-[11px] gen-text-muted">
                          {p.area?.trim() || p.tags[0] || 'Sin área'} · {p.owner ?? 'Sin responsable'}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleFavorite(s.id)}
                        className={cn('shrink-0 transition-colors', p.favorite ? 'text-accent-amber' : 'text-[var(--gen-text-muted)] hover:text-accent-amber')}
                        aria-label="Favorito"
                      >
                        <Star size={16} fill={p.favorite ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: `${st.color}22`, color: st.color }}>
                        {st.label}
                      </span>
                      <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] gen-text-muted">Salud {health}</span>
                      <span className="rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-semibold text-brand-300">AI First {ai}</span>
                      <span className="rounded-full bg-accent-amber/12 px-2 py-0.5 text-[10px] font-semibold text-accent-amber">Prod {ps}</span>
                      <span className="rounded-full bg-accent-violet/12 px-2 py-0.5 text-[10px] font-semibold text-accent-violet">{auto}% auto</span>
                    </div>

                    <div className="mt-2 text-[10.5px] gen-text-muted">
                      {p.metrics.length} métricas · {p.risks.length} riesgos · {p.agents?.length ?? 0} agentes ·{' '}
                      {new Date(s.updatedAt).toLocaleDateString('es-PE')}
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--gen-border)] pt-2.5">
                      <button onClick={() => openFromLibrary(s.id)} className="flex items-center gap-1 rounded-btn bg-brand-500/12 px-2.5 py-1.5 text-[11.5px] font-semibold text-brand-300 hover:bg-brand-500/20">
                        <FolderOpen size={12} /> Abrir
                      </button>
                      <button onClick={() => duplicateLibraryItem(s.id)} className="flex items-center gap-1 rounded-btn px-2 py-1.5 text-[11.5px] gen-text-muted hover:bg-white/[0.06]">
                        <Copy size={12} /> Duplicar
                      </button>
                      <button onClick={() => deleteLibraryItem(s.id)} className="ml-auto rounded-btn px-2 py-1.5 text-[11.5px] gen-text-muted hover:text-accent-red" aria-label="Eliminar">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <button
              key={t.id}
              onClick={() => loadTemplate(t.id)}
              className="gen-surface rounded-card p-4 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400/45 hover:shadow-glow focus-visible:shadow-focus"
            >
              <div className="text-[14px] font-semibold">{t.name}</div>
              <p className="mt-1 text-[12px] leading-snug gen-text-muted">{t.description}</p>
              <span className="mt-2 inline-block rounded-full bg-brand-500/12 px-2 py-0.5 text-[10px] font-semibold text-brand-300">
                Incluye métricas, riesgos y automatizaciones
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
