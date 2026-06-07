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
