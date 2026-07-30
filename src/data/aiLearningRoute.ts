import type { EdgeType, ProcessMap, ProcessNodeData } from '../types/process';
import {
  makeChecklistItem,
  makeDocument,
  makeEdge,
  makeLane,
  makeMetric,
  makeNode,
  makeRisk,
  nowIso,
} from '../lib/processSchema';

export const AI_LEARNING_SOURCE = {
  title: 'AECODE - F3 | ESTRUCTURA MICROLEARNING',
  sheet: 'Ruta IA Diplomado',
  modules: 118,
  milestones: 8,
  url: 'https://docs.google.com/spreadsheets/d/16ZepB3xEqqGYfB_o3zs1yllTHxhIbLMRz5eXH5tESHo/edit?pli=1&gid=1677733499#gid=1677733499',
} as const;

type RouteType = 'tronco' | 'electivo' | 'capstone';

interface RouteCourse {
  id: string;
  code: string;
  title: string;
  summary: string;
  skills: string[];
  density: string;
}

interface RouteMilestone {
  id: string;
  number: number;
  title: string;
  routeType: RouteType;
  courses: RouteCourse[];
}

const MILESTONES: RouteMilestone[] = [
  {
    id: 'h1',
    number: 1,
    title: 'Fundamentos, criterio y uso responsable',
    routeType: 'tronco',
    courses: [
      {
        id: 'h1-c01',
        code: 'C01',
        title: 'IA para Construcción: fundamentos y criterio',
        summary: 'Distinguir tipos de IA, límites, riesgos y oportunidades de uso en el ciclo AEC.',
        skills: ['Reconocer cuándo usar IA', 'Validar respuestas y fuentes', 'Priorizar un caso de uso'],
        density: 'Accesible · práctico',
      },
      {
        id: 'h1-e01',
        code: 'H1-E01',
        title: 'Prompt Engineering y Context Engineering',
        summary: 'Construir instrucciones profesionales y contextos reutilizables para entregables AEC.',
        skills: ['Diseñar prompts verificables', 'Estructurar contexto', 'Versionar una biblioteca de prompts'],
        density: 'Intermedio · práctico',
      },
    ],
  },
  {
    id: 'h2',
    number: 2,
    title: 'Asistentes y productividad aumentada',
    routeType: 'tronco',
    courses: [
      {
        id: 'h2-c02',
        code: 'C02',
        title: 'Asistentes IA para productividad y entregables AEC',
        summary: 'Aplicar asistentes a documentos, reuniones, análisis y producción técnica con control humano.',
        skills: ['Configurar un asistente', 'Analizar documentos', 'Producir entregables trazables'],
        density: 'Accesible · práctico',
      },
      {
        id: 'h2-assistants',
        code: 'H2-E01–E04',
        title: 'Ecosistemas de asistentes profesionales',
        summary: 'Elegir y operar ChatGPT, Claude, Gemini o Microsoft 365 según tarea, contexto y permisos.',
        skills: ['Configurar proyectos e instrucciones', 'Analizar documentos y datos', 'Elegir el stack adecuado'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h2-research',
        code: 'H2-E05',
        title: 'Perplexity y Deep Research',
        summary: 'Investigar, triangular fuentes y convertir hallazgos en un brief técnico accionable.',
        skills: ['Diseñar búsquedas', 'Contrastar fuentes', 'Redactar un brief con evidencia'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h2-multimodal',
        code: 'H2-E06',
        title: 'Comunicación visual y multimodal con IA',
        summary: 'Construir informes, presentaciones y recursos visuales con narrativa y control de calidad.',
        skills: ['Estructurar narrativa', 'Generar recursos multimodales', 'Validar fidelidad'],
        density: 'Accesible · práctico',
      },
    ],
  },
  {
    id: 'h3',
    number: 3,
    title: 'Conocimiento, documentación y evidencia',
    routeType: 'tronco',
    courses: [
      {
        id: 'h3-c03',
        code: 'C03',
        title: 'Gestión del conocimiento con NotebookLM y RAG',
        summary: 'Crear un corpus gobernado y obtener respuestas citadas, comparables y trazables.',
        skills: ['Curar fuentes', 'Consultar con citas', 'Evaluar cobertura del conocimiento'],
        density: 'Accesible · práctico',
      },
      {
        id: 'h3-rag',
        code: 'H3-E03',
        title: 'RAG vectorial para asistentes',
        summary: 'Preparar documentos, recuperar contexto y evaluar un asistente conectado a un corpus.',
        skills: ['Preparar embeddings', 'Diseñar recuperación', 'Evaluar respuestas'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h3-contracts',
        code: 'H3-E04',
        title: 'IA para contratos, licitaciones y RFIs',
        summary: 'Despiece, comparación y control documental asistido con roles de aprobación.',
        skills: ['Extraer requisitos', 'Comparar versiones', 'Operar un flujo documentado'],
        density: 'Intermedio · práctico',
      },
    ],
  },
  {
    id: 'h4',
    number: 4,
    title: 'Construye sin programar',
    routeType: 'electivo',
    courses: [
      {
        id: 'h4-c04',
        code: 'C04',
        title: 'Fundamentos de automatización no-code',
        summary: 'Traducir un proceso manual a trigger, reglas, acciones, datos, control humano y fallback.',
        skills: ['Mapear un workflow', 'Definir reglas determinísticas', 'Diseñar manejo de errores'],
        density: 'Accesible · práctico',
      },
      {
        id: 'h4-make',
        code: 'H4-E01',
        title: 'Automatización con Make para procesos AEC',
        summary: 'Conectar aplicaciones, transformar datos y operar escenarios multi-módulo.',
        skills: ['Construir escenarios', 'Mapear datos', 'Monitorear ejecuciones'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h4-n8n',
        code: 'H4-E02',
        title: 'n8n y Google Cloud para operaciones AEC',
        summary: 'Diseñar workflows avanzados con APIs, subflujos, errores e infraestructura controlada.',
        skills: ['Integrar APIs', 'Orquestar subflujos', 'Operar con logs y reintentos'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h4-apps',
        code: 'H5-E05',
        title: 'Apps no-code, low-code y vibe coding',
        summary: 'Pasar de problema y usuario a una aplicación AEC mínima, publicable y medible.',
        skills: ['Definir un MVP', 'Construir una interfaz', 'Publicar y evolucionar'],
        density: 'Intermedio · práctico',
      },
    ],
  },
  {
    id: 'h5',
    number: 5,
    title: 'Agentes e IDE agéntico',
    routeType: 'electivo',
    courses: [
      {
        id: 'h5-agents',
        code: 'H4-E05',
        title: 'Agentes IA con herramientas y MCP',
        summary: 'Diseñar agentes con rol, permisos, herramientas, evaluación y control humano.',
        skills: ['Diferenciar agente y workflow', 'Conectar herramientas', 'Evaluar y monitorear'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h5-mcp',
        code: 'MCP',
        title: 'Contexto de modelo para herramientas AEC',
        summary: 'Conectar datos y acciones con contratos claros, permisos, logs y fallback.',
        skills: ['Diseñar recursos y tools', 'Controlar permisos', 'Auditar acciones'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h5-ides',
        code: 'IDE-AI',
        title: 'Claude Code, Codex y Cursor',
        summary: 'Dirigir agentes de código sobre repositorios y carpetas sin perder control del alcance.',
        skills: ['Delegar una feature', 'Revisar cambios', 'Validar y entregar'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h5-software',
        code: 'H4-E07',
        title: 'De prototipo a software AEC real',
        summary: 'Versionar, modelar datos, probar, desplegar y mantener una aplicación asistida por IA.',
        skills: ['Usar Git', 'Modelar el dominio', 'Probar y desplegar'],
        density: 'Técnico-dev · opt-in',
      },
    ],
  },
  {
    id: 'h6',
    number: 6,
    title: 'Datos, ML y visión computacional',
    routeType: 'electivo',
    courses: [
      {
        id: 'h6-c05',
        code: 'C05',
        title: 'Datos y arquitectura de soluciones IA',
        summary: 'Definir datos, componentes, APIs, prototipo, evaluación y operación de una solución.',
        skills: ['Evaluar calidad de datos', 'Diseñar arquitectura funcional', 'Definir pruebas'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h6-pbi',
        code: 'H5-E01',
        title: 'Power BI para proyectos AEC',
        summary: 'Preparar datos, crear indicadores y publicar un dashboard gobernado.',
        skills: ['Transformar con Power Query', 'Crear KPIs', 'Publicar con permisos'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h6-python',
        code: 'H5-E02',
        title: 'Python para automatización y análisis AEC',
        summary: 'Procesar archivos y datasets y convertir un script en una herramienta usable.',
        skills: ['Procesar CSV, Excel y JSON', 'Automatizar análisis', 'Manejar errores'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h6-ml',
        code: 'H5-E03',
        title: 'Machine Learning aplicado a datos AEC',
        summary: 'Formular, entrenar, comparar e interpretar modelos predictivos sin fuga de datos.',
        skills: ['Preparar un dataset', 'Evaluar modelos', 'Interpretar sesgos'],
        density: 'Técnico-dev · opt-in',
      },
      {
        id: 'h6-cv',
        code: 'H5-E04',
        title: 'Visión computacional y YOLO para obra',
        summary: 'Preparar imágenes, entrenar un detector y validar precisión, privacidad y límites.',
        skills: ['Etiquetar un dataset', 'Entrenar YOLO', 'Evaluar mAP e IoU'],
        density: 'Técnico-dev · opt-in',
      },
    ],
  },
  {
    id: 'h7',
    number: 7,
    title: 'IA aplicada al sector AEC',
    routeType: 'electivo',
    courses: [
      {
        id: 'h7-bim',
        code: 'H5-E06',
        title: 'IA aplicada a BIM, modelos y QA/QC',
        summary: 'Priorizar, automatizar y validar casos sobre Revit, IFC, datos y coordinación BIM.',
        skills: ['Consultar modelos', 'Automatizar parámetros', 'Validar QA/QC'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h7-structures',
        code: 'H5-E07',
        title: 'IA para ingeniería estructural e inspección',
        summary: 'Revisar documentación, automatizar cálculos y clasificar evidencia de daños.',
        skills: ['Extraer supuestos', 'Automatizar verificaciones', 'Evaluar daños con evidencia'],
        density: 'Intermedio · práctico',
      },
      {
        id: 'h7-controls',
        code: 'H5-E09',
        title: 'Planificación, costos y control de obra',
        summary: 'Analizar restricciones, costos, avance y alertas para sostener decisiones de proyecto.',
        skills: ['Analizar cronogramas', 'Verificar costos', 'Comunicar estado y riesgos'],
        density: 'Intermedio · práctico',
      },
    ],
  },
  {
    id: 'h8',
    number: 8,
    title: 'Implementación y Capstone',
    routeType: 'capstone',
    courses: [
      {
        id: 'h8-c06',
        code: 'C06',
        title: 'Implementación AI First, gobierno y adopción',
        summary: 'Definir problema, piloto, métricas, gobierno, adopción y defensa de una solución real.',
        skills: ['Definir propuesta de valor', 'Diseñar un piloto', 'Medir impacto y adopción'],
        density: 'Accesible · práctico',
      },
      {
        id: 'h8-ops',
        code: 'H6-E02',
        title: 'Evaluación, LLMOps y MLOps',
        summary: 'Evaluar antes de desplegar y operar versiones, trazas, costo, seguridad y rollback.',
        skills: ['Construir casos de prueba', 'Registrar versiones y trazas', 'Monitorear en producción'],
        density: 'Técnico-dev · opt-in',
      },
    ],
  },
];

const ROUTE_LABEL: Record<RouteType, string> = {
  tronco: 'Tronco común',
  electivo: 'Ruta electiva',
  capstone: 'Convergencia',
};

const ROUTE_COLORS = ['#0E2A6B', '#1748B5', '#2165FF', '#4D84FF', '#5E90FF', '#72A0FF', '#8CB1FF', '#AFC7FF'];

export function buildAILearningRoute(): ProcessMap {
  const createdAt = nowIso();
  const lanes = MILESTONES.map((milestone, index) =>
    makeLane({
      id: `lane-ai-${milestone.id}`,
      name: `Hito ${milestone.number} · ${milestone.title}`,
      type: 'custom',
      color: ROUTE_COLORS[index],
      ownerRole: ROUTE_LABEL[milestone.routeType],
      description: `routeType:${milestone.routeType}`,
    }),
  );

  const nodesById = new Map<string, ProcessNodeData>();
  const nodes = MILESTONES.flatMap((milestone) =>
    milestone.courses.map((course) => {
      const node = makeNode({
        id: `node-ai-${course.id}`,
        type: milestone.routeType === 'capstone' ? 'approval' : 'activity',
        code: course.code,
        title: course.title,
        description: course.summary,
        laneId: `lane-ai-${milestone.id}`,
        responsible: ROUTE_LABEL[milestone.routeType],
        estimatedDuration: '3–6 módulos',
        status: 'draft',
        priority: milestone.routeType === 'capstone' ? 'high' : 'medium',
        inputs: milestone.number === 1 ? ['Diagnóstico inicial'] : [`Hito ${Math.max(1, milestone.number - 1)} o prerrequisito validado`],
        outputs: course.skills,
        evidence: 'Evidencia y rúbrica por definir en la implementación académica.',
        metadata: {
          routeType: milestone.routeType,
          hito: String(milestone.number),
          density: course.density,
          source: AI_LEARNING_SOURCE.title,
          sourceSheet: AI_LEARNING_SOURCE.sheet,
          sourceModules: String(AI_LEARNING_SOURCE.modules),
        },
      });
      nodesById.set(course.id, node);
      return node;
    }),
  );

  const edges = [];
  for (const milestone of MILESTONES) {
    for (let index = 0; index < milestone.courses.length - 1; index += 1) {
      edges.push(makeEdge(nodesById.get(milestone.courses[index].id)!.id, nodesById.get(milestone.courses[index + 1].id)!.id));
    }
  }

  const link = (source: string, target: string, type: EdgeType = 'sequence', label?: string) => {
    edges.push(makeEdge(nodesById.get(source)!.id, nodesById.get(target)!.id, { type, label }));
  };

  link('h1-e01', 'h2-c02');
  link('h2-multimodal', 'h3-c03');
  link('h3-contracts', 'h4-c04', 'sequence', 'Automatización');
  link('h3-contracts', 'h5-agents', 'sequence', 'Agentes / dev');
  link('h3-contracts', 'h6-c05', 'sequence', 'Datos / ML');
  link('h3-contracts', 'h7-bim', 'sequence', 'Especialidad AEC');
  link('h4-apps', 'h8-c06', 'sequence', 'Converge');
  link('h5-software', 'h8-c06', 'sequence', 'Converge');
  link('h6-cv', 'h8-c06', 'sequence', 'Converge');
  link('h7-controls', 'h8-c06', 'sequence', 'Converge');
  link('h6-ml', 'h7-structures', 'dependency', 'Desbloquea nivel avanzado');
  link('h6-cv', 'h7-bim', 'dependency', 'Desbloquea visión');

  return {
    id: 'proc-ai-learning-route',
    title: 'Ruta IA · Diplomado AEC',
    description:
      'Mapa editable GEN+ de la Ruta IA Diplomado de AECODE. Presenta 27 clusters que sintetizan los 118 módulos de la fuente en 8 hitos: tronco común, bifurcación electiva y convergencia en implementación.',
    context: `Fuente verificada: ${AI_LEARNING_SOURCE.title}, pestaña ${AI_LEARNING_SOURCE.sheet}.`,
    objective: 'Convertir el currículo completo en una ruta comprensible, editable y lista para validar dependencias, evidencias y secuencia.',
    owner: 'AECODE · Coordinación Académica',
    version: '2026.07',
    maturityLevel: 'current',
    status: 'mapeado',
    area: 'Educación · IA aplicada a AEC',
    involvedAreas: ['Producto educativo', 'Contenido', 'Tecnología', 'Certificación'],
    tags: ['ruta-ia', 'aecode', 'genplus-canvas', 'diplomado-ia'],
    northStarMetric: 'Skills verificadas con evidencia por usuario activo mensual',
    unitOfFlow: 'Skill verificada con evidencia',
    industry: 'Arquitectura, Ingeniería y Construcción',
    createdAt,
    updatedAt: createdAt,
    lanes,
    nodes,
    edges,
    metrics: [
      makeMetric({
        code: 'RUTA-01',
        name: 'Síntesis visible de la fuente curricular',
        category: 'quality',
        formula: 'clusters visuales / módulos documentados en la fuente',
        target: '27 clusters · fuente de 118 módulos',
        currentValue: '27 clusters visuales',
        frequency: 'Por revisión curricular',
        owner: 'Coordinación Académica',
        dataSource: AI_LEARNING_SOURCE.title,
        interpretation: 'Es una síntesis ejecutiva, no una correspondencia 1:1 ni evidencia de contenido producido o validado.',
        decisionRule: 'Si cambia la hoja fuente, revisar versión y dependencias del mapa.',
      }),
      makeMetric({
        code: 'RUTA-02',
        name: 'Hitos con evidencia y rúbrica definidas',
        category: 'quality',
        formula: 'hitos con criterio de aceptación / 8',
        target: '8/8',
        currentValue: 'No evaluado',
        frequency: 'Por hito',
        owner: 'Producto Educativo',
        dataSource: 'Diseño instruccional',
        interpretation: 'La estructura está mapeada; la validación pedagógica requiere evidencia.',
        decisionRule: 'No publicar una certificación sin rúbrica y evidencia aceptada.',
      }),
    ],
    risks: [
      makeRisk({
        name: 'Sobrecarga visual por mostrar 118 módulos a la vez',
        probability: 4,
        impact: 4,
        mitigation: 'Mostrar cursos por hito y revelar el detalle en el inspector y filtros.',
        owner: 'Producto Educativo',
      }),
      makeRisk({
        name: 'Dependencias curriculares sin validación pedagógica',
        probability: 3,
        impact: 4,
        mitigation: 'Validar prerrequisitos, evidencia y rúbrica con owner antes de declarar la ruta operativa.',
        owner: 'Coordinación Académica',
      }),
      makeRisk({
        name: 'Desalineación entre mapa y hoja fuente',
        probability: 3,
        impact: 3,
        mitigation: 'Versionar la fuente y ejecutar una revisión cuando cambien filas, hitos o tipo de ruta.',
        owner: 'Producto Educativo',
      }),
    ],
    automations: [],
    documents: [
      makeDocument({
        name: AI_LEARNING_SOURCE.title,
        type: 'Google Sheet',
        format: 'Google Sheets',
        owner: 'AECODE',
        repository: AI_LEARNING_SOURCE.url,
        required: true,
      }),
    ],
    assumptions: [
      `La hoja ${AI_LEARNING_SOURCE.title} es la fuente curricular de esta versión.`,
      'El mapa condensa cursos y clusters; el detalle completo permanece en los 118 módulos de la fuente.',
      'La posición visual no sustituye la validación académica de prerrequisitos.',
    ],
    openQuestions: [
      '¿Qué evidencias y rúbricas validan cada hito?',
      '¿Qué electivos son obligatorios por perfil profesional?',
      '¿Qué owner aprueba cambios entre la hoja y el mapa?',
    ],
    implementationChecklist: [
      makeChecklistItem('Validar prerrequisitos y bifurcaciones con Coordinación Académica', 'Gobierno'),
      makeChecklistItem('Definir evidencia y rúbrica por hito', 'Evidencia'),
      makeChecklistItem('Asignar owner a cada curso y electivo', 'Operación'),
      makeChecklistItem('Probar comprensión de la ruta con cinco usuarios', 'Validación'),
    ],
  };
}
