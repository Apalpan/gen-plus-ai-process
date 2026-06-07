import { HardHat, Network, TrendingUp, GraduationCap, CalendarHeart, FileCog, FilePlus2, Sparkles, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { templates } from '../../data/templates';
import { useProcessStore } from '../../store/useProcessStore';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

const ICONS: Record<string, LucideIcon> = {
  Users,
  HardHat,
  Network,
  TrendingUp,
  GraduationCap,
  CalendarHeart,
  FileCog,
};

export function TemplatesPanel() {
  const loadTemplate = useProcessStore((s) => s.loadTemplate);
  const newBlank = useProcessStore((s) => s.newBlank);
  const setSection = useProcessStore((s) => s.setSection);

  return (
    <div className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-brand-400" />
        <h2 className="text-[14px] font-bold tracking-tight">Plantillas</h2>
      </div>
      <p className="mb-3 text-[12px] gen-text-muted">Procesos precargados, completos y editables.</p>

      <div className="space-y-2.5">
        {templates.map((t) => {
          const Icon = ICONS[t.icon] ?? Network;
          return (
            <Card key={t.id} interactive onClick={() => loadTemplate(t.id)} className="p-3">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-btn bg-brand-500/15 text-brand-300">
                  <Icon size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[13.5px] font-semibold leading-tight">{t.name}</h3>
                  <p className="mt-0.5 text-[11.5px] leading-snug gen-text-muted">{t.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="secondary" size="sm" onClick={newBlank} leftIcon={<FilePlus2 size={15} />}>
          En blanco
        </Button>
        <Button variant="primary" size="sm" onClick={() => setSection('builder')} leftIcon={<Sparkles size={15} />}>
          Usar IA
        </Button>
      </div>
    </div>
  );
}
