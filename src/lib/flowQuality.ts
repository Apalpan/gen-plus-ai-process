import type { FlowIssue, FlowValidationReport, ProcessMap, ProcessNodeData } from '../types/process';
import { id } from './processSchema';

/**
 * Validación pedagógica del flujo (reglas AEC / Lean / buenas prácticas BPMN).
 * Enseña mientras corrige: rol no nombre, decisión como pregunta con dos caminos,
 * actividad = verbo + objeto, evidencia al cierre, métricas con fórmula, etc.
 */

const ROLE_HINTS = /coordinad|ingenier|jefe|especialista|oficina|residente|analista|geren|responsable|asistent|administr|contab|tesorer|soporte|community|partnership|pmo|proyectista|documentalista|cliente|sponsor|instructor|aprobador|solicitante|área|area|equipo de|líder|lider|bim|vdc|capataz|supervisor|director/i;
const GENERIC_OWNER = /^(alguien|equipo|varios|el equipo|todos|nadie|alguno)$/i;
const PERSON_NAME = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?$/;
const VERB_START = /^(¿)?[a-záéíóúñ]+(ar|er|ir|izar|ificar|guir|cer)\b/i;
const KNOWN_VERBS = /^(registr|revis|valid|public|coordin|asign|env[ií]|gener|aprob|analiz|comunic|detect|deriv|recib|ejecut|concili|clasific|gestion|elabor|emit|monitore|prepar|solicit|cerr|crear|crea|definir|defin|capt|actualiz|notific|archiv|program|verif|consolid|present|dise[ñn]|map|medir|mide|optimiz|implement|document)/i;

const WORK = ['activity', 'approval', 'handoff'];

function isPersonName(s: string): boolean {
  return PERSON_NAME.test(s.trim()) && !ROLE_HINTS.test(s);
}

function isVerbObject(title: string): boolean {
  const t = title.trim();
  return VERB_START.test(t) || KNOWN_VERBS.test(t);
}

export function runFlowValidation(p: ProcessMap): FlowValidationReport {
  const issues: FlowIssue[] = [];
  let total = 0;
  let passed = 0;
  const rule = (_name: string, ok: boolean, make: () => FlowIssue[]) => {
    total++;
    if (ok) passed++;
    else issues.push(...make());
  };

  const acts = p.nodes.filter((n) => WORK.includes(n.type));
  const decisions = p.nodes.filter((n) => n.type === 'decision');
  const handoffs = p.nodes.filter((n) => n.type === 'handoff');
  const queues = p.nodes.filter((n) => n.type === 'queue');
  const hasStart = p.nodes.some((n) => n.type === 'start');
  const hasEnd = p.nodes.some((n) => n.type === 'end');

  // 1. Inicio y fin
  rule('inicio_fin', hasStart && hasEnd, () => [
    {
      id: id('iss'),
      rule: 'Todo flujo tiene inicio y fin',
      severity: 'fail',
      detail: !hasStart && !hasEnd ? 'Falta el nodo de inicio y el de fin.' : !hasStart ? 'Falta el nodo de inicio (evento disparador).' : 'Falta el nodo de fin (cierre con evidencia).',
      fix: 'Agrega un nodo Inicio (qué evento dispara el proceso) y un Fin (qué resultado lo cierra).',
    },
  ]);

  // 2. Responsable por rol (no nombre propio, no genérico)
  const noResp = acts.filter((n) => !n.responsible?.trim());
  const badResp = acts.filter((n) => n.responsible && (GENERIC_OWNER.test(n.responsible.trim()) || isPersonName(n.responsible)));
  rule('responsable_rol', noResp.length === 0 && badResp.length === 0, () => [
    ...noResp.map((n) => issueFor(n, 'Cada paso tiene responsable', 'fail', 'Actividad sin responsable.', 'Asigna un rol o equipo responsable de este paso.')),
    ...badResp.map((n) =>
      issueFor(n, 'Responsable por rol, no nombre', 'warn', `"${n.responsible}" parece nombre propio o genérico.`, 'Usa el rol/equipo (ej. "Coordinador BIM", "Oficina técnica"), no "Juan Pérez" ni "Equipo".'),
    ),
  ]);

  // 3. Decisión = pregunta con dos caminos
  const decBad = decisions.filter((d) => {
    const isQuestion = /\?|¿/.test(d.title) || /\?|¿/.test(d.condition ?? '');
    const out = p.edges.filter((e) => e.source === d.id);
    const hasBoth = out.some((e) => e.type === 'decision_yes') && out.some((e) => e.type === 'decision_no');
    return !isQuestion || !hasBoth;
  });
  rule('decision_dos_caminos', decBad.length === 0, () =>
    decBad.map((d) => {
      const out = p.edges.filter((e) => e.source === d.id);
      const hasBoth = out.some((e) => e.type === 'decision_yes') && out.some((e) => e.type === 'decision_no');
      const isQuestion = /\?|¿/.test(d.title) || /\?|¿/.test(d.condition ?? '');
      return issueFor(
        d,
        'Cada decisión: pregunta + dos caminos',
        hasBoth ? 'warn' : 'fail',
        !isQuestion ? 'La decisión no está redactada como pregunta.' : 'La decisión no tiene ambas ramas Sí/No.',
        !isQuestion ? 'Redáctala como pregunta: "¿La consulta tiene información completa?".' : 'Conecta una rama Sí y una rama No desde el rombo.',
      );
    }),
  );

  // 4. Actividad = verbo + objeto
  const vagueActs = acts.filter((n) => n.type === 'activity' && !isVerbObject(n.title));
  rule('verbo_objeto', vagueActs.length === 0, () =>
    vagueActs.map((n) => issueFor(n, 'Actividad = verbo + objeto', 'warn', `"${n.title}" no empieza con un verbo de acción.`, 'Reescribe como verbo + objeto: "Registrar consulta", "Validar interferencias".')),
  );

  // 5. Input / output
  const noOut = acts.filter((n) => (n.outputs?.length ?? 0) === 0 && (n.documents?.length ?? 0) === 0 && !n.evidence);
  rule('input_output', acts.length === 0 || noOut.length <= Math.floor(acts.length * 0.4), () =>
    noOut.slice(0, 8).map((n) => issueFor(n, 'Cada paso tiene salida', 'warn', `"${n.title}" no declara una salida/output.`, 'Indica qué produce el paso (documento, registro, decisión, entregable).')),
  );

  // 6. Evidencia al cierre
  const hasEvidence = p.nodes.some((n) => n.type === 'evidence' || n.evidence) || p.documents.length > 0;
  rule('evidencia_cierre', !hasEnd || hasEvidence, () => [
    {
      id: id('iss'),
      rule: 'El cierre deja evidencia',
      severity: 'warn',
      detail: 'El proceso cierra sin evidencia trazable.',
      fix: 'Agrega un nodo Evidencia / Documento antes del Fin (acta, PDF, registro en CDE).',
    },
  ]);

  // 7. Métricas con fórmula, meta y frecuencia
  const badMetrics = p.metrics.filter((m) => !m.formula?.trim() || !m.target?.trim() || !m.frequency?.trim());
  rule('metricas_completas', p.metrics.length > 0 && badMetrics.length === 0, () =>
    p.metrics.length === 0
      ? [{ id: id('iss'), rule: 'Cada proceso tiene métrica', severity: 'warn', detail: 'No hay métricas definidas.', fix: 'Define al menos 1 métrica con fórmula, meta y frecuencia en el paso Medir.' }]
      : badMetrics.map((m) => ({ id: id('iss'), rule: 'Métrica con fórmula, meta y frecuencia', severity: 'warn' as const, detail: `"${m.name}" está incompleta.`, fix: 'Completa fórmula, meta y frecuencia (una métrica sin fórmula no sirve).' })),
  );

  // 8. Handoff indica de quién a quién
  const badHandoffs = handoffs.filter((n) => !n.responsible?.trim());
  rule('handoff_direccion', badHandoffs.length === 0, () =>
    badHandoffs.map((n) => issueFor(n, 'Handoff: de quién a quién', 'warn', `El traspaso "${n.title}" no indica el rol que lo realiza.`, 'Define el rol que entrega y a quién (el responsable del siguiente paso).')),
  );

  // 9. Cola indica qué se acumula
  const badQueues = queues.filter((n) => !n.description?.trim() && !n.waitTime);
  rule('cola_acumula', badQueues.length === 0, () =>
    badQueues.map((n) => issueFor(n, 'La cola indica qué se acumula', 'warn', `La cola "${n.title}" no dice qué se acumula ni cuánto espera.`, 'Indica qué unidad espera y el wait time (ej. "RFIs en espera de respuesta", 2 días).')),
  );

  const score = total ? Math.round((passed / total) * 100) : 0;
  return { score, passed, total, issues };
}

function issueFor(n: ProcessNodeData, ruleName: string, severity: FlowIssue['severity'], detail: string, fix: string): FlowIssue {
  return { id: id('iss'), rule: ruleName, severity, detail, fix, nodeId: n.id };
}
