import type { VdcEntity, VdcLinkData } from "./types";
import { entitiesOf } from "./types";

export interface VdcValidation {
  cycles: string[][];
  brokenLinks: string[];
  factorWithoutProductionObjective: string[];
}

/** A causal VDC map is acyclic from FC to CO. Feedback needs a dated observation, not a causal edge. */
export function validateVdcGraph(entities: VdcEntity[]): VdcValidation {
  const links = entitiesOf<VdcLinkData>(entities, "vdc-link");
  const ids = new Set(entities.map((entity) => entity.id));
  const brokenLinks = links
    .filter(
      (link) => !ids.has(link.data.sourceId) || !ids.has(link.data.targetId),
    )
    .map((link) => link.id);
  const graph = new Map<string, string[]>();
  links
    .filter((link) => !brokenLinks.includes(link.id))
    .forEach((link) => {
      const targets = graph.get(link.data.sourceId) ?? [];
      targets.push(link.data.targetId);
      graph.set(link.data.sourceId, targets);
    });
  const cycles: string[][] = [];
  const done = new Set<string>();
  const visiting = new Set<string>();
  const path: string[] = [];
  const visit = (id: string) => {
    if (visiting.has(id)) {
      const from = path.indexOf(id);
      cycles.push([...path.slice(from), id]);
      return;
    }
    if (done.has(id)) return;
    visiting.add(id);
    path.push(id);
    (graph.get(id) ?? []).forEach(visit);
    path.pop();
    visiting.delete(id);
    done.add(id);
  };
  [...graph.keys()].forEach(visit);
  const objectives = new Map(
    entities
      .filter((entity) => entity.kind === "vdc-objective")
      .map((entity) => [entity.id, entity]),
  );
  const factorWithoutProductionObjective = entities
    .filter((entity) => entity.kind === "vdc-factor")
    .filter((factor) => {
      const target = objectives.get(String(factor.data.objectiveId));
      return target?.data.level !== "ProdO";
    })
    .map((factor) => factor.id);
  return { cycles, brokenLinks, factorWithoutProductionObjective };
}
