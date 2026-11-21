import type { StudioEntity } from "./types";

type TemplateDefinition = {
  id: string;
  name: string;
  description: string;
  stages: string[];
};

export const launchTemplates: TemplateDefinition[] = [
  {
    id: "approval",
    name: "Aprobación de solicitud",
    description: "Solicitud, revisión, decisión y evidencia.",
    stages: [
      "Registrar solicitud",
      "Validar expediente",
      "¿Información completa?",
      "Aprobar y comunicar",
    ],
  },
  {
    id: "incident",
    name: "Gestión de incidencia",
    description: "Triage, escalamiento, solución y cierre.",
    stages: [
      "Registrar incidencia",
      "Clasificar prioridad",
      "Resolver o escalar",
      "Verificar cierre",
    ],
  },
  {
    id: "rfi",
    name: "RFI técnico",
    description: "Consulta técnica con respuesta formal trazable.",
    stages: [
      "Registrar RFI",
      "Validar consulta",
      "Resolver con especialista",
      "Emitir respuesta",
    ],
  },
  {
    id: "dfma",
    name: "Diseño y liberación DfMA",
    description: "Diseño coordinado listo para fábrica.",
    stages: [
      "Recibir paquete",
      "Coordinar interfaces",
      "Revisar fabricabilidad",
      "Liberar a fabricación",
    ],
  },
  {
    id: "fabrication",
    name: "Fabricación y QA",
    description: "Lote fabricado con conformidad.",
    stages: [
      "Liberar orden",
      "Fabricar lote",
      "Inspeccionar calidad",
      "Embalaje conforme",
    ],
  },
  {
    id: "transport",
    name: "Transporte y recepción",
    description: "Carga entregada en ventana acordada.",
    stages: [
      "Planificar carga",
      "Despachar",
      "Transportar",
      "Recibir y verificar",
    ],
  },
  {
    id: "assembly",
    name: "Montaje y aceptación",
    description: "Montaje, inspección y entrega.",
    stages: [
      "Liberar frente",
      "Montar lote",
      "Inspeccionar",
      "Aceptar instalación",
    ],
  },
  {
    id: "industrial",
    name: "Cadena industrializada",
    description: "Diseño, fábrica, transporte y montaje.",
    stages: [
      "Diseñar paquete",
      "Fabricar lote",
      "¿Lote liberado para despacho?",
      "Transportar carga",
      "Montar módulo",
    ],
  },
];

export function createTemplateEntities(templateId: string): StudioEntity[] {
  const template =
    launchTemplates.find((item) => item.id === templateId) ??
    launchTemplates[0];
  const handlers: Record<string, string[]> = {
    approval: ["Solicitante", "Mesa de entrada", "Revisor", "Aprobador"],
    incident: [
      "Usuario",
      "Soporte",
      "Especialista",
      "Responsable del servicio",
    ],
    rfi: ["Obra", "Oficina técnica", "Proyectista", "Control documental"],
    dfma: [
      "Diseño",
      "Coordinación BIM",
      "Ingeniería de fábrica",
      "Control documental",
    ],
    fabrication: [
      "Planificación",
      "Producción",
      "Control de calidad",
      "Despacho",
    ],
    transport: ["Logística", "Despacho", "Transportista", "Recepción"],
    assembly: ["Jefe de frente", "Montaje", "Inspección", "Cliente"],
    industrial: ["Diseño / VDC", "Fábrica", "Calidad", "Transporte", "Montaje"],
  };
  const lanes = handlers[template.id];
  const laneEntities: StudioEntity[] = lanes.map((name, index) => ({
    id: `lane_${template.id}_${index}`,
    kind: "lane",
    rev: 0,
    data: {
      name,
      color: ["#2165ff", "#12867a", "#6676f5", "#b56c1d", "#557c54"][index],
    },
  }));
  const queue: StudioEntity = {
    id: `queue_${template.id}`,
    kind: "step",
    rev: 0,
    data: {
      title: "COLA · trabajo listo",
      laneId: laneEntities[0].id,
      owner: "Planificador",
      type: "queue",
      x: 100,
      y: 90,
      status: "active",
      evidence: "Criterio de entrada validado",
    },
  };
  const steps: StudioEntity[] = template.stages.map((title, index) => ({
    id:
      template.id === "industrial" && index === 0
        ? "prefabricated-design"
        : `step_${template.id}_${index}`,
    kind: "step",
    rev: 0,
    data: {
      title,
      laneId: laneEntities[index % laneEntities.length].id,
      owner: lanes[index % lanes.length],
      type:
        title.startsWith("¿")
          ? "decision"
          : /^(inicio|fin|cierre|aceptación|aceptar)/i.test(title)
            ? index === template.stages.length - 1 ? "end" : "start"
            : "activity",
      x: 340 + index * 250,
      y: 90 + (index % 2) * 150,
      status: "draft",
      condition: title.startsWith("¿")
        ? "¿Cumple criterios de salida?"
        : undefined,
      evidence:
        index === template.stages.length - 1
          ? "Acta, registro o evidencia verificable"
          : undefined,
      reworkTo: title.startsWith("¿")
        ? stepsId(template.id, index - 1)
        : undefined,
      controls: {
        entry:
          index === 0
            ? "Trabajo priorizado y listo"
            : "Salida verificada del paso anterior",
        exit:
          index === template.stages.length - 1
            ? "Entrega aceptada"
            : "Criterio de salida cumplido",
        evidence:
          index === template.stages.length - 1
            ? "Acta o registro firmado"
            : "Registro de control",
      },
    },
  }));
  const edges: StudioEntity[] = [
    {
      id: `edge_${template.id}_queue`,
      kind: "edge",
      rev: 0,
      data: { source: queue.id, target: steps[0].id, type: "sequence" },
    },
    ...steps.slice(1).map((step, index) => ({
      id: `edge_${template.id}_${index}`,
      kind: "edge",
      rev: 0,
      data: { source: steps[index].id, target: step.id, type: "sequence" },
    })),
    ...steps
      .filter((step) => Boolean(step.data.condition))
      .map((step, index) => ({
        id: `edge_${template.id}_rework_${index}`,
        kind: "edge",
        rev: 0,
        data: {
          source: step.id,
          target: String(step.data.reworkTo),
          type: "rework",
          label: "No · retrabajo",
        },
      })),
  ];
  return [...laneEntities, queue, ...steps, ...edges];
}

function stepsId(templateId: string, index: number) {
  return `step_${templateId}_${index}`;
}
