import { useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  type NodeProps,
  type ReactFlowInstance,
} from "reactflow";
import { ArrowUpRight, Crosshair, Network } from "lucide-react";
import { useStudio, type Entity } from "../shared";
import { metricForBinding } from "../editor/metricCatalog";
import { calculateMetric } from "./metrics";
import type { MetricData, ObservationData } from "./types";
import { validateVdcGraph } from "./validation";

const columns = ["MET", "ACT", "FC", "ProdO", "PO", "CO"];
const titles = [
  "Métrica y evidencia",
  "Actividad y medición",
  "Factor controlable",
  "Objetivo de producción",
  "Objetivo del proyecto",
  "Objetivo del cliente",
];
const paths = [
  "#0f766e",
  "#1a759f",
  "#527e83",
  "#3366b6",
  "#765aae",
  "#af701b",
];
function measurementSummary(value: unknown) {
  if (!Array.isArray(value) || !value.length) return "Sin medición";
  return value
    .map((binding: any) => {
      const code = String(binding.code || binding.id || "métrica");
      const metric = metricForBinding(binding);
      const observed = binding.observed ?? binding.value;
      const unit = binding.unit || metric?.unit || "";
      return (
        (metric?.label || code) +
        (observed === null || observed === undefined
          ? " · sin valor"
          : " · " + observed + " " + unit)
      );
    })
    .join(" · ");
}
type Card = {
  title: string;
  level: string;
  detail: string;
  active: boolean;
  dim: boolean;
  relatedId?: string;
  stepId?: string;
  objectiveId?: string;
  relatedNodeIds?: string[];
};
function GraphCard({ data }: NodeProps<Card>) {
  const color = paths[columns.indexOf(data.level)] || paths[0];
  return (
    <div
      className={"rg-node" + (data.active ? " rg-active" : "")}
      style={{ borderLeftColor: color, opacity: data.dim ? 0.45 : 1 }}
    >
      <Handle type="target" position={Position.Left} />
      <small style={{ color }}>
        {data.level} · {titles[columns.indexOf(data.level)]}
      </small>
      <strong>{data.title}</strong>
      <span>{data.detail}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
const nodeTypes = { relationship: GraphCard };
export function RelationshipGraph() {
  const s = useStudio();
  const [find, setFind] = useState(""),
    [direction, setDirection] = useState("ambas"),
    [flow, setFlow] = useState<ReactFlowInstance | null>(null);
  const entities = s.entities,
    focus = s.selection;
  const nodes = entities.filter(
    (e) => e.kind === "vdc-factor" || e.kind === "vdc-objective",
  );
  const selected = entities.find((e) => e.id === focus);
  const steps = entities.filter((e) => e.kind === "step");
  const vdcMetrics = entities.filter((e) => e.kind === "vdc-metric");
  const vdcMetricResults = new Map(
    vdcMetrics.map((metric) => [
      metric.id,
      calculateMetric(
        metric.data as MetricData,
        entities
          .filter(
            (entity) =>
              entity.kind === "vdc-observation" &&
              entity.data.metricId === metric.id,
          )
          .map((entity) => entity.data as ObservationData),
      ),
    ]),
  );
  const activityMetrics = steps.flatMap((step) =>
    Array.isArray(step.data.metrics)
      ? step.data.metrics.map((binding: any, index: number) => {
          const code = String(binding.code || binding.id || `metric-${index}`);
          const metric = metricForBinding(binding);
          return {
            id: `activity-metric:${step.id}:${code}`,
            kind: "activity-metric",
            rev: 0,
            data: {
              stepId: step.id,
              title: metric?.label || code,
              code,
              unit: binding.unit || metric?.unit || "",
              observed: binding.observed ?? binding.value ?? null,
              target: binding.target ?? null,
              period: binding.period || "Sin periodo",
              quality: binding.quality || "SIN_DATO",
              source: binding.source || "Sin fuente",
            },
          } as Entity;
        })
      : [],
  );
  const legacyMetrics = entities
    .filter(
      (entity) =>
        entity.kind === "legacy-metadata" && Array.isArray(entity.data.metrics),
    )
    .flatMap((metadata) =>
      (metadata.data.metrics as any[]).map(
        (metric, index) =>
          ({
            id:
              "legacy-metric:" +
              metadata.id +
              ":" +
              String(metric.id || metric.code || index),
            kind: "legacy-metric",
            rev: 0,
            data: {
              title:
                metric.name ||
                metric.label ||
                metric.code ||
                "Métrica histórica",
              metricId: metric.id || metric.code || String(index),
              relatedNodeIds: Array.isArray(metric.relatedNodeIds)
                ? metric.relatedNodeIds
                : [],
              currentValue: metric.currentValue ?? "Sin dato",
              targetText: metric.target ?? "Sin meta",
              unit: metric.unit || "",
              formula: metric.formula || "Sin fórmula",
              source: metric.dataSource || "Sin fuente",
              frequency: metric.frequency || "Sin frecuencia",
            },
          }) as Entity,
      ),
    );
  const links = entities.filter((e) => e.kind === "vdc-link");
  const implied = nodes
    .filter(
      (e) =>
        e.kind === "vdc-factor" &&
        e.data.objectiveId &&
        !links.some(
          (l) =>
            l.data.sourceId === e.id && l.data.targetId === e.data.objectiveId,
        ),
    )
    .map(
      (e) =>
        ({
          id: "derived-" + e.id,
          kind: "asignacion",
          rev: 0,
          data: {
            sourceId: e.id,
            targetId: e.data.objectiveId,
            reason: "Factor asignado al objetivo",
            evidenceStatus: "ASIGNACIÓN",
          },
        }) as Entity,
    );
  const stepRelations = steps.flatMap((step) => {
    const targets = [step.data.factorId, step.data.objectiveId].filter(Boolean);
    return targets.map(
      (targetId) =>
        ({
          id: "derived-step:" + step.id + ":" + targetId,
          kind: "actividad",
          rev: 0,
          data: {
            sourceId: step.id,
            targetId,
            reason: "Actividad vinculada",
            evidenceStatus: "ASIGNACIÓN",
          },
        }) as Entity,
    );
  });
  const metricRelations = [
    ...vdcMetrics
      .filter((metric) => metric.data.objectiveId)
      .map(
        (metric) =>
          ({
            id: "derived-vdc-metric:" + metric.id,
            kind: "medicion",
            rev: 0,
            data: {
              sourceId: metric.id,
              targetId: metric.data.objectiveId,
              reason: "Métrica del objetivo",
              evidenceStatus: "ASIGNACIÓN",
            },
          }) as Entity,
      ),
    ...activityMetrics.map(
      (metric) =>
        ({
          id: "derived-activity-metric:" + metric.id,
          kind: "medicion",
          rev: 0,
          data: {
            sourceId: metric.id,
            targetId: metric.data.stepId,
            reason: "Medición de actividad",
            evidenceStatus:
              metric.data.quality === "OBSERVADO" &&
              metric.data.source !== "Sin fuente"
                ? "RESPALDADA"
                : "ASIGNACIÓN",
          },
        }) as Entity,
    ),
    ...legacyMetrics.flatMap((metric) =>
      (metric.data.relatedNodeIds as string[])
        .filter((stepId) => steps.some((step) => step.id === stepId))
        .map(
          (stepId) =>
            ({
              id: "derived-legacy-metric:" + metric.id + ":" + stepId,
              kind: "referencia-caso",
              rev: 0,
              data: {
                sourceId: metric.id,
                targetId: stepId,
                reason: "Referencia del caso histórico",
                evidenceStatus: "ASIGNACIÓN",
              },
            }) as Entity,
        ),
    ),
  ];
  const relations = [
    ...links,
    ...implied,
    ...stepRelations,
    ...metricRelations,
  ];
  const reachable = new Set<string>();
  function walk(start: string, up: boolean) {
    const seen = new Set([start]);
    const queue = [start];
    while (queue.length) {
      const id = queue.shift();
      for (const l of relations) {
        const a = up ? l.data.targetId : l.data.sourceId,
          b = up ? l.data.sourceId : l.data.targetId;
        if (a === id && !seen.has(b)) {
          seen.add(b);
          queue.push(b);
        }
      }
    }
    seen.forEach((id) => reachable.add(id));
  }
  if (
    focus &&
    [
      ...nodes,
      ...vdcMetrics,
      ...steps,
      ...activityMetrics,
      ...legacyMetrics,
    ].some((n) => n.id === focus)
  ) {
    if (direction !== "abajo") walk(focus, true);
    if (direction !== "arriba") walk(focus, false);
  }
  const ranked = [
    ...nodes,
    ...vdcMetrics,
    ...steps.filter(
      (step) =>
        step.data.factorId ||
        step.data.objectiveId ||
        metricRelations.some((edge) => edge.data.targetId === step.id),
    ),
    ...activityMetrics,
    ...legacyMetrics,
  ].sort((a, b) => a.id.localeCompare(b.id));
  // Classic cases can have measures with no activity link. Give those their
  // own column so a handful of reference cards does not shrink the whole map.
  const historicalOnly =
    legacyMetrics.length > 0 && nodes.length === 0 && vdcMetrics.length === 0;
  const rows = [0, 0, 0, 0, 0, 0];
  const boxes = ranked.map((n) => {
    const level =
      n.kind === "vdc-metric" ||
      n.kind === "activity-metric" ||
      n.kind === "legacy-metric"
        ? "MET"
        : n.kind === "step"
          ? "ACT"
          : n.kind === "vdc-factor"
            ? "FC"
            : n.data.level;
    const metricResult =
      n.kind === "vdc-metric" ? vdcMetricResults.get(n.id) : null;
    const independentReference =
      historicalOnly &&
      n.kind === "legacy-metric" &&
      !n.data.relatedNodeIds?.length;
    const col = independentReference ? 2 : Math.max(0, columns.indexOf(level)),
      row = rows[col]++;
    return {
      id: n.id,
      type: "relationship",
      position: {
        x: col * 291,
        y:
          row * (historicalOnly ? 150 : 123) +
          (historicalOnly ? 0 : Math.max(0, col - 1) * 36),
      },
      draggable: false,
      connectable: false,
      data: {
        level,
        stepId: n.data.stepId,
        objectiveId: n.kind === "vdc-metric" ? n.data.objectiveId : undefined,
        relatedNodeIds:
          n.kind === "legacy-metric" ? n.data.relatedNodeIds : undefined,
        title: n.kind === "vdc-metric" ? n.data.label : n.data.title,
        detail:
          n.kind === "legacy-metric"
            ? [
                "Referencia del caso",
                n.data.currentValue + (n.data.unit ? " " + n.data.unit : ""),
                n.data.targetText + (n.data.unit ? " " + n.data.unit : ""),
                n.data.frequency,
                n.data.source,
                n.data.formula,
              ].join(" · ")
            : n.kind === "activity-metric"
              ? [
                  n.data.observed === null
                    ? "Sin valor"
                    : "Valor " + n.data.observed + " " + n.data.unit,
                  n.data.target === null
                    ? "Sin meta"
                    : "Meta " + n.data.target + " " + n.data.unit,
                  n.data.quality + " · " + n.data.period,
                  n.data.source,
                ].join(" · ")
              : n.kind === "vdc-metric"
                ? [
                    metricResult?.current === null ||
                    metricResult?.current === undefined
                      ? "Sin valor"
                      : "Valor " +
                        metricResult.current +
                        " " +
                        metricResult.unit,
                    "Meta " + metricResult?.target + " " + metricResult?.unit,
                    metricResult?.status || "sin_dato",
                    metricResult?.period || "sin corte",
                    metricResult?.quality || "SIN_DATO",
                    n.data.source || "Sin fuente",
                  ].join(" · ")
                : n.kind === "step"
                  ? [
                      n.data.owner || "Sin responsable",
                      Array.isArray(n.data.experts) && n.data.experts.length
                        ? n.data.experts.join(", ")
                        : "Sin especialistas declarados",
                      n.data.technology || "Sin tecnología",
                      Array.isArray(n.data.metrics)
                        ? measurementSummary(n.data.metrics)
                        : "Sin medición",
                    ].join(" · ")
                  : n.kind === "vdc-factor"
                    ? n.data.owner +
                      " · " +
                      (n.data.completed ? "Ejecutado" : "Pendiente")
                    : n.data.target,
        active: focus === n.id,
        dim:
          (!!find &&
            !(String(n.data.title || "") + " " + String(n.data.label || ""))
              .toLowerCase()
              .includes(find.toLowerCase())) ||
          (reachable.size > 0 && !reachable.has(n.id)),
      },
    };
  });
  const lines = relations
    .filter(
      (l) =>
        boxes.some((n) => n.id === l.data.sourceId) &&
        boxes.some((n) => n.id === l.data.targetId),
    )
    .map((l) => {
      const highlighted =
        l.id === focus ||
        (reachable.has(l.data.sourceId) && reachable.has(l.data.targetId));
      const color = highlighted
        ? "#164abe"
        : l.data.evidenceStatus === "NO_RESPALDADA"
          ? "#ad4848"
          : "#829ab8";
      return {
        id: l.id,
        source: l.data.sourceId,
        target: l.data.targetId,
        type: "smoothstep",
        animated: false,
        markerEnd: { type: MarkerType.ArrowClosed, color },
        style: {
          stroke: color,
          strokeWidth: highlighted ? 2.8 : 1.7,
          strokeDasharray: ["ASIGNACIÓN", "HIPOTESIS"].includes(
            l.data.evidenceStatus,
          )
            ? "5 4"
            : undefined,
        },
        interactionWidth: 18,
      };
    });
  const health = useMemo(() => validateVdcGraph(entities), [entities]);
  const target =
    selected?.kind === "vdc-factor" || selected?.kind === "vdc-objective"
      ? selected
      : null;
  const key = target?.kind === "vdc-factor" ? "factorId" : "objectiveId";
  const attached = target
    ? steps.filter((step) => step.data[key] === target.id)
    : [];
  const follow = target
    ? entities.filter(
        (e) =>
          ["ice-decision", "ice-action", "ice-restriction"].includes(e.kind) &&
          (e.data[key] === target.id ||
            attached.some((x) => x.id === e.data.stepId)),
      )
    : [];
  async function attach(id: string) {
    const step = steps.find((x) => x.id === id);
    if (!step || !target) return;
    await s.apply(
      [
        {
          id: step.id,
          kind: "step",
          expectedRev: step.rev,
          data: { ...step.data, [key]: target.id },
        },
      ],
      "Actividad vinculada",
    );
  }
  return (
    <section className="st-card rg-panel">
      <div className="st-cardtitle">
        <Network size={19} />
        <h2>Rutas de contribución</h2>
        <span className="st-tag">
          {health.cycles.length || health.brokenLinks.length
            ? "Revisar vínculos"
            : relations.length + " relaciones"}
        </span>
      </div>
      <div className="rg-toolbar">
        <input
          aria-label="Buscar en el grafo"
          placeholder="Buscar factor u objetivo"
          value={find}
          onChange={(e) => setFind(e.target.value)}
        />
        <select
          aria-label="Dirección de la ruta"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
        >
          <option value="ambas">Ruta completa</option>
          <option value="arriba">Aguas arriba</option>
          <option value="abajo">Aguas abajo</option>
        </select>
        <button onClick={() => flow?.fitView({ padding: 0.08, duration: 200 })}>
          <Crosshair size={14} /> Encuadrar
        </button>
      </div>
      <div
        className="rg-flow"
        style={
          historicalOnly
            ? {
                height: `clamp(375px, ${Math.max(...rows) * 150 + 30}px, 80svh)`,
              }
            : undefined
        }
      >
        <ReactFlow
          onInit={setFlow}
          nodes={boxes}
          edges={lines}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.07, maxZoom: 1.15 }}
          minZoom={0.15}
          maxZoom={2.2}
          nodesConnectable={false}
          nodesDraggable={false}
          onNodeClick={(_, n) => {
            s.select(n.id);
            if (n.data.level === "ACT") s.navigate("mapa", n.id);
            if (n.data.level === "MET" && n.data.stepId)
              s.navigate("mapa", n.data.stepId);
            if (n.data.level === "MET" && n.data.objectiveId)
              s.navigate("vdc", n.data.objectiveId);
            if (
              n.data.level === "MET" &&
              Array.isArray(n.data.relatedNodeIds) &&
              n.data.relatedNodeIds[0]
            )
              s.navigate("mapa", n.data.relatedNodeIds[0]);
          }}
          onEdgeClick={(_, edge) => {
            const l = relations.find((r) => r.id === edge.id);
            s.select(l?.kind === "asignacion" ? l.data.sourceId : edge.id);
          }}
          onPaneClick={() => s.select(null)}
        >
          <Background color="#b7c8dd" gap={18} />
          <Controls position="bottom-right" showInteractive={false} />
        </ReactFlow>
      </div>
      {target && (
        <section className="rg-detail">
          <strong>{target.data.title}</strong>
          <div className="st-btnrow">
            {attached.map((e) => (
              <button key={e.id} onClick={() => s.navigate("mapa", e.id)}>
                Actividad · {e.data.title}
                <ArrowUpRight size={14} />
                <small>{measurementSummary(e.data.metrics)}</small>
              </button>
            ))}
            {follow.map((e) => (
              <button key={e.id} onClick={() => s.navigate("ice", e.id)}>
                ICE · {e.data.title}
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          {s.canEdit && (
            <label className="st-field">
              Vincular una actividad
              <select value="" onChange={(e) => void attach(e.target.value)}>
                <option value="">Elegir paso del mapa</option>
                {steps
                  .filter((e) => !attached.includes(e))
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.data.title}
                    </option>
                  ))}
              </select>
            </label>
          )}
        </section>
      )}
      <details>
        <summary>Hipótesis y fechas de revisión ({links.length})</summary>
        <div className="rg-hypotheses">
          {links.map((l) => (
            <button key={l.id} onClick={() => s.select(l.id)}>
              <b>{l.data.evidenceStatus}</b> · {l.data.reason}
              <small>
                {l.data.owner} · {l.data.reviewDate}
              </small>
            </button>
          ))}
        </div>
      </details>
    </section>
  );
}
