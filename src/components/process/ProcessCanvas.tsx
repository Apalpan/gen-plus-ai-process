import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type OnConnectStartParams,
} from 'reactflow';
import { Play, Activity, GitBranch, FileText, Flag, Hourglass, LayoutGrid, Maximize, Sparkles, Loader2 } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { toFlowEdges, toFlowNodes, linearLayout } from '../../lib/processEngine';
import { makeEdge, NODE_TYPE_META } from '../../lib/processSchema';
import { ProcessNode } from './nodes/ProcessNode';
import { DecisionNode } from './nodes/DecisionNode';
import { TerminalNode } from './nodes/TerminalNode';
import { DocumentNode } from './nodes/DocumentNode';
import { LaneNode } from './nodes/LaneNode';
import { GenEdge } from './edges/GenEdge';
import { LaneRail } from './LaneRail';
import { ViewSwitcher } from './ViewSwitcher';
import { AlignToolbar } from './AlignToolbar';
import { cn } from '../../lib/cn';

const Canvas3D = lazy(() => import('./Canvas3D'));

const nodeTypes = { process: ProcessNode, decision: DecisionNode, terminal: TerminalNode, doc: DocumentNode, lane: LaneNode };
const edgeTypes = { gen: GenEdge };
const BASIC_HIDDEN = new Set(['metric', 'risk', 'automation', 'system', 'buffer']);

function miniMapColor(node: Node): string {
  if (node.type === 'lane') return 'rgba(106,152,255,0.06)';
  const data = node.data as { node?: { type?: keyof typeof NODE_TYPE_META } };
  const t = data?.node?.type;
  return t ? NODE_TYPE_META[t].color : '#4D84FF';
}

function CanvasInner() {
  const process = useProcessStore((s) => s.process);
  const selectedNodeId = useProcessStore((s) => s.selectedNodeId);
  const highlightLaneId = useProcessStore((s) => s.highlightLaneId);
  const viewMode = useProcessStore((s) => s.viewMode);
  const selectNode = useProcessStore((s) => s.selectNode);
  const setHighlightLane = useProcessStore((s) => s.setHighlightLane);
  const moveNode = useProcessStore((s) => s.moveNode);
  const addEdge = useProcessStore((s) => s.addEdge);
  const addConnectedNode = useProcessStore((s) => s.addConnectedNode);
  const deleteEdge = useProcessStore((s) => s.deleteEdge);
  const deleteNode = useProcessStore((s) => s.deleteNode);
  const relayout = useProcessStore((s) => s.relayout);
  const addNode = useProcessStore((s) => s.addNode);
  const seedSkeleton = useProcessStore((s) => s.seedSkeleton);
  const setSection = useProcessStore((s) => s.setSection);
  const theme = useProcessStore((s) => s.theme);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const connectFrom = useRef<{ nodeId: string | null; handleId: string | null } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const is3d = viewMode === '3d';
  const isBasic = viewMode === 'basic';

  const rfNodes = useMemo(() => {
    const linear = isBasic ? linearLayout(process) : null;
    return toFlowNodes(process)
      .filter((n) => {
        if (n.type === 'lane') return !isBasic; // sin swimlanes en Básico
        if (!isBasic) return true;
        const t = (n.data as { node?: { type?: string } })?.node?.type;
        return !t || !BASIC_HIDDEN.has(t);
      })
      .map((n) => {
        if (n.type === 'lane') return n;
        const laneId = (n.data as { node?: { laneId?: string } })?.node?.laneId;
        const dim = !isBasic && highlightLaneId !== null && laneId !== highlightLaneId;
        return {
          ...n,
          position: linear?.[n.id] ?? n.position,
          draggable: !isBasic,
          style: { ...(n.style ?? {}), opacity: dim ? 0.26 : 1, transition: 'opacity 0.2s ease-out' },
        };
      });
  }, [process, highlightLaneId, isBasic]);

  const rfEdges = useMemo(() => {
    const all = toFlowEdges(process);
    if (!isBasic) return all;
    const hidden = new Set(process.nodes.filter((n) => BASIC_HIDDEN.has(n.type)).map((n) => n.id));
    return all.filter((e) => !hidden.has(e.source) && !hidden.has(e.target));
  }, [process, isBasic]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  // Re-deriva nodos preservando la selección (multiselección) y resaltando el seleccionado.
  useEffect(() => {
    setNodes((prev) => {
      const sel = new Set(prev.filter((p) => p.selected).map((p) => p.id));
      if (selectedNodeId) sel.add(selectedNodeId);
      return rfNodes.map((n) => (n.type === 'lane' ? n : { ...n, selected: sel.has(n.id) }));
    });
  }, [rfNodes, selectedNodeId, setNodes]);
  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      if (isBasic) return; // Básico no persiste posiciones
      changes.forEach((c) => {
        if (c.type === 'position' && c.position && !c.dragging && !c.id.startsWith('lane-')) moveNode(c.id, c.position);
      });
    },
    [onNodesChange, moveNode, isBasic],
  );

  const onConnect = useCallback(
    (c: Connection) => {
      if (!c.source || !c.target) return;
      const type = c.sourceHandle === 'yes' ? 'decision_yes' : c.sourceHandle === 'no' ? 'decision_no' : 'sequence';
      addEdge(makeEdge(c.source, c.target, { type }));
    },
    [addEdge],
  );

  const onConnectStart = useCallback((_: unknown, params: OnConnectStartParams) => {
    connectFrom.current = { nodeId: params.nodeId, handleId: params.handleId };
  }, []);

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      const from = connectFrom.current;
      connectFrom.current = null;
      if (!from?.nodeId) return;
      const target = event.target as Element | null;
      if (!target?.classList?.contains('react-flow__pane')) return;
      const point = 'changedTouches' in event ? event.changedTouches[0] : (event as MouseEvent);
      const pos = screenToFlowPosition({ x: point.clientX, y: point.clientY });
      const type = from.handleId === 'yes' ? 'decision_yes' : from.handleId === 'no' ? 'decision_no' : 'sequence';
      addConnectedNode(from.nodeId, 'activity', type, { x: pos.x - 100, y: pos.y - 24 });
    },
    [screenToFlowPosition, addConnectedNode],
  );

  const onEdgesDelete = useCallback((eds: Edge[]) => eds.forEach((e) => deleteEdge(e.id)), [deleteEdge]);
  const onNodesDelete = useCallback((nds: Node[]) => nds.forEach((n) => !n.id.startsWith('lane-') && deleteNode(n.id)), [deleteNode]);

  return (
    <div className={cn('relative h-full w-full', isBasic ? 'gen-canvas-basic' : 'gen-canvas-2d')}>
      {is3d ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center bg-ink-900 text-brand-200">
              <Loader2 size={22} className="mr-2 animate-spin" /> Cargando 3D…
            </div>
          }
        >
          <Canvas3D />
        </Suspense>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectStart={onConnectStart}
          onConnectEnd={onConnectEnd}
          onEdgesDelete={onEdgesDelete}
          onNodesDelete={onNodesDelete}
          onSelectionChange={({ nodes: sel }) => {
            const ids = sel.filter((n) => !n.id.startsWith('lane-')).map((n) => n.id);
            setSelectedIds(ids);
            selectNode(ids.length === 1 ? ids[0] : null);
          }}
          onPaneClick={() => {
            if (highlightLaneId) setHighlightLane(null);
          }}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.15}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
          connectionMode={ConnectionMode.Loose}
          connectionRadius={40}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#4D84FF', strokeWidth: 2.5 }}
          deleteKeyCode={['Backspace', 'Delete']}
          zoomOnDoubleClick={false}
          nodesDraggable={!isBasic}
          elementsSelectable
          selectionOnDrag={!isBasic}
          panOnDrag={isBasic ? true : [1, 2]}
          zoomOnScroll
          className="bg-ink-900"
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={theme === 'dark' ? 'rgba(106,152,255,0.14)' : 'rgba(33,101,255,0.16)'} />
          {!isBasic && <LaneRail />}
          <Controls showInteractive={false} />
          {!isBasic && <MiniMap pannable zoomable nodeColor={miniMapColor} maskColor={theme === 'dark' ? 'rgba(4,15,32,0.78)' : 'rgba(237,242,252,0.82)'} />}
        </ReactFlow>
      )}

      {/* Overlays planos */}
      <div className="pointer-events-none absolute inset-0 z-30">
        {!is3d && (
          <div className="pointer-events-auto absolute left-1/2 top-3 -translate-x-1/2">
            <div className="flex items-center gap-1 rounded-btn-lg border border-[var(--gen-border)] bg-ink-850/90 p-1 shadow-elevated backdrop-blur">
              <ToolBtn label="Inicio" onClick={() => addNode('start')} icon={<Play size={15} />} />
              <ToolBtn label="Actividad" onClick={() => addNode('activity')} icon={<Activity size={15} />} />
              <ToolBtn label="Decisión" onClick={() => addNode('decision')} icon={<GitBranch size={15} />} />
              <ToolBtn label="Documento" onClick={() => addNode('document')} icon={<FileText size={15} />} />
              <ToolBtn label="Cola/WIP" onClick={() => addNode('queue')} icon={<Hourglass size={15} />} />
              <ToolBtn label="Fin" onClick={() => addNode('end')} icon={<Flag size={15} />} />
              <div className="mx-0.5 h-5 w-px bg-[var(--gen-border)]" />
              <ToolBtn label="Ordenar" onClick={relayout} icon={<LayoutGrid size={15} />} />
              <ToolBtn label="Ajustar" onClick={() => fitView({ padding: 0.2, duration: 400 })} icon={<Maximize size={15} />} />
            </div>
          </div>
        )}

        {!is3d && !isBasic && selectedIds.length >= 2 && (
          <div className="pointer-events-auto absolute left-1/2 top-16 -translate-x-1/2">
            <AlignToolbar ids={selectedIds} />
          </div>
        )}

        <div className="pointer-events-auto absolute right-3 top-3">
          <ViewSwitcher />
        </div>

        {process.nodes.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="rounded-full border border-[var(--gen-border)] bg-ink-850/85 px-3 py-1 text-center text-[11px] gen-text-muted shadow-elevated backdrop-blur">
              {is3d ? (
                <>Vista <b className="text-brand-300">3D</b> · arrastra para orbitar · rueda para zoom · clic en un nodo lo selecciona</>
              ) : isBasic ? (
                <>Vista <b className="text-brand-300">Básico</b> · flujo en una línea, sin carriles · cambia a 2D para editar posiciones</>
              ) : (
                <>Arrastra en vacío para seleccionar varios · botón medio/derecho para mover el lienzo · suelta un punto en vacío para crear el siguiente paso</>
              )}
            </div>
          </div>
        )}
      </div>

      {process.nodes.length === 0 && !is3d && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="gen-surface pointer-events-auto max-w-sm rounded-card-lg p-6 text-center shadow-elevated">
            <p className="text-[15px] font-semibold">Empieza tu mapa</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed gen-text-muted">Genera la lógica desde una descripción, o crea el esqueleto y arrástralo.</p>
            <div className="mt-4 flex flex-col gap-2">
              <button onClick={() => setSection('capture')} className="flex items-center justify-center gap-1.5 rounded-btn bg-brand-500 px-4 py-2.5 text-[13px] font-semibold text-oncolor transition-colors hover:bg-brand-400">
                <Sparkles size={15} /> Generar con IA (Capturar)
              </button>
              <button onClick={seedSkeleton} className="flex items-center justify-center gap-1.5 rounded-btn border border-[var(--gen-border-strong)] px-4 py-2.5 text-[13px] font-semibold text-brand-100 transition-colors hover:bg-white/[0.06]">
                <Play size={14} /> Crear Inicio → Actividad → Fin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProcessCanvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}

function ToolBtn({ label, icon, onClick }: { label: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex h-9 items-center gap-1.5 rounded-btn px-2.5 text-[12px] font-medium text-brand-100 transition-colors hover:bg-white/[0.08] focus-visible:shadow-focus"
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
