import { useProcessStore } from '../store/useProcessStore';
import { Home } from '../components/home/Home';
import { AppShell } from '../components/layout/AppShell';
import { Login } from '../components/auth/Login';

export default function App() {
  const user = useProcessStore((s) => s.user);
  const view = useProcessStore((s) => s.view);
  if (!user) return <Login />;
  return view === 'home' ? <Home /> : <AppShell />;
}
