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
}

export interface EdgeData {
  source: string;
  target: string;
  label?: string;
  type?: string;
}

export const asStep = (entity: StudioEntity): StepData =>
  entity.data as unknown as StepData;
export const asEdge = (entity: StudioEntity): EdgeData =>
  entity.data as unknown as EdgeData;

export const entityId = (prefix: string) =>
  `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
