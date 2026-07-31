import { Trash2, X } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Field, Input, Label, Select, Textarea } from '../ui/Field';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { NODE_TYPE_META } from '../../lib/processSchema';
import type { NodeType, Priority, ProcessNodeData } from '../../types/process';

const linesToArray = (s: string): string[] => s.split('\n').map((x) => x.trim()).filter(Boolean);
const arrayToLines = (a?: string[]): string => (a ?? []).join('\n');

const NODE_TYPES: NodeType[] = ['start', 'end', 'activity', 'decision', 'document', 'evidence', 'system', 'approval', 'handoff', 'queue', 'buffer', 'metric', 'risk', 'automation'];
const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const VARIABILITY = ['baja', 'media', 'alta'] as const;

export function NodeInspector({ node }: { node: ProcessNodeData }) {
  const patchNode = useProcessStore((s) => s.patchNode);
  const deleteNode = useProcessStore((s) => s.deleteNode);
  const selectNode = useProcessStore((s) => s.selectNode);
  const lanes = useProcessStore((s) => s.process.lanes);
  const meta = NODE_TYPE_META[node.type];

  const set = (patch: Partial<ProcessNodeData>) => patchNode(node.id, patch);
  const isDecision = node.type === 'decision';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--gen-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: meta.color }} />
          <span className="text-[13px] font-bold uppercase tracking-wider" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => selectNode(null)} aria-label="Cerrar inspector">
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <Field label="Título">
          <Input value={node.title} onChange={(e) => set({ title: e.target.value })} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo">
            <Select value={node.type} onChange={(e) => set({ type: e.target.value as NodeType })}>
              {NODE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {NODE_TYPE_META[t].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Carril">
            <Select value={node.laneId} onChange={(e) => set({ laneId: e.target.value })}>
              {lanes.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Código">
            <Input value={node.code ?? ''} placeholder="RFI-01" onChange={(e) => set({ code: e.target.value })} />
          </Field>
          <Field label="Prioridad">
            <Select value={node.priority ?? 'medium'} onChange={(e) => set({ priority: e.target.value as Priority })}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Descripción">
          <Textarea rows={2} value={node.description ?? ''} onChange={(e) => set({ description: e.target.value })} />
        </Field>

        {isDecision && (
          <Field label="Condición (sí / no)" hint="Define cuándo la decisión es afirmativa.">
            <Textarea rows={2} value={node.condition ?? ''} onChange={(e) => set({ condition: e.target.value })} />
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Responsable (R)">
            <Input value={node.responsible ?? ''} onChange={(e) => set({ responsible: e.target.value })} />
          </Field>
          <Field label="Aprobador (A)">
            <Input value={node.accountable ?? ''} onChange={(e) => set({ accountable: e.target.value })} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="SLA">
            <Input value={node.sla ?? ''} placeholder="≤ 48 h" onChange={(e) => set({ sla: e.target.value })} />
          </Field>
          <Field label="Duración est.">
            <Input value={node.estimatedDuration ?? ''} placeholder="2 h" onChange={(e) => set({ estimatedDuration: e.target.value })} />
          </Field>
        </div>

        {/* Producción (PPI / Operations Science) */}
        <div className="mt-1 mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-300">
          Producción (PPI)
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Touch time" hint="Trabajo real (2 h).">
            <Input value={node.touchTime ?? ''} placeholder="2 h" onChange={(e) => set({ touchTime: e.target.value })} />
          </Field>
          <Field label="Wait time" hint="Espera / cola (1 día).">
            <Input value={node.waitTime ?? ''} placeholder="1 día" onChange={(e) => set({ waitTime: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Capacidad">
            <Input value={node.capacity ?? ''} placeholder="8/día" onChange={(e) => set({ capacity: e.target.value })} />
          </Field>
          <Field label="WIP límite">
            <Input
              type="number"
              value={node.wipLimit ?? ''}
              placeholder="—"
              onChange={(e) => set({ wipLimit: e.target.value ? Number(e.target.value) : undefined })}
            />
          </Field>
          <Field label="Variabilidad">
            <Select value={node.variabilityLevel ?? ''} onChange={(e) => set({ variabilityLevel: (e.target.value || undefined) as ProcessNodeData['variabilityLevel'] })}>
              <option value="">—</option>
              {VARIABILITY.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Entradas" hint="Una por línea.">
          <Textarea rows={2} value={arrayToLines(node.inputs)} onChange={(e) => set({ inputs: linesToArray(e.target.value) })} />
        </Field>
        <Field label="Salidas" hint="Una por línea.">
          <Textarea rows={2} value={arrayToLines(node.outputs)} onChange={(e) => set({ outputs: linesToArray(e.target.value) })} />
        </Field>
        <Field label="Herramientas">
          <Textarea rows={2} value={arrayToLines(node.tools)} onChange={(e) => set({ tools: linesToArray(e.target.value) })} />
        </Field>
        <Field label="Documentos">
          <Textarea rows={2} value={arrayToLines(node.documents)} onChange={(e) => set({ documents: linesToArray(e.target.value) })} />
        </Field>

        <div className="mt-1 flex flex-wrap gap-1.5">
          <Label>Vínculos</Label>
          <div className="flex w-full flex-wrap gap-1.5">
            <Badge tone="green">{node.metricIds?.length ?? 0} métricas</Badge>
            <Badge tone="red">{node.riskIds?.length ?? 0} riesgos</Badge>
            <Badge tone="violet">{node.automationIds?.length ?? 0} automatizaciones</Badge>
          </div>
        </div>
      </div>

      <div className="border-t border-[var(--gen-border)] p-3">
        <Button variant="danger" size="sm" className="w-full" onClick={() => deleteNode(node.id)} leftIcon={<Trash2 size={15} />}>
          Eliminar nodo
        </Button>
      </div>
    </div>
  );
}
