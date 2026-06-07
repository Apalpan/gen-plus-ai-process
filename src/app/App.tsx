import { useProcessStore } from '../store/useProcessStore';
import { Home } from '../components/home/Home';
import { AppShell } from '../components/layout/AppShell';

export default function App() {
  const view = useProcessStore((s) => s.view);
  return view === 'home' ? <Home /> : <AppShell />;
}
