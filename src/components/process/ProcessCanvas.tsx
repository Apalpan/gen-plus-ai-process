import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
} from 'reactflow';
import { Play, Activity, GitBranch, FileText, Flag, LayoutGrid, Sparkles } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { toFlowEdges, toFlowNodes } from '../../lib/processEngine';
import { makeEdge, NODE_TYPE_META } from '../../lib/processSchema';
import { ProcessNode } from './nodes/ProcessNode';
import { DecisionNode } from './nodes/DecisionNode';
import { TerminalNode } from './nodes/TerminalNode';
import { LaneNode } from './nodes/LaneNode';
import { GenEdge } from './edges/GenEdge';

const nodeTypes = { process: ProcessNode, decision: DecisionNode, terminal: TerminalNode, lane: LaneNode };
const edgeTypes = { gen: GenEdge };

function miniMapColor(node: Node): string {
  if (node.type === 'lane') return 'rgba(106,152,255,0.06)';
  const data = node.data as { node?: { type?: keyof typeof NODE_TYPE_META } };
  const t = data?.node?.type;
  return t ? NODE_TYPE_META[t].color : '#4D84FF';
}

export function ProcessCanvas() {
  const process = useProcessStore((s) => s.process);
  const selectedNodeId = useProcessStore((s) => s.selectedNodeId);
  const selectNode = useProcessStore((s) => s.selectNode);
  const moveNode = useProcessStore((s) => s.moveNode);
  const addEdge = useProcessStore((s) => s.addEdge);
  const deleteEdge = useProcessStore((s) => s.deleteEdge);
  const deleteNode = useProcessStore((s) => s.deleteNode);
  const relayout = useProcessStore((s) => s.relayout);
  const addNode = useProcessStore((s) => s.addNode);
  const seedSkeleton = useProcessStore((s) => s.seedSkeleton);
  const setSection = useProcessStore((s) => s.setSection);
  const theme = useProcessStore((s) => s.theme);

  const rfNodes = useMemo(() => {
    return toFlowNodes(process).map((n) =>
      n.type !== 'lane'
        ? { ...n, data: { ...n.data, isSelected: n.id === selectedNodeId }, selected: n.id === selectedNodeId }
        : n,
    );
  }, [process, selectedNodeId]);

  const rfEdges = useMemo(() => toFlowEdges(process), [process]);

  const [nodes, setNodes, onNodesChange] = useNodesState(rfNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(rfEdges);

  useEffect(() => setNodes(rfNodes), [rfNodes, setNodes]);
  useEffect(() => setEdges(rfEdges), [rfEdges, setEdges]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
      changes.forEach((c) => {
        if (c.type === 'position' && c.position && !c.dragging) {
          if (!c.id.startsWith('lane-')) moveNode(c.id, c.position);
        }
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

  const onEdgesDelete = useCallback((eds: Edge[]) => eds.forEach((e) => deleteEdge(e.id)), [deleteEdge]);
  const onNodesDelete = useCallback(
    (nds: Node[]) => nds.forEach((n) => !n.id.startsWith('lane-') && deleteNode(n.id)),
    [deleteNode],
  );

  return (
    <div className="relative h-full w-full">
      {process.nodes.length === 0 && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <div className="gen-surface pointer-events-auto max-w-sm rounded-card-lg p-6 text-center shadow-elevated">
            <p className="text-[15px] font-semibold">Empieza tu mapa</p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed gen-text-muted">
              No necesitas dibujar perfecto. Genera la lógica desde una descripción, o crea el esqueleto y arrástralo.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                onClick={() => setSection('capture')}
                className="flex items-center justify-center gap-1.5 rounded-btn bg-brand-500 px-4 py-2.5 text-[13px] font-semibold text-oncolor transition-colors hover:bg-brand-400"
              >
                <Sparkles size={15} /> Generar con IA (Capturar)
              </button>
              <button
                onClick={seedSkeleton}
                className="flex items-center justify-center gap-1.5 rounded-btn border border-[var(--gen-border-strong)] px-4 py-2.5 text-[13px] font-semibold text-brand-100 transition-colors hover:bg-white/[0.06]"
              >
                <Play size={14} /> Crear Inicio → Actividad → Fin
              </button>
            </div>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgesDelete={onEdgesDelete}
        onNodesDelete={onNodesDelete}
        onNodeClick={(_, node) => !node.id.startsWith('lane-') && selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#4D84FF', strokeWidth: 2.5 }}
        deleteKeyCode={['Backspace', 'Delete']}
        zoomOnDoubleClick={false}
        className="bg-ink-900"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color={theme === 'dark' ? 'rgba(106,152,255,0.14)' : 'rgba(33,101,255,0.16)'}
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={miniMapColor}
          maskColor={theme === 'dark' ? 'rgba(4,15,32,0.78)' : 'rgba(237,242,252,0.82)'}
        />

        <Panel position="top-left" className="!m-3">
          <div className="flex items-center gap-1 rounded-btn-lg border border-[var(--gen-border)] bg-ink-850/90 p-1 shadow-elevated backdrop-blur">
            <ToolBtn label="Inicio" onClick={() => addNode('start')} icon={<Play size={15} />} />
            <ToolBtn label="Actividad" onClick={() => addNode('activity')} icon={<Activity size={15} />} />
            <ToolBtn label="Decisión" onClick={() => addNode('decision')} icon={<GitBranch size={15} />} />
            <ToolBtn label="Documento" onClick={() => addNode('document')} icon={<FileText size={15} />} />
            <ToolBtn label="Fin" onClick={() => addNode('end')} icon={<Flag size={15} />} />
            <div className="mx-0.5 h-5 w-px bg-[var(--gen-border)]" />
            <ToolBtn label="Ordenar" onClick={relayout} icon={<LayoutGrid size={15} />} />
          </div>
        </Panel>

        {process.nodes.length > 0 && (
          <Panel position="bottom-center" className="!mb-2">
            <div className="rounded-full border border-[var(--gen-border)] bg-ink-850/85 px-3 py-1 text-[11px] gen-text-muted shadow-elevated backdrop-blur">
              Pasa el cursor sobre un nodo y pulsa <b className="text-brand-300">+</b> para añadir el siguiente paso · doble clic para renombrar · arrastra los puntos para conectar
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
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
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
