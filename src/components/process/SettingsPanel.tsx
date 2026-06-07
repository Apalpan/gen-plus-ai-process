import { useRef, useState } from 'react';
import { Settings, Upload, Sun, Moon, KeyRound, Bot } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Field, Input, Textarea } from '../ui/Field';
import { MASTER_PROMPT } from '../../ai/masterPrompt';
import { fromJSON } from '../../lib/jsonExporter';

export function SettingsPanel() {
  const theme = useProcessStore((s) => s.theme);
  const toggleTheme = useProcessStore((s) => s.toggleTheme);
  const loadProcess = useProcessStore((s) => s.loadProcess);
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [apiKey, setApiKey] = useState('');

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      loadProcess(fromJSON(text));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar el archivo.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Settings size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Configuración</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Field label="Tema">
          <Button variant="secondary" size="sm" onClick={toggleTheme} leftIcon={theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}>
            {theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}
          </Button>
        </Field>

        <Field label="Importar proceso (JSON)">
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} leftIcon={<Upload size={15} />}>
            Seleccionar archivo .json
          </Button>
          {error && <p className="mt-1.5 text-[11.5px] text-accent-red">{error}</p>}
        </Field>

        <div className="my-4 h-px bg-[var(--gen-border)]" />

        <div className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          <KeyRound size={14} /> Conectar IA real
        </div>
        <p className="mb-2 text-[11.5px] gen-text-muted">
          La generación usa un motor heurístico local. Para conectar un LLM, edita
          <span className="font-mono text-brand-200"> src/ai/ProcessGenerator.ts</span> y pega tu clave (OpenAI / Claude / endpoint propio).
        </p>
        <Field label="API key (no se guarda — solo demo)">
          <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-… / claude-…" />
        </Field>

        <div className="mb-1.5 mt-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          <Bot size={14} /> Master prompt
        </div>
        <p className="mb-2 text-[11.5px] gen-text-muted">El prompt maestro que se enviará al modelo cuando conectes una API.</p>
        <Textarea rows={10} readOnly value={MASTER_PROMPT} className="!text-[11px] !font-mono !leading-relaxed" />
      </div>
    </div>
  );
}
