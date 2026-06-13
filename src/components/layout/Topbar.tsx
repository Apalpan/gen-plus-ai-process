import { useState } from 'react';
import { Download, Save, Sun, Moon, Star, Check, LogOut } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';

export function Topbar() {
  const process = useProcessStore((s) => s.process);
  const patchProcess = useProcessStore((s) => s.patchProcess);
  const theme = useProcessStore((s) => s.theme);
  const toggleTheme = useProcessStore((s) => s.toggleTheme);
  const setSection = useProcessStore((s) => s.setSection);
  const saveToLibrary = useProcessStore((s) => s.saveToLibrary);
  const user = useProcessStore((s) => s.user);
  const logout = useProcessStore((s) => s.logout);
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveToLibrary();
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--gen-border)] bg-ink-850/70 px-3 backdrop-blur">
      <Logo />
      <div className="mx-1 h-6 w-px bg-[var(--gen-border)]" />

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          value={process.title}
          onChange={(e) => patchProcess({ title: e.target.value })}
          aria-label="Título del proceso"
          className="min-w-0 max-w-[520px] flex-1 truncate rounded-btn bg-transparent px-2 py-1.5 text-sm font-semibold text-white outline-none transition-colors hover:bg-white/[0.04] focus:bg-white/[0.06] focus-visible:shadow-focus"
        />
        <span className="hidden items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] gen-text-muted sm:flex">
          <Star size={11} className="text-brand-400" /> v{process.version}
        </span>
      </div>

      <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Cambiar tema" title="Tema claro/oscuro">
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </Button>
      <Button variant="secondary" size="sm" onClick={save} leftIcon={saved ? <Check size={16} /> : <Save size={16} />}>
        <span className="hidden sm:inline">{saved ? 'Guardado' : 'Guardar'}</span>
      </Button>
      <Button variant="primary" size="sm" onClick={() => setSection('implement')} leftIcon={<Download size={16} />}>
        <span className="hidden sm:inline">Exportar</span>
      </Button>
      <div className="mx-0.5 h-6 w-px bg-[var(--gen-border)]" />
      <div className="flex items-center gap-1.5">
        {user && (
          <span className="hidden h-7 w-7 items-center justify-center rounded-full bg-brand-500/20 text-[12px] font-bold text-brand-200 sm:flex" title={user}>
            {user.charAt(0).toUpperCase()}
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut size={17} />
        </Button>
      </div>
    </header>
  );
}
