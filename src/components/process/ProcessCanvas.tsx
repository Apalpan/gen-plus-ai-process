import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  type Connection,
  type Node,
  type NodeChange,
} from 'reactflow';
import { Activity, GitBranch, FileText, LayoutGrid, Zap } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { toFlowEdges, toFlowNodes } from '../../lib/processEngine';
import { makeEdge, NODE_TYPE_META } from '../../lib/processSchema';
import { ProcessNode } from './nodes/ProcessNode';
import { LaneNode } from './nodes/LaneNode';

const nodeTypes = { process: ProcessNode, lane: LaneNode };

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
  const relayout = useProcessStore((s) => s.relayout);
  const addNode = useProcessStore((s) => s.addNode);
  const theme = useProcessStore((s) => s.theme);

  const rfNodes = useMemo(() => {
    return toFlowNodes(process).map((n) =>
      n.type === 'process'
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
      addEdge(makeEdge(c.source, c.target, { type: 'sequence' }));
    },
    [addEdge],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => !node.id.startsWith('lane-') && selectNode(node.id)}
        onPaneClick={() => selectNode(null)}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
        minZoom={0.2}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ type: 'smoothstep' }}
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
            <ToolBtn label="Actividad" onClick={() => addNode('activity')} icon={<Activity size={15} />} />
            <ToolBtn label="Decisión" onClick={() => addNode('decision')} icon={<GitBranch size={15} />} />
            <ToolBtn label="Documento" onClick={() => addNode('document')} icon={<FileText size={15} />} />
            <ToolBtn label="Automatización" onClick={() => addNode('automation')} icon={<Zap size={15} />} />
            <div className="mx-0.5 h-5 w-px bg-[var(--gen-border)]" />
            <ToolBtn label="Reorganizar" onClick={relayout} icon={<LayoutGrid size={15} />} />
          </div>
        </Panel>
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
