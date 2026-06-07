import { create } from 'zustand';
import type {
  Automation,
  HealthReport,
  Lane,
  Metric,
  NodeType,
  ProcessEdgeData,
  ProcessMap,
  ProcessNodeData,
  ProcessPrompt,
  Risk,
  XY,
} from '../types/process';
import { autoLayout } from '../lib/processEngine';
import { runHealthCheck } from '../lib/health';
import { emptyProcess, makeAutomation, makeMetric, makeNode, makeRisk, nowIso } from '../lib/processSchema';
import { buildObra, getTemplateById } from '../data/templates';
import { generateProcessFromAI } from '../ai/ProcessGenerator';
import { runCopilot } from '../ai/copilot';

export type View = 'home' | 'app';
export type Section =
  | 'builder'
  | 'templates'
  | 'metrics'
  | 'risks'
  | 'automations'
  | 'health'
  | 'export'
  | 'roadmap'
  | 'settings';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  code?: string;
}

interface ProcessState {
  view: View;
  section: Section;
  theme: 'dark' | 'light';
  process: ProcessMap;
  selectedNodeId: string | null;
  isGenerating: boolean;
  chat: ChatMessage[];

  // derived
  health: () => HealthReport;

  // navigation
  setView: (v: View) => void;
  setSection: (s: Section) => void;
  toggleTheme: () => void;
  selectNode: (id: string | null) => void;

  // process lifecycle
  loadProcess: (p: ProcessMap, opts?: { relayout?: boolean }) => void;
  loadTemplate: (id: string) => void;
  newBlank: () => void;
  generate: (prompt: ProcessPrompt) => Promise<void>;
  relayout: () => void;

  // editing
  patchProcess: (patch: Partial<ProcessMap>) => void;
  patchNode: (id: string, patch: Partial<ProcessNodeData>) => void;
  moveNode: (id: string, position: XY) => void;
  addNode: (type: NodeType, laneId?: string) => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: ProcessEdgeData) => void;
  deleteEdge: (id: string) => void;
  addLane: () => void;
  patchLane: (id: string, patch: Partial<Lane>) => void;
  toggleChecklist: (id: string) => void;

  // metrics / risks / automations
  addMetric: () => void;
  patchMetric: (id: string, patch: Partial<Metric>) => void;
  deleteMetric: (id: string) => void;
  addRisk: () => void;
  patchRisk: (id: string, patch: Partial<Risk>) => void;
  deleteRisk: (id: string) => void;
  addAutomation: () => void;
  patchAutomation: (id: string, patch: Partial<Automation>) => void;
  deleteAutomation: (id: string) => void;

  // copilot
  sendCopilot: (command: string) => void;
}

const initialProcess = ((): ProcessMap => {
  const p = buildObra();
  return { ...p, nodes: autoLayout(p) };
})();

export const useProcessStore = create<ProcessState>((set, get) => ({
  view: 'home',
  section: 'builder',
  theme: 'dark',
  process: initialProcess,
  selectedNodeId: null,
  isGenerating: false,
  chat: [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        '¡Hola! Soy tu Process Copilot. Puedo simplificar, hacer más técnico, agregar métricas, detectar cuellos de botella, asignar responsables o exportar el proceso. Escribe una instrucción.',
    },
  ],

  health: () => runHealthCheck(get().process),

  setView: (v) => set({ view: v }),
  setSection: (s) => set({ section: s }),
  toggleTheme: () =>
    set((st) => {
      const theme = st.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      return { theme };
    }),
  selectNode: (id) => set({ selectedNodeId: id }),

  loadProcess: (p, opts = { relayout: true }) =>
    set({
      process: opts.relayout ? { ...p, nodes: autoLayout(p) } : p,
      selectedNodeId: null,
    }),

  loadTemplate: (id) => {
    const tpl = getTemplateById(id);
    if (!tpl) return;
    const p = tpl.build();
    set({ process: { ...p, nodes: autoLayout(p) }, selectedNodeId: null, section: 'builder', view: 'app' });
  },

  newBlank: () => {
    const p = emptyProcess();
    set({ process: p, selectedNodeId: null, view: 'app', section: 'builder' });
  },

  generate: async (prompt) => {
    set({ isGenerating: true });
    set((st) => ({
      chat: [...st.chat, { id: 'u' + Date.now(), role: 'user', text: prompt.input || '(generar proceso)' }],
    }));
    try {
      const p = await generateProcessFromAI(prompt);
      set({
        process: { ...p, nodes: autoLayout(p) },
        selectedNodeId: null,
        isGenerating: false,
        view: 'app',
        section: 'builder',
      });
      const report = runHealthCheck(p);
      set((st) => ({
        chat: [
          ...st.chat,
          {
            id: 'a' + Date.now(),
            role: 'assistant',
            text: `Listo. Generé "${p.title}" con ${p.lanes.length} carriles, ${p.nodes.length} nodos, ${p.metrics.length} métricas y ${p.risks.length} riesgos. Health Score inicial: ${report.score}/100 (${report.bandLabel}). Edita cualquier nodo o pídeme ajustes.`,
          },
        ],
      }));
    } catch {
      set({ isGenerating: false });
      set((st) => ({
        chat: [...st.chat, { id: 'e' + Date.now(), role: 'assistant', text: 'No pude generar el proceso. Revisa la instrucción e inténtalo de nuevo.' }],
      }));
    }
  },

  relayout: () =>
    set((st) => ({ process: { ...st.process, nodes: autoLayout(st.process), updatedAt: nowIso() } })),

  patchProcess: (patch) =>
    set((st) => ({ process: { ...st.process, ...patch, updatedAt: nowIso() } })),

  patchNode: (id, patch) =>
    set((st) => ({
      process: {
        ...st.process,
        nodes: st.process.nodes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
        updatedAt: nowIso(),
      },
    })),

  moveNode: (id, position) =>
    set((st) => ({
      process: {
        ...st.process,
        nodes: st.process.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
      },
    })),

  addNode: (type, laneId) =>
    set((st) => {
      const lane = laneId ?? st.process.lanes[0]?.id;
      if (!lane) return st;
      const existing = st.process.nodes.filter((n) => n.laneId === lane);
      const maxX = existing.length ? Math.max(...existing.map((n) => n.position.x)) : 0;
      const laneIdx = st.process.lanes.findIndex((l) => l.id === lane);
      const node = makeNode({
        type,
        title: `Nuevo ${type}`,
        laneId: lane,
        position: { x: maxX + 248, y: laneIdx * 168 + 46 },
      });
      return { process: { ...st.process, nodes: [...st.process.nodes, node], updatedAt: nowIso() }, selectedNodeId: node.id };
    }),

  deleteNode: (id) =>
    set((st) => ({
      process: {
        ...st.process,
        nodes: st.process.nodes.filter((n) => n.id !== id),
        edges: st.process.edges.filter((e) => e.source !== id && e.target !== id),
        updatedAt: nowIso(),
      },
      selectedNodeId: st.selectedNodeId === id ? null : st.selectedNodeId,
    })),

  addEdge: (edge) =>
    set((st) => ({ process: { ...st.process, edges: [...st.process.edges, edge], updatedAt: nowIso() } })),

  deleteEdge: (id) =>
    set((st) => ({ process: { ...st.process, edges: st.process.edges.filter((e) => e.id !== id), updatedAt: nowIso() } })),

  addLane: () =>
    set((st) => {
      const idx = st.process.lanes.length;
      const colors = ['#1E5CE8', '#22D3EE', '#8B5CF6', '#34D399', '#F5A623', '#6A98FF', '#FB923C'];
      const lane: Lane = {
        id: 'lane_' + Date.now().toString(36),
        name: `Carril ${idx + 1}`,
        type: 'custom',
        color: colors[idx % colors.length],
      };
      return { process: { ...st.process, lanes: [...st.process.lanes, lane], updatedAt: nowIso() } };
    }),

  patchLane: (id, patch) =>
    set((st) => ({
      process: { ...st.process, lanes: st.process.lanes.map((l) => (l.id === id ? { ...l, ...patch } : l)), updatedAt: nowIso() },
    })),

  toggleChecklist: (id) =>
    set((st) => ({
      process: {
        ...st.process,
        implementationChecklist: st.process.implementationChecklist.map((c) =>
          c.id === id ? { ...c, done: !c.done } : c,
        ),
        updatedAt: nowIso(),
      },
    })),

  addMetric: () =>
    set((st) => ({
      process: {
        ...st.process,
        metrics: [
          ...st.process.metrics,
          makeMetric({ code: `M-${st.process.metrics.length + 1}`, name: 'Nueva métrica', category: 'quality', formula: 'definir / total', target: '≥ 90%' }),
        ],
        updatedAt: nowIso(),
      },
    })),
  patchMetric: (id, patch) =>
    set((st) => ({
      process: { ...st.process, metrics: st.process.metrics.map((m) => (m.id === id ? { ...m, ...patch } : m)), updatedAt: nowIso() },
    })),
  deleteMetric: (id) =>
    set((st) => ({ process: { ...st.process, metrics: st.process.metrics.filter((m) => m.id !== id), updatedAt: nowIso() } })),

  addRisk: () =>
    set((st) => ({
      process: {
        ...st.process,
        risks: [...st.process.risks, makeRisk({ name: 'Nuevo riesgo', probability: 3, impact: 3, mitigation: 'Definir mitigación' })],
        updatedAt: nowIso(),
      },
    })),
  patchRisk: (id, patch) =>
    set((st) => ({
      process: {
        ...st.process,
        risks: st.process.risks.map((r) => {
          if (r.id !== id) return r;
          const next = { ...r, ...patch };
          next.severity = next.probability * next.impact;
          return next;
        }),
        updatedAt: nowIso(),
      },
    })),
  deleteRisk: (id) =>
    set((st) => ({ process: { ...st.process, risks: st.process.risks.filter((r) => r.id !== id), updatedAt: nowIso() } })),

  addAutomation: () =>
    set((st) => ({
      process: {
        ...st.process,
        automations: [
          ...st.process.automations,
          makeAutomation({ name: 'Nueva automatización', trigger: 'Definir trigger', action: 'Definir acción', inputData: 'Definir input', outputData: 'Definir output' }),
        ],
        updatedAt: nowIso(),
      },
    })),
  patchAutomation: (id, patch) =>
    set((st) => ({
      process: { ...st.process, automations: st.process.automations.map((a) => (a.id === id ? { ...a, ...patch } : a)), updatedAt: nowIso() },
    })),
  deleteAutomation: (id) =>
    set((st) => ({ process: { ...st.process, automations: st.process.automations.filter((a) => a.id !== id), updatedAt: nowIso() } })),

  sendCopilot: (command) => {
    const trimmed = command.trim();
    if (!trimmed) return;
    set((st) => ({ chat: [...st.chat, { id: 'u' + Date.now(), role: 'user', text: trimmed }] }));
    const result = runCopilot(trimmed, get().process);
    if (result.process) {
      set({ process: { ...result.process, nodes: autoLayout(result.process) } });
    }
    set((st) => ({
      chat: [...st.chat, { id: 'a' + Date.now(), role: 'assistant', text: result.message, code: result.code }],
    }));
  },
}));
