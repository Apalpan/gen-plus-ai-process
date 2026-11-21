import type { ProcessMap } from "../../types/process";
import { readMap } from "./importMap";
import type { Entity } from "../shared";

export type HistoricalCase = {
  id: string;
  name: string;
  description: string;
  kind: string;
};

type LegacyTemplate = HistoricalCase & { build: () => ProcessMap };

/**
 * Historical maps enter through the same v1 reader as an uploaded map. This
 * keeps schema normalization, original-node preservation and validation in one
 * place. The source map is never mutated.
 */
export function convertHistoricalCase(map: ProcessMap): Entity[] {
  return readMap(
    JSON.stringify({
      ...map,
      title: map.title,
      lanes: map.lanes,
      nodes: map.nodes,
      edges: map.edges,
      metrics: map.metrics,
    }),
  );
}

export async function listHistoricalCases(): Promise<HistoricalCase[]> {
  const { templates } = await import("../../data/templates");
  return (templates as LegacyTemplate[]).map(
    ({ id, name, description, kind }) => ({
      id,
      name,
      description,
      kind,
    }),
  );
}

export async function buildHistoricalCase(id: string) {
  const { templates } = await import("../../data/templates");
  const selected = (templates as LegacyTemplate[]).find(
    (template) => template.id === id,
  );
  if (!selected) throw Error("Caso histórico no encontrado.");
  const map = selected.build();
  return {
    title: map.title || selected.name,
    entities: convertHistoricalCase(map),
  };
}
