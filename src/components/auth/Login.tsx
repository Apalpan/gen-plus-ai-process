import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LogIn, Lock, User } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Logo } from '../brand/Logo';
import { Button } from '../ui/Button';

/** Puerta de acceso simple (demo): cualquier usuario + clave no vacía entra. */
export function Login() {
  const login = useProcessStore((s) => s.login);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = user.trim();
    if (!u || !pass.trim()) {
      setErr('Ingresa un usuario y cualquier clave.');
      return;
    }
    login(u);
  };

  return (
    <div className="dark relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-ink-900 text-white">
      <div className="pointer-events-none absolute inset-0 bg-gen-hero opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dots [background-size:26px_26px] opacity-[0.45]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink-900/40 via-ink-900/60 to-ink-900" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[360px] max-w-[92vw]"
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo />
          <p className="text-[13px] leading-relaxed text-[var(--gen-text-secondary)]">
            Mapea cómo trabaja tu equipo y conviértelo en un sistema de producción medible.
          </p>
        </div>

        <form onSubmit={submit} className="gen-surface rounded-card-lg p-5 shadow-elevated">
          <label className="mb-1.5 block text-[12px] font-semibold gen-text-secondary">Usuario</label>
          <div className="relative mb-3">
            <User size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gen-text-muted)]" />
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
              placeholder="tu.nombre"
              className="min-h-[44px] w-full rounded-btn border border-[var(--gen-border)] bg-ink-900/60 pl-9 pr-3 text-sm text-white outline-none transition-all placeholder:text-[var(--gen-text-muted)] hover:border-brand-400/40 focus:border-brand-400/70 focus-visible:shadow-focus"
            />
          </div>

          <label className="mb-1.5 block text-[12px] font-semibold gen-text-secondary">Clave</label>
          <div className="relative mb-1">
            <Lock size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gen-text-muted)]" />
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder="cualquier clave"
              className="min-h-[44px] w-full rounded-btn border border-[var(--gen-border)] bg-ink-900/60 pl-9 pr-3 text-sm text-white outline-none transition-all placeholder:text-[var(--gen-text-muted)] hover:border-brand-400/40 focus:border-brand-400/70 focus-visible:shadow-focus"
            />
          </div>
          {err && <p className="mb-1 mt-1 text-[11.5px] text-accent-red">{err}</p>}

          <Button type="submit" size="lg" className="mt-3 w-full" leftIcon={<LogIn size={18} />} rightIcon={<ArrowRight size={18} />}>
            Entrar
          </Button>
          <p className="mt-3 text-center text-[11px] gen-text-muted">Demo · cualquier clave funciona. Tus procesos se guardan en este navegador.</p>
        </form>
      </motion.div>
    </div>
  );
}
