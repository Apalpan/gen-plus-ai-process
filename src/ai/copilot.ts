import type { ProcessMap } from '../types/process';
import { makeAutomation, makeChecklistItem, makeMetric, nowIso } from '../lib/processSchema';
import { runHealthCheck } from '../lib/health';
import { toMarkdown } from '../lib/markdownExporter';
import { toMermaid } from '../lib/mermaidExporter';
import { toJSON } from '../lib/jsonExporter';

export interface CopilotResult {
  process?: ProcessMap; // present if the map was mutated
  message: string;
  code?: string; // optional code block (mermaid/json/markdown)
}

const laneRole = (p: ProcessMap, laneId: string) =>
  p.lanes.find((l) => l.id === laneId)?.ownerRole ?? p.lanes.find((l) => l.id === laneId)?.name ?? 'Responsable';

const touch = (p: ProcessMap): ProcessMap => ({ ...p, updatedAt: nowIso() });

export const COPILOT_SUGGESTIONS = [
  'Simplifica este proceso',
  'Hazlo más técnico',
  'Agrega métricas',
  'Detecta cuellos de botella',
  'Agrega responsables',
  'Genera checklist de implementación',
  'Dime qué automatizar',
  'Dime qué datos debo capturar',
  'Dime qué preguntas faltan',
  'Pásalo a Mermaid',
  'Pásalo a Markdown',
  'Pásalo a JSON',
  'Dame versión ejecutiva',
  'Dame versión para el cliente',
];

export function runCopilot(rawCommand: string, p: ProcessMap): CopilotResult {
  const cmd = rawCommand.toLowerCase().trim();
  const has = (...keys: string[]) => keys.some((k) => cmd.includes(k));

  /* ---- Exports ---- */
  if (has('mermaid')) {
    return { message: 'Aquí tienes el proceso en formato Mermaid. Pégalo en cualquier visor Mermaid o en Obsidian.', code: toMermaid(p) };
  }
  if (has('markdown', 'md ', '.md')) {
    return { message: 'Markdown técnico generado con la estructura de 12 secciones.', code: toMarkdown(p, 'technical') };
  }
  if (has('json')) {
    return { message: 'ProcessMap completo en JSON (contrato de dominio).', code: toJSON(p) };
  }

  /* ---- Simplify ---- */
  if (has('simplifica', 'simplificar', 'simple')) {
    const removeTypes = new Set(['metric', 'risk', 'automation']);
    const keptNodes = p.nodes.filter((n) => !removeTypes.has(n.type));
    const keptIds = new Set(keptNodes.map((n) => n.id));
    const keptEdges = p.edges.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));
    const removed = p.nodes.length - keptNodes.length;
    return {
      process: touch({ ...p, nodes: keptNodes, edges: keptEdges }),
      message: `Proceso simplificado: oculté ${removed} nodo(s) auxiliares (métricas/riesgos/automatizaciones en el canvas). El flujo principal queda más legible. Las métricas y riesgos siguen disponibles en sus paneles.`,
    };
  }

  /* ---- More technical ---- */
  if (has('técnico', 'tecnico', 'detalle', 'profund')) {
    let codeSeq = 1;
    const nodes = p.nodes.map((n) => {
      if (!['activity', 'approval', 'handoff'].includes(n.type)) return n;
      return {
        ...n,
        code: n.code ?? `ACT-${String(codeSeq++).padStart(2, '0')}`,
        sla: n.sla ?? '≤ 1 día',
        tools: n.tools && n.tools.length ? n.tools : ['Por definir'],
        responsible: n.responsible ?? laneRole(p, n.laneId),
      };
    });
    return { process: touch({ ...p, nodes, maturityLevel: 'optimized' }), message: 'Subí el nivel técnico: completé códigos, SLAs y herramientas faltantes en las actividades.' };
  }

  /* ---- Add responsibles ---- */
  if (has('responsable', 'raci', 'roles')) {
    let filled = 0;
    const nodes = p.nodes.map((n) => {
      if (!['activity', 'approval', 'handoff', 'decision'].includes(n.type)) return n;
      if (n.responsible) return n;
      filled++;
      return { ...n, responsible: laneRole(p, n.laneId) };
    });
    return { process: touch({ ...p, nodes }), message: `Asigné responsable a ${filled} actividad(es) usando el rol dueño de cada carril.` };
  }

  /* ---- Add metrics ---- */
  if (has('métrica', 'metrica', 'kpi', 'indicador', 'medir')) {
    const additions = [];
    if (!p.metrics.some((m) => /ciclo|tiempo/i.test(m.name))) {
      additions.push(makeMetric({ code: `M-${p.metrics.length + 1}`, name: 'Tiempo de ciclo', category: 'time', formula: 'tiempo promedio inicio → fin', target: '≤ 48 h', frequency: 'Semanal', owner: p.owner ?? 'Owner' }));
    }
    additions.push(makeMetric({ code: `M-${p.metrics.length + 1 + additions.length}`, name: '% cumplimiento en SLA', category: 'quality', formula: 'casos en SLA / total', target: '≥ 90%', frequency: 'Semanal', owner: p.owner ?? 'Owner', leadingOrLagging: 'lagging' }));
    return { process: touch({ ...p, metrics: [...p.metrics, ...additions] }), message: `Agregué ${additions.length} métrica(s) con fórmula, meta, frecuencia y dueño. Revisa la pestaña Métricas para afinar valores.` };
  }

  /* ---- Bottleneck ---- */
  if (has('cuello', 'bottleneck', 'embudo', 'estancad')) {
    const inDeg: Record<string, number> = {};
    p.edges.forEach((e) => (inDeg[e.target] = (inDeg[e.target] ?? 0) + 1));
    const candidates = p.nodes
      .filter((n) => ['activity', 'approval', 'handoff', 'decision'].includes(n.type))
      .map((n) => ({ n, score: (inDeg[n.id] ?? 0) + (n.sla && /3|día|d/.test(n.sla) ? 2 : 0) + (n.type === 'approval' ? 2 : 0) }))
      .sort((a, b) => b.score - a.score);
    if (!candidates.length) return { message: 'No encuentro suficientes actividades para detectar un cuello de botella.' };
    const top = candidates[0].n;
    const nodes = p.nodes.map((n) => (n.id === top.id ? { ...n, priority: 'critical' as const } : n));
    return {
      process: touch({ ...p, nodes }),
      message: `Cuello de botella probable: **${top.title}** (alta convergencia / SLA largo / aprobación). Lo marqué como prioridad crítica. Recomendación: paralelizar entradas, definir un suplente y automatizar la alerta de SLA.`,
    };
  }

  /* ---- Suggest automations ---- */
  if (has('automatiz', 'automatización', 'bot', 'workflow')) {
    const firstAct = p.nodes.find((n) => n.type === 'activity');
    const additions = [
      makeAutomation({ name: 'Notificar al responsable al iniciar', trigger: `Inicio de "${firstAct?.title ?? 'la actividad'}"`, action: 'Enviar notificación al responsable', inputData: 'Caso creado', outputData: 'Notificación enviada', humanInTheLoop: false }),
      makeAutomation({ name: 'Alerta de SLA', trigger: 'SLA excedido', action: 'Notificar y escalar', inputData: 'Estado del caso', outputData: 'Alerta + escalamiento', humanInTheLoop: true }),
    ];
    return { process: touch({ ...p, automations: [...p.automations, ...additions] }), message: `Sugerí ${additions.length} automatización(es) con trigger, acción, input, output y human-in-the-loop. Están en la pestaña Automatizaciones.` };
  }

  /* ---- Checklist ---- */
  if (has('checklist', 'implementaci', 'pasos')) {
    const report = runHealthCheck(p);
    const gaps = report.items.filter((i) => i.severity !== 'pass').map((i) => makeChecklistItem(`Resolver: ${i.label} — ${i.detail}`, 'Health gap'));
    const base = [
      makeChecklistItem('Definir owners y matriz RACI', 'Roles'),
      makeChecklistItem('Crear formularios de entrada', 'Setup'),
      makeChecklistItem('Configurar repositorio documental (CDE)', 'Documentación'),
      makeChecklistItem('Configurar alertas de SLA', 'Automatización'),
      makeChecklistItem('Conectar dashboard de métricas', 'Métricas'),
      makeChecklistItem('Plan de adopción y capacitación', 'Adopción'),
    ];
    return { process: touch({ ...p, implementationChecklist: [...base, ...gaps] }), message: `Generé un checklist de implementación con ${base.length + gaps.length} ítems, incluyendo las brechas detectadas por el Health Check.` };
  }

  /* ---- Data to capture ---- */
  if (has('datos', 'capturar', 'campos')) {
    const fields = new Set<string>(['id_caso', 'fecha', 'responsable', 'estado', 'prioridad']);
    p.nodes.forEach((n) => {
      n.inputs?.forEach((i) => fields.add(i.toLowerCase().replace(/\s+/g, '_')));
      n.outputs?.forEach((o) => fields.add(o.toLowerCase().replace(/\s+/g, '_')));
    });
    p.metrics.forEach((m) => fields.add(m.name.toLowerCase().replace(/\s+/g, '_')));
    return { message: 'Datos sugeridos a capturar para implementar y medir el proceso:', code: Array.from(fields).map((f) => `- ${f}`).join('\n') };
  }

  /* ---- Open questions ---- */
  if (has('pregunta', 'falta', 'cerrar el proceso', 'dudas')) {
    const qs = p.openQuestions.length ? p.openQuestions : ['¿Quién es el dueño del proceso?', '¿Qué define el cierre exitoso?', '¿Qué SLA aplica por etapa?'];
    return { message: 'Preguntas abiertas que conviene resolver para blindar el proceso:', code: qs.map((q) => `- ${q}`).join('\n') };
  }

  /* ---- Versions ---- */
  if (has('ejecutiv')) {
    const report = runHealthCheck(p);
    return {
      message: `**Versión ejecutiva — ${p.title}**\n\n${p.objective}\n\nNorth Star: ${p.northStarMetric ?? '—'}. ${p.lanes.length} carriles, ${p.nodes.length} nodos, ${p.metrics.length} métricas. Health Score: ${report.score}/100 (${report.bandLabel}).`,
    };
  }
  if (has('cliente', 'presentar')) {
    return {
      message: `**Para el cliente — ${p.title}**\n\nObjetivo: ${p.objective}\n\nValor: trazabilidad de extremo a extremo, decisiones más rápidas y métricas claras (${p.metrics.slice(0, 3).map((m) => m.name).join(', ')}). Riesgos controlados con planes de mitigación y automatizaciones que reducen el trabajo manual.`,
    };
  }
  if (has('operativ')) {
    const steps = p.nodes.filter((n) => ['activity', 'approval', 'handoff'].includes(n.type)).map((n, i) => `${i + 1}. ${n.title} — ${n.responsible ?? 'responsable por definir'} ${n.sla ? `(${n.sla})` : ''}`);
    return { message: '**Versión operativa** — pasos con responsable y SLA:', code: steps.join('\n') };
  }

  /* ---- Fallback ---- */
  return {
    message:
      'Puedo modificar el proceso por ti. Prueba: "simplifica", "hazlo más técnico", "agrega métricas", "detecta cuellos de botella", "agrega responsables", "genera checklist", "dime qué automatizar", "pásalo a Mermaid/Markdown/JSON", o "dame versión ejecutiva".',
  };
}
