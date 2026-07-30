import { aecodeF3Route } from './aecodeF3Route';

export type LearningMapNodeKind =
  | 'terminal'
  | 'process'
  | 'decision'
  | 'document'
  | 'result'
  | 'level';

export type LearningMapStatus =
  | 'neutral'
  | 'active'
  | 'pending'
  | 'review'
  | 'verified'
  | 'improve';

export interface LearningMapStage {
  id: string;
  index: number;
  title: string;
  subtitle: string;
  x: number;
  width: number;
}

export interface LearningMapLane {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  y: number;
  height: number;
  tone: 'participant' | 'content' | 'engine' | 'evidence' | 'community';
}

export interface LearningMapProcessNode {
  id: string;
  kind: Exclude<LearningMapNodeKind, 'level'>;
  laneId: string;
  stageId: string;
  eyebrow: string;
  title: string;
  description?: string;
  status: LearningMapStatus;
  position: { x: number; y: number };
  width?: number;
  height?: number;
}

export interface LearningMapEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: 'source-left' | 'source-right' | 'source-top' | 'source-bottom';
  targetHandle?: 'target-left' | 'target-right' | 'target-top' | 'target-bottom';
  label?: string;
  tone?: 'route' | 'feedback' | 'support' | 'verified';
  animated?: boolean;
}

export const LEARNING_MAP_SIZE = {
  width: 4320,
  height: 1690,
  railWidth: 150,
} as const;

export const learningMapStages: LearningMapStage[] = [
  {
    id: 'diagnosis',
    index: 1,
    title: 'Diagnóstico',
    subtitle: 'Punto de partida',
    x: 160,
    width: 640,
  },
  {
    id: 'base-route',
    index: 2,
    title: 'Ruta base',
    subtitle: 'Recomendación',
    x: 810,
    width: 640,
  },
  {
    id: 'guided-learning',
    index: 3,
    title: 'Aprendizaje guiado',
    subtitle: 'Skill y cápsulas',
    x: 1460,
    width: 640,
  },
  {
    id: 'application',
    index: 4,
    title: 'Aplicación',
    subtitle: 'Práctica real',
    x: 2110,
    width: 640,
  },
  {
    id: 'validation',
    index: 5,
    title: 'Evidencia y validación',
    subtitle: 'Criterio humano',
    x: 2760,
    width: 640,
  },
  {
    id: 'continuity',
    index: 6,
    title: 'Continuidad',
    subtitle: 'Passport y siguiente skill',
    x: 3410,
    width: 760,
  },
];

export const learningMapLanes: LearningMapLane[] = [
  {
    id: 'participant',
    title: 'Participante',
    shortTitle: 'PARTICIPANTE',
    description: 'Decisiones, progreso y siguiente acción',
    y: 112,
    height: 248,
    tone: 'participant',
  },
  {
    id: 'content',
    title: 'Ruta y contenido AECODE',
    shortTitle: 'RUTA Y CONTENIDO',
    description: '8 niveles · 27 cursos navegables',
    y: 370,
    height: 430,
    tone: 'content',
  },
  {
    id: 'engine',
    title: 'Motor de aprendizaje',
    shortTitle: 'MOTOR DE APRENDIZAJE',
    description: 'Diagnóstico, skill, cápsulas y práctica',
    y: 810,
    height: 300,
    tone: 'engine',
  },
  {
    id: 'evidence',
    title: 'Evidencia y validación',
    shortTitle: 'EVIDENCIA Y VALIDACIÓN',
    description: 'Entrega, rúbrica y revisión humana',
    y: 1120,
    height: 300,
    tone: 'evidence',
  },
  {
    id: 'community',
    title: 'Comunidad / empresa',
    shortTitle: 'COMUNIDAD / EMPRESA',
    description: 'Mentoría, pares y transferencia profesional',
    y: 1430,
    height: 250,
    tone: 'community',
  },
];

export const learningMapProcessNodes: LearningMapProcessNode[] = [
  {
    id: 'flow-start',
    kind: 'terminal',
    laneId: 'participant',
    stageId: 'diagnosis',
    eyebrow: 'INICIO',
    title: 'Quiero desarrollar una capacidad IA aplicable a AEC',
    status: 'active',
    position: { x: 205, y: 184 },
    width: 240,
  },
  {
    id: 'participant-diagnosis',
    kind: 'process',
    laneId: 'participant',
    stageId: 'diagnosis',
    eyebrow: '5–8 MIN',
    title: 'Diagnóstico inicial',
    description: 'Rol, experiencia, tareas, objetivo y tiempo disponible.',
    status: 'active',
    position: { x: 500, y: 170 },
    width: 235,
  },
  {
    id: 'route-recommendation',
    kind: 'result',
    laneId: 'participant',
    stageId: 'base-route',
    eyebrow: 'RECOMENDACIÓN',
    title: 'Ruta base personalizada',
    description: 'Nivel recomendado, skill activa y razón de la secuencia.',
    status: 'active',
    position: { x: 875, y: 170 },
    width: 245,
  },
  {
    id: 'participant-progress',
    kind: 'process',
    laneId: 'participant',
    stageId: 'guided-learning',
    eyebrow: 'PROGRESO VISIBLE',
    title: 'Comprende qué sigue y por qué',
    description: 'Avance por evidencia, no solo por consumo.',
    status: 'neutral',
    position: { x: 1570, y: 176 },
    width: 250,
  },
  {
    id: 'participant-feedback',
    kind: 'result',
    laneId: 'participant',
    stageId: 'validation',
    eyebrow: 'FEEDBACK',
    title: 'Recibe una decisión explicada',
    description: 'Criterios cumplidos, brecha y próxima acción.',
    status: 'review',
    position: { x: 2935, y: 176 },
    width: 255,
  },
  {
    id: 'participant-next-level',
    kind: 'terminal',
    laneId: 'participant',
    stageId: 'continuity',
    eyebrow: 'CONTINUIDAD',
    title: 'Avanza a la siguiente skill o nivel',
    status: 'verified',
    position: { x: 3715, y: 184 },
    width: 260,
  },
  {
    id: 'diagnostic-engine',
    kind: 'process',
    laneId: 'engine',
    stageId: 'diagnosis',
    eyebrow: 'MOTOR',
    title: 'Interpreta el punto de partida',
    description: 'Contrasta objetivo, brecha, prerequisitos y disponibilidad.',
    status: 'active',
    position: { x: 455, y: 882 },
    width: 245,
  },
  {
    id: 'active-course',
    kind: 'process',
    laneId: 'engine',
    stageId: 'base-route',
    eyebrow: 'NIVEL 1 · C01',
    title: 'Fundamentos y criterio IA',
    description: 'Curso activo de la vertical slice.',
    status: 'active',
    position: { x: 960, y: 880 },
    width: 235,
  },
  {
    id: 'active-module',
    kind: 'process',
    laneId: 'engine',
    stageId: 'guided-learning',
    eyebrow: 'MÓDULO M05',
    title: 'Identificar y priorizar oportunidades',
    status: 'active',
    position: { x: 1260, y: 880 },
    width: 245,
  },
  {
    id: 'capsule-1',
    kind: 'process',
    laneId: 'engine',
    stageId: 'guided-learning',
    eyebrow: 'CÁPSULA 1 · 5–8 MIN',
    title: 'Detectar fricciones',
    status: 'active',
    position: { x: 1570, y: 892 },
    width: 190,
  },
  {
    id: 'capsule-2',
    kind: 'process',
    laneId: 'engine',
    stageId: 'guided-learning',
    eyebrow: 'CÁPSULA 2 · 8–10 MIN',
    title: 'Formular el caso',
    status: 'neutral',
    position: { x: 1805, y: 892 },
    width: 190,
  },
  {
    id: 'capsule-3',
    kind: 'process',
    laneId: 'engine',
    stageId: 'guided-learning',
    eyebrow: 'CÁPSULA 3 · 10–12 MIN',
    title: 'Priorizar con criterios',
    status: 'neutral',
    position: { x: 2040, y: 892 },
    width: 200,
  },
  {
    id: 'practice',
    kind: 'process',
    laneId: 'engine',
    stageId: 'application',
    eyebrow: 'PRÁCTICA APLICADA',
    title: 'Ficha de priorización de un caso real',
    description: 'Compara al menos dos oportunidades antes de decidir.',
    status: 'pending',
    position: { x: 2305, y: 874 },
    width: 255,
  },
  {
    id: 'practice-decision',
    kind: 'decision',
    laneId: 'engine',
    stageId: 'application',
    eyebrow: 'CHECKPOINT',
    title: '¿Cumple criterios mínimos?',
    status: 'pending',
    position: { x: 2630, y: 865 },
    width: 190,
    height: 190,
  },
  {
    id: 'adaptive-feedback',
    kind: 'result',
    laneId: 'engine',
    stageId: 'validation',
    eyebrow: 'REFUERZO',
    title: 'Feedback adaptativo',
    description: 'Recomienda cápsula o ajuste puntual.',
    status: 'improve',
    position: { x: 3030, y: 880 },
    width: 225,
  },
  {
    id: 'next-skill-engine',
    kind: 'result',
    laneId: 'engine',
    stageId: 'continuity',
    eyebrow: 'SIGUIENTE PASO',
    title: 'Activa la próxima skill',
    description: 'Conserva progreso y evidencia vinculada.',
    status: 'verified',
    position: { x: 3650, y: 884 },
    width: 245,
  },
  {
    id: 'evidence-document',
    kind: 'document',
    laneId: 'evidence',
    stageId: 'application',
    eyebrow: 'EVIDENCIA',
    title: 'Entrega ficha y soporte verificable',
    description: 'Problema, usuario, impacto, factibilidad, riesgo y métrica.',
    status: 'pending',
    position: { x: 2315, y: 1188 },
    width: 260,
  },
  {
    id: 'rubric',
    kind: 'document',
    laneId: 'evidence',
    stageId: 'validation',
    eyebrow: 'RÚBRICA · 4 CRITERIOS',
    title: 'Evalúa la calidad de la evidencia',
    description: 'La rúbrica es visible antes de enviar.',
    status: 'review',
    position: { x: 2675, y: 1188 },
    width: 245,
  },
  {
    id: 'human-review',
    kind: 'process',
    laneId: 'evidence',
    stageId: 'validation',
    eyebrow: 'CONTROL HUMANO',
    title: 'Revisión académica',
    description: 'El criterio final no se delega automáticamente.',
    status: 'review',
    position: { x: 2980, y: 1188 },
    width: 245,
  },
  {
    id: 'review-decision',
    kind: 'decision',
    laneId: 'evidence',
    stageId: 'validation',
    eyebrow: 'DECISIÓN',
    title: '¿La evidencia demuestra la skill?',
    status: 'review',
    position: { x: 3290, y: 1172 },
    width: 195,
    height: 195,
  },
  {
    id: 'needs-improvement',
    kind: 'result',
    laneId: 'evidence',
    stageId: 'continuity',
    eyebrow: 'REQUIERE MEJORA',
    title: 'Iterar evidencia',
    description: 'Vuelve a práctica con una brecha concreta.',
    status: 'improve',
    position: { x: 3570, y: 1162 },
    width: 235,
  },
  {
    id: 'skill-verified',
    kind: 'result',
    laneId: 'evidence',
    stageId: 'continuity',
    eyebrow: 'VERIFICADA',
    title: 'Skill demostrada con evidencia',
    description: 'Revisor y decisión quedan trazables.',
    status: 'verified',
    position: { x: 3570, y: 1300 },
    width: 235,
  },
  {
    id: 'mentor-support',
    kind: 'process',
    laneId: 'community',
    stageId: 'application',
    eyebrow: 'MENTORÍA',
    title: 'Desbloquea la práctica',
    description: 'Orientación puntual, no resolución del entregable.',
    status: 'neutral',
    position: { x: 2410, y: 1494 },
    width: 245,
  },
  {
    id: 'peer-review',
    kind: 'process',
    laneId: 'community',
    stageId: 'validation',
    eyebrow: 'COMUNIDAD',
    title: 'Contraste entre pares',
    description: 'Comparte criterio y contexto profesional.',
    status: 'neutral',
    position: { x: 2860, y: 1494 },
    width: 240,
  },
  {
    id: 'skill-passport',
    kind: 'document',
    laneId: 'community',
    stageId: 'continuity',
    eyebrow: 'SKILL PASSPORT',
    title: 'Registra evidencia verificada',
    description: 'Skill, evidencia, revisor y fecha.',
    status: 'verified',
    position: { x: 3520, y: 1494 },
    width: 250,
  },
  {
    id: 'company-transfer',
    kind: 'result',
    laneId: 'community',
    stageId: 'continuity',
    eyebrow: 'TRANSFERENCIA',
    title: 'Aplica la capacidad en empresa',
    description: 'El aprendizaje se convierte en evidencia profesional.',
    status: 'verified',
    position: { x: 3860, y: 1494 },
    width: 260,
  },
];

export const learningMapEdges: LearningMapEdge[] = [
  {
    id: 'start-diagnosis',
    source: 'flow-start',
    target: 'participant-diagnosis',
    tone: 'route',
  },
  {
    id: 'diagnosis-engine',
    source: 'participant-diagnosis',
    target: 'diagnostic-engine',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    tone: 'route',
  },
  {
    id: 'engine-recommendation',
    source: 'diagnostic-engine',
    target: 'route-recommendation',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    tone: 'route',
  },
  {
    id: 'recommendation-course',
    source: 'route-recommendation',
    target: 'map-level-1',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    tone: 'route',
  },
  {
    id: 'level-1-level-2',
    source: 'map-level-1',
    target: 'map-level-2',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    tone: 'route',
  },
  {
    id: 'level-2-level-3',
    source: 'map-level-2',
    target: 'map-level-3',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    tone: 'route',
  },
  {
    id: 'level-3-level-4',
    source: 'map-level-3',
    target: 'map-level-4',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    label: 'Electivos',
    tone: 'route',
  },
  {
    id: 'level-4-level-5',
    source: 'map-level-4',
    target: 'map-level-5',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    tone: 'route',
  },
  {
    id: 'level-5-level-6',
    source: 'map-level-5',
    target: 'map-level-6',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    tone: 'route',
  },
  {
    id: 'level-6-level-7',
    source: 'map-level-6',
    target: 'map-level-7',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    tone: 'route',
  },
  {
    id: 'level-7-level-8',
    source: 'map-level-7',
    target: 'map-level-8',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    label: 'Capstone',
    tone: 'verified',
  },
  {
    id: 'level-one-active-course',
    source: 'map-level-1',
    target: 'active-course',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    label: 'Vertical slice',
    tone: 'route',
  },
  { id: 'course-module', source: 'active-course', target: 'active-module', tone: 'route' },
  { id: 'module-capsule-1', source: 'active-module', target: 'capsule-1', tone: 'route' },
  { id: 'capsule-1-2', source: 'capsule-1', target: 'capsule-2', tone: 'route' },
  { id: 'capsule-2-3', source: 'capsule-2', target: 'capsule-3', tone: 'route' },
  { id: 'capsule-3-practice', source: 'capsule-3', target: 'practice', tone: 'route' },
  { id: 'practice-check', source: 'practice', target: 'practice-decision', tone: 'route' },
  {
    id: 'check-evidence',
    source: 'practice-decision',
    target: 'evidence-document',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    label: 'Sí',
    tone: 'route',
  },
  {
    id: 'check-feedback',
    source: 'practice-decision',
    target: 'adaptive-feedback',
    label: 'Aún no',
    tone: 'feedback',
  },
  {
    id: 'feedback-capsule',
    source: 'adaptive-feedback',
    target: 'capsule-1',
    sourceHandle: 'source-top',
    targetHandle: 'target-top',
    label: 'Refuerzo',
    tone: 'feedback',
  },
  { id: 'evidence-rubric', source: 'evidence-document', target: 'rubric', tone: 'route' },
  { id: 'rubric-review', source: 'rubric', target: 'human-review', tone: 'route' },
  { id: 'review-decision-edge', source: 'human-review', target: 'review-decision', tone: 'route' },
  {
    id: 'decision-improve',
    source: 'review-decision',
    target: 'needs-improvement',
    label: 'No',
    tone: 'feedback',
  },
  {
    id: 'decision-verified',
    source: 'review-decision',
    target: 'skill-verified',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-left',
    label: 'Sí',
    tone: 'verified',
  },
  {
    id: 'improve-practice',
    source: 'needs-improvement',
    target: 'practice',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    label: 'Iterar',
    tone: 'feedback',
  },
  {
    id: 'verified-passport',
    source: 'skill-verified',
    target: 'skill-passport',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    tone: 'verified',
  },
  {
    id: 'passport-company',
    source: 'skill-passport',
    target: 'company-transfer',
    tone: 'verified',
  },
  {
    id: 'passport-next',
    source: 'skill-passport',
    target: 'next-skill-engine',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    tone: 'verified',
  },
  {
    id: 'next-level-participant',
    source: 'next-skill-engine',
    target: 'participant-next-level',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    tone: 'verified',
  },
  {
    id: 'mentor-practice',
    source: 'mentor-support',
    target: 'practice',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    tone: 'support',
  },
  {
    id: 'peer-review-support',
    source: 'peer-review',
    target: 'human-review',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    tone: 'support',
  },
  {
    id: 'feedback-participant',
    source: 'human-review',
    target: 'participant-feedback',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    tone: 'support',
  },
  {
    id: 'progress-active-module',
    source: 'participant-progress',
    target: 'active-module',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    tone: 'support',
  },
];

export const learningLevelNodeDefaults = aecodeF3Route.levels.map((level, index) => ({
  id: `map-${level.id}`,
  levelId: level.id,
  position: { x: 190 + index * 505, y: 438 },
  width: 465,
}));

export const mobileLearningSequence = [
  {
    id: 'mobile-diagnosis',
    stage: '1 · Diagnóstico',
    title: 'Define punto de partida',
    detail: 'Rol, objetivo, brecha y tiempo disponible.',
  },
  {
    id: 'mobile-route',
    stage: '2 · Ruta base',
    title: 'Recibe nivel y skill recomendados',
    detail: 'La secuencia explica por qué debes empezar allí.',
  },
  {
    id: 'mobile-learning',
    stage: '3 · Aprendizaje guiado',
    title: 'C01 → M05 → 3 cápsulas',
    detail: 'Detecta fricciones, formula el caso y prioriza con criterios.',
  },
  {
    id: 'mobile-practice',
    stage: '4 · Aplicación',
    title: 'Resuelve una práctica real',
    detail: 'Si no cumple criterios, recibe refuerzo y vuelve a intentar.',
  },
  {
    id: 'mobile-evidence',
    stage: '5 · Evidencia y validación',
    title: 'Entrega evidencia y pasa revisión humana',
    detail: 'Rúbrica visible, decisión explicada y oportunidad de mejora.',
  },
  {
    id: 'mobile-continuity',
    stage: '6 · Continuidad',
    title: 'Skill verificada → Passport → siguiente nivel',
    detail: 'El progreso se demuestra con evidencia aceptada.',
  },
] as const;
