import type { HealthCheckItem, HealthReport, ProcessMap } from '../types/process';

/**
 * Process Health Check — evaluates structural and operational completeness.
 * Mirrors the "Process Health Check" module spec.
 */
export function runHealthCheck(p: ProcessMap): HealthReport {
  const items: HealthCheckItem[] = [];

  const activities = p.nodes.filter((n) => ['activity', 'approval', 'handoff'].includes(n.type));
  const decisions = p.nodes.filter((n) => n.type === 'decision');
  const hasStart = p.nodes.some((n) => n.type === 'start');
  const hasEnd = p.nodes.some((n) => n.type === 'end');

  const push = (
    id: string,
    label: string,
    ok: boolean,
    weight: number,
    okMsg: string,
    failMsg: string,
    warnOnly = false,
  ) => {
    items.push({
      id,
      label,
      severity: ok ? 'pass' : warnOnly ? 'warn' : 'fail',
      detail: ok ? okMsg : failMsg,
      weight,
    });
  };

  push(
    'start-end',
    'Tiene inicio y fin',
    hasStart && hasEnd,
    10,
    'El proceso define un nodo de inicio y de fin.',
    'Falta un nodo de inicio y/o de fin claramente definido.',
  );

  const actWithResp = activities.filter((n) => n.responsible && n.responsible.trim().length > 0);
  push(
    'responsible',
    'Cada actividad tiene responsable',
    activities.length > 0 && actWithResp.length === activities.length,
    12,
    `${actWithResp.length}/${activities.length} actividades con responsable.`,
    `${activities.length - actWithResp.length} actividad(es) sin responsable asignado.`,
  );

  const decWithCond = decisions.filter((n) => (n.condition ?? n.description ?? '').trim().length > 0);
  push(
    'decisions',
    'Cada decisión tiene condiciones',
    decisions.length === 0 || decWithCond.length === decisions.length,
    10,
    decisions.length === 0 ? 'Sin decisiones (lineal).' : `${decWithCond.length}/${decisions.length} decisiones con condición.`,
    `${decisions.length - decWithCond.length} decisión(es) sin condición sí/no.`,
  );

  // every decision should have both yes & no outgoing
  const decBalanced = decisions.every((d) => {
    const out = p.edges.filter((e) => e.source === d.id);
    return out.some((e) => e.type === 'decision_yes') && out.some((e) => e.type === 'decision_no');
  });
  push(
    'decision-branches',
    'Decisiones con ramas Sí/No',
    decisions.length === 0 || decBalanced,
    8,
    'Todas las decisiones tienen ambas ramas.',
    'Hay decisiones sin rama Sí y/o No explícita.',
    true,
  );

  const outputsHaveEvidence = activities.filter((n) => (n.outputs?.length ?? 0) > 0 || (n.documents?.length ?? 0) > 0);
  push(
    'evidence',
    'Salidas con documento o evidencia',
    activities.length === 0 || outputsHaveEvidence.length >= Math.ceil(activities.length * 0.6),
    8,
    'La mayoría de actividades produce salidas/evidencia.',
    'Demasiadas actividades sin salida documental.',
    true,
  );

  const metricsOk = p.metrics.every((m) => m.formula.trim() && m.target.trim());
  push(
    'metrics',
    'Cada métrica tiene fórmula y meta',
    p.metrics.length > 0 && metricsOk,
    12,
    `${p.metrics.length} métricas con fórmula y objetivo.`,
    p.metrics.length === 0 ? 'No hay métricas definidas.' : 'Hay métricas sin fórmula u objetivo.',
  );

  const risksOk = p.risks.every((r) => r.mitigation.trim());
  push(
    'risks',
    'Cada riesgo tiene mitigación',
    p.risks.length > 0 && risksOk,
    8,
    `${p.risks.length} riesgos con mitigación.`,
    p.risks.length === 0 ? 'No se identificaron riesgos.' : 'Hay riesgos sin mitigación.',
    true,
  );

  const slaCount = activities.filter((n) => n.sla && n.sla.trim()).length;
  push(
    'sla',
    'Actividades con SLA',
    activities.length === 0 || slaCount >= Math.ceil(activities.length * 0.4),
    7,
    `${slaCount}/${activities.length} actividades con SLA.`,
    'Pocas actividades tienen SLA definido.',
    true,
  );

  // handoffs with responsible
  const handoffs = p.nodes.filter((n) => n.type === 'handoff');
  const handoffOk = handoffs.every((n) => n.responsible);
  push(
    'handoffs',
    'Handoffs con responsable',
    handoffs.length === 0 || handoffOk,
    5,
    'Handoffs con responsable definido.',
    'Hay handoffs sin responsable.',
    true,
  );

  const autoOk = p.automations.every((a) => a.trigger && a.action && a.inputData && a.outputData);
  push(
    'automations',
    'Automatizaciones con input/output',
    p.automations.length === 0 || autoOk,
    7,
    p.automations.length === 0 ? 'Sin automatizaciones aún.' : 'Automatizaciones con trigger, acción, input y output.',
    'Hay automatizaciones sin input/output definido.',
    true,
  );

  const docsRepo = p.documents.every((d) => d.repository);
  push(
    'docs-repo',
    'Documentos con repositorio',
    p.documents.length === 0 || docsRepo,
    5,
    'Documentos con repositorio asignado.',
    'Hay documentos sin repositorio definido.',
    true,
  );

  // orphan nodes (no edges)
  const connected = new Set<string>();
  p.edges.forEach((e) => {
    connected.add(e.source);
    connected.add(e.target);
  });
  const orphans = p.nodes.filter((n) => !['start'].includes(n.type) && !connected.has(n.id));
  push(
    'connectivity',
    'Sin nodos huérfanos',
    orphans.length === 0,
    6,
    'Todos los nodos están conectados.',
    `${orphans.length} nodo(s) sin conexiones.`,
    true,
  );

  push(
    'implementable',
    'Implementable en software',
    activities.length >= 3 && p.metrics.length >= 1 && hasStart && hasEnd,
    6,
    'El proceso tiene la estructura mínima para implementarse.',
    'Falta estructura mínima (actividades, métricas, inicio/fin).',
    true,
  );

  const totalWeight = items.reduce((s, it) => s + it.weight, 0);
  const earned = items.reduce((s, it) => {
    if (it.severity === 'pass') return s + it.weight;
    if (it.severity === 'warn') return s + it.weight * 0.5;
    return s;
  }, 0);
  const score = Math.round((earned / totalWeight) * 100);

  let band: HealthReport['band'] = 'weak';
  let bandLabel = 'Proceso débil';
  if (score >= 91) {
    band = 'hardened';
    bandLabel = 'Proceso blindado';
  } else if (score >= 71) {
    band = 'implementable';
    bandLabel = 'Proceso implementable';
  } else if (score >= 41) {
    band = 'incomplete';
    bandLabel = 'Proceso operativo incompleto';
  }

  return { score, band, bandLabel, items };
}
