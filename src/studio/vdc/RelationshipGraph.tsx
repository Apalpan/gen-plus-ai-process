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
import { validateVdcGraph } from "./validation";

const columns = ["FC", "ProdO", "PO", "CO"];
const titles = [
  "Factor controlable",
  "Objetivo de producción",
  "Objetivo del proyecto",
  "Objetivo del cliente",
];
const paths = ["#527e83", "#3366b6", "#765aae", "#af701b"];
type Card = {
  title: string;
  level: string;
  detail: string;
  active: boolean;
  dim: boolean;
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
  const relations = [...links, ...implied];
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
  if (focus && nodes.some((n) => n.id === focus)) {
    if (direction !== "abajo") walk(focus, true);
    if (direction !== "arriba") walk(focus, false);
  }
  const ranked = [...nodes].sort((a, b) => a.id.localeCompare(b.id));
  const rows = [0, 0, 0, 0];
  const boxes = ranked.map((n) => {
    const level = n.kind === "vdc-factor" ? "FC" : n.data.level;
    const col = Math.max(0, columns.indexOf(level)),
      row = rows[col]++;
    return {
      id: n.id,
      type: "relationship",
      position: { x: col * 291, y: row * 123 + Math.max(0, col - 1) * 36 },
      draggable: false,
      connectable: false,
      data: {
        level,
        title: n.data.title,
        detail:
          n.kind === "vdc-factor"
            ? n.data.owner +
              " · " +
              (n.data.completed ? "Ejecutado" : "Pendiente")
            : n.data.target,
        active: focus === n.id,
        dim:
          (!!find &&
            !n.data.title?.toLowerCase().includes(find.toLowerCase())) ||
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
  const steps = entities.filter((e) => e.kind === "step");
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
      <div className="rg-flow">
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
          onNodeClick={(_, n) => s.select(n.id)}
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
