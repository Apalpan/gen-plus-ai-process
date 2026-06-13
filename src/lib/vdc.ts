import type { ProcessMap } from '../types/process';

/**
 * Cobertura VDC: conecta objetivos cliente → proyecto → producción → factores
 * controlables, e ICE / BIM / PPM. Mide qué tan completa está la cadena VDC.
 */
export interface VdcCoverageItem {
  key: string;
  label: string;
  present: boolean;
}

export interface VdcCoverage {
  score: number; // 0..100
  items: VdcCoverageItem[];
}

export function vdcCoverage(p: ProcessMap): VdcCoverage {
  const text = [
    ...p.nodes.map((n) => `${n.title} ${n.code ?? ''} ${n.description ?? ''}`),
    ...p.metrics.map((m) => `${m.name} ${m.code}`),
    ...p.lanes.map((l) => l.name),
    p.objective,
    p.northStarMetric ?? '',
  ]
    .join(' ')
    .toLowerCase();
  const hasMetric = (cat: string) => p.metrics.some((m) => m.category === cat);

  const items: VdcCoverageItem[] = [
    { key: 'co', label: 'Objetivo del cliente', present: hasMetric('client_objective') || /objetivo.*client|operabilidad/.test(text) },
    { key: 'po', label: 'Objetivo del proyecto', present: hasMetric('project_objective') || /objetivo.*proyecto|hito/.test(text) },
    { key: 'oprod', label: 'Objetivo de producción', present: hasMetric('production_objective') || /producci[oó]n|throughput|avance/.test(text) },
    { key: 'fc', label: 'Factores controlables', present: hasMetric('controllable_factor') || /factor controlable|fci|pre-read/.test(text) },
    { key: 'ice', label: 'Sesiones ICE', present: /\bice\b|sesi[oó]n ice/.test(text) },
    { key: 'bim', label: 'BIM / CDE / modelo', present: /\bbim\b|\bcde\b|modelo federado|clash|acc/.test(text) || p.documents.some((d) => /cde|bim|acc/i.test(`${d.name} ${d.repository ?? ''}`)) },
    { key: 'ppm', label: 'PPM / lookahead', present: /\bppm\b|lookahead|last planner|ppc|restriccion/.test(text) },
  ];

  const present = items.filter((i) => i.present).length;
  return { score: Math.round((present / items.length) * 100), items };
}
