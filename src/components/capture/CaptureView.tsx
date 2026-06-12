import { useState } from 'react';
import { Sparkles, Loader2, Wand2, LayoutTemplate } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Field, Input, Select, Textarea } from '../ui/Field';
import { templates } from '../../data/templates';
import type { DetailLevel, ProcessKind } from '../../types/process';

const KINDS: { value: ProcessKind | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Detectar automáticamente' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'finanzas', label: 'Finanzas' },
  { value: 'bim_via', label: 'Proyectos' },
  { value: 'obra', label: 'Construcción' },
  { value: 'academico', label: 'Educación' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'soporte', label: 'Soporte' },
  { value: 'administracion', label: 'Administración' },
  { value: 'custom', label: 'Custom' },
];

const PLACEHOLDER =
  'Ej.: "Así gestionamos hoy las solicitudes entre áreas: alguien pide algo por chat, ' +
  'el coordinador lo anota, busca quién puede hacerlo, se ejecuta y a veces se aprueba con gerencia. ' +
  'El seguimiento es manual y se pierden pendientes."';

/** Paso 1 — Capturar: una pantalla simple para describir el proceso. */
export function CaptureView() {
  const generate = useProcessStore((s) => s.generate);
  const isGenerating = useProcessStore((s) => s.isGenerating);
  const loadTemplate = useProcessStore((s) => s.loadTemplate);

  const [name, setName] = useState('');
  const [area, setArea] = useState('');
  const [involved, setInvolved] = useState('');
  const [input, setInput] = useState('');
  const [problem, setProblem] = useState('');
  const [expected, setExpected] = useState('');
  const [detail, setDetail] = useState<DetailLevel>('operativo');
  const [kind, setKind] = useState<ProcessKind | 'auto'>('auto');

  const canSubmit = input.trim().length >= 20;

  const onSubmit = () =>
    generate({
      input,
      kind,
      detail,
      format: 'swimlane',
      maturity: 'current',
      name,
      area,
      involvedAreas: involved.split(',').map((s) => s.trim()).filter(Boolean),
      problem,
      expectedResult: expected,
    });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8 animate-fade-up">
      <div className="mb-1 flex items-center gap-2 text-brand-400">
        <Sparkles size={18} />
        <span className="text-[12px] font-bold uppercase tracking-wider">Paso 1 · Capturar</span>
      </div>
      <h1 className="font-display text-[26px] font-bold tracking-tight">¿Cómo trabaja tu equipo hoy?</h1>
      <p className="mt-1.5 text-[14px] leading-relaxed gen-text-secondary">
        Describe tu proceso como lo explicarías en una reunión. No necesitas dibujar perfecto: primero capturamos la lógica.
      </p>

      <div className="gen-surface mt-6 rounded-card-lg p-5">
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field label="Nombre del proceso">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Atención de solicitudes internas" />
          </Field>
          <Field label="Área principal">
            <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ej. Operaciones" />
          </Field>
        </div>

        <Field label="Áreas involucradas" hint="Separadas por coma.">
          <Input value={involved} onChange={(e) => setInvolved(e.target.value)} placeholder="Ej. Comercial, Administración, Gerencia" />
        </Field>

        <Field label="Descripción del proceso (lenguaje natural)">
          <Textarea rows={5} value={input} onChange={(e) => setInput(e.target.value)} placeholder={PLACEHOLDER} />
        </Field>

        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <Field label="Problema principal">
            <Input value={problem} onChange={(e) => setProblem(e.target.value)} placeholder="Ej. Se pierden pendientes y nadie hace seguimiento" />
          </Field>
          <Field label="Resultado esperado">
            <Input value={expected} onChange={(e) => setExpected(e.target.value)} placeholder="Ej. Cerrar el 90% de solicitudes en plazo" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-x-4">
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
            </Select>
          </Field>
        </div>

        <Button
          size="lg"
          className="mt-1 w-full"
          disabled={!canSubmit || isGenerating}
          onClick={onSubmit}
          leftIcon={isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
        >
          {isGenerating ? 'Mapeando proceso…' : 'Mapear proceso'}
        </Button>
        {!canSubmit && (
          <p className="mt-2 text-center text-[11.5px] gen-text-muted">Describe el proceso con al menos una o dos frases para mapearlo.</p>
        )}
      </div>

      <div className="mt-7">
        <div className="mb-2 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider gen-text-muted">
          <LayoutTemplate size={14} /> O empieza desde una plantilla
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {templates.slice(0, 8).map((t) => (
            <button
              key={t.id}
              onClick={() => loadTemplate(t.id)}
              className="gen-surface rounded-card p-3 text-left transition-all duration-150 hover:-translate-y-0.5 hover:border-brand-400/45 hover:shadow-glow focus-visible:shadow-focus"
            >
              <div className="text-[12.5px] font-semibold leading-snug">{t.name}</div>
              <div className="mt-1 line-clamp-2 text-[10.5px] leading-snug gen-text-muted">{t.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
