import { useState } from 'react';
import { Gauge, ShieldAlert, HeartPulse } from 'lucide-react';
import { MetricsPanel } from './MetricsPanel';
import { RisksPanel } from './RisksPanel';
import { HealthPanel } from './HealthPanel';
import { cn } from '../../lib/cn';

type Tab = 'metrics' | 'risks' | 'health';

/** Paso 3 — Medir: métricas, riesgos y salud del proceso en un solo lugar. */
export function MeasurePanel() {
  const [tab, setTab] = useState<Tab>('metrics');

  const tabs: { id: Tab; label: string; icon: typeof Gauge }[] = [
    { id: 'metrics', label: 'Métricas', icon: Gauge },
    { id: 'risks', label: 'Riesgos', icon: ShieldAlert },
    { id: 'health', label: 'Salud', icon: HeartPulse },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 pt-3">
        <p className="mb-2 text-[11px] leading-snug gen-text-muted">Una métrica sin decisión asociada no sirve. Conecta cada métrica a un nodo del proceso.</p>
        <div className="flex rounded-btn bg-ink-900/60 p-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-semibold transition-colors',
                  tab === t.id ? 'bg-brand-500/20 text-brand-100' : 'gen-text-muted hover:text-brand-100',
                )}
              >
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'metrics' && <MetricsPanel />}
        {tab === 'risks' && <RisksPanel />}
        {tab === 'health' && <HealthPanel />}
      </div>
    </div>
  );
}
