import type { StepMetricBinding } from "./types";

/**
 * Catálogo para medir una actividad. La fórmula indica qué registrar.
 * No se deriva ni completa una observación si el equipo no entregó su fuente.
 */
export type MetricCategory =
  | "flujo"
  | "tiempo"
  | "calidad"
  | "variabilidad"
  | "confiabilidad"
  | "capacidad"
  | "coordinación"
  | "tecnología"
  | "propia";
export type ProcessMetric = {
  code: string;
  label: string;
  category: MetricCategory;
  unit: string;
  direction: "higher" | "lower" | "target";
  formula: string;
  inputs: string;
  definition: string;
  period: string;
};
export const processMetrics: ProcessMetric[] = [
  {
    code: "throughput",
    label: "Salida aceptada",
    category: "flujo",
    unit: "unidades/periodo",
    direction: "higher",
    formula: "unidades aceptadas ÷ periodo",
    inputs: "unidades aceptadas, periodo",
    definition: "Entregables que cumplieron el criterio de aceptación.",
    period: "día o semana",
  },
  {
    code: "wip",
    label: "Trabajo en curso",
    category: "flujo",
    unit: "unidades",
    direction: "lower",
    formula: "conteo de unidades iniciadas y no terminadas",
    inputs: "unidades abiertas",
    definition: "Inventario de trabajo entre inicio y aceptación.",
    period: "corte",
  },
  {
    code: "flow-efficiency",
    label: "Eficiencia de flujo",
    category: "flujo",
    unit: "%",
    direction: "higher",
    formula: "tiempo de toque ÷ tiempo de flujo × 100",
    inputs: "tiempo de toque, tiempo de flujo",
    definition: "Proporción de tiempo con trabajo que agrega valor.",
    period: "muestra o semana",
  },
  {
    code: "cycle-time",
    label: "Tiempo de ciclo",
    category: "tiempo",
    unit: "h/unidad",
    direction: "lower",
    formula: "fin de actividad − inicio de actividad",
    inputs: "marca de inicio, marca de fin",
    definition: "Duración de ejecución de una unidad.",
    period: "unidad o corte",
  },
  {
    code: "lead-time",
    label: "Tiempo de flujo",
    category: "tiempo",
    unit: "días/unidad",
    direction: "lower",
    formula: "aceptación − solicitud liberada",
    inputs: "solicitud liberada, aceptación",
    definition: "Tiempo total que una unidad permanece en el sistema.",
    period: "unidad o semana",
  },
  {
    code: "first-pass-yield",
    label: "Conformidad a la primera",
    category: "calidad",
    unit: "%",
    direction: "higher",
    formula: "unidades aceptadas sin reproceso ÷ unidades revisadas × 100",
    inputs: "aceptadas sin reproceso, revisadas",
    definition: "Calidad del resultado antes de corregirlo.",
    period: "lote o semana",
  },
  {
    code: "rework-rate",
    label: "Tasa de reproceso",
    category: "calidad",
    unit: "%",
    direction: "lower",
    formula: "unidades con reproceso ÷ unidades terminadas × 100",
    inputs: "unidades con reproceso, terminadas",
    definition: "Proporción de resultados que vuelven a trabajo.",
    period: "lote o semana",
  },
  {
    code: "cycle-variation",
    label: "Variación de ciclo",
    category: "variabilidad",
    unit: "%",
    direction: "lower",
    formula: "desviación estándar del ciclo ÷ ciclo promedio × 100",
    inputs: "muestra de tiempos de ciclo",
    definition: "Dispersión relativa del tiempo de ciclo.",
    period: "semana o lote",
  },
  {
    code: "ppc",
    label: "PPC",
    category: "confiabilidad",
    unit: "%",
    direction: "higher",
    formula: "compromisos cumplidos ÷ compromisos prometidos × 100",
    inputs: "cumplidos, prometidos",
    definition: "Porcentaje de compromisos completados como se prometieron.",
    period: "semana",
  },
  {
    code: "constraint-release",
    label: "Restricciones liberadas",
    category: "confiabilidad",
    unit: "%",
    direction: "higher",
    formula:
      "restricciones resueltas a tiempo ÷ restricciones detectadas × 100",
    inputs: "resueltas a tiempo, detectadas",
    definition: "Confiabilidad de la preparación del trabajo.",
    period: "semana",
  },
  {
    code: "capacity-load",
    label: "Carga sobre capacidad",
    category: "capacidad",
    unit: "%",
    direction: "target",
    formula: "carga requerida ÷ capacidad disponible × 100",
    inputs: "carga, capacidad",
    definition: "Uso de capacidad contra el rango acordado.",
    period: "día o semana",
  },
  {
    code: "utilization",
    label: "Utilización del recurso",
    category: "capacidad",
    unit: "%",
    direction: "target",
    formula: "tiempo productivo ÷ tiempo disponible × 100",
    inputs: "tiempo productivo, tiempo disponible",
    definition: "Tiempo ocupado por trabajo productivo del recurso.",
    period: "turno o semana",
  },
  {
    code: "ice-decision-latency",
    label: "Latencia de decisión ICE",
    category: "coordinación",
    unit: "h",
    direction: "lower",
    formula: "decisión registrada − asunto listo para decisión",
    inputs: "marca asunto listo, marca decisión",
    definition: "Tiempo para resolver un asunto preparado en ICE.",
    period: "sesión",
  },
  {
    code: "ice-action-closure",
    label: "Acciones ICE verificadas",
    category: "coordinación",
    unit: "%",
    direction: "higher",
    formula: "acciones verificadas en fecha ÷ acciones comprometidas × 100",
    inputs: "verificadas en fecha, comprometidas",
    definition: "Cierre verificable de acuerdos ICE.",
    period: "semana",
  },
  {
    code: "ice-resolution",
    label: "Asuntos ICE resueltos",
    category: "coordinación",
    unit: "%",
    direction: "higher",
    formula: "asuntos resueltos ÷ asuntos tratados × 100",
    inputs: "asuntos resueltos, asuntos tratados",
    definition: "Resolución dentro de una sesión ICE.",
    period: "sesión",
  },
  {
    code: "digital-adoption",
    label: "Adopción de tecnología",
    category: "tecnología",
    unit: "%",
    direction: "higher",
    formula:
      "ejecuciones con evidencia en el sistema ÷ ejecuciones aplicables × 100",
    inputs: "ejecuciones con evidencia, aplicables",
    definition: "Uso trazable de la tecnología acordada.",
    period: "semana o mes",
  },
  {
    code: "automation-success",
    label: "Automatización exitosa",
    category: "tecnología",
    unit: "%",
    direction: "higher",
    formula:
      "ejecuciones automatizadas sin intervención ÷ ejecuciones automatizadas × 100",
    inputs: "ejecuciones exitosas, automatizadas",
    definition: "Confiabilidad de una automatización en alcance.",
    period: "semana",
  },
];
export const metricByCode = (code: string) =>
  processMetrics.find((metric) => metric.code === code);

/** Unifica una métrica de catálogo y una métrica propia persistida en el paso. */
export function metricForBinding(
  binding: StepMetricBinding,
): ProcessMetric | undefined {
  const known = metricByCode(binding.code || binding.id || "");
  if (known) return known;
  const definition = binding.definition;
  if (!definition) return undefined;
  return {
    code: binding.code || "custom:" + definition.id,
    label: definition.name || "Métrica propia",
    category: "propia",
    unit: definition.unit,
    direction: definition.direction,
    formula: definition.formula || "Fórmula por definir",
    inputs: "Entradas por definir con el equipo",
    definition: "Métrica propia del proceso.",
    period: "Corte por definir",
  };
}
