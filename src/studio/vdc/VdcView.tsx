import { MetricRegistry, ProductionEntry, WorkQueue } from "./ControlPanel";
import { RelationshipGraph } from "./RelationshipGraph";
import { FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Factory,
  Gauge,
  Target,
} from "lucide-react";
import { uid, useStudio } from "../shared";
import { calculateProduction, metricResults } from "./metrics";
import { validateVdcGraph } from "./validation";
import { entityData, entitiesOf } from "./types";
import type {
  FactorData,
  MetricData,
  ObjectiveData,
  ObservationData,
  ProductionData,
  VdcEntity,
  VdcLinkData,
} from "./types";

export type VdcMode =
  | "gerencia"
  | "operacion"
  | "vdc"
  | "produccion"
  | "objetivos";

function percentage(value: number | null, unit: string): string {
  if (value === null) return "Sin dato";
  return `${value.toLocaleString("es-PE", { maximumFractionDigits: 1 })}${unit === "%" ? " %" : ` ${unit}`}`;
}

function MetricCard({
  metric,
  result,
  onClick,
}: {
  metric: MetricData;
  result: ReturnType<typeof metricResults>[number]["result"];
  onClick: () => void;
}) {
  const deltaValue = result.delta;
  const delta =
    deltaValue === null
      ? null
      : `${deltaValue > 0 ? "+" : ""}${deltaValue.toFixed(1)}`;
  return (
    <button
      onClick={onClick}
      className="rounded-card border border-[var(--gen-border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:shadow-focus"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="max-w-[185px] text-xs font-semibold text-[var(--gen-text)]">
          {metric.label}
        </span>
        <span
          className={`rounded-full px-2 py-1 text-[10px] font-bold ${result.status === "en_meta" ? "bg-emerald-100 text-emerald-800" : result.status === "sin_dato" ? "bg-slate-100 text-slate-600" : "bg-red-100 text-red-700"}`}
        >
          {result.status.replace("_", " ")}
        </span>
      </div>
      <div className="mt-4 flex items-end gap-2">
        <span className="text-3xl font-bold tracking-tight text-navy-900">
          {percentage(result.current, result.unit)}
        </span>
        {delta && (
          <span
            className={`mb-1 text-xs font-semibold ${deltaValue === 0 ? "text-slate-600" : deltaValue !== null && (result.comparison === "gte" ? deltaValue > 0 : deltaValue < 0) ? "text-emerald-700" : "text-red-700"}`}
          >
            {delta} vs. corte anterior
          </span>
        )}
      </div>
      <div className="mt-2 text-[11px] text-[var(--gen-text-muted)]">
        Meta {result.comparison === "gte" ? "≥" : "≤"} {result.target}
        {metric.unit} · {result.period} · {result.coverage} · {result.quality}
      </div>
    </button>
  );
}

function CifeTable({ entities }: { entities: VdcEntity[] }) {
  const studio = useStudio();
  const objectives = entitiesOf<ObjectiveData>(entities, "vdc-objective");
  const change = (
    entity: VdcEntity,
    field: keyof ObjectiveData,
    value: string,
  ) =>
    studio.canEdit &&
    value !== entity.data[field] &&
    studio.apply(
      [
        {
          id: entity.id,
          kind: entity.kind,
          expectedRev: entity.rev,
          data: { ...entity.data, [field]: value },
        },
      ],
      "Actualiza cuadro CIFE",
    );
  return (
    <section className="overflow-x-auto rounded-card border border-[var(--gen-border)] bg-white">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h2 className="font-bold">Cuadro CIFE</h2>
          <p className="text-xs text-[var(--gen-text-muted)]">
            La tabla y el mapa editan las mismas entidades.
          </p>
        </div>
      </div>
      <table className="mt-3 min-w-[820px] w-full text-left text-xs">
        <thead className="bg-slate-50 text-[10px] uppercase tracking-[.08em] text-[var(--gen-text-muted)]">
          <tr>
            <th className="px-4 py-3">Nivel</th>
            <th className="px-3 py-3">Objetivo</th>
            <th className="px-3 py-3">Meta</th>
            <th className="px-3 py-3">Línea base</th>
            <th className="px-3 py-3">Dueño</th>
            <th className="px-3 py-3">Horizonte</th>
          </tr>
        </thead>
        <tbody>
          {objectives.map((entity) => (
            <tr key={entity.id} className="border-t">
              <td className="px-4 py-2 font-bold text-brand-600">
                {entity.data.level}
              </td>
              <td className="px-3 py-2">
                <input
                  readOnly={!studio.canEdit}
                  aria-label={`Objetivo ${entity.data.code}`}
                  defaultValue={entity.data.title}
                  onBlur={(event) =>
                    void change(entity, "title", event.currentTarget.value)
                  }
                  className="w-full rounded border border-transparent bg-transparent px-2 py-1.5 hover:border-blue-200 focus:border-brand-500"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  readOnly={!studio.canEdit}
                  aria-label={`Meta ${entity.data.code}`}
                  defaultValue={entity.data.target}
                  onBlur={(event) =>
                    void change(entity, "target", event.currentTarget.value)
                  }
                  className="w-28 rounded border border-transparent bg-transparent px-2 py-1.5 hover:border-blue-200 focus:border-brand-500"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  readOnly={!studio.canEdit}
                  aria-label={`Línea base ${entity.data.code}`}
                  defaultValue={entity.data.baseline ?? ""}
                  onBlur={(event) =>
                    void change(entity, "baseline", event.currentTarget.value)
                  }
                  className="w-24 rounded border border-transparent bg-transparent px-2 py-1.5 hover:border-blue-200 focus:border-brand-500"
                />
              </td>
              <td className="px-3 py-2">
                <input
                  readOnly={!studio.canEdit}
                  aria-label={`Dueño ${entity.data.code}`}
                  defaultValue={entity.data.owner}
                  onBlur={(event) =>
                    void change(entity, "owner", event.currentTarget.value)
                  }
                  className="w-28 rounded border border-transparent bg-transparent px-2 py-1.5 hover:border-blue-200 focus:border-brand-500"
                />
              </td>
              <td className="px-3 py-2">{entity.data.horizon}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Factors({ entities }: { entities: VdcEntity[] }) {
  const studio = useStudio();
  const factors = entitiesOf<FactorData>(entities, "vdc-factor")
    .map((entity) => ({
      entity,
      score:
        entity.data.expectedImpact === null || entity.data.effortHours <= 0
          ? null
          : entity.data.expectedImpact / entity.data.effortHours,
    }))
    .sort((a, b) => {
      const group = (f: FactorData) =>
        [f.objectiveId, f.impactUnit, f.cadence].join("|");
      return (
        group(a.entity.data).localeCompare(group(b.entity.data)) ||
        (b.score ?? -1) - (a.score ?? -1)
      );
    });
  return (
    <section className="rounded-card border border-[var(--gen-border)] bg-white p-4">
      <div className="flex items-center gap-2">
        <Gauge size={17} className="text-brand-500" />
        <h3 className="text-sm font-bold">Palancas de esta semana</h3>
      </div>
      <p className="mt-1 text-xs text-[var(--gen-text-muted)]">
        La relación impacto/esfuerzo es una hipótesis hasta que haya
        observaciones compatibles.
      </p>
      <div className="mt-4 space-y-2">
        {factors.map(({ entity, score }) => (
          <button
            key={entity.id}
            onClick={() => studio.navigate("vdc", entity.id)}
            className={`grid w-full grid-cols-[1fr_auto] gap-3 rounded-btn border p-3 text-left hover:bg-blue-50 ${studio.selection === entity.id ? "border-brand-500 bg-blue-50" : "border-[var(--gen-border)]"}`}
          >
            <span>
              <b className="text-sm text-navy-900">{entity.data.title}</b>
              <span className="mt-1 block text-[11px] text-[var(--gen-text-muted)]">
                {entity.data.owner} · {entity.data.cadence} ·{" "}
                {entity.data.completed ? "evidencia registrada" : "pendiente"}
              </span>
            </span>
            <span className="text-right text-xs font-bold text-brand-600">
              {score === null
                ? "Sin dato"
                : `${score.toFixed(1)} ${entity.data.impactUnit}/h`}
              <span className="mt-1 block text-[10px] font-medium text-[var(--gen-text-muted)]">
                {entity.data.effortHours} h
              </span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Production({ entities }: { entities: VdcEntity[] }) {
  const production = entitiesOf<ProductionData>(
    entities,
    "production-snapshot",
  ).sort((a, b) => b.data.period.localeCompare(a.data.period))[0];
  if (!production)
    return (
      <div className="rounded-card border border-dashed p-5 text-sm text-[var(--gen-text-muted)]">
        No hay corte de producción para la frontera seleccionada.
      </div>
    );
  const result = calculateProduction(production.data);
  return (
    <section className="rounded-card border border-[var(--gen-border)] bg-white p-5">
      <div className="flex gap-3">
        <Factory className="text-brand-500" />
        <div>
          <h3 className="font-bold">Sistema de producción</h3>
          <p className="text-xs text-[var(--gen-text-muted)]">
            {production.data.boundary} · {production.data.period} ·{" "}
            {production.data.quality}
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Throughput observado"
          value={
            result.throughputPerDay === null
              ? "Sin dato"
              : `${result.throughputPerDay.toFixed(1)} ${production.data.unit}/día`
          }
          note="Salidas aceptadas / días hábiles"
        />
        <Metric
          label="WIP promedio"
          value={
            production.data.wipAverage === null
              ? "Sin dato"
              : `${production.data.wipAverage} ${production.data.unit}s`
          }
          note="Dentro de la misma frontera"
        />
        <Metric
          label="Little"
          value={
            result.littleLawCycleDays === null
              ? "Sin dato"
              : `${result.littleLawCycleDays.toFixed(1)} días`
          }
          note={`Consistencia ${result.flowConsistency}`}
        />
        <Metric
          label="Utilización"
          value={
            result.capacityUtilization === null
              ? "Sin dato"
              : `${(result.capacityUtilization * 100).toFixed(0)} %`
          }
          note={`Señal ${result.constraint}`}
        />
      </div>
      <div className="mt-4 rounded-btn bg-slate-50 p-3 text-xs text-[var(--gen-text-secondary)]">
        {result.limitations.length
          ? result.limitations.join(" ")
          : "Corte compatible. La desviación entre tiempo observado y Ley de Little queda visible para revisión."}
      </div>
    </section>
  );
}

function Scenario({ entities }: { entities: VdcEntity[] }) {
  const production = entitiesOf<ProductionData>(
    entities,
    "production-snapshot",
  ).sort((a, b) => b.data.period.localeCompare(a.data.period))[0];
  const [capacity, setCapacity] = useState({
    design: 6,
    fabrication: 5,
    transport: 7,
    montage: 4,
  });
  if (!production) return null;
  const current = calculateProduction(production.data);
  const bottleneck = Object.entries(capacity).sort((a, b) => a[1] - b[1])[0];
  const proposal = calculateProduction({
    ...production.data,
    capacityPerDay: bottleneck[1],
    loadPerDay: production.data.loadPerDay,
  });
  return (
    <section className="mt-5 rounded-card border border-[var(--gen-border)] bg-white p-5">
      <div className="flex items-start gap-3">
        <Factory className="text-brand-500" />
        <div>
          <h3 className="font-bold">Escenario de capacidad por etapa</h3>
          <p className="text-xs text-[var(--gen-text-muted)]">
            Escenario determinístico: limita la cadena por la menor capacidad;
            no proyecta throughput hasta medir el próximo corte.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {Object.entries(capacity).map(([stage, value]) => (
          <label
            key={stage}
            className="rounded-btn bg-slate-50 p-3 text-sm font-semibold capitalize text-navy-900"
          >
            {stage}{" "}
            <b className="float-right text-brand-600">{value} lotes/día</b>
            <input
              aria-label={`Capacidad ${stage}`}
              className="mt-3 w-full accent-[#2165ff]"
              type="range"
              min="2"
              max="9"
              value={value}
              onChange={(event) =>
                setCapacity({
                  ...capacity,
                  [stage]: Number(event.target.value),
                })
              }
            />
          </label>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Metric
          label="Actual"
          value={
            current.capacityUtilization === null
              ? "Sin dato"
              : `${(current.capacityUtilization * 100).toFixed(0)} % utilización`
          }
          note="Carga/capacidad actual"
        />
        <Metric
          label="Escenario"
          value={
            proposal.capacityUtilization === null
              ? "Sin dato"
              : `${(proposal.capacityUtilization * 100).toFixed(0)} % utilización`
          }
          note={`Restricción: ${bottleneck[0]}`}
        />
      </div>
      <p className="mt-3 rounded-btn bg-blue-50 p-3 text-xs text-navy-900">
        La capacidad restrictiva es <b>{bottleneck[0]}</b> ({bottleneck[1]}{" "}
        lotes/día). Throughput observado sigue en{" "}
        {current.throughputPerDay?.toFixed(1) ?? "sin dato"} lotes/día hasta
        validar un corte posterior.
      </p>
    </section>
  );
}

function EntityEditor({
  entities,
  objectiveOnly = false,
  close,
}: {
  entities: VdcEntity[];
  objectiveOnly?: boolean;
  close?: () => void;
}) {
  const studio = useStudio();
  const selected = studio.selection
    ? entities.find((entity) => entity.id === studio.selection)
    : undefined;
  const objectives = entitiesOf<ObjectiveData>(entities, "vdc-objective");
  const submitObjective = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id =
      selected?.kind === "vdc-objective" ? selected.id : uid("objective");
    const data = {
      ...(selected?.kind === "vdc-objective" ? selected.data : {}),
      code: String(form.get("code") || "OP-NUEVO"),
      title: String(form.get("title") || "Nuevo objetivo"),
      level: String(form.get("level") || "ProdO"),
      owner: String(form.get("owner") || studio.user.name),
      target: String(form.get("target") || "Pendiente"),
      baseline: String(form.get("baseline") || "Pendiente"),
      horizon: String(form.get("horizon") || "Semanal"),
      acceptance: String(form.get("acceptance") || "Pendiente"),
      lane:
        form.get("level") === "ProdO"
          ? String(form.get("lane") || "")
          : undefined,
      status: selected?.data.status || "sin_linea_base",
    };
    const ok = await studio.apply(
      [
        {
          id,
          kind: "vdc-objective",
          data,
          expectedRev: selected?.kind === "vdc-objective" ? selected.rev : 0,
        },
      ],
      selected?.kind === "vdc-objective"
        ? "Objetivo actualizado"
        : "Objetivo creado",
    );
    if (ok) studio.select(id);
  };
  const submitFactor = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const id = selected?.kind === "vdc-factor" ? selected.id : uid("fc");
    const data = {
      ...(selected?.kind === "vdc-factor" ? selected.data : {}),
      objectiveId: String(form.get("objectiveId")),
      title: String(form.get("title") || "Nuevo factor controlable"),
      owner: String(form.get("owner") || studio.user.name),
      cadence: String(form.get("cadence") || "Semanal"),
      effortHours: Number(form.get("effortHours") || 0),
      expectedImpact: form.get("expectedImpact")
        ? Number(form.get("expectedImpact"))
        : null,
      impactUnit: String(form.get("impactUnit") || "pendiente"),
      completed: Boolean(form.get("completed")),
      evidenceIds: selected?.data.evidenceIds || [],
    };
    await studio.apply(
      [{ id, kind: "vdc-factor", data, expectedRev: selected?.rev }],
      selected ? "Edita factor controlable" : "Crea factor controlable",
    );
    studio.select(id);
  };
  const submitLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const sourceId = String(form.get("sourceId"));
    const targetId = String(form.get("targetId"));
    const draft: VdcEntity = {
      id: selected?.kind === "vdc-link" ? selected.id : uid("link"),
      kind: "vdc-link",
      rev: selected?.rev ?? 0,
      data: {
        sourceId,
        targetId,
        reason: String(form.get("reason") || "Pendiente de explicar"),
        expectedDirection: String(form.get("expectedDirection") || "sube"),
        effectWindow: String(form.get("effectWindow") || "1 semana"),
        owner: String(form.get("owner") || studio.user.name),
        evidenceStatus: String(form.get("evidenceStatus") || "HIPOTESIS"),
        reviewDate: String(
          form.get("reviewDate") || new Date().toISOString().slice(0, 10),
        ),
        evidenceIds: [],
      },
    };
    const proposed =
      selected?.kind === "vdc-link"
        ? entities.map((entity) => (entity.id === draft.id ? draft : entity))
        : [...entities, draft];
    const validation = validateVdcGraph(proposed);
    if (validation.cycles.length) {
      studio.notify(
        "La relación crea un ciclo causal. Registra el aprendizaje como observación de otro corte.",
      );
      return;
    }
    await studio.apply(
      [
        {
          id: draft.id,
          kind: draft.kind,
          data: draft.data,
          expectedRev: selected?.rev,
        },
      ],
      selected ? "Edita hipótesis VDC" : "Crea hipótesis VDC",
    );
    studio.select(draft.id);
  };
  const tabs: Array<{
    kind: "vdc-objective" | "vdc-factor" | "vdc-link";
    label: string;
  }> = [
    { kind: "vdc-objective", label: "Objetivo" },
    { kind: "vdc-factor", label: "Factor" },
    { kind: "vdc-link", label: "Relación" },
  ];
  const current =
    selected?.kind &&
    ["vdc-objective", "vdc-factor", "vdc-link"].includes(selected.kind)
      ? (selected.kind as (typeof tabs)[number]["kind"])
      : "vdc-objective";
  const [tab, setTab] = useState<typeof current>(current);
  const sourceData =
    selected?.kind === "vdc-link"
      ? entityData<VdcLinkData>(selected)
      : undefined;
  const factorData =
    selected?.kind === "vdc-factor"
      ? entityData<FactorData>(selected)
      : undefined;
  const objectiveData =
    selected?.kind === "vdc-objective"
      ? entityData<ObjectiveData>(selected)
      : undefined;
  return (
    <section className="rounded-card border border-[var(--gen-border)] bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold">
            {objectiveOnly ? "Ficha del objetivo" : "Ficha VDC"}
          </h2>
          <p className="text-xs text-[var(--gen-text-muted)]">
            Editar crea una revisión compartida.
          </p>
        </div>
        <button
          className="text-xs text-brand-600 underline"
          onClick={() => {
            studio.select(null);
            close?.();
          }}
        >
          Cerrar
        </button>
      </div>
      {!objectiveOnly && (
        <div className="mt-4 flex gap-1 rounded-btn bg-slate-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.kind}
              onClick={() => {
                setTab(item.kind);
                studio.select(null);
              }}
              className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold ${tab === item.kind ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      {tab === "vdc-objective" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => void submitObjective(event)}
        >
          <Field
            name="code"
            label="Código"
            initial={objectiveData?.code ?? "OP-NUEVO"}
          />
          <Field
            name="title"
            label="Objetivo"
            initial={objectiveData?.title ?? ""}
          />
          <label className="block text-xs font-semibold">
            Nivel
            <select
              name="level"
              defaultValue={objectiveData?.level ?? "ProdO"}
              className="mt-1 w-full rounded-btn border p-2.5"
            >
              <option value="CO">Cliente · CO</option>
              <option value="PO">Proyecto · PO</option>
              <option value="ProdO">Producción · ProdO</option>
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Área del objetivo de producción
            <select
              name="lane"
              defaultValue={objectiveData?.lane || ""}
              className="mt-1 w-full rounded-btn border p-2.5"
            >
              <option value="">Sin asignar</option>
              <option>VIA/BIM</option>
              <option>ICE</option>
              <option>PPM</option>
            </select>
          </label>
          <Field
            name="target"
            label="Meta"
            initial={objectiveData?.target ?? ""}
          />
          <Field
            name="baseline"
            label="Línea base"
            initial={objectiveData?.baseline ?? ""}
          />
          <Field
            name="owner"
            label="Dueño"
            initial={objectiveData?.owner ?? studio.user.name}
          />
          <Field
            name="horizon"
            label="Horizonte"
            initial={objectiveData?.horizon ?? "Semanal"}
          />
          <Field
            name="acceptance"
            label="Criterio de aceptación"
            initial={objectiveData?.acceptance ?? ""}
          />
          <Save />
        </form>
      )}
      {tab === "vdc-factor" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => void submitFactor(event)}
        >
          <label className="block text-xs font-semibold">
            ProdO que mueve
            <select
              name="objectiveId"
              defaultValue={
                factorData?.objectiveId ??
                objectives.find((item) => item.data.level === "ProdO")?.id
              }
              className="mt-1 w-full rounded-btn border p-2.5"
            >
              {objectives
                .filter((item) => item.data.level === "ProdO")
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.data.code} · {item.data.title}
                  </option>
                ))}
            </select>
          </label>
          <Field
            name="title"
            label="Acción controlable"
            initial={factorData?.title ?? ""}
          />
          <Field
            name="owner"
            label="Dueño"
            initial={factorData?.owner ?? studio.user.name}
          />
          <Field
            name="cadence"
            label="Cadencia"
            initial={factorData?.cadence ?? "Semanal"}
          />
          <Field
            name="effortHours"
            label="Esfuerzo h-persona"
            initial={String(factorData?.effortHours ?? 1)}
            type="number"
          />
          <Field
            name="expectedImpact"
            label="Impacto esperado"
            initial={
              factorData?.expectedImpact === null ||
              factorData?.expectedImpact === undefined
                ? ""
                : String(factorData.expectedImpact)
            }
            type="number"
          />
          <Field
            name="impactUnit"
            label="Unidad de impacto"
            initial={factorData?.impactUnit ?? "puntos"}
          />
          <Save />
        </form>
      )}
      {tab === "vdc-link" && (
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => void submitLink(event)}
        >
          <label className="block text-xs font-semibold">
            Origen
            <select
              name="sourceId"
              defaultValue={sourceData?.sourceId}
              className="mt-1 w-full rounded-btn border p-2.5"
            >
              {entities
                .filter(
                  (entity) =>
                    entity.kind === "vdc-objective" ||
                    entity.kind === "vdc-factor",
                )
                .map((entity) => (
                  <option key={entity.id} value={entity.id}>
                    {entity.id}
                  </option>
                ))}
            </select>
          </label>
          <label className="block text-xs font-semibold">
            Contribuye a
            <select
              name="targetId"
              defaultValue={sourceData?.targetId}
              className="mt-1 w-full rounded-btn border p-2.5"
            >
              {objectives.map((objective) => (
                <option key={objective.id} value={objective.id}>
                  {objective.data.code} · {objective.data.title}
                </option>
              ))}
            </select>
          </label>
          <Field
            name="reason"
            label="Hipótesis y porqué"
            initial={sourceData?.reason ?? ""}
          />
          <label className="block text-xs font-semibold">
            Estado
            <select
              name="evidenceStatus"
              defaultValue={sourceData?.evidenceStatus ?? "HIPOTESIS"}
              className="mt-1 w-full rounded-btn border p-2.5"
            >
              <option>HIPOTESIS</option>
              <option>EN_PRUEBA</option>
              <option>RESPALDADA</option>
              <option>NO_RESPALDADA</option>
            </select>
          </label>
          <Field
            name="effectWindow"
            label="Ventana de efecto"
            initial={sourceData?.effectWindow ?? "1 semana"}
          />
          <Field
            name="reviewDate"
            label="Próxima revisión"
            initial={
              sourceData?.reviewDate ?? new Date().toISOString().slice(0, 10)
            }
            type="date"
          />
          <Field
            name="owner"
            label="Dueño"
            initial={sourceData?.owner ?? studio.user.name}
          />
          <Save />
        </form>
      )}
    </section>
  );
}

function Field({
  name,
  label,
  initial,
  type = "text",
}: {
  name: string;
  label: string;
  initial: string;
  type?: string;
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--gen-text-secondary)]">
      {label}
      <input
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        defaultValue={initial}
        required={name === "title" || name === "reason"}
        className="mt-1 w-full rounded-btn border border-[var(--gen-border)] bg-white px-3 py-2.5 text-sm text-[var(--gen-text)] focus:border-brand-500"
      />
    </label>
  );
}
function Save() {
  return (
    <button className="w-full rounded-btn bg-brand-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
      Guardar cambio
    </button>
  );
}

function RelationNavigator({ entities }: { entities: VdcEntity[] }) {
  const studio = useStudio();
  const links = entitiesOf<VdcLinkData>(entities, "vdc-link");
  if (!studio.selection)
    return (
      <section className="rounded-card border border-dashed p-4 text-xs text-[var(--gen-text-muted)]">
        Selecciona un objetivo, factor o relación para recorrer sus
        dependencias.
      </section>
    );
  const around = links.filter(
    (link) =>
      link.data.sourceId === studio.selection ||
      link.data.targetId === studio.selection,
  );
  const label = (id: string) => {
    const found = entities.find((entity) => entity.id === id);
    return found?.kind === "vdc-objective"
      ? entityData<ObjectiveData>(found).title
      : found?.kind === "vdc-factor"
        ? entityData<FactorData>(found).title
        : id;
  };
  const jump = (id: string) => {
    const found = entities.find((entity) => entity.id === id);
    studio.select(id);
    if (found?.kind === "step") studio.navigate("mapa", id);
  };
  return (
    <section className="rounded-card border border-[var(--gen-border)] bg-white p-4">
      <h3 className="text-sm font-bold">Navegación causal</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {around.length ? (
          around.map((link) => {
            const upstream = link.data.targetId === studio.selection;
            const id = upstream ? link.data.sourceId : link.data.targetId;
            return (
              <button
                key={link.id}
                className="rounded-btn bg-slate-50 p-3 text-left text-xs hover:bg-blue-50"
                onClick={() => jump(id)}
              >
                <b className="text-brand-600">
                  {upstream ? "↑ Aguas arriba" : "↓ Aguas abajo"}
                </b>
                <span className="mt-1 block font-semibold text-navy-900">
                  {label(id)}
                </span>
                <span className="mt-1 block text-[var(--gen-text-muted)]">
                  {link.data.evidenceStatus} · {link.data.reason}
                </span>
              </button>
            );
          })
        ) : (
          <p className="text-xs text-[var(--gen-text-muted)]">
            Sin relaciones registradas.
          </p>
        )}
      </div>
    </section>
  );
}

function ObservationEntry({ entities }: { entities: VdcEntity[] }) {
  const studio = useStudio();
  const metrics = entitiesOf<MetricData>(entities, "vdc-metric");
  const [metricId, setMetricId] = useState("");
  const active = metrics.find((item) => item.id === metricId) || metrics[0];
  if (!studio.canEdit) return null;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const element = event.currentTarget;
    const form = new FormData(element);
    const numerator = Number(form.get("numerator"));
    const denominator = Number(form.get("denominator"));
    const percent = active?.data.unit === "%";
    if (
      percent &&
      (!Number.isFinite(numerator) ||
        !Number.isFinite(denominator) ||
        denominator <= 0)
    ) {
      studio.notify("Ingresa numerador y denominador válidos.");
      return;
    }
    const ref = metrics.find((m) => m.id === form.get("metricId"));
    if (
      !ref ||
      !String(form.get("period") || "").trim() ||
      !String(form.get("source") || "").trim() ||
      (percent
        ? !String(form.get("numerator") || "").trim() ||
          numerator < 0 ||
          numerator > denominator
        : !String(form.get("directValue") || "").trim() ||
          !Number.isFinite(Number(form.get("directValue"))))
    ) {
      studio.notify(
        "Completa indicador, fuente, periodo y cantidades válidas.",
      );
      return;
    }
    const data: ObservationData = {
      targetAtCut: ref.data.target,
      comparisonAtCut: ref.data.comparison,
      metricId: String(form.get("metricId")),
      period: String(form.get("period")),
      ...(percent ? { numerator, denominator, sampleSize: denominator } : {}),
      value: percent
        ? (numerator / denominator) * 100
        : Number(form.get("directValue")),
      quality: String(form.get("quality")) as ObservationData["quality"],
      coverage: String(form.get("coverage")) as ObservationData["coverage"],
      source: String(form.get("source")),
      capturedAt: new Date().toISOString().slice(0, 10),
    };
    const same = entities.find(
      (e) =>
        e.kind === "vdc-observation" &&
        e.data.metricId === data.metricId &&
        e.data.period === data.period,
    );
    if (
      await studio.apply(
        [
          {
            id: same?.id || uid("obs"),
            expectedRev: same?.rev || 0,
            kind: "vdc-observation",
            data,
          },
        ],
        "Corte registrado.",
      )
    )
      element.reset();
  };
  return (
    <section className="rounded-card border border-[var(--gen-border)] bg-white p-4">
      <h3 className="text-sm font-bold">Ingresar corte</h3>
      <p className="mt-1 text-xs text-[var(--gen-text-muted)]">
        Registra el corte con su periodo, fuente y cobertura.
      </p>
      <form
        onSubmit={(event) => void submit(event)}
        className="mt-3 grid gap-2 sm:grid-cols-2"
      >
        <label className="text-xs font-semibold">
          Métrica
          <select
            name="metricId"
            value={active?.id || ""}
            onChange={(event) => setMetricId(event.target.value)}
            className="mt-1 w-full rounded-btn border p-2"
          >
            {metrics.map((metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.data.label}
              </option>
            ))}
          </select>
        </label>
        <Field name="period" label="Periodo" initial="" />
        {active?.data.unit === "%" ? (
          <>
            <Field
              name="numerator"
              label="Numerador"
              initial=""
              type="number"
            />
            <Field
              name="denominator"
              label="Denominador"
              initial=""
              type="number"
            />
          </>
        ) : (
          <Field
            name="directValue"
            label={`Valor medido (${active?.data.unit || "unidad"})`}
            initial=""
            type="number"
          />
        )}
        <Field name="source" label="Fuente" initial="" />
        <label className="text-xs font-semibold">
          Cobertura
          <select
            name="coverage"
            className="mt-1 w-full rounded-btn border p-2"
          >
            <option value="completo">Completo</option>
            <option value="parcial">Parcial</option>
          </select>
        </label>
        <label className="text-xs font-semibold">
          Calidad
          <select name="quality" className="mt-1 w-full rounded-btn border p-2">
            <option>DATO_DEMO</option>
            <option>OBSERVADO</option>
            <option>ESTIMADO</option>
          </select>
        </label>
        <div className="sm:col-span-2">
          <Save />
        </div>
      </form>
    </section>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded-btn border border-[var(--gen-border)] p-3">
      <div className="text-[11px] font-semibold text-[var(--gen-text-muted)]">
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-navy-900">{value}</div>
      <div className="mt-1 text-[10px] text-[var(--gen-text-muted)]">
        {note}
      </div>
    </div>
  );
}

function Dashboard({
  entities,
  operational,
}: {
  entities: VdcEntity[];
  operational: boolean;
}) {
  const studio = useStudio();
  const allPeriods = [
    ...new Set(
      entitiesOf<ObservationData>(entities, "vdc-observation").map(
        (item) => item.data.period,
      ),
    ),
  ].sort();
  const owners = [
    ...new Set(
      entitiesOf<ObjectiveData>(entities, "vdc-objective").map(
        (item) => item.data.owner,
      ),
    ),
  ];
  const [period, setPeriod] = useState("Todos");
  const [owner, setOwner] = useState("Todos");
  const visible =
    period === "Todos"
      ? entities
      : entities.filter(
          (item) =>
            item.kind !== "vdc-observation" ||
            entityData<ObservationData>(item).period === period,
        );
  const results = metricResults(visible).filter(
    ({ metric }) => owner === "Todos" || metric.owner === owner,
  );
  const objectives = entitiesOf<ObjectiveData>(entities, "vdc-objective");
  const decisions = entities.filter((entity) => entity.kind === "ice-decision");
  const atRisk = objectives.filter((objective) => {
    const own = results.filter(
      (x) => x.metric.objectiveId === objective.id && x.result.current !== null,
    );
    return own.length
      ? own.some((x) => x.result.status === "fuera_meta")
      : objective.data.status === "en_riesgo";
  });
  const status = operational
    ? "Prioridades operativas"
    : "Decisiones gerenciales";
  const outcomeRows = objectives.filter(
    (item) =>
      (item.data.level === "CO" || item.data.level === "PO") &&
      (owner === "Todos" || item.data.owner === owner),
  );
  return (
    <section className="space-y-5">
      <div className="rounded-card bg-[linear-gradient(120deg,#0E2A6B,#2165FF)] p-5 text-white">
        <div className="flex items-start justify-between gap-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[.14em] text-blue-100">
              {operational ? "Control de producción" : "Estado del proyecto"}
            </div>
            <h2 className="mt-2 font-display text-2xl font-bold">{status}</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              {atRisk.length
                ? `${atRisk.length} objetivos requieren una decisión o una acción de control.`
                : "Sin objetivos en riesgo registrados en este corte."}
            </p>
          </div>
          <Target className="shrink-0 text-blue-100" size={34} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <select
            aria-label="Filtrar periodo"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-btn border-0 px-3 py-2 text-xs text-navy-900"
          >
            <option>Todos</option>
            {allPeriods.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label="Filtrar rol o responsable"
            value={owner}
            onChange={(event) => setOwner(event.target.value)}
            className="rounded-btn border-0 px-3 py-2 text-xs text-navy-900"
          >
            <option>Todos</option>
            {owners.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {results.map(({ metric, result }) => (
          <MetricCard
            key={metric.code}
            metric={metric}
            result={result}
            onClick={() => {
              studio.select(metric.objectiveId);
              studio.navigate("vdc", metric.objectiveId);
            }}
          />
        ))}
      </div>
      <WorkQueue executive={!operational} />
      {operational ? (
        <>
          <Factors entities={entities} />
          <Production entities={entities} />
          <ObservationEntry entities={entities} />
        </>
      ) : (
        <>
          <section className="rounded-card border bg-white p-4">
            <h3 className="font-bold">Resultados de proyecto y cliente</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {outcomeRows.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => {
                    studio.select(entity.id);
                    studio.navigate("vdc", entity.id);
                  }}
                  className="rounded-btn border border-[var(--gen-border)] p-3 text-left hover:bg-blue-50"
                >
                  <span className="text-[10px] font-bold text-brand-600">
                    {entity.data.level} · {entity.data.code}
                  </span>
                  <b className="mt-1 block text-sm">{entity.data.title}</b>
                  <span className="mt-1 block text-xs text-[var(--gen-text-muted)]">
                    {entity.data.target} · {entity.data.status}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-card border bg-white p-4">
              <h3 className="font-bold">Objetivos en riesgo</h3>
              <div className="mt-3 space-y-2">
                {atRisk.map((entity) => (
                  <button
                    key={entity.id}
                    className="flex w-full items-center gap-2 rounded-btn bg-red-50 p-3 text-left text-sm text-red-900"
                    onClick={() => {
                      studio.select(entity.id);
                      studio.navigate("vdc", entity.id);
                    }}
                  >
                    <CircleAlert size={16} />
                    <span>{entity.data.title}</span>
                    <ChevronRight className="ml-auto" size={16} />
                  </button>
                ))}
              </div>
            </section>
            <section className="rounded-card border bg-white p-4">
              <h3 className="font-bold">Decisiones ICE</h3>
              <div className="mt-3 space-y-2">
                {decisions.length ? (
                  decisions.map((decision) => (
                    <button
                      key={decision.id}
                      className="flex w-full items-center gap-2 rounded-btn bg-blue-50 p-3 text-left text-sm text-navy-900"
                      onClick={() => studio.navigate("ice", decision.id)}
                    >
                      <CheckCircle2 size={16} />
                      <span>{String(decision.data.title)}</span>
                      <ChevronRight className="ml-auto" size={16} />
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-[var(--gen-text-muted)]">
                    Sin decisiones ICE registradas.
                  </p>
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </section>
  );
}

const frameworkLevels = [
  {
    id: "CO",
    name: "Cliente",
    question: "¿Qué podrá hacer el cliente con el producto entregado?",
  },
  {
    id: "PO",
    name: "Proyecto",
    question: "¿Qué entrega se aceptará y en qué condiciones?",
  },
  {
    id: "ProdO",
    name: "Producción",
    question: "¿Qué desempeño debe lograr el equipo durante el trabajo?",
  },
  {
    id: "FC",
    name: "Factor controlable",
    question:
      "¿Qué acción puede repetir el equipo para influir en ese resultado?",
  },
];

function FrameworkGuide() {
  const [review, setReview] = useState(false);
  const studio = useStudio();
  const levels = review ? [...frameworkLevels].reverse() : frameworkLevels;
  return (
    <details className="fw-guide">
      <summary>Cómo leer el framework</summary>
      <p>
        Virtual Design and Construction (VDC) relaciona el producto que se
        entrega, la organización que decide y el proceso que ejecuta el trabajo.
        BIM/VIA permite coordinar el producto, ICE reúne a los decisores y PPM
        gestiona el flujo de producción.
      </p>
      <div className="fw-toggle" aria-label="Sentido del recorrido">
        <button aria-pressed={!review} onClick={() => setReview(false)}>
          Diseñar desde el objetivo
        </button>
        <button aria-pressed={review} onClick={() => setReview(true)}>
          Revisar desde la evidencia
        </button>
      </div>
      <div className="fw-routes">
        {levels.map((level) => {
          const candidate = studio.entities.find((e) =>
            level.id === "FC"
              ? e.kind === "vdc-factor"
              : e.kind === "vdc-objective" && e.data.level === level.id,
          );
          return (
            <div key={level.id}>
              <strong>
                {level.name} <small>{level.id}</small>
              </strong>
              <p>{level.question}</p>
              {candidate && (
                <button onClick={() => studio.select(candidate.id)}>
                  Ubicar en el mapa
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p>
        {review
          ? "Revisa quién ejecutó el control, su evidencia y el corte de la métrica. Contrasta la contribución esperada antes de mantener o cambiar la acción."
          : "Define el valor para el cliente y desciende hasta una acción con responsable y frecuencia. Cada vínculo expresa una contribución que podrás contrastar con mediciones."}
      </p>
    </details>
  );
}

function Objectives({ entities }: { entities: VdcEntity[] }) {
  const studio = useStudio();
  const objectives = entitiesOf<ObjectiveData>(entities, "vdc-objective");
  const [editing, setEditing] = useState(false);
  const indicators = metricResults(entities);
  function edit(id: string | null) {
    studio.select(id);
    setEditing(true);
  }
  if (editing && studio.canEdit)
    return (
      <div className="max-w-2xl">
        <EntityEditor
          key={studio.selection || "new"}
          entities={entities}
          objectiveOnly
          close={() => setEditing(false)}
        />
      </div>
    );
  return (
    <div className="space-y-4">
      <div className="fw-actions">
        <button className="mg-secondary" onClick={() => studio.navigate("vdc")}>
          Ver mapa de interrelaciones
        </button>
        {studio.canEdit && (
          <button className="st-primary" onClick={() => edit(null)}>
            Crear objetivo
          </button>
        )}
      </div>
      {frameworkLevels.slice(0, 3).map((level) => {
        const group = objectives.filter((item) => item.data.level === level.id);
        return (
          <section key={level.id} className="fw-objectives">
            <header>
              <h2>{level.name}</h2>
              <span>
                {level.id} · {group.length}{" "}
                {group.length === 1 ? "objetivo" : "objetivos"}
              </span>
            </header>
            {group.map((item) => {
              const observed = indicators.filter(
                (x) =>
                  x.metric.objectiveId === item.id && x.result.current !== null,
              );
              return (
                <div
                  className="fw-objective"
                  key={item.id}
                  data-selected={item.id === studio.selection}
                >
                  <div>
                    <small>
                      {item.data.code}
                      {item.data.lane && " · " + item.data.lane}
                    </small>
                    <h3>{item.data.title}</h3>
                    <p>
                      {item.data.owner || "Por asignar"} ·{" "}
                      {item.data.horizon || "Sin horizonte"}
                    </p>
                  </div>
                  <div>
                    <small>Meta</small>
                    <strong>{item.data.target || "Sin definir"}</strong>
                    <p>
                      {observed.length
                        ? observed.length + " indicadores con corte"
                        : "Sin medición vinculada"}
                    </p>
                  </div>
                  <div className="fw-actions">
                    <button onClick={() => studio.navigate("vdc", item.id)}>
                      Ver vínculos
                    </button>
                    {studio.canEdit && (
                      <button onClick={() => edit(item.id)}>Editar</button>
                    )}
                  </div>
                </div>
              );
            })}
            {!group.length && (
              <p className="fw-no-objective">{level.question}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function VdcView({ mode }: { mode: VdcMode }) {
  const studio = useStudio();
  const entities = studio.entities as VdcEntity[];
  const summary = useMemo(
    () =>
      `${entitiesOf<ObjectiveData>(entities, "vdc-objective").length} objetivos · ${entitiesOf<FactorData>(entities, "vdc-factor").length} factores`,
    [entities],
  );
  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_70%_0%,#dceaff,transparent_34%),#f7f9fd] p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6">
          <div className="text-xs font-bold uppercase tracking-[.12em] text-brand-600">
            {studio.board.title}
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold text-navy-900">
            {mode === "vdc"
              ? "Framework VDC"
              : mode === "objetivos"
                ? "Objetivos"
                : mode === "gerencia"
                  ? "Dashboard gerencial"
                  : mode === "operacion"
                    ? "Dashboard operativo"
                    : "Producción y PPM"}
          </h1>
          <p className="mt-2 text-sm text-[var(--gen-text-muted)]">
            {mode === "vdc"
              ? "Mapa de interrelaciones · " + summary
              : mode === "objetivos"
                ? "Del valor para el cliente a los resultados que el equipo puede medir."
                : summary}
          </p>
        </header>
        {mode === "vdc" && (
          <div className="space-y-5">
            <FrameworkGuide />
            <RelationshipGraph />
            <MetricRegistry />
            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <CifeTable entities={entities} />
              {studio.canEdit && (
                <EntityEditor
                  key={studio.selection || "nuevo"}
                  entities={entities}
                />
              )}
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <RelationNavigator entities={entities} />
              <Factors entities={entities} />
            </div>
          </div>
        )}
        {mode === "objetivos" && <Objectives entities={entities} />}
        {mode === "gerencia" && (
          <Dashboard entities={entities} operational={false} />
        )}{" "}
        {mode === "operacion" && <Dashboard entities={entities} operational />}
        {mode === "produccion" && (
          <>
            <Production entities={entities} />
            <Scenario entities={entities} />
            <ProductionEntry />
            <ObservationEntry entities={entities} />
          </>
        )}
      </div>
    </main>
  );
}
