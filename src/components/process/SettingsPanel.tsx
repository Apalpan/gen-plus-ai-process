import { useRef, useState } from 'react';
import { Settings, Upload, Sun, Moon, KeyRound, Bot, Plug, Plus, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Field, Input, Label, Select, Textarea } from '../ui/Field';
import { Badge } from '../ui/Badge';
import { MASTER_PROMPT } from '../../ai/masterPrompt';
import { fromJSON } from '../../lib/jsonExporter';
import { PROVIDERS, callLLM, defaultModelFor, isLLMConfigured, type Integration, type ProviderId } from '../../ai/llm';

export function SettingsPanel() {
  const theme = useProcessStore((s) => s.theme);
  const toggleTheme = useProcessStore((s) => s.toggleTheme);
  const loadProcess = useProcessStore((s) => s.loadProcess);
  const llm = useProcessStore((s) => s.llmConfig);
  const setLLMConfig = useProcessStore((s) => s.setLLMConfig);
  const integrations = useProcessStore((s) => s.integrations);
  const addIntegration = useProcessStore((s) => s.addIntegration);
  const patchIntegration = useProcessStore((s) => s.patchIntegration);
  const deleteIntegration = useProcessStore((s) => s.deleteIntegration);

  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [test, setTest] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMsg, setTestMsg] = useState('');

  // new integration form
  const [intName, setIntName] = useState('');
  const [intType, setIntType] = useState<Integration['type']>('mcp');
  const [intUrl, setIntUrl] = useState('');

  const provider = PROVIDERS.find((p) => p.id === llm.provider);

  const onImport = async (file: File) => {
    try {
      loadProcess(fromJSON(await file.text()));
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar.');
    }
  };

  const onTest = async () => {
    if (!isLLMConfigured(llm)) {
      setTest('fail');
      setTestMsg('Falta API key o modelo.');
      return;
    }
    setTest('testing');
    setTestMsg('');
    try {
      const out = await callLLM(llm, 'Eres un verificador de conexión.', 'Responde únicamente con la palabra: ok');
      setTest('ok');
      setTestMsg(out.slice(0, 60));
    } catch (e) {
      setTest('fail');
      setTestMsg(e instanceof Error ? e.message : 'Error');
    }
  };

  const onAddIntegration = () => {
    if (!intName.trim()) return;
    addIntegration({ name: intName.trim(), type: intType, url: intUrl.trim() || undefined, enabled: true });
    setIntName('');
    setIntUrl('');
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

        <div className="my-4 h-px bg-[var(--gen-border)]" />

        {/* LLM provider */}
        <div className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          <KeyRound size={14} /> Modelo de IA
        </div>
        <p className="mb-2 text-[11.5px] gen-text-muted">
          Conecta tu LLM. Con API key, la generación usa el modelo real; sin key, el motor heurístico local. La clave se guarda solo en este navegador.
        </p>

        <Field label="Proveedor">
          <Select
            value={llm.provider}
            onChange={(e) => {
              const p = e.target.value as ProviderId;
              setLLMConfig({ provider: p, model: defaultModelFor(p) });
            }}
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
        {provider && <p className="-mt-1 mb-2 text-[11px] gen-text-muted">{provider.help}</p>}

        <Field label="API key">
          <Input type="password" value={llm.apiKey} onChange={(e) => setLLMConfig({ apiKey: e.target.value })} placeholder="sk-… / claude-…" autoComplete="off" />
        </Field>
        <Field label="Modelo">
          <Input value={llm.model} onChange={(e) => setLLMConfig({ model: e.target.value })} placeholder={defaultModelFor(llm.provider)} />
        </Field>
        {llm.provider === 'custom' && (
          <Field label="Base URL">
            <Input value={llm.baseUrl ?? ''} onChange={(e) => setLLMConfig({ baseUrl: e.target.value })} placeholder="https://tu-endpoint/v1" />
          </Field>
        )}

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onTest} disabled={test === 'testing'} leftIcon={test === 'testing' ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />}>
            Probar conexión
          </Button>
          {test === 'ok' && <span className="flex items-center gap-1 text-[12px] text-accent-green"><CheckCircle2 size={14} /> OK</span>}
          {test === 'fail' && <span className="flex items-center gap-1 text-[12px] text-accent-red"><XCircle size={14} /> Falló</span>}
        </div>
        {testMsg && <p className="mt-1 truncate text-[11px] gen-text-muted">{testMsg}</p>}

        <div className="my-4 h-px bg-[var(--gen-border)]" />

        {/* Integrations / MCP */}
        <div className="mb-1.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          <Plug size={14} /> MCPs e integraciones
        </div>
        <p className="mb-2 text-[11.5px] gen-text-muted">
          Registra servidores MCP y conectores (Notion, Drive, n8n…). Se incluyen en los prompts de exportación para implementación.
        </p>

        <div className="space-y-1.5">
          {integrations.length === 0 && <p className="text-[11.5px] gen-text-muted">Sin integraciones aún.</p>}
          {integrations.map((it) => (
            <div key={it.id} className="flex items-center gap-2 rounded-btn border border-[var(--gen-border)] bg-white/[0.03] px-2.5 py-1.5">
              <Badge tone={it.type === 'mcp' ? 'violet' : 'cyan'}>{it.type}</Badge>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-medium">{it.name}</div>
                {it.url && <div className="truncate text-[10.5px] gen-text-muted">{it.url}</div>}
              </div>
              <button
                onClick={() => patchIntegration(it.id, { enabled: !it.enabled })}
                className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${it.enabled ? 'bg-accent-green/20 text-accent-green' : 'bg-white/[0.06] gen-text-muted'}`}
              >
                {it.enabled ? 'On' : 'Off'}
              </button>
              <button onClick={() => deleteIntegration(it.id)} className="text-[var(--gen-text-muted)] hover:text-accent-red" aria-label="Eliminar">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-card border border-[var(--gen-border)] bg-white/[0.02] p-2.5">
          <Label>Agregar integración</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input className="col-span-2 !py-2 !text-[12px]" placeholder="Nombre (ej. Notion)" value={intName} onChange={(e) => setIntName(e.target.value)} />
            <Select className="!py-2 !text-[12px]" value={intType} onChange={(e) => setIntType(e.target.value as Integration['type'])}>
              <option value="mcp">MCP</option>
              <option value="connector">Conector</option>
            </Select>
          </div>
          <Input className="mt-2 !py-2 !text-[12px]" placeholder="URL (opcional)" value={intUrl} onChange={(e) => setIntUrl(e.target.value)} />
          <Button size="sm" className="mt-2 w-full" onClick={onAddIntegration} leftIcon={<Plus size={15} />}>
            Agregar
          </Button>
        </div>

        <div className="my-4 h-px bg-[var(--gen-border)]" />

        <Field label="Importar proceso (JSON)">
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} leftIcon={<Upload size={15} />}>
            Seleccionar .json
          </Button>
          {error && <p className="mt-1.5 text-[11.5px] text-accent-red">{error}</p>}
        </Field>

        <div className="mb-1.5 mt-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand-300">
          <Bot size={14} /> Master prompt
        </div>
        <p className="mb-2 text-[11.5px] gen-text-muted">El prompt maestro enviado al modelo al generar.</p>
        <Textarea rows={8} readOnly value={MASTER_PROMPT} className="!text-[11px] !font-mono !leading-relaxed" />
      </div>
    </div>
  );
}
