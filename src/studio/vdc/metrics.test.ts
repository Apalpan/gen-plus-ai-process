import { calculateMetric, calculateProduction } from "./metrics";
import { seedVdc } from "./seed";
import { validateVdcGraph } from "./validation";

function require(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runVdcFixtures(): void {
  const production = calculateProduction({
    boundary: "B",
    unit: "lote",
    period: "W48",
    wipAverage: 12,
    acceptedOutput: 20,
    workingDays: 5,
    cycleTimeDays: 3,
    capacityPerDay: 4,
    loadPerDay: 4.8,
    quality: "DATO_DEMO",
    source: "fixture",
  });
  require(production.throughputPerDay ===
    4, "Throughput observado debe ser 4 lotes/día.");
  require(production.littleLawCycleDays === 3, "Little debe producir 3 días.");
  require(production.constraint ===
    "capacidad", "La carga 4.8 / capacidad 4 debe marcar capacidad.");
  const ppc = calculateMetric(
    {
      code: "PPC",
      objectiveId: "p",
      label: "PPC",
      formula: "x",
      unit: "%",
      target: 85,
      comparison: "gte",
      frequency: "Semanal",
      owner: "Planner",
      source: "fixture",
      actionThreshold: "x",
    },
    [
      {
        metricId: "m",
        period: "W47",
        value: 62,
        quality: "DATO_DEMO",
        coverage: "completo",
        source: "fixture",
        capturedAt: "x",
      },
      {
        metricId: "m",
        period: "W48",
        value: 75,
        quality: "DATO_DEMO",
        coverage: "completo",
        source: "fixture",
        capturedAt: "x",
      },
    ],
  );
  require(ppc.delta === 13 &&
    ppc.status === "fuera_meta", "PPC debe conservar delta y meta.");
  const oneCut = calculateMetric(
    {
      code: "ONE",
      objectiveId: "p",
      label: "Uno",
      formula: "n/d",
      unit: "%",
      target: 70,
      comparison: "gte",
      frequency: "Semanal",
      owner: "Planner",
      source: "fixture",
      actionThreshold: "x",
    },
    [
      {
        metricId: "m",
        period: "W49",
        value: null,
        numerator: 7,
        denominator: 10,
        quality: "OBSERVADO",
        coverage: "completo",
        source: "fixture",
        capturedAt: "x",
      },
    ],
  );
  require(oneCut.current === 70 &&
    oneCut.delta === null &&
    oneCut.status ===
      "en_meta", "Un corte debe derivar numerador/denominador sin delta.");
  const incompatible = calculateMetric(
    {
      code: "INC",
      objectiveId: "p",
      label: "Incomp",
      formula: "x",
      unit: "%",
      target: 1,
      comparison: "gte",
      frequency: "Semanal",
      owner: "Planner",
      source: "fixture",
      actionThreshold: "x",
    },
    [
      {
        metricId: "m",
        period: "W47",
        value: 1,
        quality: "DATO_DEMO",
        coverage: "completo",
        source: "fixture",
        capturedAt: "x",
      },
      {
        metricId: "m",
        period: "W48",
        value: 2,
        quality: "OBSERVADO",
        coverage: "completo",
        source: "fixture",
        capturedAt: "x",
      },
    ],
  );
  require(incompatible.delta ===
    null, "Cortes de calidad distinta no deben producir delta comparable.");
  const invalid = seedVdc();
  invalid.push({
    id: "cycle",
    kind: "vdc-link",
    rev: 1,
    data: { sourceId: "co-operacion", targetId: "prodo-ice" },
  });
  require(validateVdcGraph(invalid).cycles.length ===
    1, "Debe detectar el ciclo causal.");
  require(validateVdcGraph(seedVdc()).cycles.length ===
    0, "El fixture base debe ser acíclico.");
}
