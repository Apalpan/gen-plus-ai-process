import { useCallback, useEffect, useMemo, useRef } from 'react';
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
import { Play, Activity, GitBranch, FileText, Flag, Hourglass, LayoutGrid, Maximize, Sparkles } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { toFlowEdges, toFlowNodes } from '../../lib/processEngine';
import { makeEdge, NODE_TYPE_META } from '../../lib/processSchema';
import { ProcessNode } from './nodes/ProcessNode';
import { DecisionNode } from './nodes/DecisionNode';
import { TerminalNode } from './nodes/TerminalNode';
import { LaneNode } from './nodes/LaneNode';
import { GenEdge } from './edges/GenEdge';
import { LaneRail } from './LaneRail';
import { ViewSwitcher } from './ViewSwitcher';
import { cn } from '../../lib/cn';

const nodeTypes = { process: ProcessNode, decision: DecisionNode, terminal: TerminalNode, lane: LaneNode };
const edgeTypes = { gen: GenEdge };
const BASIC_HIDDEN = new Set(['metric', 'risk', 'automation', 'system']);

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
  const is3d = viewMode === '3d';
  const isBasic = viewMode === 'basic';

  const rfNodes = useMemo(() => {
    const base = toFlowNodes(process);
    return base
      .filter((n) => {
        if (n.type === 'lane' || !isBasic) return true;
        const t = (n.data as { node?: { type?: string } })?.node?.type;
        return !t || !BASIC_HIDDEN.has(t);
      })
      .map((n) => {
        if (n.type === 'lane') return n;
        const laneId = (n.data as { node?: { laneId?: string } })?.node?.laneId;
        const dim = highlightLaneId !== null && laneId !== highlightLaneId;
        return {
          ...n,
          data: { ...n.data, isSelected: n.id === selectedNodeId },
          selected: n.id === selectedNodeId,
          style: { ...(n.style ?? {}), opacity: dim ? 0.26 : 1, transition: 'opacity 0.2s ease-out' },
        };
      });
  }, [process, selectedNodeId, highlightLaneId, isBasic]);

  const rfEdges = useMemo(() => {
    const all = toFlowEdges(process);
    if (!isBasic) return all;
    const hidden = new Set(process.nodes.filter((n) => BASIC_HIDDEN.has(n.type)).map((n) => n.id));
    return all.filter((e) => !hidden.has(e.source) && !hidden.has(e.target));
  }, [process, isBasic]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => setNodes(rfNodes), [rfNodes, setNodes]);
  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((c) => {
        if (c.type === 'position' && c.position && !c.dragging && !c.id.startsWith('lane-')) moveNode(c.id, c.position);
      });
    },
    [onNodesChange, moveNode],
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

  // Soltar la conexión en un espacio vacío crea el siguiente paso ya conectado.
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
    <div className={cn('relative h-full w-full', is3d ? 'gen-canvas-3d' : isBasic ? 'gen-canvas-basic' : 'gen-canvas-2d')}>
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
        onNodeClick={(_, node) => !node.id.startsWith('lane-') && selectNode(node.id)}
        onPaneClick={() => {
          selectNode(null);
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
        selectionKeyCode={'Shift'}
        zoomOnDoubleClick={false}
        nodesDraggable={!is3d}
        nodesConnectable={!is3d}
        elementsSelectable
        panOnDrag={!is3d}
        panOnScroll={is3d}
        zoomOnScroll
        className="bg-ink-900"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color={theme === 'dark' ? 'rgba(106,152,255,0.14)' : 'rgba(33,101,255,0.16)'} />
        {!is3d && <LaneRail />}
        {!is3d && <Controls showInteractive={false} />}
        {!isBasic && !is3d && <MiniMap pannable zoomable nodeColor={miniMapColor} maskColor={theme === 'dark' ? 'rgba(4,15,32,0.78)' : 'rgba(237,242,252,0.82)'} />}
      </ReactFlow>

      {/* Overlays planos (no se inclinan en 3D) */}
      <div className="pointer-events-none absolute inset-0 z-30">
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

        <div className="pointer-events-auto absolute right-3 top-3">
          <ViewSwitcher />
        </div>

        {process.nodes.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2">
            <div className="rounded-full border border-[var(--gen-border)] bg-ink-850/85 px-3 py-1 text-center text-[11px] gen-text-muted shadow-elevated backdrop-blur">
              {is3d ? (
                <>Vista <b className="text-brand-300">3D</b> · explora con scroll · vuelve a <b className="text-brand-300">2D</b> para editar</>
              ) : (
                <>Arrastra un punto y suéltalo en vacío para crear el siguiente paso · clic en un carril para aislarlo</>
              )}
            </div>
          </div>
        )}
      </div>

      {process.nodes.length === 0 && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="gen-surface pointer-events-auto max-w-sm rounded-card-lg p-6 text-center shadow-elevated">
            <p className="text-[15px] font-semibold">Empieza tu mapa</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed gen-text-muted">
              Genera la lógica desde una descripción, o crea el esqueleto y arrástralo. Conecta soltando un punto en vacío.
            </p>
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
