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

export function AppShell() {
  const section = useProcessStore((s) => s.section);
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
            <LeftPanel />
            <main className="relative flex min-w-0 flex-1 flex-col">
              {showSteps && <StepBar />}
              <div className="relative min-h-0 flex-1">
                <ProcessCanvas />
              </div>
            </main>
            <RightPanel />
          </>
        )}
      </div>
      <BottomBar />
    </div>
  );
}
