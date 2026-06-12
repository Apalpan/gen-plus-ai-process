import { nanoid } from 'nanoid';
import type {
  Automation,
  ChecklistItem,
  EdgeType,
  Lane,
  Metric,
  NodeType,
  ProcessDocument,
  ProcessEdgeData,
  ProcessMap,
  ProcessNodeData,
  Risk,
} from '../types/process';

export const NODE_TYPE_META: Record<
  NodeType,
  { label: string; color: string; ring: string; tint: string }
> = {
  start: { label: 'Inicio', color: '#2165FF', ring: 'rgba(33,101,255,0.5)', tint: 'rgba(33,101,255,0.14)' },
  end: { label: 'Fin', color: '#1E5CE8', ring: 'rgba(30,92,232,0.5)', tint: 'rgba(30,92,232,0.14)' },
  activity: { label: 'Actividad', color: '#4D84FF', ring: 'rgba(77,132,255,0.45)', tint: 'rgba(14,42,107,0.55)' },
  decision: { label: 'Decisión', color: '#F5A623', ring: 'rgba(245,166,35,0.5)', tint: 'rgba(245,166,35,0.12)' },
  document: { label: 'Documento', color: '#22D3EE', ring: 'rgba(34,211,238,0.5)', tint: 'rgba(34,211,238,0.10)' },
  evidence: { label: 'Evidencia', color: '#22D3EE', ring: 'rgba(34,211,238,0.5)', tint: 'rgba(34,211,238,0.10)' },
  system: { label: 'Sistema', color: '#6A98FF', ring: 'rgba(106,152,255,0.5)', tint: 'rgba(106,152,255,0.12)' },
  metric: { label: 'Métrica', color: '#34D399', ring: 'rgba(52,211,153,0.5)', tint: 'rgba(52,211,153,0.10)' },
  risk: { label: 'Riesgo', color: '#F87171', ring: 'rgba(248,113,113,0.5)', tint: 'rgba(248,113,113,0.12)' },
  automation: { label: 'Automatización', color: '#8B5CF6', ring: 'rgba(139,92,246,0.5)', tint: 'rgba(139,92,246,0.12)' },
  approval: { label: 'Aprobación', color: '#F5A623', ring: 'rgba(245,166,35,0.5)', tint: 'rgba(245,166,35,0.12)' },
  handoff: { label: 'Handoff', color: '#FB923C', ring: 'rgba(251,146,60,0.5)', tint: 'rgba(251,146,60,0.12)' },
};

export const LANE_COLORS: string[] = [
  '#1E5CE8',
  '#22D3EE',
  '#8B5CF6',
  '#34D399',
  '#F5A623',
  '#6A98FF',
  '#FB923C',
];

export const EDGE_TYPE_META: Record<EdgeType, { color: string; dashed: boolean; label: string }> = {
  sequence: { color: '#4D84FF', dashed: false, label: 'Secuencia' },
  decision_yes: { color: '#34D399', dashed: false, label: 'Sí' },
  decision_no: { color: '#F87171', dashed: false, label: 'No' },
  dependency: { color: '#6A98FF', dashed: true, label: 'Dependencia' },
  evidence: { color: '#22D3EE', dashed: true, label: 'Evidencia' },
  feedback: { color: '#F5A623', dashed: true, label: 'Feedback' },
  automation: { color: '#8B5CF6', dashed: true, label: 'Automatización' },
  metric_impact: { color: '#34D399', dashed: true, label: 'Impacto' },
};

export const id = (prefix = 'n') => `${prefix}_${nanoid(8)}`;

export function nowIso(): string {
  return new Date().toISOString();
}

/* ---- Factories ---- */

export function makeNode(partial: Partial<ProcessNodeData> & { title: string; laneId: string }): ProcessNodeData {
  return {
    id: partial.id ?? id('node'),
    type: partial.type ?? 'activity',
    position: partial.position ?? { x: 0, y: 0 },
    status: partial.status ?? 'draft',
    priority: partial.priority ?? 'medium',
    ...partial,
  };
}

export function makeEdge(
  source: string,
  target: string,
  partial: Partial<ProcessEdgeData> = {},
): ProcessEdgeData {
  return {
    id: partial.id ?? id('edge'),
    source,
    target,
    type: partial.type ?? 'sequence',
    ...partial,
  };
}

export function makeLane(partial: Partial<Lane> & { name: string }): Lane {
  return {
    id: partial.id ?? id('lane'),
    type: partial.type ?? 'custom',
    color: partial.color ?? LANE_COLORS[0],
    ...partial,
  };
}

export function makeMetric(partial: Partial<Metric> & { code: string; name: string; formula: string; target: string; category: Metric['category'] }): Metric {
  return {
    id: partial.id ?? id('metric'),
    ...partial,
  };
}

export function makeRisk(partial: Partial<Risk> & { name: string; mitigation: string; probability: number; impact: number }): Risk {
  return {
    id: partial.id ?? id('risk'),
    severity: partial.severity ?? partial.probability * partial.impact,
    ...partial,
  };
}

export function makeAutomation(partial: Partial<Automation> & { name: string; trigger: string; action: string }): Automation {
  return {
    id: partial.id ?? id('auto'),
    humanInTheLoop: partial.humanInTheLoop ?? false,
    ...partial,
  };
}

export function makeDocument(partial: Partial<ProcessDocument> & { name: string }): ProcessDocument {
  return {
    id: partial.id ?? id('doc'),
    required: partial.required ?? false,
    ...partial,
  };
}

export function makeChecklistItem(text: string, phase?: string, done = false): ChecklistItem {
  return { id: id('chk'), text, done, phase };
}

export function emptyProcess(title = 'Nuevo proceso'): ProcessMap {
  return {
    id: id('proc'),
    title,
    description: '',
    objective: '',
    version: '1.0',
    maturityLevel: 'idea',
    status: 'borrador',
    favorite: false,
    involvedAreas: [],
    agents: [],
    roadmap: [],
    tags: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lanes: [],
    nodes: [],
    edges: [],
    metrics: [],
    risks: [],
    automations: [],
    documents: [],
    assumptions: [],
    openQuestions: [],
    implementationChecklist: [],
  };
}

export const STATUS_META: Record<NonNullable<ProcessMap['status']>, { label: string; color: string }> = {
  borrador: { label: 'Borrador', color: '#6A98FF' },
  mapeado: { label: 'Mapeado', color: '#2165FF' },
  medido: { label: 'Medido', color: '#22D3EE' },
  optimizado: { label: 'Optimizado', color: '#8B5CF6' },
  en_implementacion: { label: 'En implementación', color: '#F5A623' },
  implementado: { label: 'Implementado', color: '#34D399' },
  mejora_continua: { label: 'Mejora continua', color: '#34D399' },
};

/** Severity band color for a risk (1..25). */
export function riskSeverityColor(severity: number): string {
  if (severity >= 15) return '#F87171';
  if (severity >= 8) return '#FB923C';
  return '#34D399';
}

/** Metric status by comparing currentValue to target where parseable. */
export function metricStatus(metric: Metric): 'on' | 'warn' | 'crit' | 'unknown' {
  const cur = parseFloat((metric.currentValue ?? '').replace(/[^0-9.\-]/g, ''));
  const tgt = parseFloat((metric.target ?? '').replace(/[^0-9.\-]/g, ''));
  if (Number.isNaN(cur) || Number.isNaN(tgt)) return 'unknown';
  const isLowerBetter = /≤|<=|<|menor|máx|max/i.test(metric.target);
  const ratio = tgt === 0 ? (cur === 0 ? 1 : 0) : cur / tgt;
  if (isLowerBetter) {
    if (cur <= tgt) return 'on';
    if (cur <= tgt * 1.25) return 'warn';
    return 'crit';
  }
  if (ratio >= 0.98) return 'on';
  if (ratio >= 0.85) return 'warn';
  return 'crit';
}
