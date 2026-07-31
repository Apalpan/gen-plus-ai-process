import { useProcessStore } from '../../store/useProcessStore';
import { NodeInspector } from './NodeInspector';
import { ProcessSummary } from './ProcessSummary';
import { HealthScoreCompact } from './HealthScore';

export function RightPanel() {
  const selectedNodeId = useProcessStore((s) => s.selectedNodeId);
  const node = useProcessStore((s) => s.process.nodes.find((n) => n.id === selectedNodeId));

  return (
    <aside className="gen-side-panel gen-side-panel-right flex w-[340px] shrink-0 flex-col border-l border-[var(--gen-border)] bg-ink-850/95">
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
