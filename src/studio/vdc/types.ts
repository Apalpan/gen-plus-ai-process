export type VdcLevel = "CO" | "PO" | "ProdO" | "FC";
export type EvidenceStatus =
  | "HIPOTESIS"
  | "EN_PRUEBA"
  | "RESPALDADA"
  | "NO_RESPALDADA";
export type DataQuality =
  | "OBSERVADO"
  | "ESTIMADO"
  | "SUPUESTO"
  | "DATO_DEMO"
  | "SIN_DATO";

/** Generic persisted entity shared by VDC, ICEBOT and the process editor. */
export interface VdcEntity {
  id: string;
  kind: string;
  data: Record<string, unknown>;
  rev: number;
}

export interface ObjectiveData {
  code: string;
  title: string;
  level: VdcLevel;
  lane?: "VIA/BIM" | "ICE" | "PPM";
  owner: string;
  target: string;
  baseline?: string;
  horizon: string;
  acceptance: string;
  status: "en_riesgo" | "en_curso" | "cumplido" | "sin_linea_base";
}

export interface VdcLinkData {
  sourceId: string;
  targetId: string;
  reason: string;
  expectedDirection: "sube" | "baja" | "habilita";
  effectWindow: string;
  owner: string;
  evidenceStatus: EvidenceStatus;
  reviewDate: string;
  evidenceIds: string[];
}

export interface MetricData {
  code: string;
  objectiveId: string;
  label: string;
  formula: string;
  unit: string;
  target: number;
  comparison: "gte" | "lte";
  frequency: string;
  owner: string;
  source: string;
  actionThreshold: string;
}

export interface ObservationData {
  targetAtCut?: number;
  comparisonAtCut?: "gte" | "lte";
  metricId: string;
  period: string;
  value: number | null;
  numerator?: number;
  denominator?: number;
  sampleSize?: number;
  quality: DataQuality;
  coverage: "completo" | "parcial" | "derivado";
  source: string;
  capturedAt: string;
}

export interface FactorData {
  objectiveId: string;
  title: string;
  owner: string;
  cadence: string;
  effortHours: number;
  expectedImpact: number | null;
  impactUnit: string;
  completed: boolean;
  evidenceIds: string[];
}

export interface ProductionData {
  boundary: string;
  unit: string;
  period: string;
  wipAverage: number | null;
  acceptedOutput: number | null;
  workingDays: number | null;
  cycleTimeDays: number | null;
  capacityPerDay: number | null;
  loadPerDay: number | null;
  quality: DataQuality;
  source: string;
}

export interface IceSessionData {
  title: string;
  scheduledAt: string;
  preReadDueAt: string;
  objectiveIds: string[];
  status: "preparacion" | "en_sesion" | "revision" | "cerrada";
  source: string;
}

export interface IceDecisionData {
  sessionId: string;
  title: string;
  objectiveIds: string[];
  factorIds: string[];
  owner: string;
  dueDate: string;
  status: "registrado" | "aceptado" | "ejecutado" | "verificado";
  evidenceIds: string[];
  sourceRef: string;
}

export const entityData = <T>(entity: VdcEntity): T => entity.data as T;
export const entitiesOf = <T>(
  entities: VdcEntity[],
  kind: string,
): Array<VdcEntity & { data: T }> =>
  entities.filter((entity) => entity.kind === kind) as Array<
    VdcEntity & { data: T }
  >;
