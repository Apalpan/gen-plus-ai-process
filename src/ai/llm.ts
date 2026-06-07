/**
 * Multi-provider LLM layer for GEN+ AI Process.
 * Claude (Anthropic) goes through the official @anthropic-ai/sdk; OpenAI,
 * Gemini and OpenAI-compatible endpoints use fetch. The user's key is stored
 * locally in the browser and never leaves it except to the chosen provider.
 *
 * ⚠️ Browser-side keys are exposed to the page. This is acceptable for a
 * client-only tool where each user supplies their own key. For production /
 * shared deployments, proxy these calls through a backend instead.
 */

export type ProviderId = 'anthropic' | 'openai' | 'gemini' | 'custom';

export interface LLMConfig {
  provider: ProviderId;
  apiKey: string;
  model: string;
  baseUrl?: string; // for `custom` (OpenAI-compatible) endpoints
}

export interface Integration {
  id: string;
  name: string;
  type: 'mcp' | 'connector';
  url?: string;
  enabled: boolean;
  notes?: string;
}

export const PROVIDERS: { id: ProviderId; label: string; defaultModel: string; help: string }[] = [
  { id: 'anthropic', label: 'Claude (Anthropic)', defaultModel: 'claude-opus-4-8', help: 'Recomendado. Modelos claude-opus-4-8 / claude-sonnet-4-6.' },
  { id: 'openai', label: 'OpenAI (GPT)', defaultModel: 'gpt-4o', help: 'Endpoint /v1/chat/completions.' },
  { id: 'gemini', label: 'Google Gemini', defaultModel: 'gemini-2.0-flash', help: 'API generativelanguage.' },
  { id: 'custom', label: 'Compatible (OpenAI API)', defaultModel: '', help: 'Cualquier endpoint compatible con OpenAI (define Base URL).' },
];

export function defaultModelFor(provider: ProviderId): string {
  return PROVIDERS.find((p) => p.id === provider)?.defaultModel ?? '';
}

export function emptyLLMConfig(): LLMConfig {
  return { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-8' };
}

export function isLLMConfigured(c: LLMConfig | undefined | null): c is LLMConfig {
  return !!c && !!c.apiKey.trim() && !!c.model.trim();
}

/** Sends a single system+user turn and returns the raw text response. */
export async function callLLM(config: LLMConfig, system: string, user: string): Promise<string> {
  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config, system, user);
    case 'gemini':
      return callGemini(config, system, user);
    case 'openai':
    case 'custom':
    default:
      return callOpenAICompatible(config, system, user);
  }
}

async function callAnthropic(config: LLMConfig, system: string, user: string): Promise<string> {
  // Documented Messages endpoint. `anthropic-dangerous-direct-browser-access`
  // enables CORS for browser-only apps (each user supplies their own key).
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-opus-4-8',
      max_tokens: 16000,
      thinking: { type: 'adaptive' },
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await safeText(res)}`);
  const data = await res.json();
  const text: string = (data?.content ?? [])
    .map((block: { type?: string; text?: string }) => (block.type === 'text' ? block.text ?? '' : ''))
    .join('')
    .trim();
  if (!text) throw new Error('Respuesta vacía del modelo.');
  return text;
}

async function callOpenAICompatible(config: LLMConfig, system: string, user: string): Promise<string> {
  const base = config.provider === 'custom' ? (config.baseUrl || '').replace(/\/$/, '') : 'https://api.openai.com/v1';
  if (!base) throw new Error('Define la Base URL del endpoint compatible.');
  const res = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await safeText(res)}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Respuesta vacía del proveedor.');
  return text;
}

async function callGemini(config: LLMConfig, system: string, user: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    config.model,
  )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
    }),
  });
  if (!res.ok) throw new Error(`Error ${res.status}: ${await safeText(res)}`);
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('');
  if (!text) throw new Error('Respuesta vacía de Gemini.');
  return text;
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return res.statusText;
  }
}
