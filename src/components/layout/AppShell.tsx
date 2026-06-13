import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useProcessStore, FLOW_SECTIONS } from '../../store/useProcessStore';
import type { Section } from '../../store/useProcessStore';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomBar } from './BottomBar';
import { LeftPanel } from './LeftPanel';
import { StepBar } from './StepBar';
import { ProcessCanvas } from '../process/ProcessCanvas';
import { RightPanel } from '../process/RightPanel';
import { Dashboard } from '../dashboard/Dashboard';
import { ProcessLibraryView } from '../processes/ProcessLibraryView';
import { CaptureView } from '../capture/CaptureView';
import { AIFirstView } from '../aifirst/AIFirstView';

const FULL_WIDTH: Section[] = ['dashboard', 'processes', 'capture', 'aifirst'];

function SeamToggle({ side, open, onClick }: { side: 'left' | 'right'; open: boolean; onClick: () => void }) {
  const Icon = (side === 'left') === open ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      title={open ? 'Ocultar panel' : 'Mostrar panel'}
      className={`absolute top-1/2 z-30 flex h-12 w-4 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--gen-border)] bg-ink-850/90 text-brand-300 shadow-elevated backdrop-blur transition-colors hover:bg-ink-800 ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
    >
      <Icon size={14} />
    </button>
  );
}

export function AppShell() {
  const section = useProcessStore((s) => s.section);
  const leftOpen = useProcessStore((s) => s.leftPanelOpen);
  const rightOpen = useProcessStore((s) => s.rightPanelOpen);
  const togglePanel = useProcessStore((s) => s.togglePanel);
  const fullWidth = FULL_WIDTH.includes(section);
  const showSteps = FLOW_SECTIONS.includes(section);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-900 text-white">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        {fullWidth ? (
          <main className="flex min-w-0 flex-1 flex-col">
            {showSteps && <StepBar />}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {section === 'dashboard' && <Dashboard />}
              {section === 'processes' && <ProcessLibraryView />}
              {section === 'capture' && <CaptureView />}
              {section === 'aifirst' && <AIFirstView />}
            </div>
          </main>
        ) : (
          <>
            {leftOpen && <LeftPanel />}
            <main className="relative flex min-w-0 flex-1 flex-col">
              {showSteps && <StepBar />}
              <div className="relative min-h-0 flex-1">
                <ProcessCanvas />
                <SeamToggle side="left" open={leftOpen} onClick={() => togglePanel('left')} />
                <SeamToggle side="right" open={rightOpen} onClick={() => togglePanel('right')} />
              </div>
            </main>
            {rightOpen && <RightPanel />}
          </>
        )}
      </div>
      <BottomBar />
    </div>
  );
}
