import { useState } from 'react';
import { Sparkles, Wand2, ShieldAlert, Gauge, Workflow, Loader2 } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Field, Select, Textarea } from '../ui/Field';
import type { DetailLevel, MaturityLevel, OutputFormat, ProcessKind } from '../../types/process';

const EXAMPLE =
  'Quiero mapear cómo coordinamos las solicitudes entre áreas: desde que llega un pedido, se prioriza y se asigna un responsable, se ejecuta, se aprueba si impacta presupuesto o plazo, y se cierra con seguimiento y evidencia.';

const KINDS: { value: ProcessKind | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Detección automática' },
  { value: 'obra', label: 'Obra' },
  { value: 'bim_via', label: 'BIM / VIA' },
  { value: 'ice', label: 'ICE' },
  { value: 'ppm', label: 'PPM' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'academico', label: 'Académico' },
  { value: 'administracion', label: 'Administración' },
  { value: 'evento', label: 'Evento' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'producto', label: 'Producto' },
  { value: 'custom', label: 'Custom' },
];

export function PromptComposer() {
  const generate = useProcessStore((s) => s.generate);
  const sendCopilot = useProcessStore((s) => s.sendCopilot);
  const isGenerating = useProcessStore((s) => s.isGenerating);

  const [input, setInput] = useState(EXAMPLE);
  const [kind, setKind] = useState<ProcessKind | 'auto'>('auto');
  const [detail, setDetail] = useState<DetailLevel>('operativo');
  const [format, setFormat] = useState<OutputFormat>('swimlane');
  const [maturity, setMaturity] = useState<MaturityLevel>('optimized');

  const onGenerate = () => generate({ input, kind, detail, format, maturity });

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Constructor IA</h2>
      </div>
      <p className="mb-3 text-[12px] leading-relaxed gen-text-muted">
        Describe un flujo de coordinación en lenguaje natural. La IA construye el proceso con responsables, métricas y riesgos.
      </p>

      <Field label="Instrucción">
        <Textarea
          rows={6}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pega aquí notas operativas, una reunión, un problema o un flujo…"
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de proceso">
          <Select value={kind} onChange={(e) => setKind(e.target.value as ProcessKind | 'auto')}>
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Nivel de detalle">
          <Select value={detail} onChange={(e) => setDetail(e.target.value as DetailLevel)}>
            <option value="ejecutivo">Ejecutivo</option>
            <option value="operativo">Operativo</option>
            <option value="tecnico">Técnico</option>
            <option value="implementacion">Implementación</option>
          </Select>
        </Field>
        <Field label="Formato">
          <Select value={format} onChange={(e) => setFormat(e.target.value as OutputFormat)}>
            <option value="swimlane">Swimlane</option>
            <option value="bpmn">BPMN-like</option>
            <option value="metricas">Métricas</option>
            <option value="roadmap">Roadmap</option>
            <option value="checklist">Checklist</option>
            <option value="todo">Todo</option>
          </Select>
        </Field>
        <Field label="Madurez">
          <Select value={maturity} onChange={(e) => setMaturity(e.target.value as MaturityLevel)}>
            <option value="idea">Idea</option>
            <option value="current">Proceso actual</option>
            <option value="optimized">Proceso optimizado</option>
            <option value="automatable">Automatizable</option>
          </Select>
        </Field>
      </div>

      <Button className="mt-1 w-full" size="lg" onClick={onGenerate} disabled={isGenerating} leftIcon={isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}>
        {isGenerating ? 'Generando mapa lógico…' : 'Generar mapa lógico'}
      </Button>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={() => sendCopilot('Optimiza este proceso, hazlo más técnico')} leftIcon={<Sparkles size={15} />}>
          Optimizar
        </Button>
        <Button variant="secondary" size="sm" onClick={() => sendCopilot('Detecta cuellos de botella')} leftIcon={<ShieldAlert size={15} />}>
          Detectar riesgos
        </Button>
        <Button variant="secondary" size="sm" onClick={() => sendCopilot('Agrega métricas')} leftIcon={<Gauge size={15} />}>
          Crear métricas
        </Button>
        <Button variant="secondary" size="sm" onClick={() => sendCopilot('Dime qué automatizar')} leftIcon={<Workflow size={15} />}>
          Automatizar
        </Button>
      </div>
    </div>
  );
}
