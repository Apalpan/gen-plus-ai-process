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
import {
  Activity,
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  FileText,
  Flag,
  GitBranch,
  Hourglass,
  LayoutGrid,
  ListTree,
  Loader2,
  Maximize,
  Pencil,
  Play,
  Sparkles,
} from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import type { ProcessMap } from '../../types/process';
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
import { NodeInspector } from './NodeInspector';
import { cn } from '../../lib/cn';

const Canvas3D = lazy(() => import('./Canvas3D'));

const nodeTypes = { process: ProcessNode, decision: DecisionNode, terminal: TerminalNode, doc: DocumentNode, lane: LaneNode };
const edgeTypes = { gen: GenEdge };
const BASIC_HIDDEN = new Set(['metric', 'risk', 'automation', 'system', 'buffer']);
type RouteFocus = 'all' | 'tronco' | 'electivo' | 'capstone';
const ROUTE_FILTERS: { id: RouteFocus; label: string }[] = [
  { id: 'all', label: 'Todo' },
  { id: 'tronco', label: 'Tronco' },
  { id: 'electivo', label: 'Electivos' },
  { id: 'capstone', label: 'Capstone' },
];
const LEARNING_CLUSTER_COUNT = 27;

function miniMapColor(node: Node): string {
  if (node.type === 'lane') return 'rgba(106,152,255,0.06)';
  const data = node.data as { node?: { type?: keyof typeof NODE_TYPE_META } };
  const t = data?.node?.type;
  return t ? NODE_TYPE_META[t].color : '#4D84FF';
}

function LearningRouteOverview({
  process,
  routeFocus,
  onRouteFocusChange,
  onEdit,
}: {
  process: ProcessMap;
  routeFocus: RouteFocus;
  onRouteFocusChange: (focus: RouteFocus) => void;
  onEdit: () => void;
}) {
  const [expandedLaneId, setExpandedLaneId] = useState<string | null>(process.lanes[0]?.id ?? null);
  const sourceUrl = process.documents.find((document) => document.repository)?.repository;
  const visibleLanes = process.lanes.filter((lane) => {
    if (routeFocus === 'all') return true;
    return lane.description?.includes(`routeType:${routeFocus}`);
  });

  return (
    <div className="h-full overflow-y-auto bg-ink-900 px-4 pb-10 pt-5">
      <div className="mx-auto max-w-2xl">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-brand-300">
          <ListTree size={15} aria-hidden="true" />
          Ruta IA · Diplomado AEC
        </div>
        <h1 className="max-w-xl text-2xl font-bold leading-tight text-white">De fundamentos a una implementación AI First verificable</h1>
        <p className="mt-2 text-[13px] leading-relaxed gen-text-secondary">
          27 clusters sintetizan los 118 módulos de la fuente. La secuencia es una estructura de decisión; la evidencia, las rúbricas y los prerrequisitos siguen pendientes de validación académica.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            ['8', 'hitos'],
            [String(LEARNING_CLUSTER_COUNT), 'clusters visuales'],
            ['118', 'módulos fuente'],
            [String(process.risks.length), 'riesgos abiertos'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-card border border-[var(--gen-border)] bg-ink-850/80 p-3">
              <div className="text-xl font-bold text-brand-200">{value}</div>
              <div className="mt-0.5 text-[11px] gen-text-muted">{label}</div>
            </div>
          ))}
        </div>

        <div className="mt-3 rounded-card border border-accent-amber/30 bg-accent-amber/[0.07] p-3">
          <div className="text-[12px] font-bold text-accent-amber">Estructura mapeada · validación pedagógica pendiente</div>
          <p className="mt-1 text-[11px] leading-relaxed gen-text-secondary">
            Siguiente decisión: confirmar dependencias, evidencia y rúbrica por hito antes de declarar la ruta operativa.
          </p>
        </div>

        <div className="mt-4 overflow-x-auto pb-1">
          <div className="flex w-max items-center gap-1" role="group" aria-label="Filtrar la ruta de aprendizaje">
            {ROUTE_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={routeFocus === filter.id}
                onClick={() => onRouteFocusChange(filter.id)}
                className={cn(
                  'min-h-11 rounded-btn px-3 text-[12px] font-semibold transition-colors focus-visible:shadow-focus',
                  routeFocus === filter.id
                    ? 'bg-brand-500 text-oncolor'
                    : 'border border-[var(--gen-border)] bg-ink-850 gen-text-secondary',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {visibleLanes.map((lane) => {
            const laneNodes = process.nodes.filter((node) => node.laneId === lane.id);
            const expanded = expandedLaneId === lane.id;
            const milestoneNumber = lane.name.match(/\d+/)?.[0] ?? '—';
            return (
              <section key={lane.id} className="overflow-hidden rounded-card border border-[var(--gen-border)] bg-ink-850/75">
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpandedLaneId(expanded ? null : lane.id)}
                  className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left focus-visible:shadow-focus"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-brand-500/15 text-[12px] font-bold text-brand-200">
                    {milestoneNumber}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold leading-snug text-white">{lane.name}</span>
                    <span className="mt-1 block text-[11px] gen-text-muted">{lane.ownerRole} · {laneNodes.length} clusters</span>
                  </span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={cn('shrink-0 text-brand-300 transition-transform', expanded && 'rotate-180')}
                  />
                </button>
                {expanded && (
                  <div className="border-t border-[var(--gen-border)] px-4 py-3">
                    <ol className="space-y-2">
                      {laneNodes.map((node) => (
                        <li key={node.id} className="rounded-btn border border-white/[0.06] bg-white/[0.025] p-3">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-brand-300">{node.code}</div>
                          <div className="mt-1 text-[13px] font-semibold leading-snug text-white">{node.title}</div>
                          {node.description && <p className="mt-1 text-[11px] leading-relaxed gen-text-muted">{node.description}</p>}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onEdit}
            className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn bg-brand-500 px-4 text-[13px] font-semibold text-oncolor focus-visible:shadow-focus"
          >
            <Pencil size={15} aria-hidden="true" /> Editar mapa
          </button>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-btn border border-[var(--gen-border-strong)] px-4 text-[13px] font-semibold text-brand-200 focus-visible:shadow-focus"
            >
              <ExternalLink size={15} aria-hidden="true" /> Abrir fuente
            </a>
          )}
        </div>
        <p className="mt-3 text-center text-[10px] gen-text-muted">Fuente: Google Sheet · Ruta IA Diplomado · versión del mapa {process.version}</p>
      </div>
    </div>
  );
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
  const setViewMode = useProcessStore((s) => s.setViewMode);
  const theme = useProcessStore((s) => s.theme);

  const { screenToFlowPosition, fitView } = useReactFlow();
  const connectFrom = useRef<{ nodeId: string | null; handleId: string | null } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [routeInspectorNodeId, setRouteInspectorNodeId] = useState<string | null>(null);
  const [routeFocus, setRouteFocus] = useState<RouteFocus>('all');
  const [routeEditMode, setRouteEditMode] = useState(false);
  const [mobileEditMode, setMobileEditMode] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const is3d = viewMode === '3d';
  const isBasic = viewMode === 'basic';
  const isLearningRoute = process.tags.includes('ruta-ia');

  useEffect(() => {
    setRouteFocus(isLearningRoute && !window.matchMedia('(max-width: 767px)').matches ? 'tronco' : 'all');
    setRouteEditMode(false);
    setMobileEditMode(false);
    setRouteInspectorNodeId(null);
  }, [process.id, isLearningRoute]);
  useEffect(() => {
    const compact = window.matchMedia('(max-width: 767px)');
    const syncView = () => {
      setIsCompactViewport(compact.matches);
      if (isLearningRoute && compact.matches) setViewMode('basic');
    };
    syncView();
    compact.addEventListener('change', syncView);
    return () => compact.removeEventListener('change', syncView);
  }, [isLearningRoute, setViewMode]);

  const rfNodes = useMemo(() => {
    const linear = isBasic ? linearLayout(process) : null;
    const compactRoute =
      isLearningRoute && isBasic && window.matchMedia('(max-width: 767px)').matches;
    const compactPositions = new Map(
      compactRoute
        ? process.nodes
            .filter((node) => routeFocus === 'all' || node.metadata?.routeType === routeFocus)
            .map((node, index) => [node.id, { x: 72, y: index * 148 + 48 }] as const)
        : [],
    );
    return toFlowNodes(process)
      .filter((n) => {
        if (n.type === 'lane') return !isBasic; // sin swimlanes en Básico
        if (!isBasic) return true;
        const t = (n.data as { node?: { type?: string } })?.node?.type;
        return !t || !BASIC_HIDDEN.has(t);
      })
      .map((n) => {
        if (n.type === 'lane') {
          const description = (n.data as { lane?: { description?: string } })?.lane?.description ?? '';
          const dimRoute = isLearningRoute && routeFocus !== 'all' && !description.includes(`routeType:${routeFocus}`);
          return {
            ...n,
            hidden: dimRoute,
            style: {
              ...(n.style ?? {}),
              opacity: dimRoute ? 0.16 : 1,
              transition: 'opacity 0.18s ease-out',
            },
          };
        }
        const laneId = (n.data as { node?: { laneId?: string } })?.node?.laneId;
        const nodeRoute = (n.data as { node?: { metadata?: Record<string, string> } })?.node?.metadata?.routeType;
        const dimLane = !isBasic && highlightLaneId !== null && laneId !== highlightLaneId;
        const dimRoute = isLearningRoute && routeFocus !== 'all' && nodeRoute !== routeFocus;
        return {
          ...n,
          data: isLearningRoute ? { ...n.data, onInspect: () => setRouteInspectorNodeId(n.id) } : n.data,
          hidden: dimRoute,
          position: compactPositions.get(n.id) ?? linear?.[n.id] ?? n.position,
          draggable: !isBasic && !dimRoute,
          selectable: !dimRoute,
          style: {
            ...(n.style ?? {}),
            opacity: dimRoute ? 0.12 : dimLane ? 0.26 : 1,
            ...(dimRoute ? { pointerEvents: 'none' as const } : {}),
            transition: 'opacity 0.18s ease-out',
          },
        };
      });
  }, [process, highlightLaneId, isBasic, isLearningRoute, routeFocus]);

  const rfEdges = useMemo(() => {
    let all = toFlowEdges(process);
    if (isBasic) {
      const hidden = new Set(process.nodes.filter((n) => BASIC_HIDDEN.has(n.type)).map((n) => n.id));
      all = all.filter((e) => !hidden.has(e.source) && !hidden.has(e.target));
    }
    if (!isLearningRoute || routeFocus === 'all') return all;
    const visibleIds = new Set(
      process.nodes.filter((n) => n.metadata?.routeType === routeFocus).map((n) => n.id),
    );
    return all.map((edge) => {
      const active = visibleIds.has(edge.source) && visibleIds.has(edge.target);
      return {
        ...edge,
        hidden: !active,
        animated: active ? edge.animated : false,
        selectable: active,
        style: { ...(edge.style ?? {}), opacity: active ? 1 : 0.08 },
      };
    });
  }, [process, isBasic, isLearningRoute, routeFocus]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);
  const fitCurrentView = useCallback(
    (duration = 320) => {
      const allVisibleProcessNodes = nodes.filter((node) => node.type !== 'lane' && !node.hidden);
      const visibleProcessNodes = (
        window.matchMedia('(max-width: 767px)').matches
          ? allVisibleProcessNodes.slice(0, 3)
          : allVisibleProcessNodes
      )
        .map((node) => ({ id: node.id }));
      fitView({
        padding: 0.2,
        duration,
        ...(visibleProcessNodes.length ? { nodes: visibleProcessNodes } : {}),
      });
    },
    [fitView, nodes],
  );

  useEffect(() => {
    if (!isLearningRoute || is3d) return;
    const frame = window.requestAnimationFrame(() => {
      const allVisibleProcessNodes = rfNodes.filter((node) => node.type !== 'lane' && !node.hidden);
      const visibleProcessNodes = (
        window.matchMedia('(max-width: 767px)').matches
          ? allVisibleProcessNodes.slice(0, 3)
          : allVisibleProcessNodes
      )
        .map((node) => ({ id: node.id }));
      fitView({ nodes: visibleProcessNodes, padding: 0.2, duration: 280 });
    });
    return () => window.cancelAnimationFrame(frame);
    // Refit only when the selected route slice changes, not on every node edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [is3d, isBasic, isLearningRoute, process.id, routeFocus]);

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

  if (isLearningRoute && isCompactViewport && !mobileEditMode) {
    return (
      <LearningRouteOverview
        process={process}
        routeFocus={routeFocus}
        onRouteFocusChange={setRouteFocus}
        onEdit={() => {
          setViewMode('basic');
          setMobileEditMode(true);
          setRouteEditMode(true);
        }}
      />
    );
  }

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
          onNodeClick={(_, node) => {
            if (!node.id.startsWith('lane-')) {
              selectNode(node.id);
              setSelectedIds([node.id]);
              if (isLearningRoute) setRouteInspectorNodeId(node.id);
            }
          }}
          onSelectionChange={({ nodes: sel }) => {
            const ids = sel.filter((n) => !n.id.startsWith('lane-')).map((n) => n.id);
            setSelectedIds(ids);
            if (ids.length === 1) selectNode(ids[0]);
            else if (!isLearningRoute || ids.length > 1) selectNode(null);
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
          deleteKeyCode={isLearningRoute && !routeEditMode ? null : ['Backspace', 'Delete']}
          zoomOnDoubleClick={false}
          nodesDraggable={!isBasic && (!isLearningRoute || routeEditMode)}
          nodesConnectable={!isLearningRoute || routeEditMode}
          elementsSelectable
          selectionOnDrag={!isBasic && (!isLearningRoute || routeEditMode)}
          panOnDrag={isLearningRoute && !routeEditMode ? true : isBasic ? true : [1, 2]}
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
        {!is3d && (!isLearningRoute || (routeEditMode && !isCompactViewport)) && (
          <div className="pointer-events-auto absolute left-2 right-2 top-3 overflow-x-auto sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
            <div className="flex w-max items-center gap-1 rounded-btn-lg border border-[var(--gen-border)] bg-ink-850/90 p-1 shadow-elevated backdrop-blur">
              <ToolBtn label="Inicio" onClick={() => addNode('start')} icon={<Play size={15} />} />
              <ToolBtn label="Actividad" onClick={() => addNode('activity')} icon={<Activity size={15} />} />
              <ToolBtn label="Decisión" onClick={() => addNode('decision')} icon={<GitBranch size={15} />} />
              <ToolBtn label="Documento" onClick={() => addNode('document')} icon={<FileText size={15} />} />
              <ToolBtn label="Cola/WIP" onClick={() => addNode('queue')} icon={<Hourglass size={15} />} />
              <ToolBtn label="Fin" onClick={() => addNode('end')} icon={<Flag size={15} />} />
              <div className="mx-0.5 h-5 w-px bg-[var(--gen-border)]" />
              <ToolBtn label="Ordenar" onClick={relayout} icon={<LayoutGrid size={15} />} />
              <ToolBtn label="Ajustar" onClick={() => fitCurrentView(400)} icon={<Maximize size={15} />} />
            </div>
          </div>
        )}

        {!is3d && !isBasic && selectedIds.length >= 2 && (
          <div className={`pointer-events-auto absolute left-1/2 -translate-x-1/2 ${isLearningRoute ? 'top-20' : 'top-16'}`}>
            <AlignToolbar ids={selectedIds} />
          </div>
        )}

        <div className="pointer-events-auto absolute right-3 top-3 hidden md:block">
          <ViewSwitcher />
        </div>

        {isLearningRoute && !is3d && (
          <div
            className={cn(
              'pointer-events-auto absolute left-2 right-2 overflow-x-auto pb-1 sm:left-3 sm:right-auto sm:max-w-[calc(100%-1.5rem)]',
              routeEditMode && !isCompactViewport ? 'top-14' : 'top-3',
            )}
          >
            <div className="flex min-h-11 w-max min-w-full items-center gap-2 rounded-btn-lg border border-[var(--gen-border)] bg-ink-850/95 p-1.5 shadow-elevated backdrop-blur sm:min-w-0">
              {isCompactViewport && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileEditMode(false);
                    setRouteEditMode(false);
                  }}
                  className="flex min-h-10 items-center gap-1.5 rounded-btn border border-[var(--gen-border)] px-3 text-[11px] font-semibold text-brand-200 focus-visible:shadow-focus"
                >
                  <ArrowLeft size={14} aria-hidden="true" /> Volver a ruta
                </button>
              )}
              <div className="hidden min-w-0 border-r border-[var(--gen-border)] px-2 md:block">
                <div className="text-[11px] font-bold text-brand-200">Ruta IA · Diplomado AEC</div>
                <div className="text-[10px] gen-text-muted">8 hitos · 27 clusters · síntesis de 118 módulos fuente · 3 riesgos</div>
              </div>
              <div className="flex items-center gap-1" role="group" aria-label="Filtrar la ruta de aprendizaje">
                {ROUTE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={routeFocus === filter.id}
                    onClick={() => setRouteFocus(filter.id)}
                    className={cn(
                      'min-h-10 rounded-btn px-3 text-[11px] font-semibold transition-colors focus-visible:shadow-focus',
                      routeFocus === filter.id
                        ? 'bg-brand-500 text-oncolor'
                        : 'gen-text-secondary hover:bg-brand-500/10 hover:text-brand-200',
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => fitCurrentView()}
                className="flex min-h-10 items-center gap-1.5 rounded-btn border border-[var(--gen-border)] px-3 text-[11px] font-semibold text-brand-200 transition-colors hover:border-brand-400/50 hover:bg-brand-500/10 focus-visible:shadow-focus"
                aria-label="Ajustar toda la ruta a la vista"
              >
                <Maximize size={14} aria-hidden="true" /> Ajustar vista
              </button>
              {!isCompactViewport && (
                <button
                  type="button"
                  onClick={() => setRouteEditMode((editing) => !editing)}
                  aria-pressed={routeEditMode}
                  className={cn(
                    'flex min-h-10 items-center gap-1.5 rounded-btn border px-3 text-[11px] font-semibold transition-colors focus-visible:shadow-focus',
                    routeEditMode
                      ? 'border-brand-400/50 bg-brand-500/15 text-brand-100'
                      : 'border-[var(--gen-border)] text-brand-200 hover:bg-brand-500/10',
                  )}
                >
                  <Pencil size={14} aria-hidden="true" /> {routeEditMode ? 'Editando mapa' : 'Editar mapa'}
                </button>
              )}
              {!isCompactViewport && (
                <button
                  type="button"
                  onClick={() => {
                    const nextNode = process.nodes.find(
                      (node) => routeFocus === 'all' || node.metadata?.routeType === routeFocus,
                    );
                    if (!nextNode) return;
                    selectNode(nextNode.id);
                    setRouteInspectorNodeId(nextNode.id);
                  }}
                  className="flex min-h-10 items-center gap-1.5 rounded-btn border border-[var(--gen-border)] px-3 text-[11px] font-semibold text-brand-200 hover:bg-brand-500/10 focus-visible:shadow-focus"
                >
                  <ListTree size={14} aria-hidden="true" /> Revisar detalle
                </button>
              )}
              {process.documents[0]?.repository && (
                <a
                  href={process.documents[0].repository}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-10 items-center gap-1.5 rounded-btn border border-[var(--gen-border)] px-3 text-[11px] font-semibold text-brand-200 hover:bg-brand-500/10 focus-visible:shadow-focus"
                >
                  <ExternalLink size={14} aria-hidden="true" /> Fuente
                </a>
              )}
              <span className="hidden rounded-full border border-accent-amber/30 bg-accent-amber/[0.07] px-2.5 py-1.5 text-[10px] font-semibold text-accent-amber lg:inline">
                Validación pedagógica pendiente
              </span>
            </div>
          </div>
        )}

        {process.nodes.length > 0 && (
          <div className="pointer-events-auto absolute bottom-3 left-1/2 hidden -translate-x-1/2 sm:block">
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

      {isLearningRoute && routeInspectorNodeId && (
        <aside className="absolute bottom-3 right-3 top-20 z-50 hidden w-[340px] overflow-hidden rounded-card border border-[var(--gen-border)] bg-ink-850/95 shadow-elevated backdrop-blur md:flex">
          {process.nodes.find((node) => node.id === routeInspectorNodeId) && (
            <NodeInspector
              node={process.nodes.find((node) => node.id === routeInspectorNodeId)!}
              onClose={() => {
                setSelectedIds([]);
                setRouteInspectorNodeId(null);
                setNodes((current) => current.map((node) => ({ ...node, selected: false })));
              }}
            />
          )}
        </aside>
      )}

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
      aria-label={label}
      className="flex h-9 items-center gap-1.5 rounded-btn px-2.5 text-[12px] font-medium text-brand-100 transition-colors hover:bg-white/[0.08] focus-visible:shadow-focus"
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
