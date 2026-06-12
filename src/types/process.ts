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
  | 'evidence';

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
