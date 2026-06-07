import type {
  Automation,
  Lane,
  Metric,
  ProcessDocument,
  ProcessEdgeData,
  ProcessKind,
  ProcessMap,
  ProcessNodeData,
  ProcessPrompt,
  Risk,
} from '../types/process';
import {
  buildAcademico,
  buildAdmin,
  buildComercial,
  buildEventos,
  buildGeneric,
  buildObra,
  buildVDC,
} from '../data/templates';
import { emptyProcess, id, nowIso } from '../lib/processSchema';
import { callLLM, isLLMConfigured, type LLMConfig } from './llm';
import { MASTER_PROMPT, buildUserMessage } from './masterPrompt';

const KEYWORDS: Record<ProcessKind, string[]> = {
  obra: ['consulta', 'duda', 'obra', 'plano', 'rfi', 'sdi', 'campo', 'cde', 'interferenc', 'encofrado', 'cierre de consulta', 'trazabilidad'],
  bim_via: ['bim', 'vdc', ' via', 'ice', 'ppm', 'modelo federado', 'clash', 'lookahead', 'federado', 'publicar modelo'],
  ice: ['sesión ice'],
  ppm: ['lookahead', 'compromiso'],
  comercial: ['lead', 'venta', 'comercial', 'propuesta', 'negociaci', 'crm', 'pipeline', 'b2b', 'cotizaci', 'cierre de venta'],
  academico: ['curso', 'academ', 'alumno', 'estudiante', 'instructor', 'cohorte', 'certific', 'temario', 'programa formativo'],
  administracion: ['administrat', 'factura', 'tramite', 'trámite', 'aprobaci', 'expediente', 'archivo', 'planilla'],
  evento: ['sponsor', 'evento', 'patrocin', 'activaci', 'auspici'],
  soporte: ['ticket', 'soporte', 'incidencia', 'mesa de ayuda'],
  producto: ['feature', 'producto', 'roadmap', 'release', 'backlog'],
  custom: [],
};

export function detectKind(input: string): ProcessKind {
  const text = input.toLowerCase();
  const scores: Partial<Record<ProcessKind, number>> = {};
  (Object.keys(KEYWORDS) as ProcessKind[]).forEach((kind) => {
    const hits = KEYWORDS[kind].reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (hits > 0) scores[kind] = hits;
  });
  const ranked = (Object.entries(scores) as [ProcessKind, number][]).sort((a, b) => b[1] - a[1]);
  return ranked.length ? ranked[0][0] : 'custom';
}

function buildForKind(kind: ProcessKind): ProcessMap {
  switch (kind) {
    case 'obra':
      return buildObra();
    case 'bim_via':
    case 'ice':
    case 'ppm':
      return buildVDC();
    case 'comercial':
      return buildComercial();
    case 'academico':
      return buildAcademico();
    case 'evento':
      return buildEventos();
    case 'administracion':
      return buildAdmin();
    default:
      return buildGeneric();
  }
}

function deriveTitle(input: string, fallback: string): string {
  const firstLine = input.split(/[.\n]/)[0]?.trim() ?? '';
  if (firstLine.length >= 12 && firstLine.length <= 70) {
    return firstLine.charAt(0).toUpperCase() + firstLine.slice(1);
  }
  return fallback;
}

/**
 * Main generation entrypoint. Uses a real LLM when configured, otherwise the
 * local heuristic engine. The contract is the ProcessMap schema either way.
 */
export async function generateProcessFromAI(prompt: ProcessPrompt, config?: LLMConfig): Promise<ProcessMap> {
  if (isLLMConfigured(config)) {
    const raw = await callLLM(config, MASTER_PROMPT, buildUserMessage(prompt));
    return normalizeGenerated(raw, prompt);
  }
  return heuristicGenerate(prompt);
}

async function heuristicGenerate(prompt: ProcessPrompt): Promise<ProcessMap> {
  await new Promise((r) => setTimeout(r, 420));
  const kind: ProcessKind = prompt.kind === 'auto' ? detectKind(prompt.input) : prompt.kind;
  const base =
    kind === 'custom' && prompt.input.trim()
      ? buildGeneric(deriveTitle(prompt.input, 'Proceso a medida'), '', prompt.input)
      : buildForKind(kind);

  return {
    ...base,
    id: 'gen_' + Date.now().toString(36),
    title: prompt.input.trim() ? deriveTitle(prompt.input, base.title) : base.title,
    context: prompt.input.trim() ? prompt.input.trim() : base.context,
    maturityLevel: prompt.maturity,
    tags: Array.from(new Set([...base.tags, kind])),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
}

/* ---------- LLM JSON → ProcessMap normalization ---------- */

function extractJSON(raw: string): unknown {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  return JSON.parse(s);
}

const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
const strArr = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : undefined) as string[];
const num = (v: unknown, d: number): number => (typeof v === 'number' && !Number.isNaN(v) ? v : d);

function normalizeGenerated(raw: string, prompt: ProcessPrompt): ProcessMap {
  let parsed: Record<string, unknown>;
  try {
    parsed = extractJSON(raw) as Record<string, unknown>;
  } catch {
    throw new Error('El modelo no devolvió un JSON válido. Reintenta o ajusta la instrucción.');
  }

  const base = emptyProcess();

  const lanes: Lane[] = arr<Record<string, unknown>>(parsed.lanes).map((l, i) => ({
    id: str(l.id) || `lane_${i}`,
    name: str(l.name, `Carril ${i + 1}`),
    type: (str(l.type) || 'custom') as Lane['type'],
    color: str(l.color) || ['#1E5CE8', '#22D3EE', '#8B5CF6', '#34D399', '#F5A623', '#6A98FF', '#FB923C'][i % 7],
    description: str(l.description) || undefined,
    ownerRole: str(l.ownerRole) || undefined,
  }));
  if (lanes.length === 0) lanes.push({ id: 'lane_0', name: 'Proceso', type: 'operations', color: '#1E5CE8' });
  const laneIds = new Set(lanes.map((l) => l.id));

  const nodes: ProcessNodeData[] = arr<Record<string, unknown>>(parsed.nodes).map((n, i) => {
    const laneId = str(n.laneId);
    return {
      id: str(n.id) || `node_${i}`,
      type: (str(n.type) || 'activity') as ProcessNodeData['type'],
      code: str(n.code) || undefined,
      title: str(n.title, `Paso ${i + 1}`),
      description: str(n.description) || undefined,
      laneId: laneIds.has(laneId) ? laneId : lanes[0].id,
      responsible: str(n.responsible) || undefined,
      accountable: str(n.accountable) || undefined,
      consulted: strArr(n.consulted),
      informed: strArr(n.informed),
      inputs: strArr(n.inputs),
      outputs: strArr(n.outputs),
      tools: strArr(n.tools),
      documents: strArr(n.documents),
      estimatedDuration: str(n.estimatedDuration) || undefined,
      sla: str(n.sla) || undefined,
      condition: str(n.condition) || undefined,
      status: 'active',
      priority: (str(n.priority) || 'medium') as ProcessNodeData['priority'],
      position: { x: 0, y: 0 },
    };
  });
  const nodeIds = new Set(nodes.map((n) => n.id));

  const edges: ProcessEdgeData[] = arr<Record<string, unknown>>(parsed.edges)
    .filter((e) => nodeIds.has(str(e.source)) && nodeIds.has(str(e.target)))
    .map((e, i) => ({
      id: str(e.id) || `edge_${i}`,
      source: str(e.source),
      target: str(e.target),
      type: (str(e.type) || 'sequence') as ProcessEdgeData['type'],
      label: str(e.label) || undefined,
      condition: str(e.condition) || undefined,
    }));

  const metrics: Metric[] = arr<Record<string, unknown>>(parsed.metrics).map((m, i) => ({
    id: str(m.id) || id('metric'),
    code: str(m.code, `M-${i + 1}`),
    name: str(m.name, 'Métrica'),
    category: (str(m.category) || 'quality') as Metric['category'],
    formula: str(m.formula, 'definir / total'),
    target: str(m.target, '—'),
    currentValue: str(m.currentValue) || undefined,
    unit: str(m.unit) || undefined,
    frequency: str(m.frequency) || undefined,
    owner: str(m.owner) || undefined,
    dataSource: str(m.dataSource) || undefined,
    leadingOrLagging: (str(m.leadingOrLagging) || undefined) as Metric['leadingOrLagging'],
    interpretation: str(m.interpretation) || undefined,
    decisionRule: str(m.decisionRule) || undefined,
    relatedNodeIds: strArr(m.relatedNodeIds),
  }));

  const risks: Risk[] = arr<Record<string, unknown>>(parsed.risks).map((r) => {
    const probability = num(r.probability, 3);
    const impact = num(r.impact, 3);
    return {
      id: str(r.id) || id('risk'),
      name: str(r.name, 'Riesgo'),
      description: str(r.description) || undefined,
      probability,
      impact,
      severity: probability * impact,
      mitigation: str(r.mitigation, 'Definir mitigación'),
      trigger: str(r.trigger) || undefined,
      owner: str(r.owner) || undefined,
      relatedNodeIds: strArr(r.relatedNodeIds),
    };
  });

  const automations: Automation[] = arr<Record<string, unknown>>(parsed.automations).map((a) => ({
    id: str(a.id) || id('auto'),
    name: str(a.name, 'Automatización'),
    description: str(a.description) || undefined,
    trigger: str(a.trigger, 'Definir trigger'),
    action: str(a.action, 'Definir acción'),
    tools: strArr(a.tools),
    inputData: str(a.inputData) || undefined,
    outputData: str(a.outputData) || undefined,
    humanInTheLoop: typeof a.humanInTheLoop === 'boolean' ? a.humanInTheLoop : false,
    estimatedImpact: str(a.estimatedImpact) || undefined,
    relatedNodeIds: strArr(a.relatedNodeIds),
  }));

  const documents: ProcessDocument[] = arr<Record<string, unknown>>(parsed.documents).map((d) => ({
    id: str(d.id) || id('doc'),
    name: str(d.name, 'Documento'),
    type: str(d.type) || undefined,
    format: str(d.format) || undefined,
    owner: str(d.owner) || undefined,
    repository: str(d.repository) || undefined,
    required: typeof d.required === 'boolean' ? d.required : false,
    relatedNodeIds: strArr(d.relatedNodeIds),
  }));

  const checklist = arr<unknown>(parsed.implementationChecklist).map((c, i) => {
    if (typeof c === 'string') return { id: id('chk'), text: c, done: false };
    const o = c as Record<string, unknown>;
    return { id: str(o.id) || id('chk'), text: str(o.text, `Paso ${i + 1}`), done: !!o.done, phase: str(o.phase) || undefined };
  });

  return {
    ...base,
    id: 'gen_' + Date.now().toString(36),
    title: str(parsed.title) || deriveTitle(prompt.input, 'Proceso generado'),
    description: str(parsed.description) || 'Proceso generado con IA.',
    context: str(parsed.context) || prompt.input.trim(),
    objective: str(parsed.objective) || 'Definir objetivo del proceso.',
    owner: str(parsed.owner) || undefined,
    maturityLevel: prompt.maturity,
    northStarMetric: str(parsed.northStarMetric) || undefined,
    tags: strArr(parsed.tags) ?? [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lanes,
    nodes,
    edges,
    metrics,
    risks,
    automations,
    documents,
    assumptions: strArr(parsed.assumptions) ?? [],
    openQuestions: strArr(parsed.openQuestions) ?? [],
    implementationChecklist: checklist,
  };
}
