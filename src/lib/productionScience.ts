import type { ProcessMap, ProcessNodeData, ProductionLever, ProductionReport } from '../types/process';

/**
 * Capa de Producción (PPI / Operations Science).
 * Modela el proceso como un sistema productivo: cycle time, throughput, WIP,
 * eficiencia de flujo, cuello de botella y las 5 palancas de optimización.
 * Heurístico y local — usa los campos touch/wait/WIP/capacity de cada nodo.
 */

const WORK = new Set(['activity', 'approval', 'handoff', 'queue']);
const FORWARD = new Set(['sequence', 'decision_yes', 'decision_no', 'automation']);
const MIN_PER_DAY = 8 * 60;

/** Parsea una duración ("2 h", "30 min", "1 día", "≤ 3 días") a minutos. */
export function parseMinutes(s?: string): number {
  if (!s) return 0;
  const m = s.toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(min|mins|m|h|hr|hora|horas|d|día|dia|días|dias|sem|semana|semanas)/);
  if (!m) {
    const n = parseFloat(s.replace(/[^0-9.,]/g, '').replace(',', '.'));
    return Number.isFinite(n) ? n * 60 : 0; // sin unidad → asume horas
  }
  const v = parseFloat(m[1].replace(',', '.'));
  const u = m[2];
  if (u.startsWith('min') || u === 'm') return v;
  if (u.startsWith('h')) return v * 60;
  if (u.startsWith('d')) return v * MIN_PER_DAY;
  if (u.startsWith('sem')) return v * 5 * MIN_PER_DAY;
  return v * 60;
}

function fmtDuration(min: number): string {
  if (min <= 0) return '—';
  if (min < 60) return `${Math.round(min)} min`;
  const h = min / 60;
  if (h < MIN_PER_DAY / 60) return `${h % 1 === 0 ? h : h.toFixed(1)} h`;
  const d = min / MIN_PER_DAY;
  return `${d % 1 === 0 ? d : d.toFixed(1)} días`;
}

/** Tiempo total de un nodo (touch + wait), con respaldo en SLA/duración. */
function nodeTime(n: ProcessNodeData): { touch: number; wait: number } {
  const touch = parseMinutes(n.touchTime) || parseMinutes(n.estimatedDuration);
  let wait = parseMinutes(n.waitTime);
  if (n.type === 'queue' && !wait) wait = parseMinutes(n.sla) || MIN_PER_DAY; // una cola sin dato ≈ 1 día
  if (!touch && !wait && n.sla) wait = parseMinutes(n.sla);
  return { touch, wait };
}

/** Camino crítico por tiempo acumulado (touch + wait) de inicio a fin. */
function criticalPath(p: ProcessMap): string[] {
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const out: Record<string, string[]> = {};
  p.nodes.forEach((n) => (out[n.id] = []));
  p.edges.forEach((e) => {
    if (FORWARD.has(e.type) && out[e.source] && byId.has(e.target)) out[e.source].push(e.target);
  });

  const memo: Record<string, { time: number; path: string[] }> = {};
  const visiting = new Set<string>();
  const longest = (id: string): { time: number; path: string[] } => {
    if (memo[id]) return memo[id];
    if (visiting.has(id)) return { time: 0, path: [] };
    visiting.add(id);
    const node = byId.get(id)!;
    const t = nodeTime(node);
    const self = t.touch + t.wait;
    let best = { time: 0, path: [] as string[] };
    out[id].forEach((c) => {
      const r = longest(c);
      if (r.time > best.time) best = r;
    });
    visiting.delete(id);
    memo[id] = { time: self + best.time, path: [id, ...best.path] };
    return memo[id];
  };

  const starts = p.nodes.filter((n) => n.type === 'start');
  const seeds = starts.length ? starts : p.nodes.filter((n) => !p.edges.some((e) => FORWARD.has(e.type) && e.target === n.id));
  let best = { time: 0, path: [] as string[] };
  seeds.forEach((s) => {
    const r = longest(s.id);
    if (r.time >= best.time) best = r;
  });
  return best.path;
}

export function runProduction(p: ProcessMap): ProductionReport {
  const byId = new Map(p.nodes.map((n) => [n.id, n]));
  const work = p.nodes.filter((n) => WORK.has(n.type));
  const path = criticalPath(p);

  let touch = 0;
  let wait = 0;
  path.forEach((id) => {
    const t = nodeTime(byId.get(id)!);
    touch += t.touch;
    wait += t.wait;
  });
  const ct = touch + wait;
  const flowEfficiency = ct > 0 ? Math.round((touch / ct) * 100) : 0;

  // WIP ≈ estaciones de trabajo activas; TH ≈ WIP / CT (Little's Law)
  const wip = work.filter((n) => n.type !== 'queue').length;
  const ctDays = ct / MIN_PER_DAY;
  const throughput = ctDays > 0 ? `${(wip / ctDays).toFixed(1)} u/día` : '—';

  // cuello de botella: mayor (touch+wait), o cola con más espera
  let bottleneck: ProductionReport['bottleneck'];
  let maxT = -1;
  [...work, ...p.nodes.filter((n) => n.type === 'queue')].forEach((n) => {
    const t = nodeTime(n);
    const total = t.touch + t.wait;
    if (total > maxT) {
      maxT = total;
      bottleneck = {
        nodeId: n.id,
        title: n.title,
        reason:
          n.type === 'queue'
            ? `Cola con la mayor espera (${fmtDuration(t.wait)}). Limita el throughput del sistema.`
            : `Paso de mayor duración (${fmtDuration(total)}). Probable restricción de capacidad.`,
      };
    }
  });
  if (maxT <= 0) bottleneck = undefined;

  const handoffs = p.nodes.filter((n) => n.type === 'handoff').length;
  const queues = p.nodes.filter((n) => n.type === 'queue').length;
  const withData = work.filter((n) => n.touchTime || n.waitTime).length;
  const dataCompleteness = work.length ? Math.round((withData / work.length) * 100) : 0;
  const highVar = p.nodes.filter((n) => n.variabilityLevel === 'alta');
  const withCapacity = work.some((n) => n.capacity);
  const withWip = p.nodes.some((n) => typeof n.wipLimit === 'number');

  const levers: ProductionLever[] = [
    {
      lever: 'process_design',
      label: 'Diseño del proceso',
      question: '¿El flujo está bien secuenciado y sin traspasos de más?',
      finding: handoffs > 2 ? `${handoffs} handoffs: cada traspaso agrega espera y riesgo. Reduce o formaliza.` : `Secuencia razonable (${handoffs} handoffs).`,
    },
    {
      lever: 'product_design',
      label: 'Diseño del entregable',
      question: '¿El entregable está estandarizado o genera variabilidad?',
      finding: highVar.length ? `${highVar.length} paso(s) de alta variabilidad: estandariza plantillas/criterios.` : 'Sin alta variabilidad marcada. Confirma estándares del entregable.',
    },
    {
      lever: 'variability',
      label: 'Variabilidad',
      question: '¿Qué cambia demasiado entre casos (demanda vs producción)?',
      finding: flowEfficiency > 0 && flowEfficiency < 40 ? `Eficiencia de flujo ${flowEfficiency}%: la mayor parte del tiempo es espera, no trabajo.` : 'Marca la variabilidad por paso (baja/media/alta) para dimensionar buffers.',
    },
    {
      lever: 'wip',
      label: 'WIP / Inventario',
      question: '¿Cuánto trabajo abierto se acumula a la vez?',
      finding: `${wip} estaciones de trabajo, ${queues} cola(s).${withWip ? '' : ' No abras demasiados frentes a la vez: define límites de WIP.'}`,
    },
    {
      lever: 'capacity',
      label: 'Capacidad',
      question: '¿Qué recurso limita la salida (cuello de botella)?',
      finding: bottleneck ? `Cuello: "${bottleneck.title}".${withCapacity ? '' : ' Define la capacidad de los recursos clave.'}` : 'Define touch/wait time para detectar el cuello de botella.',
    },
  ];

  const insights: string[] = [];
  insights.push('Little’s Law: TH = WIP / CT. Más WIP no es más avance; suele aumentar el cycle time.');
  if (flowEfficiency > 0) insights.push(`Eficiencia de flujo ${flowEfficiency}%: de cada hora, ${(flowEfficiency / 100).toFixed(2)} h es trabajo real y el resto es espera.`);
  if (queues === 0) insights.push('No hay colas modeladas: agrega nodos "Cola/WIP" donde el trabajo se acumula para ver dónde se traba.');
  if (dataCompleteness < 50) insights.push('Completa touch time y wait time por paso para que el cycle time y el cuello de botella sean reales.');
  if (p.unitOfFlow) insights.push(`Unidad de flujo: ${p.unitOfFlow}. Todo el sistema debe medirse respecto a esta unidad.`);
  else insights.push('Define la unidad de flujo (qué fluye: RFI, consulta, plano, lote…). Es la base del sistema de producción.');

  // Production Science Score — premia modelar el sistema, no solo dibujarlo
  let score = 0;
  score += (dataCompleteness / 100) * 40;
  score += p.unitOfFlow ? 12 : 0;
  score += queues > 0 ? 12 : 0;
  score += bottleneck ? 14 : 0;
  score += withWip ? 10 : 0;
  score += withCapacity ? 12 : 0;
  const total = Math.round(Math.min(100, score));

  const band =
    total >= 80 ? 'Sistema de producción modelado' : total >= 55 ? 'Producción parcialmente modelada' : total >= 30 ? 'Flujo con datos básicos' : 'Solo diagrama (sin producción)';

  return {
    score: total,
    bandLabel: band,
    cycleTime: fmtDuration(ct),
    touchTime: fmtDuration(touch),
    waitTime: fmtDuration(wait),
    flowEfficiency,
    wip,
    throughput,
    unitOfFlow: p.unitOfFlow ?? '—',
    bottleneck,
    handoffs,
    queues,
    levers,
    insights,
    dataCompleteness,
  };
}

export function productionScore(p: ProcessMap): number {
  return runProduction(p).score;
}
