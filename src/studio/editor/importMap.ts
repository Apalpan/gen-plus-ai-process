import { uid, type Entity } from "../shared";

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
  const steps: Entity[] = doc.nodes.map(
    (n: Record<string, any>, i: number) => ({
      id: n.id,
      kind: "step",
      rev: 0,
      data: {
        ...n,
        title: n.title || n.label || "Paso " + (i + 1),
        type: n.type || "activity",
        laneId: n.laneId || lanes[0].id,
        owner: n.responsible || n.owner || "",
        x: Number(n.position?.x ?? i * 230),
        y: Number(n.position?.y ?? 140),
        status: n.status || "draft",
      },
    }),
  );
  const edges: Entity[] = doc.edges.map((e: Record<string, any>) => ({
    id: e.id,
    kind: "edge",
    rev: 0,
    data: { ...e, type: e.type || "sequence" },
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
      .map((e) => ({
        ...e.data,
        id: e.id,
        responsible: e.data.owner,
        position: { x: e.data.x, y: e.data.y },
      })),
    edges: entities
      .filter((e) => e.kind === "edge")
      .map((e) => ({ ...e.data, id: e.id })),
  };
}
