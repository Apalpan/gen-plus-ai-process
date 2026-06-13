/**
 * MASTER PROMPT — editable.
 * This is the system prompt the app will send to a real LLM when an API is wired in.
 * It is intentionally kept as a single editable export so it can evolve without touching logic.
 */
export const MASTER_PROMPT = `Eres un Arquitecto Lógico de Procesos Conversacionales y Automatización. Tu función es transformar ideas vagas expresadas en lenguaje natural en un proceso lógico blindado, con herramientas claras, variables completas y listo para implementación técnica posterior, sin rediseños.

Debes devolver:
1. Diagnóstico del proceso.
2. Objetivo del proceso.
3. Alcance.
4. Roles.
5. Entradas.
6. Actividades.
7. Decisiones.
8. Salidas.
9. Documentos.
10. Herramientas.
11. Métricas.
12. Riesgos.
13. Automatizaciones.
14. Preguntas abiertas.
15. Proceso visual en nodos y conexiones.
16. Checklist de implementación.

Reglas:
- No asumir sin marcar supuestos.
- Si falta información, crear preguntas abiertas.
- Cada actividad debe tener responsable.
- Cada decisión debe tener condiciones de sí/no.
- Cada proceso debe tener inicio y fin.
- Cada métrica debe tener fórmula, objetivo, frecuencia y dueño.
- Cada riesgo debe tener mitigación.
- Cada automatización debe indicar trigger, acción, input, output y humano responsable.
- El resultado debe ser implementable en software.

Devuelve EXCLUSIVAMENTE un objeto JSON válido que cumpla el esquema ProcessMap de GEN+ AI Process
(lanes, nodes, edges, metrics, risks, automations, documents, assumptions, openQuestions, implementationChecklist).`;

/**
 * Builds the user message for the LLM given the prompt parameters.
 */
const SCHEMA_HINT = `Estructura JSON requerida (usa IDs string consistentes):
{
  "title": string, "description": string, "context": string, "objective": string,
  "owner": string, "northStarMetric": string, "tags": string[], "unitOfFlow": string,
  "lanes": [{ "id": string, "name": string, "type": "client|project|production|control|support|documentation|ai|commercial|finance|operations|custom", "color": "#hex", "ownerRole": string }],
  "nodes": [{ "id": string, "type": "start|end|activity|decision|document|system|metric|risk|automation|approval|handoff|evidence|queue|buffer", "code": string, "title": string, "description": string, "laneId": <lane.id>, "responsible": string, "accountable": string, "inputs": string[], "outputs": string[], "tools": string[], "documents": string[], "sla": string, "condition": string, "priority": "low|medium|high|critical", "touchTime": "2 h", "waitTime": "1 día", "variabilityLevel": "baja|media|alta" }],
  "edges": [{ "id": string, "source": <node.id>, "target": <node.id>, "type": "sequence|decision_yes|decision_no|dependency|evidence|feedback|automation|metric_impact", "label": string }],
  "metrics": [{ "id": string, "code": string, "name": string, "category": "client_objective|project_objective|production_objective|controllable_factor|business|quality|time|cost|adoption|risk", "formula": string, "target": string, "currentValue": string, "frequency": string, "owner": string, "leadingOrLagging": "leading|lagging" }],
  "risks": [{ "id": string, "name": string, "probability": 1-5, "impact": 1-5, "mitigation": string, "trigger": string, "owner": string }],
  "automations": [{ "id": string, "name": string, "trigger": string, "action": string, "inputData": string, "outputData": string, "humanInTheLoop": boolean, "tools": string[] }],
  "documents": [{ "id": string, "name": string, "format": string, "repository": string, "required": boolean }],
  "assumptions": string[], "openQuestions": string[],
  "implementationChecklist": [{ "text": string, "phase": string, "done": false }]
}
Reglas: cada laneId debe existir en lanes[]; cada edge.source/target debe existir en nodes[]; debe haber un nodo start y uno end; cada decisión debe ser una pregunta con ramas decision_yes y decision_no; cada actividad = verbo + objeto; responsable por rol (no nombre propio); usa nodos "queue" donde el trabajo se acumula y estima touchTime/waitTime por paso. Devuelve SOLO el JSON, sin texto adicional ni markdown.`;

export function buildUserMessage(params: {
  input: string;
  kind: string;
  detail: string;
  format: string;
  maturity: string;
  name?: string;
  area?: string;
  involvedAreas?: string[];
  problem?: string;
  expectedResult?: string;
}): string {
  const extra = [
    params.name ? `- Nombre del proceso: ${params.name}` : '',
    params.area ? `- Área principal: ${params.area}` : '',
    params.involvedAreas?.length ? `- Áreas involucradas: ${params.involvedAreas.join(', ')}` : '',
    params.problem ? `- Problema principal: ${params.problem}` : '',
    params.expectedResult ? `- Resultado esperado: ${params.expectedResult}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `Descripción del proceso (cómo se trabaja hoy, en lenguaje natural):
"""
${params.input}
"""

Parámetros:
- Tipo de proceso: ${params.kind}
- Nivel de detalle: ${params.detail}
- Formato de salida preferido: ${params.format}
- Madurez objetivo: ${params.maturity}
${extra}

${SCHEMA_HINT}`;
}
