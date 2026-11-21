import type { StepData, StepMetricBinding } from "./types";
import { useState } from "react";
import { useStudio } from "../shared";
import { metricForBinding, processMetrics } from "./metricCatalog";
import "./stepMetrics.css";

const codeOf = (binding: StepMetricBinding) => binding.code || binding.id || "";
export function metricSummary(metrics?: StepMetricBinding[]) {
  if (!metrics?.length) return "Sin métricas seleccionadas";
  const names = metrics.slice(0, 2).map((binding) => {
    const metric = metricForBinding(binding);
    const value = binding.observed ?? binding.value;
    const label = metric?.label || codeOf(binding) || "Métrica propia";
    return value === null || value === undefined
      ? label + " · Sin dato"
      : label + " · " + value + " " + (binding.unit || metric?.unit || "");
  });
  return (
    names.join(" · ") + (metrics.length > 2 ? " +" + (metrics.length - 2) : "")
  );
}
export default function StepMetrics({
  data,
  onChange,
}: {
  data: StepData;
  onChange: (patch: Partial<StepData>) => void;
}) {
  const bindings = data.metrics || [];
  const { canEdit } = useStudio();
  const [expertDraft, setExpertDraft] = useState<string | null>(null);
  const selected = new Set(bindings.map(codeOf));
  const replace = (next: StepMetricBinding[]) => onChange({ metrics: next });
  const update = (code: string, patch: Partial<StepMetricBinding>) =>
    replace(
      bindings.map((binding) => {
        if (codeOf(binding) !== code) return binding;
        const next = { ...binding, ...patch };
        if (next.quality === "OBSERVADO" && !completeObservation(next))
          next.quality = "SIN_DATO";
        return next;
      }),
    );
  const addCustom = () => {
    const id = "custom_" + crypto.randomUUID();
    replace([
      ...bindings,
      {
        code: id,
        observed: null,
        target: null,
        quality: "SIN_DATO",
        definition: {
          id,
          name: "Métrica propia",
          unit: "",
          formula: "",
          direction: "target",
        },
      },
    ]);
  };
  return (
    <fieldset
      disabled={!canEdit}
      className="step-metrics"
      aria-label="Medición de la actividad"
    >
      <div className="step-metrics-head">
        <strong>Medición de la actividad</strong>
        <small>Registra fuente y periodo antes de interpretar.</small>
      </div>
      <label className="st-field">
        Especialistas participantes
        <input
          value={expertDraft ?? (data.experts || []).join(", ")}
          onChange={(event) => setExpertDraft(event.target.value)}
          onBlur={() => {
            if (expertDraft !== null)
              onChange({
                experts: [
                  ...new Set(
                    expertDraft
                      .split(",")
                      .map((v) => v.trim())
                      .filter(Boolean),
                  ),
                ],
              });
            setExpertDraft(null);
          }}
          placeholder="Ej. Producción, BIM, Calidad"
        />
      </label>
      <label className="st-field">
        Tecnología o sistema
        <input
          value={data.technology || ""}
          onChange={(event) =>
            onChange({ technology: event.target.value || undefined })
          }
          placeholder="Ej. Modelo BIM, formulario, equipo o agente"
        />
      </label>
      <div className="step-metric-picker">
        {processMetrics.map((metric) => (
          <label key={metric.code}>
            <input
              type="checkbox"
              checked={selected.has(metric.code)}
              onChange={(event) =>
                replace(
                  event.target.checked
                    ? [
                        ...bindings,
                        {
                          code: metric.code,
                          observed: null,
                          target: null,
                          quality: "SIN_DATO",
                        },
                      ]
                    : bindings.filter(
                        (binding) => codeOf(binding) !== metric.code,
                      ),
                )
              }
            />
            <span>{metric.label}</span>
            <small>{metric.category}</small>
          </label>
        ))}
      </div>
      <button type="button" className="btn-secondary" onClick={addCustom}>
        Añadir métrica propia
      </button>
      {bindings.map((binding) => {
        const code = codeOf(binding);
        const metric = metricForBinding(binding);
        if (!metric) return null;
        return (
          <article className="step-metric-detail" key={code}>
            <header>
              <strong>{metric.label}</strong>
              <small>
                {metric.unit} ·{" "}
                {metric.direction === "higher"
                  ? "mayor es mejor"
                  : metric.direction === "lower"
                    ? "menor es mejor"
                    : "rango acordado"}
              </small>
            </header>
            {binding.definition && (
              <label className="st-field">
                Nombre de la métrica propia
                <input
                  aria-label="Nombre de métrica propia"
                  value={binding.definition.name}
                  onChange={(event) =>
                    update(code, {
                      definition: {
                        ...binding.definition!,
                        name: event.target.value,
                      },
                    })
                  }
                />
              </label>
            )}
            {binding.definition && (
              <div className="step-metric-grid">
                <label>
                  Unidad
                  <input
                    aria-label="Unidad de métrica propia"
                    value={binding.definition.unit}
                    onChange={(event) =>
                      update(code, {
                        definition: {
                          ...binding.definition!,
                          unit: event.target.value,
                        },
                      })
                    }
                  />
                </label>
                <label>
                  Dirección
                  <select
                    aria-label="Dirección de métrica propia"
                    value={binding.definition.direction}
                    onChange={(event) =>
                      update(code, {
                        definition: {
                          ...binding.definition!,
                          direction: event.target.value as
                            "higher" | "lower" | "target",
                        },
                      })
                    }
                  >
                    <option value="higher">Mayor es mejor</option>
                    <option value="lower">Menor es mejor</option>
                    <option value="target">Rango acordado</option>
                  </select>
                </label>
              </div>
            )}
            {binding.definition && (
              <label className="st-field">
                Fórmula
                <input
                  aria-label="Fórmula de métrica propia"
                  value={binding.definition.formula}
                  onChange={(event) =>
                    update(code, {
                      definition: {
                        ...binding.definition!,
                        formula: event.target.value,
                      },
                    })
                  }
                  placeholder="Ej. aprobados ÷ revisados × 100"
                />
              </label>
            )}
            <p>{metric.formula}</p>
            <p className="step-metric-definition">{metric.definition}</p>
            <div className="step-metric-grid">
              <label>
                Observado
                <input
                  aria-label={`${metric.label} observado`}
                  type="number"
                  value={binding.observed ?? binding.value ?? ""}
                  onChange={(event) =>
                    update(code, {
                      observed:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                      value:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Meta
                <input
                  aria-label={`${metric.label} meta`}
                  type="number"
                  value={binding.target ?? ""}
                  onChange={(event) =>
                    update(code, {
                      target:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label>
                Periodo
                <input
                  aria-label={`${metric.label} periodo`}
                  value={binding.period || ""}
                  placeholder={metric.period}
                  onChange={(event) =>
                    update(code, { period: event.target.value || undefined })
                  }
                />
              </label>
              <label>
                Calidad
                <select
                  aria-label={`${metric.label} calidad`}
                  value={binding.quality || "SIN_DATO"}
                  onChange={(event) =>
                    update(code, {
                      quality: event.target
                        .value as StepMetricBinding["quality"],
                    })
                  }
                >
                  <option
                    value="OBSERVADO"
                    disabled={!completeObservation(binding)}
                  >
                    Observado
                  </option>
                  <option value="ESTIMADO">Estimado</option>
                  <option value="SUPUESTO">Supuesto</option>
                  <option value="DATO_DEMO">Dato demo</option>
                  <option value="SIN_DATO">Sin dato</option>
                </select>
              </label>
            </div>
            <label className="st-field">
              Fuente o evidencia
              <input
                aria-label={`${metric.label} fuente`}
                value={binding.source || ""}
                placeholder="Registro, acta, tablero o evidencia"
                onChange={(event) =>
                  update(code, { source: event.target.value || undefined })
                }
              />
            </label>
            <small>Entradas requeridas: {metric.inputs}.</small>
            {binding.definition && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  replace(bindings.filter((item) => codeOf(item) !== code))
                }
              >
                Quitar métrica propia
              </button>
            )}
          </article>
        );
      })}
    </fieldset>
  );
}

function completeObservation(binding: StepMetricBinding) {
  return (
    Number.isFinite(binding.observed ?? binding.value) &&
    Boolean(binding.period?.trim() && binding.source?.trim())
  );
}
