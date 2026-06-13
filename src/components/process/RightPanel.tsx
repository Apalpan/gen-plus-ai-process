import { useProcessStore } from '../../store/useProcessStore';
import { NodeInspector } from './NodeInspector';
import { ProcessSummary } from './ProcessSummary';
import { HealthScoreCompact } from './HealthScore';

export function RightPanel() {
  const selectedNodeId = useProcessStore((s) => s.selectedNodeId);
  const node = useProcessStore((s) => s.process.nodes.find((n) => n.id === selectedNodeId));

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-[var(--gen-border)] bg-ink-850/50">
      {node ? (
        <NodeInspector node={node} />
      ) : (
        <div className="flex h-full flex-col">
          <HealthScoreCompact />
          <ProcessSummary />
        </div>
      )}
    </aside>
  );
}
