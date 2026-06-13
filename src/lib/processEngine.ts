import type { Edge, Node } from 'reactflow';
import { MarkerType } from 'reactflow';
import type { ProcessEdgeData, ProcessMap, ProcessNodeData } from '../types/process';
import { EDGE_TYPE_META } from './processSchema';

export const LANE_HEIGHT = 168;
export const COLUMN_WIDTH = 248;
export const NODE_OFFSET_X = 96;
export const NODE_OFFSET_Y = 46;

const FORWARD_EDGES = new Set(['sequence', 'decision_yes', 'decision_no', 'automation']);

/**
 * Assigns a column index to each node by longest-path depth following forward edges.
 * Produces a clean left-to-right reading order.
 */
export function computeColumns(process: ProcessMap): Record<string, number> {
  const incoming: Record<string, string[]> = {};
  const outgoing: Record<string, string[]> = {};
  process.nodes.forEach((n) => {
    incoming[n.id] = [];
    outgoing[n.id] = [];
  });
  process.edges.forEach((e) => {
    if (!FORWARD_EDGES.has(e.type)) return;
    if (!outgoing[e.source] || !incoming[e.target]) return;
    outgoing[e.source].push(e.target);
    incoming[e.target].push(e.source);
  });

  const column: Record<string, number> = {};
  const visiting = new Set<string>();

  const depth = (nodeId: string): number => {
    if (column[nodeId] !== undefined) return column[nodeId];
    if (visiting.has(nodeId)) return 0; // cycle guard
    visiting.add(nodeId);
    const preds = incoming[nodeId] ?? [];
    const d = preds.length === 0 ? 0 : Math.max(...preds.map((p) => depth(p) + 1));
    visiting.delete(nodeId);
    column[nodeId] = d;
    return d;
  };

  process.nodes.forEach((n) => depth(n.id));

  // Inheritance pass: side nodes (metric/risk/automation) connected only via
  // non-forward edges inherit the column of their nearest neighbor.
  const forwardConnected = new Set<string>();
  process.edges.forEach((e) => {
    if (FORWARD_EDGES.has(e.type)) {
      forwardConnected.add(e.source);
      forwardConnected.add(e.target);
    }
  });
  process.nodes.forEach((n) => {
    if (forwardConnected.has(n.id)) return;
    const neighbours = process.edges
      .filter((e) => e.source === n.id || e.target === n.id)
      .map((e) => (e.source === n.id ? e.target : e.source));
    const cols = neighbours.map((nid) => column[nid] ?? 0);
    if (cols.length) column[n.id] = Math.max(...cols);
  });

  return column;
}

/** Positions nodes within swimlanes. Mutates a copy and returns new node array. */
export function autoLayout(process: ProcessMap): ProcessNodeData[] {
  const columns = computeColumns(process);
  const laneIndex: Record<string, number> = {};
  process.lanes.forEach((l, i) => (laneIndex[l.id] = i));

  // Track occupancy of (lane,column) to avoid overlaps within the same cell.
  const slot: Record<string, number> = {};

  return process.nodes.map((n) => {
    const li = laneIndex[n.laneId] ?? 0;
    const col = columns[n.id] ?? 0;
    const key = `${n.laneId}:${col}`;
    const stackIdx = slot[key] ?? 0;
    slot[key] = stackIdx + 1;

    return {
      ...n,
      position: {
        x: col * COLUMN_WIDTH + NODE_OFFSET_X,
        y: li * LANE_HEIGHT + NODE_OFFSET_Y + stackIdx * 8,
      },
    };
  });
}

export function laneWidth(process: ProcessMap): number {
  const columns = computeColumns(process);
  const maxCol = Math.max(0, ...Object.values(columns));
  return (maxCol + 1) * COLUMN_WIDTH + NODE_OFFSET_X + 220;
}

/** Converts the domain ProcessMap into React Flow nodes (lanes + process nodes). */
export function toFlowNodes(process: ProcessMap): Node[] {
  const width = laneWidth(process);
  const laneNodes: Node[] = process.lanes.map((lane, i) => ({
    id: `lane-${lane.id}`,
    type: 'lane',
    position: { x: 0, y: i * LANE_HEIGHT },
    data: { lane, width, height: LANE_HEIGHT },
    draggable: false,
    selectable: false,
    connectable: false,
    zIndex: 0,
    style: { width, height: LANE_HEIGHT },
  }));

  const processNodes: Node[] = process.nodes.map((n) => ({
    id: n.id,
    type: n.type === 'decision' ? 'decision' : n.type === 'start' || n.type === 'end' ? 'terminal' : 'process',
    position: n.position,
    data: { node: n, process },
    zIndex: 2,
  }));

  return [...laneNodes, ...processNodes];
}

export function toFlowEdges(process: ProcessMap): Edge[] {
  return process.edges.map((e: ProcessEdgeData) => {
    const meta = EDGE_TYPE_META[e.type];
    const label = e.label ?? (e.type === 'decision_yes' ? 'Sí' : e.type === 'decision_no' ? 'No' : undefined);
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.type === 'decision_yes' ? 'yes' : e.type === 'decision_no' ? 'no' : undefined,
      type: 'gen',
      animated: e.animated ?? (e.type === 'automation' || e.type === 'metric_impact'),
      style: {
        stroke: meta.color,
        strokeWidth: e.type === 'metric_impact' ? 1.5 + (e.strength ?? 0.5) * 2 : 2.5,
        strokeDasharray: meta.dashed ? '6 5' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: meta.color,
        width: 22,
        height: 22,
      },
      data: { edge: e, label, color: meta.color },
      zIndex: 1,
    };
  });
}
