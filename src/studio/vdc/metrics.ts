import type {
  DataQuality,
  MetricData,
  ObservationData,
  ProductionData,
  VdcEntity,
} from "./types";
import { entitiesOf } from "./types";

export interface MetricResult {
  metricId: string;
  current: number | null;
  previous: number | null;
  delta: number | null;
  target: number;
  comparison: MetricData["comparison"];
  unit: string;
  status: "en_meta" | "fuera_meta" | "sin_dato";
  quality: DataQuality;
  coverage: string;
  period: string;
}

export function calculateMetric(
  metric: MetricData,
  observations: ObservationData[],
): MetricResult {
  const ordered = [...observations].sort((left, right) =>
    left.period.localeCompare(right.period),
  );
  const latest = ordered[ordered.length - 1];
  const previous = ordered[ordered.length - 2];
  function observationValue(observation: ObservationData | undefined) {
    if (!observation || observation.quality === "SIN_DATO") return null;
    if (
      observation.numerator !== undefined ||
      observation.denominator !== undefined
    ) {
      const { numerator, denominator } = observation;
      if (
        !Number.isFinite(numerator) ||
        !Number.isFinite(denominator) ||
        !denominator ||
        denominator <= 0
      )
        return null;
      return (numerator! / denominator) * (metric.unit === "%" ? 100 : 1);
    }
    return Number.isFinite(observation.value) ? observation.value : null;
  }
  const current = observationValue(latest);
  const previousValue = observationValue(previous);
  const comparable = Boolean(
    previous &&
      latest &&
      previous.coverage === latest.coverage &&
      previous.quality === latest.quality,
  );
  const target = latest?.targetAtCut ?? metric.target;
  const compare = latest?.comparisonAtCut ?? metric.comparison;
  const meetsTarget =
    current === null
      ? false
      : compare === "gte"
        ? current >= target
        : current <= target;
  return {
    metricId: metric.code,
    current,
    previous: previousValue,
    delta:
      current === null || previousValue === null || !comparable
        ? null
        : current - previousValue,
    target,
    comparison: compare,
    unit: metric.unit,
    status:
      current === null ? "sin_dato" : meetsTarget ? "en_meta" : "fuera_meta",
    quality: latest?.quality ?? "SIN_DATO",
    coverage: latest?.coverage ?? "sin datos",
    period: latest?.period ?? "sin corte",
  };
}

export interface ProductionResult {
  throughputPerDay: number | null;
  littleLawCycleDays: number | null;
  flowConsistency: "compatible" | "revisar" | "sin_dato";
  capacityUtilization: number | null;
  constraint: "capacidad" | "carga" | "sin_dato";
  limitations: string[];
}

/**
 * Uses observed accepted output and a time-windowed WIP average. It never derives WIP
 * from diagram nodes. Little's Law is presented only when all inputs share a boundary.
 */
export function calculateProduction(data: ProductionData): ProductionResult {
  const limitations: string[] = [];
  const throughput =
    data.acceptedOutput !== null &&
    data.workingDays !== null &&
    data.workingDays > 0
      ? data.acceptedOutput / data.workingDays
      : null;
  if (throughput === null)
    limitations.push("Falta salida aceptada o días hábiles del mismo corte.");
  const littleCycle =
    data.wipAverage !== null && throughput !== null && throughput > 0
      ? data.wipAverage / throughput
      : null;
  if (littleCycle === null)
    limitations.push(
      "Falta WIP promedio compatible para aplicar la Ley de Little.",
    );
  const consistency =
    littleCycle !== null && data.cycleTimeDays !== null
      ? Math.abs(littleCycle - data.cycleTimeDays) <=
        Math.max(0.25, data.cycleTimeDays * 0.2)
        ? "compatible"
        : "revisar"
      : "sin_dato";
  const utilization =
    data.loadPerDay !== null &&
    data.capacityPerDay !== null &&
    data.capacityPerDay > 0
      ? data.loadPerDay / data.capacityPerDay
      : null;
  const constraint =
    utilization === null
      ? "sin_dato"
      : utilization >= 0.95
        ? "capacidad"
        : "carga";
  if (data.quality !== "OBSERVADO")
    limitations.push("Este corte no contiene datos observados completos.");
  return {
    throughputPerDay: throughput,
    littleLawCycleDays: littleCycle,
    flowConsistency: consistency,
    capacityUtilization: utilization,
    constraint,
    limitations,
  };
}

export function metricResults(
  entities: VdcEntity[],
): Array<{ metric: MetricData; result: MetricResult }> {
  const observations = entitiesOf<ObservationData>(entities, "vdc-observation");
  return entitiesOf<MetricData>(entities, "vdc-metric").map((entity) => ({
    metric: entity.data,
    result: calculateMetric(
      entity.data,
      observations
        .filter((observation) => observation.data.metricId === entity.id)
        .map((observation) => observation.data),
    ),
  }));
}
