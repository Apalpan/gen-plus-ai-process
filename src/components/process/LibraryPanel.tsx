import { useRef, useState } from 'react';
import { Library, Save, FolderOpen, Copy, Trash2, Pencil, Upload, Check } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import { fromJSON } from '../../lib/jsonExporter';

export function LibraryPanel() {
  const library = useProcessStore((s) => s.library);
  const currentId = useProcessStore((s) => s.process.id);
  const save = useProcessStore((s) => s.saveToLibrary);
  const open = useProcessStore((s) => s.openFromLibrary);
  const rename = useProcessStore((s) => s.renameLibraryItem);
  const duplicate = useProcessStore((s) => s.duplicateLibraryItem);
  const remove = useProcessStore((s) => s.deleteLibraryItem);
  const loadProcess = useProcessStore((s) => s.loadProcess);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const onSave = () => {
    save();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const onImport = async (file: File) => {
    try {
      loadProcess(fromJSON(await file.text()));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Archivo inválido.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Library size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Mis procesos</h2>
        <span className="ml-auto text-[11px] gen-text-muted">{library.length}</span>
      </div>
      <p className="px-4 pb-1 pt-1 text-[12px] gen-text-muted">Guarda en este navegador y comparte vía exportar/importar JSON.</p>

      <div className="flex gap-2 px-4 pb-2 pt-1">
        <Button size="sm" className="flex-1" onClick={onSave} leftIcon={saved ? <Check size={15} /> : <Save size={15} />}>
          {saved ? 'Guardado' : 'Guardar actual'}
        </Button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
        <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} leftIcon={<Upload size={15} />}>
          Importar
        </Button>
      </div>
      {error && <p className="px-4 pb-1 text-[11.5px] text-accent-red">{error}</p>}

      <div className="flex-1 space-y-2 overflow-y-auto p-4 pt-1">
        {library.length === 0 && <p className="text-[12px] gen-text-muted">Aún no guardaste procesos. Pulsa "Guardar actual".</p>}
        {library.map((s) => (
          <div
            key={s.id}
            className={`rounded-card border bg-white/[0.03] p-3 ${s.id === currentId ? 'border-brand-400/50' : 'border-[var(--gen-border)]'}`}
          >
            {editing === s.id ? (
              <div className="flex gap-1.5">
                <Input
                  value={draft}
                  autoFocus
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      rename(s.id, draft.trim() || s.title);
                      setEditing(null);
                    }
                  }}
                  className="!py-1.5 !text-[13px]"
                />
                <Button size="sm" onClick={() => { rename(s.id, draft.trim() || s.title); setEditing(null); }}>
                  OK
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-semibold">{s.title}</div>
                    <div className="text-[11px] gen-text-muted">
                      {s.maturityLevel} · {new Date(s.updatedAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <button onClick={() => open(s.id)} className="flex items-center gap-1 rounded-btn bg-white/[0.05] px-2 py-1 text-[11px] text-brand-200 hover:bg-white/[0.1]">
                    <FolderOpen size={12} /> Abrir
                  </button>
                  <button onClick={() => { setEditing(s.id); setDraft(s.title); }} className="flex items-center gap-1 rounded-btn px-2 py-1 text-[11px] gen-text-muted hover:bg-white/[0.06]" title="Renombrar">
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => duplicate(s.id)} className="flex items-center gap-1 rounded-btn px-2 py-1 text-[11px] gen-text-muted hover:bg-white/[0.06]" title="Duplicar">
                    <Copy size={12} />
                  </button>
                  <button onClick={() => remove(s.id)} className="ml-auto flex items-center gap-1 rounded-btn px-2 py-1 text-[11px] gen-text-muted hover:text-accent-red" title="Eliminar">
                    <Trash2 size={12} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
