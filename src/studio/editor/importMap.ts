import { uid, type Entity } from "../shared";
import type { StepType } from "./types";

const readableStepType = (type: unknown): StepType => {
  if (
    typeof type === "string" &&
    [
      "start",
      "end",
      "activity",
      "decision",
      "handoff",
      "evidence",
      "queue",
      "buffer",
    ].includes(type)
  )
    return type as StepType;
  if (["document", "system", "metric", "risk"].includes(String(type)))
    return "evidence";
  if (["automation", "approval"].includes(String(type))) return "handoff";
  return "activity";
};

export function validateMap(items: Entity[]): string[] {
  const seen = new Set<string>();
  const steps = new Set(
    items.filter((e) => e.kind === "step").map((e) => e.id),
  );
  const lanes = new Set(
    items.filter((e) => e.kind === "lane").map((e) => e.id),
  );
  const problems: string[] = [];
  for (const e of items) {
    if (
      !e?.id ||
      !e.kind ||
      !e.data ||
      typeof e.data !== "object" ||
      Array.isArray(e.data)
    ) {
      problems.push("Entidad incompleta.");
      continue;
    }
    if (seen.has(e.id)) problems.push("Identificador duplicado: " + e.id);
    seen.add(e.id);
    if (
      e.kind === "step" &&
      (!String(e.data.title ?? "").trim() || !lanes.has(e.data.laneId))
    )
      problems.push("Paso sin nombre o sin carril válido: " + e.id);
    if (
      e.kind === "edge" &&
      (!steps.has(e.data.source) || !steps.has(e.data.target))
    )
      problems.push("Conexión con paso ausente: " + e.id);
  }
  return problems;
}

export function readMap(raw: string): Entity[] {
  if (raw.length > 750000)
    throw Error("El archivo excede el tamaño admitido (750 KB).");
  const doc = JSON.parse(raw);
  if (Array.isArray(doc?.entities)) {
    if (doc.schemaVersion !== undefined && doc.schemaVersion !== 2)
      throw Error("Versión de mapa no compatible.");
    return doc.entities.map((e: Entity) => ({
      id: e.id,
      kind: e.kind,
      data: e.data,
      rev: 0,
    }));
  }
  if (
    !Array.isArray(doc?.nodes) ||
    !Array.isArray(doc?.edges) ||
    !Array.isArray(doc?.lanes)
  )
    throw Error("Se requiere un JSON de AI Process v1 o v2.");
  const lanes: Entity[] = doc.lanes.map((l: Record<string, any>) => ({
    id: l.id,
    kind: "lane",
    data: { ...l, name: l.name || "Carril" },
    rev: 0,
  }));
  if (!lanes.length)
    lanes.push({
      id: uid("lane"),
      kind: "lane",
      data: { name: "Proceso", color: "#376cad" },
      rev: 0,
    });
  const laneOrder = new Map(lanes.map((lane, index) => [lane.id, index]));
  const allSameY =
    new Set(
      doc.nodes.map((node: Record<string, any>) =>
        Number.isFinite(Number(node.position?.y)) ? Number(node.position.y) : 0,
      ),
    ).size <= 1;
  const withinLane = new Map<string, number>();
  const metricIdsByNode = new Map<string, string[]>();
  for (const metric of Array.isArray(doc.metrics) ? doc.metrics : []) {
    for (const nodeId of Array.isArray(metric.relatedNodeIds)
      ? metric.relatedNodeIds
      : []) {
      metricIdsByNode.set(
        nodeId,
        [
          ...(metricIdsByNode.get(nodeId) ?? []),
          metric.id || metric.code,
        ].filter(Boolean),
      );
    }
  }
  const steps: Entity[] = doc.nodes.map((n: Record<string, any>, i: number) => {
    const laneId = n.laneId || lanes[0].id;
    const laneIndex = laneOrder.get(laneId) ?? 0;
    const positionIndex = withinLane.get(laneId) ?? 0;
    withinLane.set(laneId, positionIndex + 1);
    const projectByLane = lanes.length > 1 && allSameY;
    return {
      id: n.id,
      kind: "step",
      rev: 0,
      data: {
        ...n,
        title: n.title || n.label || "Paso " + (i + 1),
        type: readableStepType(n.type),
        laneId,
        owner: n.responsible || n.owner || "",
        x: projectByLane
          ? 150 + positionIndex * 240
          : Number(n.position?.x ?? i * 230),
        y: projectByLane ? 110 + laneIndex * 158 : Number(n.position?.y ?? 140),
        status: n.status || "draft",
        person: n.responsible || n.owner || "",
        technology: Array.isArray(n.tools) ? n.tools.join(", ") : n.technology,
        experts: Array.isArray(n.consulted) ? n.consulted : undefined,
        metricIds: [
          ...new Set([
            ...(Array.isArray(n.metricIds) ? n.metricIds : []),
            ...(metricIdsByNode.get(n.id) || []),
          ]),
        ],
        legacy: { ...n },
      },
    };
  });
  const edges: Entity[] = doc.edges.map((e: Record<string, any>) => ({
    id: e.id,
    kind: "edge",
    rev: 0,
    data: {
      ...e,
      legacyType: e.type,
      type: studioEdgeType(e.type),
      label:
        e.label ||
        (e.type === "decision_yes"
          ? "Sí"
          : e.type === "decision_no"
            ? "No"
            : ""),
    },
  }));
  const { nodes: _nodes, lanes: _lanes, edges: _edges, ...metadata } = doc;
  const meta: Entity = {
    id: uid("legacy"),
    kind: "legacy-metadata",
    rev: 0,
    data: {
      ...metadata,
      importedFrom: "v1",
      title: doc.title || "Proceso histórico",
    },
  };
  return [...lanes, ...steps, ...edges, meta];
}

export function recoverOriginal(entities: Entity[]) {
  const meta = entities.find((e) => e.kind === "legacy-metadata");
  if (!meta) return null;
  const { importedFrom, ...fields } = meta.data;
  return {
    ...fields,
    lanes: entities
      .filter((e) => e.kind === "lane")
      .map((e) => ({ ...e.data, id: e.id })),
    nodes: entities
      .filter((e) => e.kind === "step")
      .map((e) => {
        const { legacy, ...current } = e.data;
        return {
          ...legacy,
          ...current,
          id: e.id,
          responsible: current.owner,
          type:
            legacy && readableStepType(legacy.type) === current.type
              ? legacy.type
              : current.type,
          position: { x: current.x, y: current.y },
        };
      }),
    edges: entities
      .filter((e) => e.kind === "edge")
      .map((e) => {
        const { legacyType, ...current } = e.data;
        const reverse: Record<string, string> = {
          rework: "feedback",
          information: "evidence",
          handoff: "sequence",
        };
        const type =
          legacyType && studioEdgeType(legacyType) === current.type
            ? legacyType
            : (reverse[current.type] ?? current.type);
        return { ...current, id: e.id, type };
      }),
  };
}

function studioEdgeType(type: string | undefined) {
  const aliases: Record<string, string> = {
    decision_yes: "sequence",
    decision_no: "sequence",
    feedback: "rework",
    evidence: "information",
    metric_impact: "dependency",
    automation: "handoff",
  };
  return type ? aliases[type] || type : "sequence";
}
