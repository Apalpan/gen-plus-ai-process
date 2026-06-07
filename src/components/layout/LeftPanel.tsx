import { useProcessStore } from '../../store/useProcessStore';
import { PromptComposer } from '../ai/PromptComposer';
import { AIConversationPanel } from '../ai/AIConversationPanel';
import { TemplatesPanel } from '../process/TemplatesPanel';
import { MetricsPanel } from '../process/MetricsPanel';
import { RisksPanel } from '../process/RisksPanel';
import { AutomationPanel } from '../process/AutomationPanel';
import { HealthPanel } from '../process/HealthPanel';
import { ExportPanel } from '../process/ExportPanel';
import { RoadmapPanel } from '../process/RoadmapPanel';
import { SettingsPanel } from '../process/SettingsPanel';

export function LeftPanel() {
  const section = useProcessStore((s) => s.section);

  return (
    <div className="flex w-[340px] shrink-0 flex-col overflow-hidden border-r border-[var(--gen-border)] bg-ink-850/50">
      {section === 'builder' && (
        <div className="flex h-full flex-col">
          <div className="max-h-[56%] shrink-0 overflow-y-auto">
            <PromptComposer />
          </div>
          <div className="min-h-0 flex-1">
            <AIConversationPanel />
          </div>
        </div>
      )}
      {section === 'templates' && <TemplatesPanel />}
      {section === 'metrics' && <MetricsPanel />}
      {section === 'risks' && <RisksPanel />}
      {section === 'automations' && <AutomationPanel />}
      {section === 'health' && <HealthPanel />}
      {section === 'export' && <ExportPanel />}
      {section === 'roadmap' && <RoadmapPanel />}
      {section === 'settings' && <SettingsPanel />}
    </div>
  );
}
