import type { ProcessKind, ProcessMap } from '../types/process';
import {
  emptyProcess,
  makeAutomation,
  makeChecklistItem,
  makeDocument,
  makeEdge,
  makeLane,
  makeMetric,
  makeNode,
  makeRisk,
  nowIso,
} from '../lib/processSchema';

export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  kind: ProcessKind;
  icon: string; // lucide icon name
  build: () => ProcessMap;
}

/* ============================================================
   A. Gestión de consultas técnicas en obra  (example / default)
   ============================================================ */
export function buildObra(): ProcessMap {
  const campo = makeLane({ name: 'Campo / Producción', type: 'production', color: '#1E5CE8', ownerRole: 'Ing. de campo' });
  const ot = makeLane({ name: 'Oficina Técnica / BIM / VIA', type: 'project', color: '#22D3EE', ownerRole: 'Coordinador OT/BIM' });
  const proy = makeLane({ name: 'Proyectista / Especialista', type: 'support', color: '#8B5CF6', ownerRole: 'Proyectista' });
  const cde = makeLane({ name: 'CDE / Documentación', type: 'documentation', color: '#34D399', ownerRole: 'Documentalista CDE' });
  const control = makeLane({ name: 'Control / Gestión', type: 'control', color: '#F5A623', ownerRole: 'Jefe de Proyecto' });

  const n1 = makeNode({ type: 'start', title: 'Duda detectada en obra', laneId: campo.id, status: 'active' });
  const n2 = makeNode({
    type: 'activity', code: 'OBR-00', title: 'Detectar duda técnica', laneId: campo.id, responsible: 'Ing. de campo',
    inputs: ['Avance de obra', 'Planos vigentes'], outputs: ['Descripción de la duda'], tools: ['App de campo'], sla: 'Inmediato', status: 'active',
  });
  const n3 = makeNode({
    type: 'activity', code: 'OBR-01', title: 'Revisar planos / documentos', laneId: campo.id, responsible: 'Ing. de campo',
    inputs: ['Planos RVT/DWG', 'Especificaciones'], outputs: ['Análisis preliminar'], tools: ['Visor BIM', 'CDE móvil'],
  });
  const d1 = makeNode({
    type: 'decision', code: 'D1', title: '¿Se resuelve con información disponible?', laneId: campo.id,
    condition: 'Información suficiente y sin impacto técnico', responsible: 'Ing. de campo',
  });
  const endField = makeNode({ type: 'end', title: 'Cierre directo en campo', laneId: campo.id });
  const n4 = makeNode({
    type: 'activity', code: 'RFI-REG', title: 'Registrar consulta en CDE', laneId: cde.id, responsible: 'Documentalista CDE',
    inputs: ['Descripción de la duda', 'Fotos JPG/PNG'], outputs: ['Consulta registrada'], tools: ['ACC / BIM 360', 'Formulario'], sla: '≤ 4 h',
  });
  const doc1 = makeNode({ type: 'document', code: 'DOC', title: 'Ficha de consulta', laneId: cde.id, documents: ['Ficha de consulta'] });
  const n5 = makeNode({
    type: 'activity', code: 'OT-VAL', title: 'Validar consulta', laneId: ot.id, responsible: 'Coordinador OT/BIM',
    inputs: ['Consulta registrada'], outputs: ['Consulta validada'], sla: '≤ 8 h',
  });
  const d2 = makeNode({
    type: 'decision', code: 'D2', title: '¿Consulta completa y válida?', laneId: ot.id,
    condition: 'Tiene contexto, ubicación, planos y evidencia', responsible: 'Coordinador OT/BIM',
  });
  const n6 = makeNode({
    type: 'handoff', code: 'HOFF-0', title: 'Solicitar completar información', laneId: ot.id, responsible: 'Coordinador OT/BIM',
    outputs: ['Solicitud de información'],
  });
  const n7 = makeNode({
    type: 'activity', code: 'OT-ASG', title: 'Asignar responsable', laneId: ot.id, responsible: 'Coordinador OT/BIM',
    outputs: ['Responsable asignado'],
  });
  const n8 = makeNode({
    type: 'handoff', code: 'HOFF-1', title: 'Solicitar respuesta a especialista', laneId: proy.id, responsible: 'Coordinador OT/BIM',
    outputs: ['Solicitud al proyectista'], sla: '≤ 24 h',
  });
  const n9 = makeNode({
    type: 'activity', code: 'PROY-01', title: 'Analizar respuesta técnica', laneId: proy.id, responsible: 'Proyectista / Especialista',
    inputs: ['Solicitud', 'Planos'], outputs: ['Respuesta técnica'], tools: ['Revit', 'AutoCAD'], sla: '≤ 3 días', priority: 'high',
  });
  const d3 = makeNode({
    type: 'decision', code: 'D3', title: '¿Requiere cambio formal o impacto mayor?', laneId: proy.id,
    condition: 'Impacta costo, plazo o diseño', responsible: 'Proyectista / Especialista',
  });
  const n10 = makeNode({
    type: 'approval', code: 'RFI-FORM', title: 'Derivar a RFI / SDI formal', laneId: control.id, responsible: 'Jefe de Proyecto',
    outputs: ['RFI/SDI emitido'], priority: 'critical',
  });
  const n11 = makeNode({
    type: 'activity', code: 'RES-REG', title: 'Registrar resolución', laneId: cde.id, responsible: 'Documentalista CDE',
    outputs: ['Resolución registrada'], tools: ['ACC / BIM 360'],
  });
  const doc2 = makeNode({ type: 'evidence', code: 'EVD', title: 'Evidencia y trazabilidad', laneId: cde.id, documents: ['PDF de trazabilidad'] });
  const n12 = makeNode({
    type: 'activity', code: 'COM-01', title: 'Comunicar solución a campo', laneId: ot.id, responsible: 'Coordinador OT/BIM',
    outputs: ['Solución comunicada'], sla: '≤ 8 h',
  });
  const n13 = makeNode({ type: 'end', code: 'CIERRE', title: 'Cierre de consulta', laneId: control.id });

  // Side nodes demonstrating metric / automation / risk node types
  const mLat = makeNode({ type: 'metric', code: 'OPI-01', title: 'Latencia de decisiones', laneId: control.id, metadata: { value: '2.4 d', target: '≤ 3 d' } });
  const autoSla = makeNode({ type: 'automation', code: 'AUT-3', title: 'Alerta de SLA', laneId: control.id });
  const riskEv = makeNode({ type: 'risk', code: 'RSK-1', title: 'Consulta sin evidencia', laneId: control.id });

  const nodes = [n1, n2, n3, d1, endField, n4, doc1, n5, d2, n6, n7, n8, n9, d3, n10, n11, doc2, n12, n13, mLat, autoSla, riskEv];

  const edges = [
    makeEdge(n1.id, n2.id),
    makeEdge(n2.id, n3.id),
    makeEdge(n3.id, d1.id),
    makeEdge(d1.id, endField.id, { type: 'decision_yes' }),
    makeEdge(d1.id, n4.id, { type: 'decision_no' }),
    makeEdge(n4.id, doc1.id, { type: 'evidence' }),
    makeEdge(n4.id, n5.id),
    makeEdge(n5.id, d2.id),
    makeEdge(d2.id, n7.id, { type: 'decision_yes' }),
    makeEdge(d2.id, n6.id, { type: 'decision_no' }),
    makeEdge(n6.id, n2.id, { type: 'feedback', label: 'Completar' }),
    makeEdge(n7.id, n8.id),
    makeEdge(n8.id, n9.id),
    makeEdge(n9.id, d3.id),
    makeEdge(d3.id, n10.id, { type: 'decision_yes' }),
    makeEdge(d3.id, n11.id, { type: 'decision_no' }),
    makeEdge(n10.id, n11.id),
    makeEdge(n11.id, doc2.id, { type: 'evidence' }),
    makeEdge(n11.id, n12.id),
    makeEdge(n12.id, n13.id),
    makeEdge(n9.id, mLat.id, { type: 'metric_impact', strength: 0.8 }),
    makeEdge(n8.id, autoSla.id, { type: 'automation' }),
    makeEdge(n4.id, riskEv.id, { type: 'dependency' }),
  ];

  const metrics = [
    makeMetric({ code: 'OPI-01', name: 'Latencia de decisiones', category: 'time', formula: 'días promedio desde consulta hasta decisión', target: '≤ 3 días', currentValue: '2.4 días', frequency: 'Semanal', owner: 'Coordinador OT', dataSource: 'CDE', leadingOrLagging: 'lagging', interpretation: 'Mide la velocidad real de resolución técnica.', decisionRule: 'Si > 3 días, reforzar capacidad del proyectista.', relatedNodeIds: [n9.id, mLat.id] }),
    makeMetric({ code: 'QLT-01', name: '% consultas cerradas en SLA', category: 'quality', formula: 'consultas en SLA / total consultas', target: '≥ 90%', currentValue: '87%', frequency: 'Semanal', owner: 'Coordinador OT', leadingOrLagging: 'lagging', relatedNodeIds: [n12.id] }),
    makeMetric({ code: 'QLT-02', name: '% consultas reabiertas', category: 'quality', formula: 'reabiertas / cerradas', target: '≤ 5%', currentValue: '4%', frequency: 'Mensual', owner: 'Jefe de Proyecto' }),
    makeMetric({ code: 'TIM-01', name: 'Tiempo promedio de respuesta', category: 'time', formula: 'Σ tiempos de respuesta / nº consultas', target: '≤ 48 h', currentValue: '41 h', frequency: 'Semanal', owner: 'Coordinador OT' }),
    makeMetric({ code: 'QLT-03', name: '% consultas con evidencia completa', category: 'quality', formula: 'con evidencia / total', target: '100%', currentValue: '94%', frequency: 'Semanal', owner: 'Documentalista CDE', relatedNodeIds: [n11.id], relatedMetricIds: [] }),
    makeMetric({ code: 'CO-01', name: 'Impacto en cronograma / costo', category: 'cost', formula: 'Σ desviación por consultas / línea base', target: '≤ 2%', currentValue: '1.3%', frequency: 'Mensual', owner: 'Jefe de Proyecto', leadingOrLagging: 'lagging' }),
  ];
  // causal links
  metrics[0].relatedMetricIds = [metrics[1].id, metrics[5].id];
  metrics[4].relatedMetricIds = [metrics[1].id];

  const risks = [
    makeRisk({ name: 'Consulta sin evidencia documental', probability: 3, impact: 4, mitigation: 'Validación obligatoria de adjuntos antes de registrar; automatización que solicita evidencia.', trigger: 'Registro sin adjunto', owner: 'Documentalista CDE', relatedNodeIds: [n4.id, riskEv.id] }),
    makeRisk({ name: 'Respuesta fuera de SLA', probability: 3, impact: 4, mitigation: 'Alerta automática a las 48 h y escalamiento al Jefe de Proyecto.', trigger: 'SLA > 48 h', owner: 'Coordinador OT', relatedNodeIds: [n8.id] }),
    makeRisk({ name: 'Cambio no formalizado (impacto oculto)', probability: 2, impact: 5, mitigation: 'Regla de derivación a RFI/SDI cuando impacta costo o plazo.', owner: 'Jefe de Proyecto', relatedNodeIds: [d3.id] }),
    makeRisk({ name: 'Pérdida de trazabilidad', probability: 2, impact: 4, mitigation: 'CDE único como fuente de verdad y numeración correlativa.', owner: 'Documentalista CDE' }),
  ];

  const automations = [
    makeAutomation({ name: 'Crear registro en CDE desde formulario', trigger: 'Nueva consulta en formulario de campo', action: 'Crear ficha de consulta en CDE con numeración correlativa', inputData: 'Formulario de campo (texto + fotos)', outputData: 'Registro CDE creado', tools: ['ACC / BIM 360', 'n8n'], humanInTheLoop: false, estimatedImpact: '−60% tiempo de registro', relatedNodeIds: [n4.id] }),
    makeAutomation({ name: 'Solicitar evidencia faltante', trigger: 'Consulta sin adjunto', action: 'Enviar solicitud automática de evidencia al emisor', inputData: 'Consulta sin adjunto', outputData: 'Solicitud enviada', humanInTheLoop: false, relatedNodeIds: [n4.id] }),
    makeAutomation({ name: 'Alerta de SLA y escalamiento', trigger: 'SLA > 48 h sin respuesta', action: 'Notificar al responsable y escalar al Jefe de Proyecto', inputData: 'Estado de la consulta', outputData: 'Alerta + escalamiento', tools: ['Slack', 'Email'], humanInTheLoop: true, relatedNodeIds: [n8.id, autoSla.id] }),
    makeAutomation({ name: 'Generar evidencia PDF al cierre', trigger: 'Consulta cerrada', action: 'Generar PDF de trazabilidad y archivar en CDE', inputData: 'Hilo de la consulta', outputData: 'PDF de evidencia', humanInTheLoop: false, relatedNodeIds: [n11.id] }),
    makeAutomation({ name: 'Crear reunión ICE si es crítica', trigger: 'Consulta crítica detectada', action: 'Agendar sesión ICE con los involucrados', inputData: 'Consulta crítica', outputData: 'Reunión ICE agendada', tools: ['Google Calendar'], humanInTheLoop: true }),
  ];

  const documents = [
    makeDocument({ name: 'Planos RVT/DWG', type: 'Plano', format: 'RVT / DWG', repository: 'CDE / ACC', required: true, relatedNodeIds: [n3.id] }),
    makeDocument({ name: 'Especificaciones técnicas', type: 'Especificación', format: 'PDF', repository: 'CDE', required: true }),
    makeDocument({ name: 'Fotos de campo', type: 'Evidencia', format: 'JPG / PNG', repository: 'CDE móvil', relatedNodeIds: [n4.id] }),
    makeDocument({ name: 'Ficha de consulta', type: 'Registro', format: 'Form / PDF', repository: 'CDE', required: true, relatedNodeIds: [n4.id] }),
    makeDocument({ name: 'Respuesta técnica', type: 'Entregable', format: 'DOCX / PDF', repository: 'CDE', relatedNodeIds: [n9.id] }),
    makeDocument({ name: 'Evidencia de cierre', type: 'Evidencia', format: 'PDF', repository: 'CDE', required: true, relatedNodeIds: [n11.id] }),
  ];

  return {
    ...emptyProcess(),
    id: 'tpl_obra_example',
    title: 'Gestión de consultas técnicas en obra',
    description: 'Flujo de extremo a extremo desde que campo detecta una duda hasta el cierre con trazabilidad documental y métricas.',
    context:
      'En obra surgen dudas técnicas sobre planos y especificaciones. Sin un proceso claro, las consultas se pierden en chats, no quedan registradas en el CDE y las decisiones se demoran, afectando cronograma y costo.',
    objective: 'Reducir la latencia de resolución de consultas técnicas en obra y garantizar trazabilidad documental completa.',
    owner: 'Oficina Técnica / VDC',
    version: '1.0',
    maturityLevel: 'optimized',
    northStarMetric: '% de consultas cerradas en SLA con evidencia completa',
    tags: ['obra', 'RFI', 'CDE', 'BIM', 'VDC', 'trazabilidad'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lanes: [campo, ot, proy, cde, control],
    nodes,
    edges,
    metrics,
    risks,
    automations,
    documents,
    assumptions: ['El CDE (ACC/BIM 360) es la fuente única de verdad.', 'El equipo de campo dispone de app móvil con cámara.'],
    openQuestions: [
      '¿Quién aprueba formalmente los cambios con impacto en costo/plazo?',
      '¿Cuál es el SLA contractual con el cliente para consultas críticas?',
      '¿Se integra el CDE con el ERP para medir impacto de costo?',
    ],
    implementationChecklist: [
      makeChecklistItem('Definir numeración correlativa de consultas', 'Setup', true),
      makeChecklistItem('Configurar formulario de campo (texto + fotos)', 'Setup', true),
      makeChecklistItem('Crear plantilla de ficha de consulta en CDE', 'Setup'),
      makeChecklistItem('Definir matriz RACI por carril', 'Roles'),
      makeChecklistItem('Configurar alertas de SLA (48 h)', 'Automatización'),
      makeChecklistItem('Automatizar generación de PDF de evidencia', 'Automatización'),
      makeChecklistItem('Conectar dashboard de métricas', 'Métricas'),
      makeChecklistItem('Capacitar a campo y oficina técnica', 'Adopción'),
    ],
  };
}

/* helper to build a simple linear/branched flow quickly */
interface QuickNode {
  key: string;
  type?: Parameters<typeof makeNode>[0]['type'];
  title: string;
  lane: string;
  responsible?: string;
  code?: string;
  condition?: string;
  outputs?: string[];
  sla?: string;
}

function quickProcess(opts: {
  id: string;
  title: string;
  description: string;
  objective: string;
  context: string;
  owner: string;
  northStar: string;
  tags: string[];
  maturity: ProcessMap['maturityLevel'];
  lanes: { key: string; name: string; type: ProcessMap['lanes'][number]['type']; color: string; role?: string }[];
  nodes: QuickNode[];
  flow: [string, string, (Parameters<typeof makeEdge>[2])?][];
  metrics: ProcessMap['metrics'];
  risks: ProcessMap['risks'];
  automations: ProcessMap['automations'];
  documents: ProcessMap['documents'];
  assumptions: string[];
  openQuestions: string[];
  checklist: [string, string?][];
}): ProcessMap {
  const laneMap: Record<string, ReturnType<typeof makeLane>> = {};
  const lanes = opts.lanes.map((l) => {
    const lane = makeLane({ name: l.name, type: l.type, color: l.color, ownerRole: l.role });
    laneMap[l.key] = lane;
    return lane;
  });
  const nodeMap: Record<string, ReturnType<typeof makeNode>> = {};
  const nodes = opts.nodes.map((n) => {
    const node = makeNode({
      type: n.type ?? 'activity',
      title: n.title,
      code: n.code,
      laneId: laneMap[n.lane].id,
      responsible: n.responsible,
      condition: n.condition,
      outputs: n.outputs,
      sla: n.sla,
    });
    nodeMap[n.key] = node;
    return node;
  });
  const edges = opts.flow.map(([s, t, extra]) => makeEdge(nodeMap[s].id, nodeMap[t].id, extra));

  return {
    ...emptyProcess(),
    id: opts.id,
    title: opts.title,
    description: opts.description,
    objective: opts.objective,
    context: opts.context,
    owner: opts.owner,
    version: '1.0',
    maturityLevel: opts.maturity,
    northStarMetric: opts.northStar,
    tags: opts.tags,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lanes,
    nodes,
    edges,
    metrics: opts.metrics,
    risks: opts.risks,
    automations: opts.automations,
    documents: opts.documents,
    assumptions: opts.assumptions,
    openQuestions: opts.openQuestions,
    implementationChecklist: opts.checklist.map(([t, p]) => makeChecklistItem(t, p)),
  };
}

/* ============================================================
   B. Matriz VDC / VIA / ICE / PPM
   ============================================================ */
export function buildVDC(): ProcessMap {
  return quickProcess({
    id: 'tpl_vdc',
    title: 'Matriz VDC / VIA / ICE / PPM',
    description: 'Cadena causal de objetivos cliente → proyecto → producción → factores controlables, con sesiones ICE y publicación de modelos.',
    objective: 'Alinear producción con objetivos del cliente mediante factores controlables medibles y sesiones ICE.',
    context: 'Los proyectos VDC requieren conectar objetivos de negocio del cliente con factores controlables operativos. Sin esa cadena, las métricas no orientan decisiones.',
    owner: 'Líder VDC',
    northStar: 'Cumplimiento de objetivos del cliente (CO)',
    tags: ['VDC', 'VIA', 'ICE', 'PPM', 'métricas'],
    maturity: 'optimized',
    lanes: [
      { key: 'cli', name: 'Cliente (CO)', type: 'client', color: '#1E5CE8', role: 'Sponsor' },
      { key: 'pro', name: 'Proyecto (PO)', type: 'project', color: '#22D3EE', role: 'Project Manager' },
      { key: 'prod', name: 'Producción (OProd)', type: 'production', color: '#34D399', role: 'Jefe de Producción' },
      { key: 'fc', name: 'Factores controlables (FC)', type: 'control', color: '#F5A623', role: 'Líder VDC' },
    ],
    nodes: [
      { key: 's', type: 'start', title: 'Inicio de ciclo VDC', lane: 'cli' },
      { key: 'co', title: 'Definir objetivos del cliente', lane: 'cli', code: 'CO', responsible: 'Sponsor', outputs: ['Objetivos CO'] },
      { key: 'po', title: 'Definir objetivos del proyecto', lane: 'pro', code: 'PO', responsible: 'Project Manager', outputs: ['Objetivos PO'] },
      { key: 'oprod', title: 'Definir objetivos de producción', lane: 'prod', code: 'OProd', responsible: 'Jefe de Producción', outputs: ['Objetivos OProd'] },
      { key: 'fc', title: 'Definir factores controlables', lane: 'fc', code: 'FC', responsible: 'Líder VDC', outputs: ['Factores controlables'] },
      { key: 'ice', title: 'Ejecutar sesión ICE', lane: 'fc', code: 'ICE', responsible: 'Líder VDC', outputs: ['Decisiones ICE'], sla: 'Semanal' },
      { key: 'pub', title: 'Publicar modelo federado', lane: 'pro', code: 'OPV-01', responsible: 'BIM Manager', outputs: ['Modelo publicado'], sla: 'Semanal' },
      { key: 'clash', title: 'Clash detection', lane: 'pro', code: 'CLASH', responsible: 'BIM Coordinator', outputs: ['Interferencias'] },
      { key: 'dcrit', type: 'decision', title: '¿Interferencias críticas?', lane: 'pro', condition: 'Clash con impacto en obra', responsible: 'BIM Coordinator' },
      { key: 'task', title: 'Crear tarea asignada', lane: 'prod', responsible: 'Jefe de Producción', outputs: ['Tarea de resolución'] },
      { key: 'look', title: 'Lookahead y compromisos', lane: 'prod', code: 'PPM', responsible: 'Jefe de Producción', outputs: ['Plan lookahead'] },
      { key: 'audit', title: 'Auditoría / control', lane: 'fc', code: 'AUD', responsible: 'Líder VDC', outputs: ['Hallazgos'] },
      { key: 'e', type: 'end', title: 'Cierre de ciclo y reporte', lane: 'cli' },
    ],
    flow: [
      ['s', 'co'], ['co', 'po'], ['po', 'oprod'], ['oprod', 'fc'],
      ['fc', 'ice'], ['ice', 'pub'], ['pub', 'clash'], ['clash', 'dcrit'],
      ['dcrit', 'task', { type: 'decision_yes' }], ['dcrit', 'look', { type: 'decision_no' }],
      ['task', 'look'], ['look', 'audit'], ['audit', 'e'],
      ['fc', 'oprod', { type: 'metric_impact', strength: 0.7 }],
      ['oprod', 'po', { type: 'metric_impact', strength: 0.7 }],
      ['po', 'co', { type: 'metric_impact', strength: 0.7 }],
    ],
    metrics: [
      makeMetric({ code: 'FCI-01', name: 'Sesiones ICE ejecutadas', category: 'controllable_factor', formula: 'sesiones realizadas / sesiones programadas', target: '100%', currentValue: '92%', frequency: 'Semanal', owner: 'Líder VDC', leadingOrLagging: 'leading' }),
      makeMetric({ code: 'FCI-02', name: 'Agenda y pre-read 48 h antes', category: 'controllable_factor', formula: 'sesiones con agenda / sesiones programadas', target: '100%', currentValue: '85%', frequency: 'Semanal', owner: 'Líder VDC', leadingOrLagging: 'leading' }),
      makeMetric({ code: 'OPV-01', name: 'Modelo federado actualizado', category: 'production_objective', formula: 'semanas con modelo publicado / semanas programadas', target: '100%', currentValue: '90%', frequency: 'Semanal', owner: 'BIM Manager', leadingOrLagging: 'leading' }),
      makeMetric({ code: 'OPI-01', name: 'Latencia de decisiones', category: 'production_objective', formula: 'días promedio desde consulta hasta decisión', target: '≤ 3 días', currentValue: '3.2 días', frequency: 'Semanal', owner: 'Líder VDC', leadingOrLagging: 'lagging' }),
      makeMetric({ code: 'PO-01', name: 'Cumplimiento de hitos', category: 'project_objective', formula: 'hitos cumplidos en fecha / hitos planificados', target: '≥ 95%', currentValue: '93%', frequency: 'Mensual', owner: 'Project Manager', leadingOrLagging: 'lagging' }),
      makeMetric({ code: 'CO-01', name: 'Operabilidad técnica', category: 'client_objective', formula: 'sistemas críticos aptos para operación / total', target: '100%', currentValue: '96%', frequency: 'Por hito', owner: 'Sponsor', leadingOrLagging: 'lagging' }),
    ],
    risks: [
      makeRisk({ name: 'Sesiones ICE sin pre-read', probability: 3, impact: 3, mitigation: 'Bloquear agenda y enviar pre-read automático 48 h antes.', owner: 'Líder VDC' }),
      makeRisk({ name: 'Modelo federado desactualizado', probability: 3, impact: 4, mitigation: 'Publicación semanal obligatoria con checklist y alerta.', owner: 'BIM Manager' }),
      makeRisk({ name: 'Interferencias resueltas tarde', probability: 2, impact: 4, mitigation: 'Tareas asignadas con SLA y seguimiento en lookahead.', owner: 'Jefe de Producción' }),
    ],
    automations: [
      makeAutomation({ name: 'Pre-read automático ICE', trigger: '48 h antes de la sesión ICE', action: 'Enviar agenda y pre-read a participantes', inputData: 'Agenda + modelo', outputData: 'Pre-read enviado', humanInTheLoop: false }),
      makeAutomation({ name: 'Actualizar dashboard al publicar modelo', trigger: 'Modelo federado publicado', action: 'Refrescar KPIs del dashboard', inputData: 'Versión del modelo', outputData: 'Dashboard actualizado', humanInTheLoop: false }),
      makeAutomation({ name: 'Tarea por interferencia crítica', trigger: 'Clash crítico detectado', action: 'Crear tarea asignada al responsable', inputData: 'Reporte de clash', outputData: 'Tarea creada', humanInTheLoop: true }),
    ],
    documents: [
      makeDocument({ name: 'Modelo federado', type: 'Modelo', format: 'IFC / RVT', repository: 'CDE / ACC', required: true }),
      makeDocument({ name: 'Reporte de clash', type: 'Reporte', format: 'BCF / PDF', repository: 'CDE' }),
      makeDocument({ name: 'Acta ICE', type: 'Acta', format: 'PDF', repository: 'Drive', required: true }),
    ],
    assumptions: ['Existe una cadencia semanal de sesiones ICE.', 'El CDE está operativo.'],
    openQuestions: ['¿Qué factores controlables tienen mayor correlación con CO?', '¿Cómo se mide la operabilidad del cliente?'],
    checklist: [
      ['Definir matriz de objetivos CO/PO/OProd/FC', 'Setup'],
      ['Configurar cadencia ICE semanal', 'Operación'],
      ['Automatizar pre-read 48 h', 'Automatización'],
      ['Conectar dashboard causal de métricas', 'Métricas'],
    ],
  });
}

/* ============================================================
   C. Proceso comercial B2B
   ============================================================ */
export function buildComercial(): ProcessMap {
  return quickProcess({
    id: 'tpl_comercial',
    title: 'Proceso comercial B2B',
    description: 'Desde la captación del lead hasta la renovación, con métricas de conversión, ciclo de venta y LTV.',
    objective: 'Aumentar la tasa de conversión y reducir el ciclo de venta con un pipeline trazable.',
    context: 'El equipo comercial gestiona oportunidades en hojas de cálculo dispersas; faltan etapas claras, responsables y métricas de conversión.',
    owner: 'Head of Sales',
    northStar: 'Ingresos recurrentes cerrados (ARR)',
    tags: ['comercial', 'B2B', 'pipeline', 'ventas'],
    maturity: 'current',
    lanes: [
      { key: 'lead', name: 'Lead', type: 'commercial', color: '#1E5CE8', role: 'SDR' },
      { key: 'diag', name: 'Diagnóstico', type: 'commercial', color: '#22D3EE', role: 'Account Executive' },
      { key: 'prop', name: 'Propuesta', type: 'commercial', color: '#8B5CF6', role: 'Account Executive' },
      { key: 'neg', name: 'Negociación', type: 'commercial', color: '#F5A623', role: 'Sales Manager' },
      { key: 'cierre', name: 'Cierre', type: 'finance', color: '#34D399', role: 'Sales Manager' },
      { key: 'deliv', name: 'Delivery', type: 'operations', color: '#6A98FF', role: 'CS Manager' },
    ],
    nodes: [
      { key: 's', type: 'start', title: 'Lead captado', lane: 'lead' },
      { key: 'qual', title: 'Calificar lead (BANT)', lane: 'lead', code: 'QUAL', responsible: 'SDR', outputs: ['Lead calificado'], sla: '≤ 24 h' },
      { key: 'dq', type: 'decision', title: '¿Lead calificado?', lane: 'lead', condition: 'Presupuesto, autoridad, necesidad y plazo', responsible: 'SDR' },
      { key: 'nurt', title: 'Nutrir lead', lane: 'lead', responsible: 'Marketing', outputs: ['Secuencia de nurturing'] },
      { key: 'diag', title: 'Reunión de diagnóstico', lane: 'diag', code: 'DIAG', responsible: 'Account Executive', outputs: ['Necesidades mapeadas'], sla: '≤ 5 días' },
      { key: 'prop', title: 'Elaborar propuesta', lane: 'prop', code: 'PROP', responsible: 'Account Executive', outputs: ['Propuesta enviada'], sla: '≤ 3 días' },
      { key: 'neg', title: 'Negociación', lane: 'neg', code: 'NEG', responsible: 'Sales Manager', outputs: ['Términos acordados'] },
      { key: 'dwin', type: 'decision', title: '¿Se gana el deal?', lane: 'neg', condition: 'Acuerdo en precio y alcance', responsible: 'Sales Manager' },
      { key: 'lost', type: 'end', title: 'Perdido (registrar motivo)', lane: 'neg' },
      { key: 'contract', type: 'approval', title: 'Contrato firmado', lane: 'cierre', code: 'WIN', responsible: 'Sales Manager', outputs: ['Contrato'] },
      { key: 'onb', title: 'Onboarding', lane: 'deliv', code: 'ONB', responsible: 'CS Manager', outputs: ['Cliente activado'], sla: '≤ 7 días' },
      { key: 'deliv', title: 'Delivery del servicio', lane: 'deliv', responsible: 'CS Manager', outputs: ['Valor entregado'] },
      { key: 'e', type: 'end', title: 'Renovación / expansión', lane: 'deliv' },
    ],
    flow: [
      ['s', 'qual'], ['qual', 'dq'],
      ['dq', 'diag', { type: 'decision_yes' }], ['dq', 'nurt', { type: 'decision_no' }],
      ['nurt', 'qual', { type: 'feedback' }],
      ['diag', 'prop'], ['prop', 'neg'], ['neg', 'dwin'],
      ['dwin', 'contract', { type: 'decision_yes' }], ['dwin', 'lost', { type: 'decision_no' }],
      ['contract', 'onb'], ['onb', 'deliv'], ['deliv', 'e'],
    ],
    metrics: [
      makeMetric({ code: 'CMR-01', name: 'Tasa de conversión', category: 'business', formula: 'deals ganados / oportunidades', target: '≥ 25%', currentValue: '21%', frequency: 'Mensual', owner: 'Head of Sales', leadingOrLagging: 'lagging' }),
      makeMetric({ code: 'CMR-02', name: 'Ciclo de venta', category: 'time', formula: 'días promedio lead → cierre', target: '≤ 45 días', currentValue: '52 días', frequency: 'Mensual', owner: 'Sales Manager' }),
      makeMetric({ code: 'CMR-03', name: 'Ticket promedio', category: 'business', formula: 'ingresos / deals ganados', target: '≥ USD 12k', currentValue: 'USD 10.5k', frequency: 'Mensual', owner: 'Head of Sales' }),
      makeMetric({ code: 'CMR-04', name: 'CAC', category: 'cost', formula: 'inversión comercial / nuevos clientes', target: '≤ USD 2k', currentValue: 'USD 2.4k', frequency: 'Mensual', owner: 'Head of Sales' }),
      makeMetric({ code: 'CMR-05', name: 'LTV', category: 'business', formula: 'ticket × duración × margen', target: '≥ USD 40k', currentValue: 'USD 36k', frequency: 'Trimestral', owner: 'CS Manager' }),
    ],
    risks: [
      makeRisk({ name: 'Leads mal calificados', probability: 3, impact: 3, mitigation: 'Checklist BANT obligatorio y scoring automático.', owner: 'SDR' }),
      makeRisk({ name: 'Propuestas genéricas', probability: 3, impact: 3, mitigation: 'Plantillas por industria y revisión por Sales Manager.', owner: 'Account Executive' }),
      makeRisk({ name: 'Fuga en handoff a delivery', probability: 2, impact: 4, mitigation: 'Onboarding con SLA y reunión de traspaso.', owner: 'CS Manager' }),
    ],
    automations: [
      makeAutomation({ name: 'Scoring automático de leads', trigger: 'Nuevo lead en CRM', action: 'Calcular score y asignar a SDR', inputData: 'Datos del lead', outputData: 'Lead priorizado', humanInTheLoop: false }),
      makeAutomation({ name: 'Secuencia de onboarding', trigger: 'Contrato firmado', action: 'Disparar secuencia de onboarding del cliente', inputData: 'Datos del cliente', outputData: 'Onboarding iniciado', humanInTheLoop: false }),
      makeAutomation({ name: 'Alerta de deal estancado', trigger: 'Deal sin actividad 10 días', action: 'Notificar al AE y Sales Manager', inputData: 'Estado del deal', outputData: 'Alerta', humanInTheLoop: true }),
    ],
    documents: [
      makeDocument({ name: 'Propuesta comercial', type: 'Propuesta', format: 'PDF', repository: 'CRM', required: true }),
      makeDocument({ name: 'Contrato', type: 'Contrato', format: 'PDF', repository: 'Legal/Drive', required: true }),
    ],
    assumptions: ['Existe un CRM como fuente única.', 'El margen objetivo está definido.'],
    openQuestions: ['¿Cuál es el ICP exacto?', '¿Qué define un lead crítico para priorización?'],
    checklist: [
      ['Definir etapas y criterios de avance', 'Setup'],
      ['Configurar scoring de leads', 'Automatización'],
      ['Estandarizar plantillas de propuesta', 'Operación'],
      ['Conectar dashboard de pipeline', 'Métricas'],
    ],
  });
}

/* ============================================================
   D. Coordinación académica (AECODE)
   ============================================================ */
export function buildAcademico(): ProcessMap {
  return quickProcess({
    id: 'tpl_academico',
    title: 'Coordinación académica AECODE',
    description: 'Del diseño de programa a la certificación y retención, con comunidad, soporte y métricas de adopción.',
    objective: 'Lanzar y operar programas con alta finalización y satisfacción, midiendo adopción y retención.',
    context: 'La coordinación académica gestiona programas con instructores externos; faltan estándares de validación de temario, producción y soporte.',
    owner: 'Coordinación Académica',
    northStar: 'Tasa de finalización con satisfacción ≥ 4.5/5',
    tags: ['académico', 'AECODE', 'comunidad', 'educación'],
    maturity: 'current',
    lanes: [
      { key: 'com', name: 'Comunidad', type: 'support', color: '#1E5CE8', role: 'Community Manager' },
      { key: 'coord', name: 'Coordinación Académica', type: 'operations', color: '#22D3EE', role: 'Coordinador' },
      { key: 'inst', name: 'Instructor', type: 'support', color: '#8B5CF6', role: 'Instructor' },
      { key: 'prod', name: 'Producto', type: 'production', color: '#34D399', role: 'Diseñador instruccional' },
      { key: 'sop', name: 'Soporte', type: 'support', color: '#F5A623', role: 'Soporte' },
    ],
    nodes: [
      { key: 's', type: 'start', title: 'Necesidad formativa detectada', lane: 'com' },
      { key: 'design', title: 'Diseñar programa', lane: 'coord', code: 'ACA-01', responsible: 'Coordinador', outputs: ['Programa propuesto'] },
      { key: 'val', type: 'decision', title: '¿Temario validado?', lane: 'coord', condition: 'Cumple objetivos de aprendizaje y nivel', responsible: 'Coordinador' },
      { key: 'inst', title: 'Asignar instructor', lane: 'inst', code: 'ACA-02', responsible: 'Coordinador', outputs: ['Instructor confirmado'] },
      { key: 'mat', title: 'Producir materiales', lane: 'prod', code: 'ACA-03', responsible: 'Diseñador instruccional', outputs: ['Materiales listos'], sla: '≤ 2 semanas' },
      { key: 'launch', title: 'Lanzamiento', lane: 'com', code: 'ACA-04', responsible: 'Community Manager', outputs: ['Cohorte abierta'] },
      { key: 'community', title: 'Activar comunidad', lane: 'com', responsible: 'Community Manager', outputs: ['Comunidad activa'] },
      { key: 'support', title: 'Soporte a estudiantes', lane: 'sop', responsible: 'Soporte', outputs: ['Tickets resueltos'], sla: '≤ 24 h' },
      { key: 'eval', title: 'Evaluación', lane: 'coord', code: 'ACA-05', responsible: 'Instructor', outputs: ['Resultados de evaluación'] },
      { key: 'cert', type: 'approval', title: 'Certificación', lane: 'coord', responsible: 'Coordinador', outputs: ['Certificados emitidos'] },
      { key: 'e', type: 'end', title: 'Retención / siguiente nivel', lane: 'com' },
    ],
    flow: [
      ['s', 'design'], ['design', 'val'],
      ['val', 'inst', { type: 'decision_yes' }], ['val', 'design', { type: 'decision_no', label: 'Ajustar' }],
      ['inst', 'mat'], ['mat', 'launch'], ['launch', 'community'],
      ['community', 'support'], ['support', 'eval'], ['eval', 'cert'], ['cert', 'e'],
    ],
    metrics: [
      makeMetric({ code: 'ACA-M1', name: 'Tasa de finalización', category: 'adoption', formula: 'estudiantes que finalizan / inscritos', target: '≥ 70%', currentValue: '62%', frequency: 'Por cohorte', owner: 'Coordinador', leadingOrLagging: 'lagging' }),
      makeMetric({ code: 'ACA-M2', name: 'Satisfacción (NPS/CSAT)', category: 'quality', formula: 'promedio de valoración', target: '≥ 4.5/5', currentValue: '4.3/5', frequency: 'Por cohorte', owner: 'Coordinador' }),
      makeMetric({ code: 'ACA-M3', name: 'Tiempo de respuesta de soporte', category: 'time', formula: 'horas promedio de primera respuesta', target: '≤ 24 h', currentValue: '18 h', frequency: 'Semanal', owner: 'Soporte' }),
      makeMetric({ code: 'ACA-M4', name: 'Retención al siguiente nivel', category: 'business', formula: 'reinscritos / certificados', target: '≥ 35%', currentValue: '28%', frequency: 'Por cohorte', owner: 'Community Manager' }),
    ],
    risks: [
      makeRisk({ name: 'Temario no validado a tiempo', probability: 3, impact: 3, mitigation: 'Checklist de validación y deadline previo a producción.', owner: 'Coordinador' }),
      makeRisk({ name: 'Baja participación en comunidad', probability: 3, impact: 3, mitigation: 'Plan de activación y rituales semanales.', owner: 'Community Manager' }),
      makeRisk({ name: 'Materiales tardíos', probability: 2, impact: 4, mitigation: 'Plantillas reutilizables y buffer de 1 semana.', owner: 'Diseñador instruccional' }),
    ],
    automations: [
      makeAutomation({ name: 'Secuencia onboarding al inscribirse', trigger: 'Alumno inscrito', action: 'Enviar bienvenida y accesos', inputData: 'Datos del alumno', outputData: 'Onboarding enviado', humanInTheLoop: false }),
      makeAutomation({ name: 'Recordatorio de avance', trigger: 'Inactividad 5 días', action: 'Enviar recordatorio personalizado', inputData: 'Progreso del alumno', outputData: 'Recordatorio enviado', humanInTheLoop: false }),
      makeAutomation({ name: 'Emisión automática de certificado', trigger: 'Evaluación aprobada', action: 'Generar y enviar certificado', inputData: 'Resultados', outputData: 'Certificado emitido', humanInTheLoop: false }),
    ],
    documents: [
      makeDocument({ name: 'Temario validado', type: 'Documento', format: 'PDF', repository: 'Drive', required: true }),
      makeDocument({ name: 'Materiales del curso', type: 'Material', format: 'PDF / Video', repository: 'LMS', required: true }),
      makeDocument({ name: 'Certificado', type: 'Certificado', format: 'PDF', repository: 'LMS' }),
    ],
    assumptions: ['Existe un LMS operativo.', 'Los instructores firman acuerdos de calidad.'],
    openQuestions: ['¿Cuál es el criterio mínimo de aprobación?', '¿Qué define una cohorte exitosa?'],
    checklist: [
      ['Definir checklist de validación de temario', 'Setup'],
      ['Estandarizar plantillas de materiales', 'Producción'],
      ['Configurar automatización de certificados', 'Automatización'],
      ['Conectar dashboard de cohortes', 'Métricas'],
    ],
  });
}

/* ============================================================
   E. Gestión de sponsors / eventos
   ============================================================ */
export function buildEventos(): ProcessMap {
  return quickProcess({
    id: 'tpl_eventos',
    title: 'Gestión de sponsors / eventos',
    description: 'De la segmentación a la renovación, con activaciones antes/durante/después y reporte de valor.',
    objective: 'Cerrar sponsors y maximizar el valor entregado para asegurar renovación.',
    context: 'La gestión de sponsors es reactiva; faltan etapas de prospección, activación y reporte de valor que sustenten renovaciones.',
    owner: 'Partnerships',
    northStar: 'Tasa de renovación de sponsors',
    tags: ['sponsors', 'eventos', 'partnerships'],
    maturity: 'current',
    lanes: [
      { key: 'pros', name: 'Prospección', type: 'commercial', color: '#1E5CE8', role: 'Partnerships' },
      { key: 'cont', name: 'Contacto', type: 'commercial', color: '#22D3EE', role: 'Partnerships' },
      { key: 'prop', name: 'Propuesta', type: 'commercial', color: '#8B5CF6', role: 'Partnerships Lead' },
      { key: 'neg', name: 'Negociación', type: 'finance', color: '#F5A623', role: 'Partnerships Lead' },
      { key: 'act', name: 'Activación', type: 'operations', color: '#34D399', role: 'Event Manager' },
      { key: 'rep', name: 'Reporte', type: 'control', color: '#6A98FF', role: 'Partnerships' },
    ],
    nodes: [
      { key: 's', type: 'start', title: 'Pipeline de sponsors', lane: 'pros' },
      { key: 'seg', title: 'Segmentar prospectos', lane: 'pros', code: 'SP-01', responsible: 'Partnerships', outputs: ['Lista segmentada'] },
      { key: 'contact', title: 'Contactar', lane: 'cont', code: 'SP-02', responsible: 'Partnerships', outputs: ['Reunión agendada'], sla: '≤ 3 días' },
      { key: 'meet', title: 'Reunión', lane: 'cont', responsible: 'Partnerships', outputs: ['Necesidades del sponsor'] },
      { key: 'prop', title: 'Propuesta de patrocinio', lane: 'prop', code: 'SP-03', responsible: 'Partnerships Lead', outputs: ['Propuesta enviada'] },
      { key: 'neg', title: 'Negociación', lane: 'neg', code: 'SP-04', responsible: 'Partnerships Lead', outputs: ['Términos acordados'] },
      { key: 'dwin', type: 'decision', title: '¿Sponsor cerrado?', lane: 'neg', condition: 'Acuerdo firmado', responsible: 'Partnerships Lead' },
      { key: 'lost', type: 'end', title: 'No cerrado (registrar motivo)', lane: 'neg' },
      { key: 'before', title: 'Activación antes', lane: 'act', responsible: 'Event Manager', outputs: ['Plan de activación'] },
      { key: 'during', title: 'Activación durante', lane: 'act', responsible: 'Event Manager', outputs: ['Activación ejecutada'] },
      { key: 'after', title: 'Activación después', lane: 'act', responsible: 'Event Manager', outputs: ['Seguimiento'] },
      { key: 'report', title: 'Reporte de valor', lane: 'rep', code: 'SP-05', responsible: 'Partnerships', outputs: ['Reporte de ROI'] },
      { key: 'e', type: 'end', title: 'Renovación', lane: 'rep' },
    ],
    flow: [
      ['s', 'seg'], ['seg', 'contact'], ['contact', 'meet'], ['meet', 'prop'], ['prop', 'neg'], ['neg', 'dwin'],
      ['dwin', 'before', { type: 'decision_yes' }], ['dwin', 'lost', { type: 'decision_no' }],
      ['before', 'during'], ['during', 'after'], ['after', 'report'], ['report', 'e'],
    ],
    metrics: [
      makeMetric({ code: 'SP-M1', name: 'Tasa de cierre de sponsors', category: 'business', formula: 'sponsors cerrados / contactados', target: '≥ 20%', currentValue: '17%', frequency: 'Por evento', owner: 'Partnerships Lead' }),
      makeMetric({ code: 'SP-M2', name: 'Valor de patrocinio promedio', category: 'business', formula: 'ingresos sponsors / sponsors', target: '≥ USD 8k', currentValue: 'USD 7k', frequency: 'Por evento', owner: 'Partnerships' }),
      makeMetric({ code: 'SP-M3', name: 'Tasa de renovación', category: 'adoption', formula: 'sponsors renovados / sponsors elegibles', target: '≥ 50%', currentValue: '42%', frequency: 'Anual', owner: 'Partnerships Lead', leadingOrLagging: 'lagging' }),
    ],
    risks: [
      makeRisk({ name: 'Activación sin evidencia de valor', probability: 3, impact: 4, mitigation: 'Plantilla de reporte de ROI con métricas y fotos.', owner: 'Event Manager' }),
      makeRisk({ name: 'Sponsor sin seguimiento post-evento', probability: 3, impact: 3, mitigation: 'Calendario automático de activaciones y follow-up.', owner: 'Partnerships' }),
    ],
    automations: [
      makeAutomation({ name: 'Calendario de activaciones al cierre', trigger: 'Sponsor cerrado', action: 'Crear calendario de activaciones antes/durante/después', inputData: 'Acuerdo del sponsor', outputData: 'Calendario creado', humanInTheLoop: false }),
      makeAutomation({ name: 'Reporte de valor automático', trigger: 'Evento finalizado', action: 'Compilar métricas y generar reporte de ROI', inputData: 'Datos del evento', outputData: 'Reporte de valor', humanInTheLoop: true }),
    ],
    documents: [
      makeDocument({ name: 'Propuesta de patrocinio', type: 'Propuesta', format: 'PDF', repository: 'Drive', required: true }),
      makeDocument({ name: 'Reporte de valor / ROI', type: 'Reporte', format: 'PDF', repository: 'Drive', required: true }),
    ],
    assumptions: ['Existe un calendario de eventos definido.'],
    openQuestions: ['¿Qué paquetes de patrocinio se ofrecen?', '¿Cómo se mide el ROI para el sponsor?'],
    checklist: [
      ['Definir paquetes de patrocinio', 'Setup'],
      ['Crear plantilla de reporte de valor', 'Operación'],
      ['Automatizar calendario de activaciones', 'Automatización'],
    ],
  });
}

/* ============================================================
   F. Automatización administrativa
   ============================================================ */
export function buildAdmin(): ProcessMap {
  return quickProcess({
    id: 'tpl_admin',
    title: 'Automatización administrativa',
    description: 'Entrada, validación, registro, clasificación, aprobación, dashboard y archivo con alertas.',
    objective: 'Reducir trabajo manual y errores en procesos administrativos con validación y trazabilidad.',
    context: 'Los procesos administrativos dependen de correos y hojas de cálculo; hay reprocesos, errores y falta de trazabilidad.',
    owner: 'Administración',
    northStar: '% de trámites procesados sin reproceso',
    tags: ['administración', 'automatización', 'operaciones'],
    maturity: 'automatable',
    lanes: [
      { key: 'in', name: 'Entrada', type: 'operations', color: '#1E5CE8', role: 'Solicitante' },
      { key: 'val', name: 'Validación', type: 'control', color: '#22D3EE', role: 'Analista' },
      { key: 'reg', name: 'Registro / Clasificación', type: 'operations', color: '#34D399', role: 'Analista' },
      { key: 'apr', name: 'Aprobación', type: 'control', color: '#F5A623', role: 'Aprobador' },
      { key: 'rep', name: 'Reporte / Archivo', type: 'documentation', color: '#8B5CF6', role: 'Administración' },
    ],
    nodes: [
      { key: 's', type: 'start', title: 'Solicitud recibida', lane: 'in' },
      { key: 'intake', title: 'Capturar información', lane: 'in', code: 'AD-01', responsible: 'Solicitante', outputs: ['Datos capturados'] },
      { key: 'validate', title: 'Validar datos', lane: 'val', code: 'AD-02', responsible: 'Analista', outputs: ['Datos validados'], sla: '≤ 4 h' },
      { key: 'dvalid', type: 'decision', title: '¿Datos completos y válidos?', lane: 'val', condition: 'Cumple reglas de negocio', responsible: 'Analista' },
      { key: 'fix', title: 'Solicitar corrección', lane: 'in', responsible: 'Analista', outputs: ['Solicitud de corrección'] },
      { key: 'register', title: 'Registrar', lane: 'reg', code: 'AD-03', responsible: 'Analista', outputs: ['Registro creado'] },
      { key: 'classify', title: 'Clasificar', lane: 'reg', responsible: 'Analista', outputs: ['Categorizado'] },
      { key: 'approve', type: 'approval', title: 'Aprobar', lane: 'apr', code: 'AD-04', responsible: 'Aprobador', outputs: ['Aprobado'], sla: '≤ 1 día' },
      { key: 'dashboard', title: 'Actualizar dashboard', lane: 'rep', responsible: 'Administración', outputs: ['KPIs actualizados'] },
      { key: 'archive', title: 'Archivar', lane: 'rep', code: 'AD-05', responsible: 'Administración', outputs: ['Expediente archivado'] },
      { key: 'e', type: 'end', title: 'Cierre y reporte', lane: 'rep' },
    ],
    flow: [
      ['s', 'intake'], ['intake', 'validate'], ['validate', 'dvalid'],
      ['dvalid', 'register', { type: 'decision_yes' }], ['dvalid', 'fix', { type: 'decision_no' }],
      ['fix', 'intake', { type: 'feedback' }],
      ['register', 'classify'], ['classify', 'approve'], ['approve', 'dashboard'],
      ['dashboard', 'archive'], ['archive', 'e'],
    ],
    metrics: [
      makeMetric({ code: 'AD-M1', name: '% trámites sin reproceso', category: 'quality', formula: 'sin reproceso / total', target: '≥ 95%', currentValue: '88%', frequency: 'Semanal', owner: 'Administración' }),
      makeMetric({ code: 'AD-M2', name: 'Tiempo de ciclo', category: 'time', formula: 'horas promedio entrada → cierre', target: '≤ 24 h', currentValue: '30 h', frequency: 'Semanal', owner: 'Analista' }),
      makeMetric({ code: 'AD-M3', name: '% aprobaciones en SLA', category: 'time', formula: 'aprobaciones en SLA / total', target: '≥ 90%', currentValue: '84%', frequency: 'Semanal', owner: 'Aprobador' }),
    ],
    risks: [
      makeRisk({ name: 'Datos inválidos en captura', probability: 3, impact: 3, mitigation: 'Validación con reglas y formularios con campos obligatorios.', owner: 'Analista' }),
      makeRisk({ name: 'Aprobaciones cuello de botella', probability: 3, impact: 4, mitigation: 'Alertas de SLA y aprobadores suplentes.', owner: 'Aprobador' }),
    ],
    automations: [
      makeAutomation({ name: 'Validación automática de campos', trigger: 'Formulario enviado', action: 'Validar reglas y marcar inconsistencias', inputData: 'Datos del formulario', outputData: 'Resultado de validación', humanInTheLoop: false }),
      makeAutomation({ name: 'Alerta de aprobación pendiente', trigger: 'Aprobación pendiente > SLA', action: 'Notificar al aprobador y suplente', inputData: 'Estado del trámite', outputData: 'Alerta', humanInTheLoop: true }),
      makeAutomation({ name: 'Archivado y reporte automático', trigger: 'Trámite aprobado', action: 'Archivar expediente y actualizar dashboard', inputData: 'Expediente', outputData: 'Archivo + KPIs', humanInTheLoop: false }),
    ],
    documents: [
      makeDocument({ name: 'Formulario de solicitud', type: 'Formulario', format: 'Form', repository: 'Sistema', required: true }),
      makeDocument({ name: 'Expediente', type: 'Expediente', format: 'PDF', repository: 'Gestor documental', required: true }),
    ],
    assumptions: ['Existe un gestor documental.', 'Las reglas de negocio están documentadas.'],
    openQuestions: ['¿Qué reglas determinan la clasificación?', '¿Quiénes son aprobadores suplentes?'],
    checklist: [
      ['Definir reglas de validación', 'Setup'],
      ['Configurar formulario con campos obligatorios', 'Setup'],
      ['Automatizar alertas de SLA', 'Automatización'],
      ['Conectar dashboard administrativo', 'Métricas'],
    ],
  });
}

/* ============================================================
   Generic fallback
   ============================================================ */
export function buildGeneric(title = 'Proceso genérico', description = '', input = ''): ProcessMap {
  const inlane = makeLane({ name: 'Entrada', type: 'operations', color: '#1E5CE8', ownerRole: 'Solicitante' });
  const analysis = makeLane({ name: 'Análisis', type: 'control', color: '#22D3EE', ownerRole: 'Analista' });
  const exec = makeLane({ name: 'Ejecución', type: 'production', color: '#34D399', ownerRole: 'Ejecutor' });
  const val = makeLane({ name: 'Validación / Cierre', type: 'documentation', color: '#F5A623', ownerRole: 'Responsable' });

  const s = makeNode({ type: 'start', title: 'Inicio', laneId: inlane.id });
  const intake = makeNode({ type: 'activity', code: 'GEN-01', title: 'Recibir entrada', laneId: inlane.id, responsible: 'Solicitante', inputs: ['Solicitud'], outputs: ['Caso registrado'] });
  const analyze = makeNode({ type: 'activity', code: 'GEN-02', title: 'Analizar', laneId: analysis.id, responsible: 'Analista', outputs: ['Análisis'], sla: '≤ 1 día' });
  const decision = makeNode({ type: 'decision', code: 'D1', title: '¿Procede?', laneId: analysis.id, condition: 'Cumple criterios de aceptación', responsible: 'Analista' });
  const reject = makeNode({ type: 'end', title: 'No procede (registrar motivo)', laneId: analysis.id });
  const execute = makeNode({ type: 'activity', code: 'GEN-03', title: 'Ejecutar', laneId: exec.id, responsible: 'Ejecutor', outputs: ['Resultado'], sla: '≤ 3 días' });
  const validate = makeNode({ type: 'activity', code: 'GEN-04', title: 'Validar', laneId: val.id, responsible: 'Responsable', outputs: ['Validado'] });
  const evidence = makeNode({ type: 'evidence', title: 'Evidencia', laneId: val.id, documents: ['Evidencia'] });
  const close = makeNode({ type: 'end', code: 'CIERRE', title: 'Cierre', laneId: val.id });

  const nodes = [s, intake, analyze, decision, reject, execute, validate, evidence, close];
  const edges = [
    makeEdge(s.id, intake.id),
    makeEdge(intake.id, analyze.id),
    makeEdge(analyze.id, decision.id),
    makeEdge(decision.id, execute.id, { type: 'decision_yes' }),
    makeEdge(decision.id, reject.id, { type: 'decision_no' }),
    makeEdge(execute.id, validate.id),
    makeEdge(validate.id, evidence.id, { type: 'evidence' }),
    makeEdge(validate.id, close.id),
  ];

  return {
    ...emptyProcess(),
    id: 'gen_' + Date.now().toString(36),
    title,
    description: description || 'Proceso genérico generado a partir de tu idea.',
    context: input ? `Idea original: ${input}` : 'Proceso base de 6 etapas: entrada, análisis, decisión, ejecución, validación y cierre.',
    objective: 'Estructurar el flujo en etapas claras con responsables, decisiones y evidencia.',
    owner: 'Responsable del proceso',
    version: '1.0',
    maturityLevel: 'idea',
    northStarMetric: '% de casos cerrados correctamente',
    tags: ['genérico', 'proceso'],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    lanes: [inlane, analysis, exec, val],
    nodes,
    edges,
    metrics: [
      makeMetric({ code: 'GEN-M1', name: 'Tiempo de ciclo', category: 'time', formula: 'horas promedio inicio → cierre', target: '≤ 48 h', frequency: 'Semanal', owner: 'Responsable' }),
      makeMetric({ code: 'GEN-M2', name: '% casos cerrados correctamente', category: 'quality', formula: 'cerrados sin reapertura / total', target: '≥ 90%', frequency: 'Semanal', owner: 'Responsable' }),
    ],
    risks: [
      makeRisk({ name: 'Entradas incompletas', probability: 3, impact: 3, mitigation: 'Formulario con campos obligatorios y validación.', owner: 'Analista' }),
    ],
    automations: [
      makeAutomation({ name: 'Registrar entrada automáticamente', trigger: 'Nueva solicitud', action: 'Crear caso y notificar', inputData: 'Solicitud', outputData: 'Caso creado', humanInTheLoop: false }),
    ],
    documents: [makeDocument({ name: 'Evidencia de cierre', type: 'Evidencia', format: 'PDF', repository: 'Repositorio', required: true })],
    assumptions: ['Marca aquí los supuestos detectados.'],
    openQuestions: ['¿Quién es el responsable de cada etapa?', '¿Qué define la aceptación del caso?', '¿Qué métricas son críticas?'],
    implementationChecklist: [
      makeChecklistItem('Definir responsables por etapa', 'Roles'),
      makeChecklistItem('Definir criterios de la decisión', 'Lógica'),
      makeChecklistItem('Definir documentos y evidencia', 'Documentación'),
      makeChecklistItem('Definir métricas y dashboard', 'Métricas'),
    ],
  };
}

/* ============================================================
   G. Coordinación de equipo / proyecto (flujo de coordinación)
   ============================================================ */
export function buildCoordinacion(): ProcessMap {
  return quickProcess({
    id: 'tpl_coordinacion',
    title: 'Coordinación de equipo / proyecto',
    description: 'Flujo de coordinación: desde una solicitud o acuerdo hasta su ejecución, seguimiento y cierre con responsables y SLA.',
    objective: 'Reducir bloqueos y demoras en la coordinación entre áreas con responsables, decisiones y seguimiento claros.',
    context: 'Las coordinaciones se gestionan por chat y reuniones sin un flujo claro: se pierden acuerdos, no hay responsables únicos y el seguimiento es manual.',
    owner: 'PMO / Coordinación',
    northStar: '% de acuerdos cerrados en plazo',
    tags: ['coordinación', 'flujo de trabajo', 'equipo', 'seguimiento'],
    maturity: 'optimized',
    lanes: [
      { key: 'sol', name: 'Solicitante', type: 'operations', color: '#1E5CE8', role: 'Solicitante' },
      { key: 'coord', name: 'Coordinación / PMO', type: 'control', color: '#22D3EE', role: 'Coordinador' },
      { key: 'resp', name: 'Área responsable', type: 'production', color: '#34D399', role: 'Responsable' },
      { key: 'aprob', name: 'Aprobación', type: 'control', color: '#F5A623', role: 'Aprobador' },
      { key: 'seg', name: 'Seguimiento', type: 'documentation', color: '#8B5CF6', role: 'PMO' },
    ],
    nodes: [
      { key: 's', type: 'start', title: 'Solicitud / acuerdo', lane: 'sol' },
      { key: 'intake', title: 'Registrar solicitud', lane: 'sol', code: 'COORD-01', responsible: 'Solicitante', outputs: ['Solicitud registrada'] },
      { key: 'triage', title: 'Triage y priorización', lane: 'coord', code: 'COORD-02', responsible: 'Coordinador', outputs: ['Prioridad asignada'], sla: '≤ 8 h' },
      { key: 'dvalid', type: 'decision', title: '¿Información completa?', lane: 'coord', condition: 'Tiene contexto, objetivo y responsable propuesto', responsible: 'Coordinador' },
      { key: 'back', type: 'handoff', title: 'Solicitar completar', lane: 'sol', responsible: 'Coordinador', outputs: ['Solicitud de info'] },
      { key: 'assign', title: 'Asignar responsable', lane: 'coord', code: 'COORD-03', responsible: 'Coordinador', outputs: ['Responsable asignado'] },
      { key: 'exec', title: 'Ejecutar tarea', lane: 'resp', code: 'COORD-04', responsible: 'Responsable', outputs: ['Entregable'], sla: '≤ 3 días' },
      { key: 'dimpact', type: 'decision', title: '¿Requiere aprobación?', lane: 'resp', condition: 'Impacta presupuesto, alcance o plazo', responsible: 'Responsable' },
      { key: 'approve', type: 'approval', title: 'Aprobar', lane: 'aprob', code: 'COORD-05', responsible: 'Aprobador', outputs: ['Aprobado'], sla: '≤ 1 día' },
      { key: 'track', title: 'Registrar avance', lane: 'seg', code: 'COORD-06', responsible: 'PMO', outputs: ['Estado actualizado'] },
      { key: 'evidence', type: 'evidence', title: 'Evidencia y acuerdos', lane: 'seg', outputs: ['Acta / evidencia'] },
      { key: 'e', type: 'end', title: 'Cierre y comunicación', lane: 'seg' },
    ],
    flow: [
      ['s', 'intake'], ['intake', 'triage'], ['triage', 'dvalid'],
      ['dvalid', 'assign', { type: 'decision_yes' }], ['dvalid', 'back', { type: 'decision_no' }],
      ['back', 'intake', { type: 'feedback' }],
      ['assign', 'exec'], ['exec', 'dimpact'],
      ['dimpact', 'approve', { type: 'decision_yes' }], ['dimpact', 'track', { type: 'decision_no' }],
      ['approve', 'track'], ['track', 'evidence', { type: 'evidence' }], ['track', 'e'],
    ],
    metrics: [
      makeMetric({ code: 'CO-M1', name: '% acuerdos cerrados en plazo', category: 'time', formula: 'cerrados en SLA / total', target: '≥ 90%', currentValue: '82%', frequency: 'Semanal', owner: 'PMO', leadingOrLagging: 'lagging' }),
      makeMetric({ code: 'CO-M2', name: 'Tiempo de coordinación', category: 'time', formula: 'horas promedio solicitud → cierre', target: '≤ 48 h', currentValue: '60 h', frequency: 'Semanal', owner: 'Coordinador' }),
      makeMetric({ code: 'CO-M3', name: 'Bloqueos abiertos', category: 'quality', formula: 'tareas bloqueadas / activas', target: '≤ 10%', currentValue: '15%', frequency: 'Semanal', owner: 'PMO' }),
      makeMetric({ code: 'CO-M4', name: '% con responsable único', category: 'quality', formula: 'con responsable / total', target: '100%', currentValue: '94%', frequency: 'Semanal', owner: 'Coordinador' }),
    ],
    risks: [
      makeRisk({ name: 'Acuerdos sin responsable', probability: 3, impact: 4, mitigation: 'Validación obligatoria de responsable antes de asignar.', trigger: 'Solicitud sin responsable', owner: 'Coordinador' }),
      makeRisk({ name: 'Seguimiento manual disperso', probability: 3, impact: 3, mitigation: 'Tablero único de estado y recordatorios automáticos.', owner: 'PMO' }),
      makeRisk({ name: 'Aprobaciones cuello de botella', probability: 2, impact: 4, mitigation: 'Alerta de SLA y aprobador suplente.', owner: 'Aprobador' }),
    ],
    automations: [
      makeAutomation({ name: 'Crear tarea desde solicitud', trigger: 'Nueva solicitud en formulario', action: 'Crear tarea con responsable y SLA en el tablero', inputData: 'Formulario de solicitud', outputData: 'Tarea creada', tools: ['n8n', 'Notion'], humanInTheLoop: false, estimatedImpact: '−50% tiempo de registro' }),
      makeAutomation({ name: 'Recordatorio de SLA', trigger: 'Tarea próxima a vencer', action: 'Notificar al responsable y al PMO', inputData: 'Estado de la tarea', outputData: 'Recordatorio', tools: ['Slack', 'Email'], humanInTheLoop: false }),
      makeAutomation({ name: 'Acta automática al cierre', trigger: 'Tarea cerrada', action: 'Generar acta/evidencia y archivar', inputData: 'Hilo de la tarea', outputData: 'Acta PDF', humanInTheLoop: false }),
    ],
    documents: [
      makeDocument({ name: 'Formulario de solicitud', type: 'Formulario', format: 'Form', repository: 'Notion / Sheets', required: true }),
      makeDocument({ name: 'Tablero de estado', type: 'Tablero', format: 'Notion / Sheets', repository: 'Workspace', required: true }),
      makeDocument({ name: 'Acta / evidencia', type: 'Evidencia', format: 'PDF', repository: 'Drive', required: true }),
    ],
    assumptions: ['Existe un tablero único (Notion/Sheets) como fuente de verdad.'],
    openQuestions: ['¿Quién aprueba cambios de alcance/presupuesto?', '¿Qué SLA aplica por tipo de solicitud?'],
    checklist: [
      ['Definir formulario de solicitud', 'Setup'],
      ['Definir matriz RACI por área', 'Roles'],
      ['Configurar recordatorios de SLA', 'Automatización'],
      ['Conectar tablero y dashboard', 'Métricas'],
    ],
  });
}

export const templates: ProcessTemplate[] = [
  { id: 'tpl_coordinacion', name: 'Coordinación de equipo / proyecto', description: 'Flujo de coordinación de extremo a extremo con responsables y SLA.', kind: 'custom', icon: 'Users', build: buildCoordinacion },
  { id: 'tpl_obra_example', name: 'Consultas técnicas en obra', description: 'RFI/CDE de extremo a extremo con trazabilidad y métricas.', kind: 'obra', icon: 'HardHat', build: buildObra },
  { id: 'tpl_vdc', name: 'Matriz VDC / VIA / ICE / PPM', description: 'Cadena causal de objetivos y factores controlables.', kind: 'bim_via', icon: 'Network', build: buildVDC },
  { id: 'tpl_comercial', name: 'Proceso comercial B2B', description: 'Pipeline de lead a renovación con métricas.', kind: 'comercial', icon: 'TrendingUp', build: buildComercial },
  { id: 'tpl_academico', name: 'Coordinación académica AECODE', description: 'De diseño de programa a certificación y retención.', kind: 'academico', icon: 'GraduationCap', build: buildAcademico },
  { id: 'tpl_eventos', name: 'Sponsors / eventos', description: 'De prospección a renovación con activaciones.', kind: 'evento', icon: 'CalendarHeart', build: buildEventos },
  { id: 'tpl_admin', name: 'Automatización administrativa', description: 'Entrada, validación, aprobación y archivo.', kind: 'administracion', icon: 'FileCog', build: buildAdmin },
];

export function getTemplateById(id: string): ProcessTemplate | undefined {
  return templates.find((t) => t.id === id);
}
