import { create } from 'zustand';
import type {
  Automation,
  EdgeType,
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
import { runAIFirst } from '../lib/aiFirst';
import { emptyProcess, makeAutomation, makeEdge, makeLane, makeMetric, makeNode, makeRisk, nowIso } from '../lib/processSchema';

const NODE_DEFAULT_TITLE: Partial<Record<NodeType, string>> = {
  start: 'Inicio',
  end: 'Fin',
  decision: '¿Decisión?',
  activity: 'Nueva actividad',
  document: 'Documento',
  approval: 'Aprobación',
  handoff: 'Traspaso',
  automation: 'Automatización',
  system: 'Sistema',
  evidence: 'Evidencia',
  metric: 'Métrica',
  risk: 'Riesgo',
};
import { buildCoordinacion, buildFinanzas, buildObra, buildRFI, getTemplateById } from '../data/templates';
import { generateProcessFromAI } from '../ai/ProcessGenerator';
import { runCopilot } from '../ai/copilot';
import { storage } from '../lib/storage';
import { emptyLLMConfig, type Integration, type LLMConfig } from '../ai/llm';
import type {
  EvidenceDraft,
  LearnerProgress,
  LearningRouteView,
  LearningViewport,
} from '../types/learning';
import { aecodeF3Route, initialLearnerProgress } from '../data/aecodeF3Route';

export type View = 'home' | 'app';

/** 6 módulos + configuración. capture/map/metrics/aifirst/implement forman el flujo de 5 pasos. */
export type Section =
  | 'dashboard'
  | 'processes'
  | 'capture'
  | 'map'
  | 'validate'
  | 'metrics'
  | 'aifirst'
  | 'implement'
  | 'settings';

export const FLOW_SECTIONS: Section[] = ['capture', 'map', 'validate', 'metrics', 'aifirst', 'implement'];

export interface SavedProcess {
  id: string;
  title: string;
  updatedAt: string;
  maturityLevel: ProcessMap['maturityLevel'];
  process: ProcessMap;
}

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
  user: string | null;
  process: ProcessMap;
  selectedNodeId: string | null;
  isGenerating: boolean;
  chat: ChatMessage[];
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  viewMode: 'basic' | '2d' | '3d';
  highlightLaneId: string | null;
  llmConfig: LLMConfig;
  integrations: Integration[];
  library: SavedProcess[];
  learningProgress: LearnerProgress;

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
  addConnectedNode: (sourceId: string, type: NodeType, edgeType?: EdgeType, position?: XY) => void;
  seedSkeleton: () => void;
  deleteNode: (id: string) => void;
  addEdge: (edge: ProcessEdgeData) => void;
  deleteEdge: (id: string) => void;
  togglePanel: (side: 'left' | 'right') => void;
  setViewMode: (m: 'basic' | '2d' | '3d') => void;
  setHighlightLane: (laneId: string | null) => void;
  setNodesPositions: (updates: { id: string; position: XY }[]) => void;
  login: (user: string) => void;
  logout: () => void;
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

  // LLM + integrations
  setLLMConfig: (patch: Partial<LLMConfig>) => void;
  addIntegration: (it: Omit<Integration, 'id'>) => void;
  patchIntegration: (id: string, patch: Partial<Integration>) => void;
  deleteIntegration: (id: string) => void;

  // library (local, shareable via JSON)
  saveToLibrary: () => void;
  openFromLibrary: (id: string) => void;
  renameLibraryItem: (id: string, title: string) => void;
  duplicateLibraryItem: (id: string) => void;
  deleteLibraryItem: (id: string) => void;
  toggleFavorite: (id: string) => void;

  // AI First
  applyAIFirst: () => void;

  // copilot
  sendCopilot: (command: string) => void;

  // AECODE F3 learning route demo
  setLearningView: (view: LearningRouteView) => void;
  selectLearningItem: (
    selection: Partial<
      Pick<
        LearnerProgress,
        | 'selectedLevelId'
        | 'selectedCourseId'
        | 'selectedModuleId'
        | 'selectedCapsuleId'
        | 'activeSkillId'
      >
    >,
  ) => void;
  startLearningCapsule: (id: string) => void;
  completeLearningCapsule: (id: string) => void;
  completeLearningPractice: () => void;
  updateLearningEvidence: (patch: Partial<EvidenceDraft>) => void;
  saveLearningEvidenceDraft: () => void;
  submitLearningEvidence: () => void;
  setLearningNodePosition: (id: string, position: XY) => void;
  setLearningViewport: (viewport: LearningViewport) => void;
  resetLearningDemo: () => void;
}

const ACTIVE_LEARNING_KEY = 'active-learning.v1';
const LEARNING_PROGRESS_KEY = 'learning-progress.v1';

const storedLearningProgress = storage.read<LearnerProgress | null>(LEARNING_PROGRESS_KEY, null);
const initialLearningState =
  storedLearningProgress?.schemaVersion === 1 &&
  storedLearningProgress.routeId === aecodeF3Route.id
    ? storedLearningProgress
    : initialLearnerProgress;

const persistLearningProgress = (progress: LearnerProgress) => {
  storage.write(LEARNING_PROGRESS_KEY, progress);
  return progress;
};

const storedActiveLearning = storage.read<{ schemaVersion: 1; process: ProcessMap } | null>(
  ACTIVE_LEARNING_KEY,
  null,
);

const initialProcess = ((): ProcessMap => {
  if (
    storedActiveLearning?.schemaVersion === 1 &&
    storedActiveLearning.process.tags.includes('ruta-ia')
  ) {
    return storedActiveLearning.process;
  }
  const p = buildObra();
  return { ...p, nodes: autoLayout(p) };
})();

const initialTheme = storage.read<'light' | 'dark'>('theme', 'light');
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');
}

/** Primera ejecución: siembra 2 procesos demo para que Dashboard y Procesos no estén vacíos. */
const initialLibrary = ((): SavedProcess[] => {
  const lib = storage.read<SavedProcess[]>('library', []);
  if (lib.length > 0 || storage.read('demoSeeded', false)) return lib;
  const demos: SavedProcess[] = [
    { ...buildRFI(), status: 'medido' as const, area: 'Construcción', favorite: true },
    { ...buildCoordinacion(), status: 'mapeado' as const, area: 'Operaciones' },
    { ...buildFinanzas(), status: 'mapeado' as const, area: 'Finanzas' },
  ].map((p) => ({ id: p.id, title: p.title, updatedAt: p.updatedAt, maturityLevel: p.maturityLevel, process: p }));
  storage.write('demoSeeded', true);
  storage.write('library', demos);
  return demos;
})();

export const useProcessStore = create<ProcessState>((set, get) => ({
  view: storedActiveLearning ? 'app' : 'home',
  section: storedActiveLearning ? 'map' : 'dashboard',
  theme: initialTheme,
  user: storage.read<string | null>('user', null),
  process: initialProcess,
  selectedNodeId: null,
  isGenerating: false,
  leftPanelOpen: true,
  rightPanelOpen: true,
  viewMode: '2d',
  highlightLaneId: null,
  llmConfig: storage.read<LLMConfig>('llm', emptyLLMConfig()),
  integrations: storage.read<Integration[]>('integrations', []),
  library: initialLibrary,
  learningProgress: initialLearningState,
  chat: [
    {
      id: 'welcome',
      role: 'assistant',
      text:
        '¡Hola! Soy tu Process Copilot para flujos de coordinación. Puedo simplificar, hacer más técnico, agregar métricas, detectar cuellos de botella, asignar responsables o exportar el proceso. Escribe una instrucción.',
    },
  ],

  health: () => runHealthCheck(get().process),

  setView: (v) => {
    if (v === 'home') storage.remove(ACTIVE_LEARNING_KEY);
    set({ view: v });
  },
  setSection: (s) => set({ section: s }),
  toggleTheme: () =>
    set((st) => {
      const theme = st.theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
      storage.write('theme', theme);
      return { theme };
    }),
  selectNode: (id) => set({ selectedNodeId: id }),

  loadProcess: (p, opts = { relayout: true }) => {
    const isLearningRoute = p.tags.includes('ruta-ia');
    const process = opts.relayout && !isLearningRoute ? { ...p, nodes: autoLayout(p) } : p;
    if (isLearningRoute) {
      storage.write(ACTIVE_LEARNING_KEY, { schemaVersion: 1, process });
    } else {
      storage.remove(ACTIVE_LEARNING_KEY);
    }
    set({ process, selectedNodeId: null });
  },

  loadTemplate: (id) => {
    const tpl = getTemplateById(id);
    if (!tpl) return;
    const p = tpl.build();
    const isLearningRoute = p.tags.includes('ruta-ia');
    const process = isLearningRoute ? p : { ...p, nodes: autoLayout(p) };
    if (isLearningRoute) {
      storage.write(ACTIVE_LEARNING_KEY, { schemaVersion: 1, process });
      persistLearningProgress(get().learningProgress);
    } else {
      storage.remove(ACTIVE_LEARNING_KEY);
    }
    set({ process, selectedNodeId: null, section: 'map', view: 'app' });
  },

  newBlank: () => {
    const p = emptyProcess();
    storage.remove(ACTIVE_LEARNING_KEY);
    set({ process: p, selectedNodeId: null, view: 'app', section: 'capture' });
  },

  generate: async (prompt) => {
    set({ isGenerating: true });
    set((st) => ({
      chat: [...st.chat, { id: 'u' + Date.now(), role: 'user', text: prompt.input || '(generar proceso)' }],
    }));
    try {
      const p = await generateProcessFromAI(prompt, get().llmConfig);
      storage.remove(ACTIVE_LEARNING_KEY);
      set({
        process: { ...p, nodes: autoLayout(p) },
        selectedNodeId: null,
        isGenerating: false,
        view: 'app',
        section: 'map',
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
    } catch (e) {
      set({ isGenerating: false });
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      set((st) => ({
        chat: [...st.chat, { id: 'e' + Date.now(), role: 'assistant', text: `No pude generar el proceso: ${msg}. Si usas un LLM, revisa la API key en Configuración; sin key uso el motor local.` }],
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
    set((st) => {
      // El nodo se queda donde lo sueltas; su carril sigue a la banda (por Y).
      const lanes = st.process.lanes;
      const idx = Math.max(0, Math.min(lanes.length - 1, Math.round((position.y - 46) / 168)));
      const laneId = lanes[idx]?.id;
      return {
        process: {
          ...st.process,
          nodes: st.process.nodes.map((n) => (n.id === id ? { ...n, position, laneId: laneId ?? n.laneId } : n)),
        },
      };
    }),

  setNodesPositions: (updates) =>
    set((st) => {
      const map = new Map(updates.map((u) => [u.id, u.position]));
      return {
        process: {
          ...st.process,
          nodes: st.process.nodes.map((n) => (map.has(n.id) ? { ...n, position: map.get(n.id)! } : n)),
          updatedAt: nowIso(),
        },
      };
    }),

  login: (user) => {
    storage.write('user', user);
    set({ user });
  },
  logout: () => {
    storage.remove('user');
    set({ user: null, view: 'home' });
  },

  addNode: (type, laneId) =>
    set((st) => {
      let lanes = st.process.lanes;
      if (lanes.length === 0) lanes = [makeLane({ name: 'Proceso', type: 'operations', color: '#1E5CE8' })];
      const lane = laneId ?? lanes[0].id;
      const existing = st.process.nodes.filter((n) => n.laneId === lane);
      const maxX = existing.length ? Math.max(...existing.map((n) => n.position.x)) : -152;
      const laneIdx = lanes.findIndex((l) => l.id === lane);
      const node = makeNode({
        type,
        title: NODE_DEFAULT_TITLE[type] ?? `Nuevo ${type}`,
        laneId: lane,
        position: { x: maxX + 248, y: laneIdx * 168 + 46 },
      });
      return { process: { ...st.process, lanes, nodes: [...st.process.nodes, node], updatedAt: nowIso() }, selectedNodeId: node.id };
    }),

  addConnectedNode: (sourceId, type, edgeType = 'sequence', position) =>
    set((st) => {
      const source = st.process.nodes.find((n) => n.id === sourceId);
      if (!source) return st;
      let pos: XY;
      let laneId = source.laneId;
      if (position) {
        // dropped on the canvas → snap to the nearest lane band by Y
        pos = position;
        const idx = Math.max(0, Math.min(st.process.lanes.length - 1, Math.round((position.y - 46) / 168)));
        laneId = st.process.lanes[idx]?.id ?? source.laneId;
      } else {
        const baseX = source.position.x + 248;
        let y = source.position.y + (edgeType === 'decision_no' ? 132 : edgeType === 'decision_yes' ? -8 : 0);
        const occupied = (yy: number) => st.process.nodes.some((n) => Math.abs(n.position.x - baseX) < 130 && Math.abs(n.position.y - yy) < 76);
        let guard = 0;
        while (occupied(y) && guard < 10) {
          y += 84;
          guard++;
        }
        pos = { x: baseX, y };
      }
      const node = makeNode({ type, title: NODE_DEFAULT_TITLE[type] ?? 'Nuevo paso', laneId, position: pos });
      const edge = makeEdge(sourceId, node.id, { type: edgeType });
      return {
        process: { ...st.process, nodes: [...st.process.nodes, node], edges: [...st.process.edges, edge], updatedAt: nowIso() },
        selectedNodeId: node.id,
      };
    }),

  seedSkeleton: () =>
    set((st) => {
      const lanes = st.process.lanes.length ? st.process.lanes : [makeLane({ name: 'Proceso', type: 'operations', color: '#1E5CE8' })];
      const laneId = lanes[0].id;
      const y = 64;
      const start = makeNode({ type: 'start', title: 'Inicio', laneId, position: { x: 72, y } });
      const act = makeNode({ type: 'activity', title: 'Primera actividad', laneId, responsible: '', position: { x: 320, y } });
      const end = makeNode({ type: 'end', title: 'Fin', laneId, position: { x: 568, y } });
      return {
        process: {
          ...st.process,
          lanes,
          nodes: [...st.process.nodes, start, act, end],
          edges: [...st.process.edges, makeEdge(start.id, act.id), makeEdge(act.id, end.id)],
          status: st.process.status ?? 'mapeado',
          updatedAt: nowIso(),
        },
        selectedNodeId: act.id,
      };
    }),

  togglePanel: (side) =>
    set((st) => (side === 'left' ? { leftPanelOpen: !st.leftPanelOpen } : { rightPanelOpen: !st.rightPanelOpen })),

  setViewMode: (m) => set({ viewMode: m, highlightLaneId: null }),
  setHighlightLane: (laneId) => set((st) => ({ highlightLaneId: st.highlightLaneId === laneId ? null : laneId })),

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

  /* ---- LLM + integrations ---- */
  setLLMConfig: (patch) =>
    set((st) => {
      const llmConfig = { ...st.llmConfig, ...patch };
      storage.write('llm', llmConfig);
      return { llmConfig };
    }),
  addIntegration: (it) =>
    set((st) => {
      const integrations = [...st.integrations, { ...it, id: 'int_' + Date.now().toString(36) }];
      storage.write('integrations', integrations);
      return { integrations };
    }),
  patchIntegration: (id, patch) =>
    set((st) => {
      const integrations = st.integrations.map((i) => (i.id === id ? { ...i, ...patch } : i));
      storage.write('integrations', integrations);
      return { integrations };
    }),
  deleteIntegration: (id) =>
    set((st) => {
      const integrations = st.integrations.filter((i) => i.id !== id);
      storage.write('integrations', integrations);
      return { integrations };
    }),

  /* ---- Library ---- */
  saveToLibrary: () =>
    set((st) => {
      const p = { ...st.process, updatedAt: nowIso() };
      const entry: SavedProcess = { id: p.id, title: p.title, updatedAt: p.updatedAt, maturityLevel: p.maturityLevel, process: p };
      const exists = st.library.some((s) => s.id === p.id);
      const library = exists ? st.library.map((s) => (s.id === p.id ? entry : s)) : [entry, ...st.library];
      storage.write('library', library);
      return { library, process: p };
    }),
  openFromLibrary: (id) =>
    set((st) => {
      const item = st.library.find((s) => s.id === id);
      if (!item) return st;
      if (item.process.tags.includes('ruta-ia')) {
        storage.write(ACTIVE_LEARNING_KEY, { schemaVersion: 1, process: item.process });
      } else {
        storage.remove(ACTIVE_LEARNING_KEY);
      }
      return { process: item.process, selectedNodeId: null, view: 'app', section: 'map' };
    }),
  renameLibraryItem: (id, title) =>
    set((st) => {
      const library = st.library.map((s) => (s.id === id ? { ...s, title, process: { ...s.process, title } } : s));
      storage.write('library', library);
      const process = st.process.id === id ? { ...st.process, title } : st.process;
      return { library, process };
    }),
  duplicateLibraryItem: (id) =>
    set((st) => {
      const item = st.library.find((s) => s.id === id);
      if (!item) return st;
      const newId = 'proc_' + Date.now().toString(36);
      const copy: SavedProcess = {
        id: newId,
        title: `${item.title} (copia)`,
        updatedAt: nowIso(),
        maturityLevel: item.maturityLevel,
        process: { ...item.process, id: newId, title: `${item.title} (copia)`, updatedAt: nowIso() },
      };
      const library = [copy, ...st.library];
      storage.write('library', library);
      return { library };
    }),
  deleteLibraryItem: (id) =>
    set((st) => {
      const library = st.library.filter((s) => s.id !== id);
      storage.write('library', library);
      return { library };
    }),

  toggleFavorite: (id) =>
    set((st) => {
      const library = st.library.map((s) =>
        s.id === id ? { ...s, process: { ...s.process, favorite: !s.process.favorite } } : s,
      );
      storage.write('library', library);
      const process =
        st.process.id === id ? { ...st.process, favorite: !st.process.favorite } : st.process;
      return { library, process };
    }),

  applyAIFirst: () =>
    set((st) => {
      const report = runAIFirst(st.process);
      const existing = new Set(st.process.automations.map((a) => a.name));
      const newAutos = report.automations.filter((a) => !existing.has(a.name));
      return {
        process: {
          ...st.process,
          agents: report.agents,
          automations: [...st.process.automations, ...newAutos],
          roadmap: report.roadmap,
          currentStateSummary: report.currentSummary.join(' '),
          futureStateSummary: report.futureSummary.join(' '),
          status: 'optimizado',
          maturityLevel: 'optimized',
          updatedAt: nowIso(),
        },
        chat: [
          ...st.chat,
          {
            id: 'a' + Date.now(),
            role: 'assistant' as const,
            text: `Plan AI First generado: ${report.agents.length} agente(s), ${report.automations.length} automatización(es) y roadmap 30/60/90. AI First Score: ${report.score}/100 (${report.bandLabel}).`,
          },
        ],
      };
    }),

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

  setLearningView: (view) =>
    set((st) => {
      const learningProgress = persistLearningProgress({ ...st.learningProgress, view });
      return { learningProgress };
    }),

  selectLearningItem: (selection) =>
    set((st) => {
      const learningProgress = persistLearningProgress({ ...st.learningProgress, ...selection });
      return { learningProgress };
    }),

  startLearningCapsule: (id) =>
    set((st) => {
      const startedCapsuleIds = st.learningProgress.startedCapsuleIds.includes(id)
        ? st.learningProgress.startedCapsuleIds
        : [...st.learningProgress.startedCapsuleIds, id];
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        selectedCapsuleId: id,
        startedCapsuleIds,
        skillStatus: st.learningProgress.skillStatus === 'available' ? 'active' : st.learningProgress.skillStatus,
      });
      return { learningProgress };
    }),

  completeLearningCapsule: (id) =>
    set((st) => {
      const completedCapsuleIds = st.learningProgress.completedCapsuleIds.includes(id)
        ? st.learningProgress.completedCapsuleIds
        : [...st.learningProgress.completedCapsuleIds, id];
      const currentCapsule = aecodeF3Route.capsules.find((capsule) => capsule.id === id);
      const nextCapsule = aecodeF3Route.capsules.find(
        (capsule) => capsule.order === (currentCapsule?.order ?? 0) + 1,
      );
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        completedCapsuleIds,
        selectedCapsuleId: nextCapsule?.id ?? id,
        skillStatus: 'active',
      });
      return { learningProgress };
    }),

  completeLearningPractice: () =>
    set((st) => {
      const allCapsulesComplete = aecodeF3Route.capsules.every((capsule) =>
        st.learningProgress.completedCapsuleIds.includes(capsule.id),
      );
      if (!allCapsulesComplete) return st;
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        practiceCompleted: true,
        skillStatus: 'active',
      });
      return { learningProgress };
    }),

  updateLearningEvidence: (patch) =>
    set((st) => {
      if (st.learningProgress.skillStatus === 'submitted') return st;
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        evidenceDraft: { ...st.learningProgress.evidenceDraft, ...patch },
      });
      return { learningProgress };
    }),

  saveLearningEvidenceDraft: () =>
    set((st) => {
      if (!st.learningProgress.practiceCompleted || st.learningProgress.skillStatus === 'submitted') return st;
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        skillStatus: 'evidence-draft',
      });
      return { learningProgress };
    }),

  submitLearningEvidence: () =>
    set((st) => {
      const evidence = aecodeF3Route.evidences[0];
      const complete =
        st.learningProgress.practiceCompleted &&
        evidence.requiredFields.every(
          (field) => st.learningProgress.evidenceDraft[field].trim().length > 0,
        );
      if (!complete || st.learningProgress.skillStatus === 'submitted') return st;
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        skillStatus: 'submitted',
        evidenceSubmittedAt: nowIso(),
      });
      return { learningProgress };
    }),

  setLearningNodePosition: (id, position) =>
    set((st) => {
      const learningProgress = persistLearningProgress({
        ...st.learningProgress,
        mapPositions: { ...st.learningProgress.mapPositions, [id]: position },
      });
      return { learningProgress };
    }),

  setLearningViewport: (mapViewport) =>
    set((st) => {
      const learningProgress = persistLearningProgress({ ...st.learningProgress, mapViewport });
      return { learningProgress };
    }),

  resetLearningDemo: () =>
    set((st) => {
      const preservedView = st.learningProgress.view;
      const learningProgress = persistLearningProgress({
        ...initialLearnerProgress,
        view: preservedView,
      });
      return { learningProgress };
    }),
}));
