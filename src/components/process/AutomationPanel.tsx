import { Workflow, Plus, Trash2, ArrowRight, UserCheck } from 'lucide-react';
import { useProcessStore } from '../../store/useProcessStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Field';
import type { Automation } from '../../types/process';

function AutoCard({ auto }: { auto: Automation }) {
  const patch = useProcessStore((s) => s.patchAutomation);
  const del = useProcessStore((s) => s.deleteAutomation);

  return (
    <div className="rounded-card border border-accent-violet/25 bg-accent-violet/[0.06] p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-btn bg-accent-violet/20 text-accent-violet">
            <Workflow size={15} />
          </span>
          <Input value={auto.name} onChange={(e) => patch(auto.id, { name: e.target.value })} className="!py-1 !text-[13px] !font-semibold" />
        </div>
        <button onClick={() => del(auto.id)} className="shrink-0 text-[var(--gen-text-muted)] hover:text-accent-red" aria-label="Eliminar">
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-2 space-y-1.5 text-[11px]">
        <label className="block">
          <span className="gen-text-muted">Trigger</span>
          <Input value={auto.trigger} onChange={(e) => patch(auto.id, { trigger: e.target.value })} className="!py-1.5 !text-[12px]" />
        </label>
        <label className="block">
          <span className="gen-text-muted">Acción</span>
          <Input value={auto.action} onChange={(e) => patch(auto.id, { action: e.target.value })} className="!py-1.5 !text-[12px]" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="gen-text-muted">Input</span>
            <Input value={auto.inputData ?? ''} onChange={(e) => patch(auto.id, { inputData: e.target.value })} className="!py-1.5 !text-[12px]" />
          </label>
          <label className="block">
            <span className="gen-text-muted">Output</span>
            <Input value={auto.outputData ?? ''} onChange={(e) => patch(auto.id, { outputData: e.target.value })} className="!py-1.5 !text-[12px]" />
          </label>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[11px]">
        <span className="flex items-center gap-1 rounded-full bg-white/[0.05] px-2 py-0.5 gen-text-secondary">
          {auto.inputData ?? 'input'} <ArrowRight size={11} /> {auto.outputData ?? 'output'}
        </span>
        <button
          onClick={() => patch(auto.id, { humanInTheLoop: !auto.humanInTheLoop })}
          className={`flex items-center gap-1 rounded-full px-2 py-0.5 transition-colors ${
            auto.humanInTheLoop ? 'bg-accent-amber/20 text-accent-amber' : 'bg-white/[0.05] gen-text-muted'
          }`}
          title="Human-in-the-loop"
        >
          <UserCheck size={11} /> {auto.humanInTheLoop ? 'HITL' : 'Auto'}
        </button>
      </div>
    </div>
  );
}

export function AutomationPanel() {
  const autos = useProcessStore((s) => s.process.automations);
  const add = useProcessStore((s) => s.addAutomation);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 pt-4">
        <Workflow size={16} className="text-accent-violet" />
        <h2 className="text-[14px] font-bold tracking-tight">Automatizaciones</h2>
        <span className="ml-auto text-[11px] gen-text-muted">{autos.length}</span>
      </div>
      <p className="px-4 pb-1 pt-1 text-[12px] gen-text-muted">Trigger → acción con input, output y human-in-the-loop.</p>

      <div className="flex-1 space-y-2.5 overflow-y-auto p-4 pt-2">
        {autos.map((a) => (
          <AutoCard key={a.id} auto={a} />
        ))}
        <Button variant="secondary" size="sm" className="w-full" onClick={add} leftIcon={<Plus size={15} />}>
          Agregar automatización
        </Button>
      </div>
    </div>
  );
}
