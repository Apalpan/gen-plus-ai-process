import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomBar } from './BottomBar';
import { LeftPanel } from './LeftPanel';
import { ProcessCanvas } from '../process/ProcessCanvas';
import { RightPanel } from '../process/RightPanel';

export function AppShell() {
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-ink-900 text-white">
      <Topbar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <LeftPanel />
        <main className="relative min-w-0 flex-1">
          <ProcessCanvas />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  );
}
