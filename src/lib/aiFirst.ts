import type {
  AIAgentRecommendation,
  AIFirstAction,
  AIFirstReport,
  Automation,
  NodeClassification,
  ProcessMap,
  ProcessNodeData,
  RoadmapItem,
} from '../types/process';
import { runHealthCheck } from './health';
import { id } from './processSchema';

/**
 * Motor AI First — analiza un proceso mapeado y propone su rediseño:
 * qué se mantiene humano, qué pasa a agentes IA, qué se automatiza,
 * qué se simplifica o elimina, con agentes, automatizaciones y roadmap 30/60/90.
 * Heurístico y local: funciona sin API key.
 */

const WORK_TYPES = new Set(['activity', 'approval', 'handoff', 'decision']);

const AUTO_RE = /registr|notific|recordator|generar|actualiz|archiv|enviar|reporte|alerta|conciliaci|emitir|publicar|agendar|sincroniz|cargar|copiar/i;
const AGENT_RE = /analiz|redact|revis|investig|respond|resum|evalu|propuesta|diagnos|calific|prioriz|triage|clasific|cotiz|consulta|preparar/i;
const HUMAN_RE = /aprob|decid|negoci|firmar|contrat|entrevista|estrateg|cerrar trato/i;

function isWorkNode(n: ProcessNodeData): boolean {
  return WORK_TYPES.has(n.type);
}

export function classifyNode(n: ProcessNodeData): NodeClassification {
  const base = { nodeId: n.id, title: n.title };
  if (n.type === 'decision' || n.type === 'approval') {
    return { ...base, action: 'mantener_humano', reason: 'Decisión / validación con criterio y autoridad humana.' };
  }
  if (n.type === 'handoff') {
    return { ...base, action: 'simplificar', reason: 'Handoff entre áreas: reducir pasos y formalizar el traspaso.' };
  }
  if (HUMAN_RE.test(n.title)) {
    return { ...base, action: 'mantener_humano', reason: 'Requiere juicio, relación o responsabilidad humana.' };
  }
  if (AUTO_RE.test(n.title)) {
    return { ...base, action: 'automatizar', reason: 'Tarea repetitiva basada en reglas: candidata a automatización (n8n / workflow).' };
  }
  if (AGENT_RE.test(n.title)) {
    return { ...base, action: 'agente_ia', reason: 'Tarea cognitiva (analizar, redactar, clasificar): asignable a un agente IA con supervisión.' };
  }
  return { ...base, action: 'mantener_humano', reason: 'Mantener humano por ahora; revisar si puede asistirse con IA.' };
}

function pct(part: number, total: number): number {
  return total === 0 ? 0 : part / total;
}

/** AI First Score 0–100 (cálculo liviano, usable en listas). */
export function aiFirstScore(p: ProcessMap): number {
  const acts = p.nodes.filter(isWorkNode);
  const total = acts.length;
  const resp = pct(acts.filter((n) => n.responsible?.trim()).length, total);
  const io = pct(acts.filter((n) => (n.inputs?.length ?? 0) > 0 || (n.outputs?.length ?? 0) > 0).length, total);
  const metricCov = Math.min(1, p.metrics.length / 4);
  const cls = acts.map(classifyNode);
  const auto = pct(cls.filter((c) => c.action === 'automatizar').length, total);
  const agent = pct(cls.filter((c) => c.action === 'agente_ia').length, total);
  const risksOk = p.risks.length > 0 && p.risks.every((r) => r.mitigation?.trim()) ? 1 : p.risks.length > 0 ? 0.5 : 0;
  const docs = Math.min(1, p.documents.length / 3);
  const trace = p.nodes.some((n) => n.type === 'evidence' || n.type === 'document') ? 1 : 0;
  const systems = pct(acts.filter((n) => (n.tools?.length ?? 0) > 0).length, total);

  const score =
    resp * 15 + io * 10 + metricCov * 10 + Math.min(1, auto * 2) * 10 + Math.min(1, agent * 2) * 10 +
    risksOk * 10 + docs * 10 + trace * 10 + systems * 15;
  return Math.round(score);
}

export function aiFirstBand(score: number): string {
  if (score <= 25) return 'Proceso informal';
  if (score <= 50) return 'Proceso documentado básico';
  if (score <= 70) return 'Proceso medible';
  if (score <= 85) return 'Proceso optimizable con IA';
  return 'Proceso AI First listo para piloto';
}

/** % de actividades automatizables o asignables a agente IA. */
export function automationPotential(p: ProcessMap): number {
  const acts = p.nodes.filter(isWorkNode);
  if (!acts.length) return 0;
  const cls = acts.map(classifyNode);
  const n = cls.filter((c) => c.action === 'automatizar' || c.action === 'agente_ia').length;
  return Math.round((n / acts.length) * 100);
}

/* ---- Agent recommendation themes ---- */

const AGENT_THEMES: { re: RegExp; name: string; role: string; kpi: string }[] = [
  { re: /redact|propuesta|cotiz/i, name: 'Agente Redactor de Propuestas', role: 'Genera borradores de propuestas y documentos desde brief y contexto', kpi: 'Tiempo de generación de propuesta' },
  { re: /analiz|revis|evalu|diagnos/i, name: 'Agente Analista', role: 'Analiza información, detecta inconsistencias y prepara recomendaciones', kpi: 'Tiempo de análisis por caso' },
  { re: /seguimiento|recordator|follow/i, name: 'Agente de Seguimiento', role: 'Hace seguimiento a pendientes, detecta casos fríos y redacta recordatorios', kpi: '% de casos con seguimiento en SLA' },
  { re: /clasific|triage|prioriz|calific/i, name: 'Agente de Triage', role: 'Clasifica y prioriza entradas según reglas y contexto', kpi: 'Tiempo de primera clasificación' },
  { re: /report|informe|resum/i, name: 'Agente de Reportes', role: 'Compila datos y redacta reportes ejecutivos periódicos', kpi: 'Reportes entregados en fecha' },
  { re: /respond|consulta|atenc|soporte/i, name: 'Agente de Respuesta', role: 'Responde consultas frecuentes con base de conocimiento y escala casos complejos', kpi: 'Tiempo de primera respuesta' },
];

function buildAgents(p: ProcessMap, cls: NodeClassification[]): AIAgentRecommendation[] {
  const agentNodes = cls.filter((c) => c.action === 'agente_ia');
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const out: AIAgentRecommendation[] = [];

  for (const theme of AGENT_THEMES) {
    const matched = agentNodes.filter((c) => theme.re.test(c.title));
    if (!matched.length) continue;
    const nodes = matched.map((m) => byId.get(m.nodeId)).filter(Boolean) as ProcessNodeData[];
    out.push({
      id: id('agent'),
      name: theme.name,
      role: theme.role,
      objective: `Ejecutar: ${matched.map((m) => m.title).slice(0, 3).join(' · ')}`,
      inputs: Array.from(new Set(nodes.flatMap((n) => n.inputs ?? []))).slice(0, 4),
      outputs: Array.from(new Set(nodes.flatMap((n) => n.outputs ?? []))).slice(0, 4),
      tools: Array.from(new Set(nodes.flatMap((n) => n.tools ?? []))).slice(0, 4),
      autonomyLevel: 'supervisado',
      supervisor: p.owner ?? 'Responsable del proceso',
      kpi: theme.kpi,
      relatedNodeIds: matched.map((m) => m.nodeId),
    });
  }

  if (!out.length && agentNodes.length) {
    out.push({
      id: id('agent'),
      name: 'Agente Asistente del Proceso',
      role: 'Asiste las tareas cognitivas del proceso con supervisión humana',
      objective: `Asistir: ${agentNodes.map((m) => m.title).slice(0, 3).join(' · ')}`,
      autonomyLevel: 'supervisado',
      supervisor: p.owner ?? 'Responsable del proceso',
      kpi: 'Horas ahorradas por semana',
      relatedNodeIds: agentNodes.map((m) => m.nodeId),
    });
  }
  return out;
}

function buildAutomations(p: ProcessMap, cls: NodeClassification[]): Automation[] {
  const incoming = new Map<string, string>();
  p.edges.forEach((e) => {
    if (!incoming.has(e.target)) incoming.set(e.target, e.source);
  });
  const byId = new Map(p.nodes.map((n) => [n.id, n]));

  return cls
    .filter((c) => c.action === 'automatizar')
    .slice(0, 6)
    .map((c) => {
      const node = byId.get(c.nodeId);
      const prev = byId.get(incoming.get(c.nodeId) ?? '');
      return {
        id: id('auto'),
        name: `Automatizar: ${c.title}`,
        trigger: prev ? `Al completar "${prev.title}"` : 'Evento de entrada del proceso',
        action: c.title,
        tools: ['n8n'],
        inputData: node?.inputs?.join(', ') || 'Datos del paso anterior',
        outputData: node?.outputs?.join(', ') || 'Registro actualizado + notificación',
        humanInTheLoop: node?.priority === 'critical',
        estimatedImpact: 'Ahorro estimado: 4–8 h/mes',
        relatedNodeIds: [c.nodeId],
      };
    });
}

function buildRoadmap(p: ProcessMap, agents: AIAgentRecommendation[], autos: Automation[], healthGaps: string[]): RoadmapItem[] {
  const items: RoadmapItem[] = [];
  const push = (timeframe: RoadmapItem['timeframe'], title: string, priority: RoadmapItem['priority'], impact: RoadmapItem['impact'], effort: RoadmapItem['effort'], description?: string) =>
    items.push({ id: id('rm'), timeframe, title, description, priority, impact, effort, owner: p.owner, status: 'pendiente' });

  // 30 días — quick wins y base
  if (healthGaps.length) push('30', 'Cerrar brechas del Health Check', 'alta', 'alto', 'bajo', healthGaps.slice(0, 3).join(' · '));
  push('30', 'Formulario de entrada + tablero único del proceso', 'alta', 'alto', 'bajo', 'Una sola puerta de entrada y una sola fuente de verdad.');
  if (p.metrics.length) push('30', `Activar métricas base: ${p.metrics.slice(0, 2).map((m) => m.name).join(', ')}`, 'alta', 'medio', 'bajo');
  autos.slice(0, 2).forEach((a) => push('30', a.name, 'media', 'medio', 'bajo', a.trigger));

  // 60 días — automatización y medición
  if (autos.length) push('60', `Construir ${autos.length} automatización(es) en n8n`, 'alta', 'alto', 'medio', autos.map((a) => a.action).slice(0, 3).join(' · '));
  push('60', 'Dashboard de métricas conectado al proceso', 'media', 'alto', 'medio');
  push('60', 'Estandarizar documentos y evidencia (trazabilidad)', 'media', 'medio', 'bajo');

  // 90 días — agentes y escala
  if (agents.length) push('90', `Piloto de agente IA: ${agents[0].name}`, 'alta', 'alto', 'medio', `${agents[0].role}. KPI: ${agents[0].kpi}.`);
  push('90', 'Medir impacto: horas ahorradas, SLA y calidad', 'alta', 'alto', 'bajo');
  push('90', 'Escalar el rediseño a procesos relacionados', 'media', 'medio', 'medio');

  return items;
}

/** Análisis AI First completo. */
export function runAIFirst(p: ProcessMap): AIFirstReport {
  const acts = p.nodes.filter(isWorkNode);
  const cls = acts.map(classifyNode);

  // validaciones duplicadas consecutivas → eliminar
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  p.edges.forEach((e) => {
    const a = byId.get(e.source);
    const b = byId.get(e.target);
    if (a && b && /validar|revisar/i.test(a.title) && /validar|revisar/i.test(b.title)) {
      const target = cls.find((c) => c.nodeId === b.id);
      if (target && target.action !== 'mantener_humano') {
        target.action = 'eliminar';
        target.reason = 'Validación duplicada consecutiva: consolidar en un solo punto de control.';
      }
    }
  });

  const score = aiFirstScore(p);
  const potential = automationPotential(p);
  const health = runHealthCheck(p);
  const healthGaps = health.items.filter((i) => i.severity !== 'pass').map((i) => i.detail);

  const agents = buildAgents(p, cls);
  const autos = buildAutomations(p, cls);
  const roadmap = buildRoadmap(p, agents, autos, healthGaps);

  const count = (a: AIFirstAction) => cls.filter((c) => c.action === a).length;
  const noResp = acts.filter((n) => !n.responsible?.trim()).length;

  const improvements: string[] = [];
  if (noResp) improvements.push(`Asignar responsable único a ${noResp} actividad(es).`);
  if (count('simplificar')) improvements.push(`Simplificar ${count('simplificar')} handoff(s) entre áreas.`);
  if (count('eliminar')) improvements.push(`Eliminar ${count('eliminar')} validación(es) duplicada(s).`);
  if (autos.length) improvements.push(`Automatizar ${autos.length} tarea(s) repetitiva(s) con n8n.`);
  if (agents.length) improvements.push(`Delegar tareas cognitivas a ${agents.length} agente(s) IA supervisado(s).`);
  if (!p.metrics.length) improvements.push('Definir métricas con fórmula, meta y dueño (paso Medir).');
  improvements.push('Mantener decisiones y aprobaciones críticas en humanos con criterio explícito.');

  const quickWins = [
    ...autos.filter((a) => /notific|recordator|registr|alert|archiv|agendar/i.test(a.name)).map((a) => a.name),
    ...(noResp ? ['Asignar responsables faltantes (sin costo, alto impacto)'] : []),
    'Centralizar la entrada del proceso en un solo formulario',
  ].slice(0, 4);

  const toolVariety = new Set(acts.flatMap((n) => n.tools ?? [])).size;
  const hiddenRisks = [
    ...(p.documents.length < 2 ? ['Dependencia de personas clave sin respaldo documental.'] : []),
    ...(toolVariety > 3 ? ['Datos dispersos en demasiadas herramientas: definir fuente única.'] : []),
    'Adopción: sin ritual de uso, el equipo vuelve al canal informal (chat).',
    ...(autos.length ? ['No automatices caos: valida el rediseño antes de construir workflows.'] : []),
  ];

  const currentSummary = [
    `${acts.length} actividades (${count('mantener_humano')} humanas, ${p.nodes.filter((n) => n.type === 'decision').length} decisiones).`,
    `${Math.round(pct(acts.filter((n) => n.responsible?.trim()).length, acts.length) * 100)}% con responsable definido.`,
    `${p.metrics.length} métrica(s) y ${p.risks.length} riesgo(s) identificados.`,
    'Ejecución mayormente manual, dependiente de personas y canales informales.',
  ];

  const futureSummary = [
    `Humanos enfocados en ${count('mantener_humano')} punto(s) de decisión y relación.`,
    `${count('agente_ia')} tarea(s) cognitivas asistidas por agentes IA supervisados.`,
    `${count('automatizar')} tarea(s) repetitivas automatizadas (n8n) con trazabilidad.`,
    'Métricas visibles en dashboard y evidencia documental en cada cierre.',
  ];

  const band = aiFirstBand(score);
  const nextStep =
    score <= 25
      ? 'Documenta el flujo: responsables, entradas y salidas (paso Mapear).'
      : score <= 50
      ? 'Define métricas con fórmula y meta (paso Medir).'
      : score <= 70
      ? 'Genera el plan AI First y prioriza quick wins.'
      : score <= 85
      ? 'Construye las automatizaciones y prepara el piloto de agente.'
      : 'Este proceso ya puede pasar a piloto: exporta la ficha de implementación.';

  return {
    score,
    bandLabel: band,
    diagnosis: `${band}. Potencial de automatización: ${potential}% de las actividades.`,
    recommendation:
      potential >= 50
        ? 'Alto potencial: rediseña primero (simplifica y elimina), luego automatiza y agrega agentes.'
        : 'Potencial moderado: enfoca el rediseño en responsables, métricas y los 2–3 pasos más repetitivos.',
    nextStep,
    automationPotential: potential,
    classifications: cls,
    improvements,
    quickWins,
    hiddenRisks,
    agents,
    automations: autos,
    roadmap,
    currentSummary,
    futureSummary,
  };
}

export const ACTION_META: Record<AIFirstAction, { label: string; color: string }> = {
  mantener_humano: { label: 'Humano decide', color: '#2165FF' },
  agente_ia: { label: 'Agente IA', color: '#8B5CF6' },
  automatizar: { label: 'Automatizar', color: '#22D3EE' },
  simplificar: { label: 'Simplificar', color: '#F5A623' },
  eliminar: { label: 'Eliminar', color: '#F87171' },
};
