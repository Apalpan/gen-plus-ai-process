import { useState, type FormEvent } from "react";
import { Target, Inbox, Factory } from "lucide-react";
import { useStudio, uid } from "../shared";

export function WorkQueue({ executive = false }: { executive?: boolean }) {
  const s = useStudio();
  const [filter, setFilter] = useState(""),
    [stage, setStage] = useState("abiertos");
  const all = s.entities.filter((e) =>
    ["ice-decision", "ice-action", "ice-restriction"].includes(e.kind),
  );
  const people = Array.from(
    new Set(all.map((e) => e.data.owner).filter(Boolean)),
  ).sort();
  const today = new Date().toLocaleDateString("sv-SE");
  const items = all
    .filter(
      (e) =>
        (!filter || e.data.owner === filter) &&
        (stage === "todos" ||
          (stage === "cerrados"
            ? e.data.status === "verificado"
            : !["verificado", "descartado"].includes(e.data.status))),
    )
    .sort((a, b) =>
      String(a.data.due || "9999").localeCompare(String(b.data.due || "9999")),
    );
  return (
    <section className="st-card">
      <div className="st-cardtitle">
        <Inbox size={18} />
        <h2>
          {executive
            ? "Decisiones y compromisos prioritarios"
            : "Bandeja de trabajo"}
        </h2>
      </div>
      <div className="rg-toolbar">
        <select
          aria-label="Responsable de acuerdos"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todo el equipo</option>
          {Array.from(new Set([s.user.name, ...people])).map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <button onClick={() => setFilter(s.user.name)}>Asignado a mí</button>
        <select
          aria-label="Estado del seguimiento"
          value={stage}
          onChange={(e) => setStage(e.target.value)}
        >
          <option value="abiertos">Abiertos</option>
          <option value="cerrados">Verificados</option>
          <option value="todos">Todos</option>
        </select>
      </div>
      {items.length ? (
        items.slice(0, executive ? 6 : 30).map((e) => (
          <button
            key={e.id}
            className="st-row"
            onClick={() => s.navigate("ice", e.id)}
          >
            <span>
              <strong>{e.data.title}</strong>
              <small>
                {[
                  e.data.owner || "Por asignar",
                  e.data.due || "Sin fecha",
                  e.data.status,
                ].join(" · ")}
              </small>
            </span>
            <span>
              {e.data.status === "verificado"
                ? "Con evidencia"
                : e.data.due && e.data.due < today
                  ? "Vencido"
                  : "Revisar"}{" "}
              ↗
            </span>
          </button>
        ))
      ) : (
        <p>Sin asuntos que coincidan con el filtro.</p>
      )}
    </section>
  );
}
export function MetricRegistry() {
  const s = useStudio();
  const all = s.entities.filter((x) => x.kind === "vdc-metric");
  const [id, setId] = useState(all[0]?.id || "");
  const item = all.find((x) => x.id === id);
  const objectives = s.entities.filter((x) => x.kind === "vdc-objective");
  async function submit(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const form = new FormData(ev.currentTarget);
    const d = Object.fromEntries(form.entries());
    if (!d.objectiveId || !String(d.source).trim() || !String(d.label).trim())
      return;
    const key = item?.id || uid("metric");
    const data = {
      ...item?.data,
      ...d,
      code: item?.data.code || "KPI-" + (all.length + 1),
      target: Number(d.target),
      unit: String(item?.data.unit || d.unit || "%").trim(),
      comparison: d.comparison || "gte",
      effectiveFrom: new Date().toISOString().slice(0, 10),
    };
    if (
      await s.apply(
        [{ id: key, kind: "vdc-metric", expectedRev: item?.rev || 0, data }],
        "Ficha de medición guardada",
      )
    )
      setId(key);
  }
  return (
    <details className="st-card">
      <summary>
        <Target size={16} /> Catálogo de métricas ({all.length})
      </summary>
      <label className="st-field">
        Ficha de medición
        <select value={id} onChange={(e) => setId(e.target.value)}>
          <option value="">Nueva métrica</option>
          {all.map((x) => (
            <option key={x.id} value={x.id}>
              {x.data.label}
            </option>
          ))}
        </select>
      </label>
      <form key={id + "-" + (item?.rev || 0)} onSubmit={submit}>
        <fieldset disabled={!s.canEdit}>
          <label className="st-field">
            Objetivo asociado
            <select
              required
              name="objectiveId"
              defaultValue={item?.data.objectiveId || ""}
            >
              <option value="">Seleccionar</option>
              {objectives.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.data.title}
                </option>
              ))}
            </select>
          </label>
          <div className="st-cols">
            {[
              ["label", "Indicador"],
              ["formula", "Fórmula y cohorte"],
              ["target", "Meta"],
              ["unit", "Unidad de medida"],
              ["owner", "Responsable"],
              ["frequency", "Frecuencia"],
              ["source", "Fuente"],
              ["actionThreshold", "Acción ante desvío"],
            ].map(([key, label]) => (
              <label className="st-field" key={key}>
                {label}
                <input
                  name={key}
                  type={key === "target" ? "number" : "text"}
                  readOnly={key === "unit" && Boolean(item)}
                  step="any"
                  required
                  defaultValue={item?.data[key] ?? (key === "unit" ? "%" : "")}
                />
              </label>
            ))}
            <label className="st-field">
              Criterio
              <select
                name="comparison"
                defaultValue={item?.data.comparison || "gte"}
              >
                <option value="gte">Al menos la meta</option>
                <option value="lte">Como máximo la meta</option>
              </select>
            </label>
          </div>
          <button className="st-primary">Guardar métrica</button>
        </fieldset>
      </form>
    </details>
  );
}
export function ProductionEntry() {
  const s = useStudio(),
    [open, setOpen] = useState(false);
  const records = s.entities
    .filter((e) => e.kind === "production-snapshot")
    .sort((a, b) => String(b.data.period).localeCompare(String(a.data.period)));
  const last = records[0];
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data: Record<string, unknown> = {};
    for (const [k, v] of form.entries()) data[k] = v;
    for (const key of [
      "wipAverage",
      "acceptedOutput",
      "workingDays",
      "cycleTimeDays",
      "capacityPerDay",
      "loadPerDay",
      "activeDays",
      "waitingDays",
      "reworkCount",
      "lotSize",
      "bufferDays",
      "inventoryBuffer",
      "capacityBuffer",
      "demand",
      "variation",
    ]) {
      const v = form.get(key);
      data[key] = v === "" || v === null ? null : Number(v);
    }
    if (
      !data.workingDays ||
      !data.boundary ||
      !data.unit ||
      !data.period ||
      !data.source
    )
      return s.notify("Completa frontera, unidad, periodo, días y fuente.");
    const old = records.find(
      (e) =>
        e.data.boundary === data.boundary &&
        e.data.period === data.period &&
        e.data.unit === data.unit,
    );
    if (
      await s.apply(
        [
          {
            id: old?.id || uid("prod"),
            kind: "production-snapshot",
            expectedRev: old?.rev || 0,
            data,
          },
        ],
        "Corte de producción guardado",
      )
    )
      setOpen(false);
  }
  return (
    <section className="st-card">
      <div className="st-cardtitle">
        <Factory size={17} />
        <h2>Cortes por frontera de producción</h2>
      </div>
      {s.canEdit && (
        <button onClick={() => setOpen(!open)}>
          {open ? "Cerrar formulario" : "Registrar corte de producción"}
        </button>
      )}
      {open && (
        <form onSubmit={submit}>
          <div className="st-cols">
            {[
              ["boundary", "Frontera"],
              ["unit", "Unidad de flujo"],
              ["period", "Periodo"],
              ["source", "Fuente del dato"],
            ].map(([key, title]) => (
              <label className="st-field" key={key}>
                {title}
                <input
                  required
                  name={key}
                  defaultValue={
                    ["boundary", "unit"].includes(key)
                      ? last?.data[key] || ""
                      : ""
                  }
                />
              </label>
            ))}
          </div>
          <div className="st-cols">
            {[
              ["wipAverage", "WIP medio"],
              ["acceptedOutput", "Unidades aceptadas"],
              ["workingDays", "Días hábiles del corte"],
              ["cycleTimeDays", "Tiempo de ciclo observado (días)"],
              ["capacityPerDay", "Capacidad efectiva / día"],
              ["loadPerDay", "Carga / día"],
              ["activeDays", "Tiempo activo (días)"],
              ["waitingDays", "Espera (días)"],
              ["reworkCount", "Unidades con retrabajo"],
              ["lotSize", "Tamaño del lote"],
              ["bufferDays", "Buffer de tiempo (días)"],
              ["inventoryBuffer", "Buffer de inventario (unidades)"],
              ["capacityBuffer", "Buffer de capacidad (unid./día)"],
              ["demand", "Demanda del periodo"],
              ["variation", "Desv. estándar del ciclo (días)"],
            ].map(([key, title]) => (
              <label className="st-field" key={key}>
                {title}
                <input
                  type="number"
                  name={key}
                  min={key === "workingDays" ? 0.01 : 0}
                  step="any"
                  required={key === "workingDays"}
                />
              </label>
            ))}
          </div>
          <label className="st-field">
            Calidad del corte
            <select name="quality">
              <option>OBSERVADO</option>
              <option>ESTIMADO</option>
              <option>DATO_DEMO</option>
            </select>
          </label>
          <button className="st-primary">Guardar corte de producción</button>
        </form>
      )}
      {records.map((e) => (
        <details key={e.id}>
          <summary>
            {e.data.period} · {e.data.boundary}
          </summary>
          <p>
            {e.data.acceptedOutput ?? "Sin dato"} {e.data.unit} aceptados ·{" "}
            {e.data.workingDays} días · {e.data.source} · {e.data.quality}
          </p>
        </details>
      ))}
    </section>
  );
}
