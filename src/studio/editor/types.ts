export type EntityKind =
  | "step"
  | "edge"
  | "lane"
  | "comment"
  | "group"
  | "vdc-objective"
  | "metric"
  | "factor"
  | "ice";

export interface StudioEntity {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  rev: number;
}

export interface StudioMutation {
  type: "upsert" | "remove";
  entity?: StudioEntity;
  id?: string;
  expectedRev?: number;
}

export interface EditorProps {
  entities: StudioEntity[];
  mutate: (operation: StudioMutation) => void | Promise<void>;
  selectedObjectiveId?: string | null;
  onSelectObjective?: (id: string | null) => void;
}

export type StepType =
  | "start"
  | "activity"
  | "decision"
  | "handoff"
  | "evidence"
  | "queue"
  | "buffer"
  | "end";

export interface StepData {
  title: string;
  laneId: string;
  owner?: string;
  type: StepType;
  x: number;
  y: number;
  objectiveId?: string;
  factorId?: string;
  status?: "draft" | "active" | "blocked" | "done";
  evidence?: string;
  groupId?: string;
  condition?: string;
  reworkTo?: string;
  controls?: { entry: string; exit: string; evidence: string };
  /**
   * A step keeps its operational measures with the process record. Older maps
   * do not need this field and continue to render normally.
   */
  metrics?: StepMetricBinding[];
  /** IDs de métricas preservados al importar un caso histórico. */
  metricIds?: string[];
  technology?: string;
  /** Persona o rol responsable de ejecutar o controlar la actividad. */
  person?: string;
  role?: string;
  /** Especialistas que participan. El dueño sigue siendo owner. */
  experts?: string[];
  /** Campos de la fuente histórica para trazabilidad e importación reversible. */
  legacy?: Record<string, unknown>;
}

export type MetricQuality =
  "OBSERVADO" | "ESTIMADO" | "SUPUESTO" | "DATO_DEMO" | "SIN_DATO";

export interface StepMetricBinding {
  /** code is current. id/value/unit retain maps drafted before this catalogue. */
  code?: string;
  id?: string;
  observed?: number | null;
  value?: number | null;
  unit?: string;
  target?: number | null;
  period?: string;
  source?: string;
  quality?: MetricQuality;
  /** Definición persistible de una métrica creada por el equipo. */
  definition?: {
    id: string;
    name: string;
    unit: string;
    formula: string;
    direction: "higher" | "lower" | "target";
  };
}

export interface EdgeData {
  source: string;
  target: string;
  label?: string;
  type?: "sequence" | "handoff" | "information" | "rework" | "dependency";
}

export const asStep = (entity: StudioEntity): StepData =>
  entity.data as unknown as StepData;
export const asEdge = (entity: StudioEntity): EdgeData =>
  entity.data as unknown as EdgeData;

export const entityId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
