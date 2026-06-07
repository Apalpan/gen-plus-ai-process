import type { ProcessKind, ProcessMap, ProcessPrompt } from '../types/process';
import {
  buildAcademico,
  buildAdmin,
  buildComercial,
  buildEventos,
  buildGeneric,
  buildObra,
  buildVDC,
} from '../data/templates';
import { nowIso } from '../lib/processSchema';

/* ----------------------------------------------------------------
   INTEGRATION POINT — replace the heuristic with a real LLM here.

   async function callRealLLM(prompt: ProcessPrompt): Promise<ProcessMap> {
     // OpenAI:   POST https://api.openai.com/v1/chat/completions
     // Claude:   POST https://api.anthropic.com/v1/messages   (model: claude-opus-4-8)
     // Internal: POST /api/generate
     // Persist:  Supabase / Firebase / GitHub storage
     //
     // Send MASTER_PROMPT (src/ai/masterPrompt.ts) as the system prompt and
     // buildUserMessage(prompt) as the user message. Parse the JSON response
     // into a ProcessMap and return it.
   }
---------------------------------------------------------------- */

const KEYWORDS: Record<ProcessKind, string[]> = {
  obra: ['consulta', 'duda', 'obra', 'plano', 'rfi', 'sdi', 'campo', 'cde', 'interferenc', 'encofrado', 'cierre de consulta', 'trazabilidad'],
  bim_via: ['bim', 'vdc', ' via', 'ice', 'ppm', 'modelo federado', 'clash', 'lookahead', 'federado', 'auditoría', 'publicar modelo'],
  ice: ['sesión ice', 'ice'],
  ppm: ['ppm', 'lookahead', 'compromiso'],
  comercial: ['lead', 'venta', 'comercial', 'propuesta', 'negociaci', 'crm', 'pipeline', 'b2b', 'cliente potencial', 'cotizaci', 'cierre de venta'],
  academico: ['curso', 'academ', 'alumno', 'estudiante', 'instructor', 'cohorte', 'certific', 'comunidad', 'temario', 'programa formativo'],
  administracion: ['administrat', 'factura', 'tramite', 'trámite', 'aprobaci', 'expediente', 'archivo', 'registro administrativo', 'planilla'],
  evento: ['sponsor', 'evento', 'patrocin', 'activaci', 'auspici'],
  soporte: ['ticket', 'soporte', 'incidencia', 'mesa de ayuda', 'sla de atención'],
  producto: ['feature', 'producto', 'roadmap', 'release', 'backlog'],
  custom: [],
};

export function detectKind(input: string): ProcessKind {
  const text = input.toLowerCase();
  const scores: Partial<Record<ProcessKind, number>> = {};
  (Object.keys(KEYWORDS) as ProcessKind[]).forEach((kind) => {
    const hits = KEYWORDS[kind].reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
    if (hits > 0) scores[kind] = hits;
  });
  const ranked = (Object.entries(scores) as [ProcessKind, number][]).sort((a, b) => b[1] - a[1]);
  return ranked.length ? ranked[0][0] : 'custom';
}

function buildForKind(kind: ProcessKind): ProcessMap {
  switch (kind) {
    case 'obra':
      return buildObra();
    case 'bim_via':
    case 'ice':
    case 'ppm':
      return buildVDC();
    case 'comercial':
      return buildComercial();
    case 'academico':
      return buildAcademico();
    case 'evento':
      return buildEventos();
    case 'administracion':
      return buildAdmin();
    default:
      return buildGeneric();
  }
}

function deriveTitle(input: string, fallback: string): string {
  const firstLine = input.split(/[.\n]/)[0]?.trim() ?? '';
  if (firstLine.length >= 12 && firstLine.length <= 70) {
    return firstLine.charAt(0).toUpperCase() + firstLine.slice(1);
  }
  return fallback;
}

/**
 * Main generation entrypoint — currently heuristic, API-ready by contract.
 * Returns a fully-populated ProcessMap derived from the natural-language input.
 */
export async function generateProcessFromAI(prompt: ProcessPrompt): Promise<ProcessMap> {
  // Simulated latency so the UI can show a thinking state (and to mirror a real API).
  await new Promise((r) => setTimeout(r, 480));

  const kind: ProcessKind = prompt.kind === 'auto' ? detectKind(prompt.input) : prompt.kind;
  const base = kind === 'custom' && prompt.input.trim()
    ? buildGeneric(deriveTitle(prompt.input, 'Proceso a medida'), '', prompt.input)
    : buildForKind(kind);

  const personalized: ProcessMap = {
    ...base,
    id: 'gen_' + Date.now().toString(36),
    title: prompt.input.trim() ? deriveTitle(prompt.input, base.title) : base.title,
    context: prompt.input.trim() ? prompt.input.trim() : base.context,
    maturityLevel: prompt.maturity,
    tags: Array.from(new Set([...base.tags, kind])),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  return personalized;
}
