import type { ProcessMap } from '../types/process';
import { runHealthCheck } from './health';
import { NODE_TYPE_META } from './processSchema';

function laneName(p: ProcessMap, laneId: string): string {
  return p.lanes.find((l) => l.id === laneId)?.name ?? '—';
}

function list(items?: string[]): string {
  if (!items || items.length === 0) return '—';
  return items.join(', ');
}

/**
 * Executive + technical Markdown export following the required 12-section structure.
 */
export function toMarkdown(p: ProcessMap, mode: 'executive' | 'technical' = 'technical'): string {
  const health = runHealthCheck(p);
  const md: string[] = [];

  md.push(`# ${p.title}`);
  md.push('');
  md.push(`> ${p.description || 'Proceso generado con GEN+ AI Process.'}`);
  md.push('');
  md.push(
    `**Versión:** ${p.version} · **Madurez:** ${p.maturityLevel} · **Health Score:** ${health.score}/100 (${health.bandLabel}) · **Owner:** ${p.owner ?? '—'}`,
  );
  if (p.tags.length) md.push(`**Tags:** ${p.tags.map((t) => `\`${t}\``).join(' ')}`);
  md.push('');

  md.push('## 1. Diagnóstico');
  md.push(p.context || 'Sin diagnóstico explícito. Definir contexto operativo y dolor principal.');
  md.push('');

  md.push('## 2. Objetivo');
  md.push(p.objective || '—');
  if (p.northStarMetric) md.push(`\n**North Star:** ${p.northStarMetric}`);
  md.push('');

  md.push('## 3. Alcance');
  md.push(`Carriles / áreas involucradas: ${p.lanes.map((l) => l.name).join(', ') || '—'}.`);
  md.push('');

  md.push('## 4. Roles');
  if (p.lanes.length) {
    md.push('| Carril | Tipo | Rol responsable |');
    md.push('|---|---|---|');
    p.lanes.forEach((l) => md.push(`| ${l.name} | ${l.type} | ${l.ownerRole ?? '—'} |`));
  } else md.push('—');
  md.push('');

  md.push('## 5. Flujo del proceso');
  p.lanes.forEach((lane) => {
    const nodes = p.nodes.filter((n) => n.laneId === lane.id);
    if (!nodes.length) return;
    md.push(`\n### ${lane.name}`);
    nodes.forEach((n) => {
      const meta = NODE_TYPE_META[n.type];
      const code = n.code ? `\`${n.code}\` ` : '';
      md.push(`- ${code}**${n.title}** _(${meta.label})_`);
      if (mode === 'technical') {
        if (n.description) md.push(`  - ${n.description}`);
        if (n.condition) md.push(`  - Condición: ${n.condition}`);
        if (n.responsible) md.push(`  - Responsable: ${n.responsible}`);
        if (n.inputs?.length) md.push(`  - Entradas: ${list(n.inputs)}`);
        if (n.outputs?.length) md.push(`  - Salidas: ${list(n.outputs)}`);
        if (n.tools?.length) md.push(`  - Herramientas: ${list(n.tools)}`);
        if (n.sla) md.push(`  - SLA: ${n.sla}`);
      }
    });
  });
  md.push('');

  md.push('## 6. Matriz RACI');
  const raci = p.nodes.filter((n) => ['activity', 'approval', 'handoff', 'decision'].includes(n.type));
  if (raci.length) {
    md.push('| Actividad | Responsable (R) | Aprobador (A) | Consultado (C) | Informado (I) |');
    md.push('|---|---|---|---|---|');
    raci.forEach((n) =>
      md.push(
        `| ${n.title} | ${n.responsible ?? '—'} | ${n.accountable ?? '—'} | ${list(n.consulted)} | ${list(n.informed)} |`,
      ),
    );
  } else md.push('—');
  md.push('');

  md.push('## 7. Documentos y evidencia');
  if (p.documents.length) {
    md.push('| Documento | Formato | Repositorio | Requerido |');
    md.push('|---|---|---|---|');
    p.documents.forEach((d) =>
      md.push(`| ${d.name} | ${d.format ?? d.type ?? '—'} | ${d.repository ?? '—'} | ${d.required ? 'Sí' : 'No'} |`),
    );
  } else md.push('—');
  md.push('');

  md.push('## 8. Métricas');
  if (p.metrics.length) {
    md.push('| Código | Métrica | Fórmula | Meta | Frecuencia | Dueño | Tipo |');
    md.push('|---|---|---|---|---|---|---|');
    p.metrics.forEach((m) =>
      md.push(
        `| ${m.code} | ${m.name} | ${m.formula} | ${m.target} | ${m.frequency ?? '—'} | ${m.owner ?? '—'} | ${m.leadingOrLagging ?? '—'} |`,
      ),
    );
  } else md.push('—');
  md.push('');

  md.push('## 9. Riesgos');
  if (p.risks.length) {
    md.push('| Riesgo | Prob. | Impacto | Severidad | Mitigación | Dueño |');
    md.push('|---|---|---|---|---|---|');
    p.risks.forEach((r) =>
      md.push(
        `| ${r.name} | ${r.probability} | ${r.impact} | ${r.severity ?? r.probability * r.impact} | ${r.mitigation} | ${r.owner ?? '—'} |`,
      ),
    );
  } else md.push('—');
  md.push('');

  md.push('## 10. Automatizaciones');
  if (p.automations.length) {
    p.automations.forEach((a) => {
      md.push(`- **${a.name}**`);
      md.push(`  - Trigger: ${a.trigger}`);
      md.push(`  - Acción: ${a.action}`);
      md.push(`  - Input → Output: ${a.inputData ?? '—'} → ${a.outputData ?? '—'}`);
      md.push(`  - Human-in-the-loop: ${a.humanInTheLoop ? 'Sí' : 'No'}`);
      if (a.estimatedImpact) md.push(`  - Impacto estimado: ${a.estimatedImpact}`);
    });
  } else md.push('—');
  md.push('');

  md.push('## 11. Preguntas abiertas');
  if (p.openQuestions.length) p.openQuestions.forEach((q) => md.push(`- ${q}`));
  else md.push('—');
  if (p.assumptions.length) {
    md.push('\n**Supuestos:**');
    p.assumptions.forEach((a) => md.push(`- ${a}`));
  }
  md.push('');

  md.push('## 12. Checklist de implementación');
  if (p.implementationChecklist.length) {
    p.implementationChecklist.forEach((c) => md.push(`- [${c.done ? 'x' : ' '}] ${c.text}${c.phase ? ` _(${c.phase})_` : ''}`));
  } else md.push('—');
  md.push('');

  md.push('---');
  md.push(`_Generado con **GEN+ AI Process** · ${new Date().toLocaleString('es-PE')} · Carriles asignados con referencia a ${laneName(p, p.nodes[0]?.laneId ?? '')}_`);

  return md.join('\n');
}
