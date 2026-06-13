/**
 * GEN+ AI Process — Domain model
 * A robust, implementation-ready schema for conversational process mapping.
 */

export type LaneType =
  | 'client'
  | 'project'
  | 'production'
  | 'control'
  | 'support'
  | 'documentation'
  | 'ai'
  | 'commercial'
  | 'finance'
  | 'operations'
  | 'custom';

export type NodeType =
  | 'start'
  | 'end'
  | 'activity'
  | 'decision'
  | 'document'
  | 'system'
  | 'metric'
  | 'risk'
  | 'automation'
  | 'approval'
  | 'handoff'
  | 'evidence'
  | 'queue' // cola / WIP — el trabajo se acumula y espera
  | 'buffer'; // amortigua variabilidad (tiempo, capacidad o inventario)

export type EdgeType =
  | 'sequence'
  | 'decision_yes'
  | 'decision_no'
  | 'dependency'
  | 'evidence'
  | 'feedback'
  | 'automation'
  | 'metric_impact';

export type MetricCategory =
  | 'client_objective'
  | 'project_objective'
  | 'production_objective'
  | 'controllable_factor'
  | 'business'
  | 'quality'
  | 'time'
  | 'cost'
  | 'adoption'
  | 'risk';

export type NodeStatus = 'draft' | 'active' | 'blocked' | 'done' | 'review';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type MaturityLevel = 'idea' | 'current' | 'optimized' | 'automatable';
export type LeadingLagging = 'leading' | 'lagging';

/** Lifecycle of a mapped process inside the production system. */
export type ProcessStatus =
  | 'borrador'
  | 'mapeado'
  | 'medido'
  | 'optimizado'
  | 'en_implementacion'
  | 'implementado'
  | 'mejora_continua';

export interface XY {
  x: number;
  y: number;
}

export interface Lane {
  id: string;
  name: string;
  type: LaneType;
  color: string;
  description?: string;
  ownerRole?: string;
}

export interface ProcessNodeData {
  id: string;
  type: NodeType;
  code?: string;
  title: string;
  description?: string;
  laneId: string;
  responsible?: string;
  accountable?: string;
  consulted?: string[];
  informed?: string[];
  inputs?: string[];
  outputs?: string[];
  tools?: string[];
  documents?: string[];
  estimatedDuration?: string;
  sla?: string;
  status?: NodeStatus;
  priority?: Priority;
  condition?: string; // for decision nodes
  evidence?: string;
  /* Production Science (Operations Science / PPI) fields */
  touchTime?: string; // tiempo de trabajo real (ej. "2 h")
  waitTime?: string; // tiempo de espera / cola (ej. "1 día")
  wipLimit?: number; // límite de trabajo en proceso
  capacity?: string; // capacidad del recurso/estación (ej. "8/día")
  variabilityLevel?: 'baja' | 'media' | 'alta';
  batchSize?: number;
  metricIds?: string[];
  riskIds?: string[];
  automationIds?: string[];
  position: XY;
  metadata?: Record<string, string>;
}

export interface ProcessEdgeData {
  id: string;
  source: string;
  target: string;
  label?: string;
  condition?: string;
  type: EdgeType;
  strength?: number; // 0..1, used for metric_impact width
  animated?: boolean;
  description?: string;
}

export interface Metric {
  id: string;
  code: string;
  name: string;
  category: MetricCategory;
  formula: string;
  target: string;
  currentValue?: string;
  unit?: string;
  frequency?: string;
  owner?: string;
  dataSource?: string;
  relatedNodeIds?: string[];
  relatedMetricIds?: string[]; // causal graph edges
  leadingOrLagging?: LeadingLagging;
  interpretation?: string;
  decisionRule?: string;
}

export interface Risk {
  id: string;
  name: string;
  description?: string;
  probability: number; // 1..5
  impact: number; // 1..5
  severity?: number; // probability * impact (derived)
  mitigation: string;
  trigger?: string;
  owner?: string;
  relatedNodeIds?: string[];
}

export interface Automation {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  action: string;
  tools?: string[];
  inputData?: string;
  outputData?: string;
  humanInTheLoop?: boolean;
  estimatedImpact?: string;
  relatedNodeIds?: string[];
}

export interface ProcessDocument {
  id: string;
  name: string;
  type?: string;
  format?: string;
  owner?: string;
  repository?: string;
  relatedNodeIds?: string[];
  required?: boolean;
  template?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  phase?: string;
}

export interface AIAgentRecommendation {
  id: string;
  name: string;
  role: string;
  objective: string;
  inputs?: string[];
  outputs?: string[];
  tools?: string[];
  autonomyLevel: 'asistido' | 'supervisado' | 'autonomo';
  supervisor?: string;
  kpi?: string;
  relatedNodeIds?: string[];
}

export interface RoadmapItem {
  id: string;
  timeframe: '30' | '60' | '90';
  title: string;
  description?: string;
  priority: 'alta' | 'media' | 'baja';
  impact: 'alto' | 'medio' | 'bajo';
  effort: 'alto' | 'medio' | 'bajo';
  owner?: string;
  status: 'pendiente' | 'en_curso' | 'hecho';
}

export interface ProcessMap {
  id: string;
  title: string;
  description: string;
  context?: string;
  objective: string;
  owner?: string;
  version: string;
  maturityLevel: MaturityLevel;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  northStarMetric?: string;
  /* Production-system fields (optional for backward compatibility) */
  area?: string;
  involvedAreas?: string[];
  status?: ProcessStatus;
  problem?: string;
  expectedResult?: string;
  favorite?: boolean;
  currentStateSummary?: string;
  futureStateSummary?: string;
  agents?: AIAgentRecommendation[];
  roadmap?: RoadmapItem[];
  unitOfFlow?: string; // qué fluye por el sistema (RFI, consulta, plano, lote…)
  industry?: string;
  lanes: Lane[];
  nodes: ProcessNodeData[];
  edges: ProcessEdgeData[];
  metrics: Metric[];
  risks: Risk[];
  automations: Automation[];
  documents: ProcessDocument[];
  assumptions: string[];
  openQuestions: string[];
  implementationChecklist: ChecklistItem[];
}

/* ---- AI prompt / generation contracts ---- */

export type ProcessKind =
  | 'obra'
  | 'bim_via'
  | 'ice'
  | 'ppm'
  | 'comercial'
  | 'operaciones'
  | 'finanzas'
  | 'marketing'
  | 'academico'
  | 'administracion'
  | 'evento'
  | 'soporte'
  | 'producto'
  | 'custom';

export type DetailLevel = 'ejecutivo' | 'operativo' | 'tecnico' | 'implementacion';

export type OutputFormat =
  | 'swimlane'
  | 'bpmn'
  | 'metricas'
  | 'roadmap'
  | 'checklist'
  | 'todo';

export interface ProcessPrompt {
  input: string;
  kind: ProcessKind | 'auto';
  detail: DetailLevel;
  format: OutputFormat;
  maturity: MaturityLevel;
  /* Capture-step fields (Paso 1) */
  name?: string;
  area?: string;
  involvedAreas?: string[];
  problem?: string;
  expectedResult?: string;
}

/* ---- Health check ---- */

export type HealthSeverity = 'pass' | 'warn' | 'fail';

export interface HealthCheckItem {
  id: string;
  label: string;
  severity: HealthSeverity;
  detail: string;
  weight: number;
}

export interface HealthReport {
  score: number; // 0..100
  band: 'weak' | 'incomplete' | 'implementable' | 'hardened';
  bandLabel: string;
  items: HealthCheckItem[];
}

/* ---- AI First analysis ---- */

export type AIFirstAction =
  | 'mantener_humano'
  | 'agente_ia'
  | 'automatizar'
  | 'simplificar'
  | 'eliminar';

export interface NodeClassification {
  nodeId: string;
  title: string;
  action: AIFirstAction;
  reason: string;
}

export interface AIFirstReport {
  score: number; // 0..100
  bandLabel: string;
  diagnosis: string;
  recommendation: string;
  nextStep: string;
  automationPotential: number; // 0..100
  classifications: NodeClassification[];
  improvements: string[];
  quickWins: string[];
  hiddenRisks: string[];
  agents: AIAgentRecommendation[];
  automations: Automation[];
  roadmap: RoadmapItem[];
  currentSummary: string[];
  futureSummary: string[];
}

/* ---- Production Science (PPI / Operations Science) ---- */

export interface ProductionLever {
  lever: 'process_design' | 'product_design' | 'variability' | 'wip' | 'capacity';
  label: string;
  question: string;
  finding: string;
}

export interface ProductionReport {
  score: number; // 0..100 — Production Science Score
  bandLabel: string;
  cycleTime: string; // CT total (touch + wait) en horas
  touchTime: string;
  waitTime: string;
  flowEfficiency: number; // 0..100 (touch / (touch+wait))
  wip: number; // estaciones de trabajo en proceso
  throughput: string; // TH ≈ WIP / CT (Little's Law), unidades/día
  unitOfFlow: string;
  bottleneck?: { nodeId: string; title: string; reason: string };
  handoffs: number;
  queues: number;
  levers: ProductionLever[];
  insights: string[];
  dataCompleteness: number; // 0..100 — % de pasos con touch/wait
}

/* ---- Flow validation (reglas pedagógicas AEC / Lean) ---- */

export interface FlowIssue {
  id: string;
  rule: string;
  severity: HealthSeverity;
  detail: string;
  fix: string;
  nodeId?: string;
}

export interface FlowValidationReport {
  score: number; // 0..100 — % de reglas que pasan
  passed: number;
  total: number;
  issues: FlowIssue[];
}
