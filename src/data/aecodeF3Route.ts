import type {
  Capsule,
  Course,
  Evidence,
  LearnerProgress,
  LearningRoute,
  Level,
  LevelType,
  Module,
  Skill,
} from '../types/learning';

export const AECODE_F3_SOURCE = {
  title: 'AECODE - F3 | ESTRUCTURA MICROLEARNING',
  sheet: 'Ruta IA Diplomado',
  url: 'https://docs.google.com/spreadsheets/d/16ZepB3xEqqGYfB_o3zs1yllTHxhIbLMRz5eXH5tESHo/edit?pli=1&gid=1677733499#gid=1677733499',
  version: '2026.07 · demo F3 v1',
  milestoneCount: 8,
  visualClusterCount: 27,
  sourceModuleCount: 118,
  validation: 'Requiere validacion',
} as const;

type CourseSeed = [code: string, title: string, outcome: string, durationHours: number];

const LEVEL_SEEDS: Array<{
  id: string;
  number: number;
  title: string;
  outcome: string;
  type: LevelType;
  courses: CourseSeed[];
}> = [
  {
    id: 'level-1',
    number: 1,
    title: 'Fundamentos, criterio y uso responsable',
    outcome: 'Detecta y prioriza oportunidades IA aplicables al ciclo AEC con criterios verificables.',
    type: 'core',
    courses: [
      ['C01', 'IA para Construcción: fundamentos y criterio', 'Distingue límites, riesgos y oportunidades de IA en AEC.', 8],
      ['H1-E01', 'Prompt Engineering y Context Engineering', 'Formula instrucciones y contexto profesional reutilizable.', 6],
    ],
  },
  {
    id: 'level-2',
    number: 2,
    title: 'Asistentes y productividad aumentada',
    outcome: 'Opera asistentes sobre entregables reales con trazabilidad y control humano.',
    type: 'core',
    courses: [
      ['C02', 'Asistentes IA para productividad y entregables AEC', 'Configura asistentes para tareas profesionales verificables.', 8],
      ['H2-E01–E04', 'Ecosistemas de asistentes profesionales', 'Elige el asistente adecuado según tarea, contexto y permisos.', 8],
      ['H2-E05', 'Perplexity y Deep Research', 'Investiga y convierte fuentes contrastadas en un brief accionable.', 5],
      ['H2-E06', 'Comunicación visual y multimodal con IA', 'Produce recursos multimodales con narrativa y control de calidad.', 5],
    ],
  },
  {
    id: 'level-3',
    number: 3,
    title: 'Conocimiento, documentación y evidencia',
    outcome: 'Construye conocimiento consultable, citado y gobernado.',
    type: 'core',
    courses: [
      ['C03', 'Gestión del conocimiento con NotebookLM y RAG', 'Cura fuentes y obtiene respuestas trazables.', 8],
      ['H3-E03', 'RAG vectorial para asistentes', 'Diseña recuperación y evaluación sobre un corpus.', 7],
      ['H3-E04', 'IA para contratos, licitaciones y RFIs', 'Opera revisión documental con roles y evidencia.', 6],
    ],
  },
  {
    id: 'level-4',
    number: 4,
    title: 'Construye sin programar',
    outcome: 'Traduce procesos manuales a automatizaciones y aplicaciones mínimas.',
    type: 'elective',
    courses: [
      ['C04', 'Fundamentos de automatización no-code', 'Modela triggers, reglas, acciones y fallback.', 8],
      ['H4-E01', 'Automatización con Make para procesos AEC', 'Construye y monitorea escenarios multi-módulo.', 7],
      ['H4-E02', 'n8n y Google Cloud para operaciones AEC', 'Orquesta APIs, subflujos, logs y reintentos.', 8],
      ['H5-E05', 'Apps no-code, low-code y vibe coding', 'Convierte un problema AEC en un MVP medible.', 8],
    ],
  },
  {
    id: 'level-5',
    number: 5,
    title: 'Agentes e IDE agéntico',
    outcome: 'Diseña agentes y software asistido con permisos, evaluación y control.',
    type: 'elective',
    courses: [
      ['H4-E05', 'Agentes IA con herramientas y MCP', 'Diseña agentes auditables con herramientas.', 8],
      ['MCP', 'Contexto de modelo para herramientas AEC', 'Conecta datos y acciones con contratos claros.', 6],
      ['IDE-AI', 'Claude Code, Codex y Cursor', 'Dirige agentes de código dentro de un alcance.', 7],
      ['H4-E07', 'De prototipo a software AEC real', 'Versiona, prueba y mantiene una aplicación.', 8],
    ],
  },
  {
    id: 'level-6',
    number: 6,
    title: 'Datos, ML y visión computacional',
    outcome: 'Diseña soluciones IA con datos, evaluación técnica y límites explícitos.',
    type: 'elective',
    courses: [
      ['C05', 'Datos y arquitectura de soluciones IA', 'Define datos, componentes, APIs y pruebas.', 8],
      ['H5-E01', 'Power BI para proyectos AEC', 'Publica indicadores gobernados.', 6],
      ['H5-E02', 'Python para automatización y análisis AEC', 'Convierte scripts en herramientas usables.', 8],
      ['H5-E03', 'Machine Learning aplicado a datos AEC', 'Evalúa modelos evitando fuga de datos.', 8],
      ['H5-E04', 'Visión computacional y YOLO para obra', 'Valida detectores con precisión, privacidad y límites.', 9],
    ],
  },
  {
    id: 'level-7',
    number: 7,
    title: 'IA aplicada al sector AEC',
    outcome: 'Aplica IA en especialidades AEC con métricas y evidencia del dominio.',
    type: 'elective',
    courses: [
      ['H5-E06', 'IA aplicada a BIM, modelos y QA/QC', 'Automatiza y valida casos sobre modelos y datos BIM.', 8],
      ['H5-E07', 'IA para ingeniería estructural e inspección', 'Clasifica evidencia y automatiza verificaciones.', 8],
      ['H5-E09', 'Planificación, costos y control de obra', 'Sostiene decisiones con avance, costos y alertas.', 8],
    ],
  },
  {
    id: 'level-8',
    number: 8,
    title: 'Implementación y Capstone',
    outcome: 'Defiende una implementación AI First con gobierno, adopción y evidencia.',
    type: 'capstone',
    courses: [
      ['C06', 'Implementación AI First, gobierno y adopción', 'Diseña un piloto medible y gobernado.', 12],
      ['H6-E02', 'Evaluación, LLMOps y MLOps', 'Opera versiones, trazas, costo, seguridad y rollback.', 9],
    ],
  },
];

const courseId = (levelNumber: number, code: string) =>
  `course-${levelNumber}-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

let clusterOrder = 0;
const courses: Course[] = LEVEL_SEEDS.flatMap((level) =>
  level.courses.map(([code, title, outcome, durationHours]) => {
    clusterOrder += 1;
    const id = courseId(level.number, code);
    const isActiveCourse = code === 'C01';
    return {
      id,
      levelId: level.id,
      code,
      title,
      outcome,
      durationHours,
      moduleIds: isActiveCourse ? ['module-c01-m05'] : [],
      skillIds: isActiveCourse ? ['skill-prioritize-aec-ai'] : [],
      clusterOrder,
      validation: isActiveCourse ? 'Vertical slice demo' : 'Requiere validacion',
    };
  }),
);

const levels: Level[] = LEVEL_SEEDS.map((level) => {
  const levelCourses = courses.filter((course) => course.levelId === level.id);
  return {
    id: level.id,
    number: level.number,
    title: level.title,
    outcome: level.outcome,
    type: level.type,
    durationHours: levelCourses.reduce((sum, course) => sum + course.durationHours, 0),
    courseIds: levelCourses.map((course) => course.id),
    skillIds: level.number === 1 ? ['skill-prioritize-aec-ai'] : [],
    validation: level.number === 1 ? 'Vertical slice demo' : 'Requiere validacion',
  };
});

const capsules: Capsule[] = [
  {
    id: 'capsule-m05-1',
    moduleId: 'module-c01-m05',
    order: 1,
    title: 'Detectar fricciones y tareas repetitivas',
    durationMinutes: { min: 5, max: 8 },
    outcome: 'Reconoce una fricción concreta que puede convertirse en oportunidad.',
  },
  {
    id: 'capsule-m05-2',
    moduleId: 'module-c01-m05',
    order: 2,
    title: 'Formular problema–solución–producto–proyecto',
    durationMinutes: { min: 8, max: 10 },
    outcome: 'Formula el caso sin confundir tecnología, producto y proyecto.',
  },
  {
    id: 'capsule-m05-3',
    moduleId: 'module-c01-m05',
    order: 3,
    title: 'Priorizar con matriz impacto–factibilidad–riesgo',
    durationMinutes: { min: 10, max: 12 },
    outcome: 'Compara alternativas y selecciona una con criterios explícitos.',
  },
];

const modules: Module[] = [
  {
    id: 'module-c01-m05',
    courseId: courseId(1, 'C01'),
    code: 'M05',
    title: 'Identificación y priorización de oportunidades',
    outcome: 'Prioriza un caso de uso IA aplicable a AEC con criterios de valor, riesgo y verificabilidad.',
    capsuleIds: capsules.map((capsule) => capsule.id),
    skillIds: ['skill-prioritize-aec-ai'],
    validation: 'Vertical slice demo',
  },
];

const skills: Skill[] = [
  {
    id: 'skill-prioritize-aec-ai',
    title: 'Prioriza un caso de uso IA aplicable a AEC',
    statement: 'Prioriza un caso de uso IA aplicable a AEC con criterios de valor, riesgo y verificabilidad.',
    practiceId: 'practice-priority-card',
    evidenceId: 'evidence-priority-card',
    validation: 'Vertical slice demo',
  },
];

const evidence: Evidence = {
  id: 'evidence-priority-card',
  skillId: skills[0].id,
  title: 'Ficha de priorización con criterios verificables',
  requiredFields: ['problem', 'user', 'impact', 'feasibility', 'risk', 'initialMetric'],
  rubric: {
    criteria: [
      { id: 'problem-user', label: 'Problema y usuario', description: 'Define una fricción real y a quién afecta.', scale: { min: 1, max: 4 } },
      { id: 'value-impact', label: 'Valor e impacto', description: 'Explica el resultado esperado y su relevancia.', scale: { min: 1, max: 4 } },
      { id: 'feasibility-risk', label: 'Factibilidad y riesgo', description: 'Reconoce datos, dependencias, límites y controles.', scale: { min: 1, max: 4 } },
      { id: 'metric-evidence', label: 'Métrica y verificabilidad', description: 'Propone una señal inicial observable.', scale: { min: 1, max: 4 } },
    ],
    proposedThreshold: 3,
    reviewMode: 'human',
    validation: 'Umbral propuesto · Requiere validacion',
  },
};

export const aecodeF3Route: LearningRoute = {
  id: 'aecode-f3-ruta-ia-2026',
  title: 'Ruta IA · Diplomado AEC',
  promise: 'De una oportunidad difusa a una skill demostrada con evidencia.',
  audience: 'Profesionales de Arquitectura, Ingeniería y Construcción',
  source: AECODE_F3_SOURCE,
  levelIds: levels.map((level) => level.id),
  levels,
  courses,
  modules,
  capsules,
  skills,
  practices: [
    {
      id: 'practice-priority-card',
      skillId: skills[0].id,
      title: 'Ficha de priorización de un caso real',
      brief: 'Elige una fricción de tu trabajo y compárala contra al menos una alternativa antes de decidir.',
      deliverable: 'Una ficha completa lista para revisión humana.',
      validation: 'Vertical slice demo',
    },
  ],
  evidences: [evidence],
};

export const initialLearnerProgress: LearnerProgress = {
  schemaVersion: 1,
  routeId: aecodeF3Route.id,
  view: 'summary',
  currentLevelId: 'level-1',
  recommendedLevelId: 'level-1',
  destinationLevelId: 'level-8',
  selectedLevelId: 'level-1',
  selectedCourseId: courseId(1, 'C01'),
  selectedModuleId: 'module-c01-m05',
  selectedCapsuleId: capsules[0].id,
  activeSkillId: skills[0].id,
  startedCapsuleIds: [],
  completedCapsuleIds: [],
  practiceCompleted: false,
  skillStatus: 'available',
  evidenceDraft: {
    problem: '',
    user: '',
    impact: '',
    feasibility: '',
    risk: '',
    initialMetric: '',
  },
  mapPositions: {},
};
