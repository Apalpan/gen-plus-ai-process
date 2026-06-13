import { Bot } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { AIConversationPanel } from '../ai/AIConversationPanel';
import { MeasurePanel } from '../process/MeasurePanel';
import { ValidatePanel } from '../process/ValidatePanel';
import { ImplementPanel } from '../process/ImplementPanel';
import { SettingsPanel } from '../process/SettingsPanel';

/** Panel izquierdo contextual por sección (solo en vistas con canvas). */
export function LeftPanel() {
  const section = useProcessStore((s) => s.section);

  return (
    <div className="flex w-[340px] shrink-0 flex-col overflow-hidden border-r border-[var(--gen-border)] bg-ink-850/50">
      {section === 'map' && (
        <div className="flex h-full flex-col">
          <div className="border-b border-[var(--gen-border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot size={15} className="text-brand-400" />
              <span className="text-[13px] font-semibold">Edita conversando</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug gen-text-muted">
              Cada actividad debe tener responsable, entrada y salida. Pídeselo al copilot o edita los nodos directamente.
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <AIConversationPanel />
          </div>
        </div>
      )}
      {section === 'validate' && <ValidatePanel />}
      {section === 'metrics' && <MeasurePanel />}
      {section === 'implement' && <ImplementPanel />}
      {section === 'settings' && <SettingsPanel />}
    </div>
  );
}
