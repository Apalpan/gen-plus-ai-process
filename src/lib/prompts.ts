import type { ProcessMap } from '../types/process';
import { toJSON } from './jsonExporter';

/** Prompt to implement the process in software (Codex / Claude Code). */
export function codexPrompt(p: ProcessMap): string {
  return `# Implementación de software — ${p.title}

Implementa este proceso como una aplicación real usando el siguiente JSON como contrato de dominio.
Crea formularios, máquina de estados, responsables, notificaciones, dashboard, base de datos,
automatizaciones y reportes. Mantén trazabilidad completa y métricas en tiempo real.

## Requisitos
- Cada actividad => entidad/estado con responsable y SLA.
- Cada decisión => bifurcación condicional (sí/no).
- Cada documento => almacenamiento con versionado y repositorio.
- Cada métrica => cálculo automático con su fórmula y objetivo, y alerta cuando se incumple.
- Cada riesgo => monitor con trigger y plan de mitigación.
- Cada automatización => job/worker con trigger, input, acción, output y human-in-the-loop.
- Auditoría y trazabilidad de extremo a extremo.

## Stack sugerido
React + TypeScript en frontend; API REST/tRPC; Postgres; colas para automatizaciones; auth por rol.

## Contrato de dominio (ProcessMap JSON)
\`\`\`json
${toJSON(p)}
\`\`\`
`;
}

/** Prompt to build the automations in n8n. */
export function n8nPrompt(p: ProcessMap): string {
  const autos = p.automations
    .map(
      (a, i) =>
        `${i + 1}. ${a.name}\n   - Trigger: ${a.trigger}\n   - Acción: ${a.action}\n   - Input: ${a.inputData ?? '—'}\n   - Output: ${a.outputData ?? '—'}\n   - Human-in-the-loop: ${a.humanInTheLoop ? 'Sí' : 'No'}\n   - Herramientas: ${(a.tools ?? []).join(', ') || '—'}`,
    )
    .join('\n');
  return `# Workflows n8n — ${p.title}

Crea workflows en n8n para automatizar este proceso. Para cada automatización define el nodo
Trigger adecuado (Webhook, Cron, Email, Form), los nodos de acción (HTTP Request, Set, IF, Switch),
y un paso de aprobación humana cuando se indique human-in-the-loop.

## Automatizaciones a construir
${autos || '— (no hay automatizaciones definidas; sugiere al menos 3 basadas en el flujo)'}

## Reglas
- Maneja errores y reintentos.
- Registra cada ejecución para trazabilidad.
- Notifica al responsable cuando se supere un SLA.
`;
}

/** Prompt to document the process in Obsidian. */
export function obsidianPrompt(p: ProcessMap): string {
  return `# Documentar en Obsidian — ${p.title}

Crea una nota maestra en Obsidian para este proceso con frontmatter YAML, enlaces internos [[...]],
y dataview-ready. Incluye:
- Frontmatter: tipo: proceso, owner, version, madurez, tags, north_star.
- Secciones: Diagnóstico, Objetivo, Roles, Flujo, RACI, Documentos, Métricas, Riesgos, Automatizaciones, Preguntas abiertas, Checklist.
- Una nota por cada métrica y por cada riesgo, enlazada desde la nota maestra.
- Un canvas opcional que represente el flujo por carriles.

Tags sugeridos: ${p.tags.map((t) => `#${t}`).join(' ') || '#proceso #genplus'}
`;
}

/** Prompt to turn the process into a live dashboard. */
export function dashboardPrompt(p: ProcessMap): string {
  const metrics = p.metrics.map((m) => `- ${m.code} ${m.name}: ${m.formula} (meta ${m.target}, ${m.frequency ?? 'mensual'})`).join('\n');
  return `# Dashboard de métricas — ${p.title}

Construye un dashboard estratégico oscuro (estética enterprise) que muestre el estado del proceso
en tiempo real, con tarjetas KPI, semáforos por meta, y un mapa causal de objetivos
(cliente → proyecto → producción → factores controlables).

## KPIs
${metrics || '— (define KPIs a partir de las actividades)'}

## Requisitos
- Semáforo verde/ámbar/rojo según objetivo.
- Tendencias y comparación vs meta.
- Drill-down por carril y por actividad.
- Alertas cuando se incumple SLA o métrica crítica.
`;
}
