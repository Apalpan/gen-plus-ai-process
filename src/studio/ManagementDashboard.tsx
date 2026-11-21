import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  GitBranch,
  Network,
  Plus,
  Target,
  Workflow,
} from "lucide-react";
import { api, useStudio } from "./shared";
import { metricResults } from "./vdc/metrics";
import { metricForBinding } from "./editor/metricCatalog";
import type { StepMetricBinding } from "./editor/types";
import "./management.css";

type Summary = {
  id: string;
  title: string;
  steps: number;
  objectives: number;
  openIce: number;
  updatedAt: string;
};
type Props = {
  workspace: string;
  newBoard: () => void;
  openMap: (id: string) => Promise<void>;
};
const number = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });
const day = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default function ManagementDashboard({
  workspace,
  newBoard,
  openMap,
}: Props) {
  const studio = useStudio();
  const { board, entities } = studio;
  const [rows, setRows] = useState<Summary[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [search, setSearch] = useState("");
  useEffect(() => {
    let live = true;
    let pending = false;
    async function load() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const result = await api<{ boards: Summary[] }>(
          "/workspaces/" + board.workspaceId + "/overview",
        );
        if (live) {
          setRows(result.boards);
          setError(false);
        }
      } catch {
        if (live) {
          setError(true);
          setRows(null);
        }
      } finally {
        pending = false;
      }
    }
    void load();
    const timer = window.setInterval(load, 30000);
    document.addEventListener("visibilitychange", load);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", load);
    };
  }, [board.workspaceId, board.revision, retry]);
  const scoped = rows?.filter((row) =>
    row.title.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );
  const indicators = metricResults(entities);
  const cuts = [...indicators].sort(
    (a, b) =>
      Number(b.result.status === "fuera_meta") -
      Number(a.result.status === "fuera_meta"),
  );
  const objective = entities.find(
    (e) => e.kind === "vdc-objective" && e.data.level === "CO",
  );
  const issues = entities.filter(
    (e) =>
      ["ice-action", "ice-decision", "ice-restriction"].includes(e.kind) &&
      !["verificado", "descartado"].includes(e.data.status),
  );
  const demo = entities.some((e) => e.data.quality === "DATO_DEMO");
  const stepMetrics = entities
    .filter((e) => e.kind === "step" && Array.isArray(e.data.metrics))
    .flatMap((step) =>
      (step.data.metrics as StepMetricBinding[]).map((binding) => ({
        step,
        binding,
        definition: metricForBinding(binding),
      })),
    );
  const totals =
    rows &&
    ([
      [rows.length, "Procesos"],
      [rows.reduce((n, b) => n + b.steps, 0), "Pasos mapeados"],
      [rows.reduce((n, b) => n + b.objectives, 0), "Objetivos"],
      [rows.reduce((n, b) => n + b.openIce, 0), "Asuntos ICE abiertos"],
    ] as const);
  return (
    <section className="mg-page">
      <header className="mg-head">
        <div>
          <p className="mg-context">{workspace}</p>
          <h1>Dashboard</h1>
        </div>
        {studio.canEdit && (
          <button className="mg-secondary" onClick={newBoard}>
            <Plus size={15} /> Nuevo proceso
          </button>
        )}
      </header>
      <div className="mg-overview" aria-label="Resumen del espacio">
        {totals ? (
          totals.map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))
        ) : (
          <p role="status">
            {error
              ? "No se pudo cargar el resumen del espacio."
              : "Cargando resumen del espacio…"}
          </p>
        )}
        {error && (
          <button
            className="mg-secondary"
            onClick={() => setRetry((v) => v + 1)}
          >
            Reintentar
          </button>
        )}
      </div>
      <section className="mg-focus">
        <div>
          <p className="mg-context">
            Proceso activo{demo && " · Datos de ejemplo"}
          </p>
          <h2>{board.title}</h2>
          {objective ? (
            <button
              className="mg-objective"
              onClick={() => studio.navigate("objetivos", objective.id)}
            >
              <Target size={16} />
              {objective.data.title}
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              className="mg-objective"
              onClick={() => studio.navigate("objetivos")}
            >
              <Target size={16} /> Consultar objetivos{" "}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        <button className="mg-map" onClick={() => studio.navigate("mapa")}>
          <Workflow size={18} /> Abrir mapeador <ArrowRight size={15} />
        </button>
      </section>
      <div className="mg-section-title">
        <h2>Indicadores del proceso</h2>
        <button onClick={() => studio.navigate("gerencia")}>
          Ver gerencial <ArrowUpRight size={15} />
        </button>
      </div>
      {cuts.length ? (
        <div className="mg-cuts">
          {cuts.slice(0, 3).map(({ metric, result }) => (
            <button
              className="mg-cut"
              key={metric.code + metric.objectiveId}
              onClick={() => studio.navigate("vdc", metric.objectiveId)}
            >
              <span className="mg-cut-heading">
                {metric.label}
                <ArrowUpRight size={14} />
              </span>
              <span className="mg-reading">
                <strong>
                  {result.current === null
                    ? "Sin dato"
                    : number.format(result.current)}
                </strong>
                {result.current !== null && <small>{result.unit}</small>}
              </span>
              <span className={"mg-state " + result.status}>
                {result.status === "en_meta"
                  ? "En meta"
                  : result.status === "fuera_meta"
                    ? "Fuera de meta"
                    : "Sin medición"}
              </span>
              <span className="mg-sub">
                Meta {result.comparison === "gte" ? "≥" : "≤"}{" "}
                {number.format(result.target)} {result.unit} · {result.period}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mg-empty">
          Este proceso todavía no tiene indicadores de objetivo.{" "}
          <button onClick={() => studio.navigate("vdc")}>
            Abrir framework
          </button>
        </div>
      )}
      {stepMetrics.length > 0 && (
        <details className="mg-measures">
          <summary>Mediciones del mapeador ({stepMetrics.length})</summary>
          {stepMetrics.map(({ step, binding, definition }) => {
            const value = binding.observed ?? binding.value;
            return (
              <button
                key={step.id + (binding.code || binding.id)}
                className="mg-list-row"
                onClick={() => studio.navigate("mapa", step.id)}
              >
                <span>
                  <strong>
                    {definition?.label || binding.code || binding.id} ·{" "}
                    {step.data.title}
                  </strong>
                  <small>
                    {binding.period || "Sin periodo"} ·{" "}
                    {binding.source || "Sin fuente"} ·{" "}
                    {binding.quality || "SIN_DATO"}
                  </small>
                </span>
                <span className="mg-measure-value">
                  {value == null
                    ? "Sin medición"
                    : number.format(value) + " " + (definition?.unit || "")}
                  {binding.target != null && (
                    <small>
                      Meta {number.format(binding.target)} {definition?.unit}
                    </small>
                  )}
                </span>
                <ChevronRight size={16} />
              </button>
            );
          })}
        </details>
      )}
      <div className="mg-columns">
        <section className="mg-box">
          <div className="mg-box-head">
            <h2>Procesos del espacio</h2>
            <GitBranch size={17} />
          </div>
          {rows && rows.length > 5 && (
            <input
              className="mg-find"
              aria-label="Buscar proceso"
              placeholder="Buscar proceso…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          )}
          {scoped?.map((row) => (
            <button
              className="mg-list-row"
              key={row.id}
              onClick={() => void openMap(row.id)}
            >
              <Workflow size={17} />
              <span>
                <strong>{row.title}</strong>
                <small>
                  {row.steps} pasos · {row.objectives} objetivos · {row.openIce}{" "}
                  asuntos ICE
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          {scoped?.length === 0 && (
            <p className="mg-sub">Sin procesos que coincidan.</p>
          )}
          {rows && rows.length > 0 && (
            <p className="mg-date">
              Última edición registrada ·{" "}
              {day.format(new Date(rows[0].updatedAt))}
            </p>
          )}
        </section>
        <section className="mg-box">
          <div className="mg-box-head">
            <h2>Decisiones pendientes</h2>
            <button onClick={() => studio.navigate("ice")}>
              Ver ICE <ArrowUpRight size={14} />
            </button>
          </div>
          {issues.slice(0, 3).map((item) => (
            <button
              key={item.id}
              className="mg-list-row"
              onClick={() => studio.navigate("ice", item.id)}
            >
              <span>
                <strong>{item.data.title}</strong>
                <small>
                  {item.data.owner || "Por asignar"}
                  {(item.data.dueDate || item.data.due) &&
                    " · " + (item.data.dueDate || item.data.due)}
                </small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          {!issues.length && (
            <p className="mg-sub">Sin asuntos ICE abiertos en este proceso.</p>
          )}
          <button className="mg-link" onClick={() => studio.navigate("vdc")}>
            <Network size={15} /> Ver mapa de interrelaciones{" "}
            <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </section>
  );
}
