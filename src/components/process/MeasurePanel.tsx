import { useState } from 'react';
import { Gauge, ShieldAlert, HeartPulse, Factory } from 'lucide-react';
import { MetricsPanel } from './MetricsPanel';
import { RisksPanel } from './RisksPanel';
import { HealthPanel } from './HealthPanel';
import { ProductionPanel } from './ProductionPanel';
import { cn } from '../../lib/cn';

type Tab = 'metrics' | 'production' | 'risks' | 'health';

/** Paso 4 — Medir: métricas, producción (PPI), riesgos y salud del proceso. */
export function MeasurePanel() {
  const [tab, setTab] = useState<Tab>('metrics');

  const tabs: { id: Tab; label: string; icon: typeof Gauge }[] = [
    { id: 'metrics', label: 'Métricas', icon: Gauge },
    { id: 'production', label: 'Producción', icon: Factory },
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
                title={t.label}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors',
                  tab === t.id ? 'bg-brand-500/20 text-brand-100' : 'gen-text-muted hover:text-brand-100',
                )}
              >
                <Icon size={13} className="shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'metrics' && <MetricsPanel />}
        {tab === 'production' && <ProductionPanel />}
        {tab === 'risks' && <RisksPanel />}
        {tab === 'health' && <HealthPanel />}
      </div>
    </div>
  );
}
