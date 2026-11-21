import { useState } from "react";
import {
  Bot,
  ArrowRight,
  Check,
  GitBranch,
  AudioLines,
  Gauge,
  BriefcaseBusiness,
} from "lucide-react";
import { api, useStudio, type Change } from "./shared";
const caps = [
  ["map", "Mapear un proceso", "Texto a pasos y conexiones", GitBranch],
  ["ice", "Preparar una sesión", "Restricciones a una agenda ICE", AudioLines],
  ["production", "Analizar producción", "Observaciones y factores", Gauge],
  [
    "executive",
    "Informe gerencial",
    "Objetivos y decisiones",
    BriefcaseBusiness,
  ],
] as const;
export default function Agents() {
  const s = useStudio(),
    [cap, setCap] = useState<string>("map"),
    [input, setInput] = useState(""),
    [objectiveId, setObjectiveId] = useState(""),
    [model, setModel] = useState(true),
    [busy, setBusy] = useState(false);
  const runs = s.entities
    .filter((e) => e.kind === "agent-run")
    .sort((a, b) =>
      String(b.data.createdAt).localeCompare(String(a.data.createdAt)),
    );
  async function run() {
    setBusy(true);
    try {
      const { proposal: r } = await api(
        "/boards/" + s.board.id + "/agents",
        "POST",
        { capability: cap, input, objectiveId, useModel: model },
      );
      await s.apply(
        [
          {
            id: r.id,
            kind: "agent-run",
            expectedRev: 0,
            data: { ...r, status: "propuesto" },
          },
        ],
        "Análisis disponible",
      );
    } catch (e) {
      s.notify(String(e));
    } finally {
      setBusy(false);
    }
  }
  async function decide(id: string, accept: boolean) {
    const e = runs.find((r) => r.id === id);
    if (!e) return;
    if (
      accept &&
      (e.data.sources || []).some(
        (source: any) =>
          s.entities.find((item) => item.id === source.id)?.rev !== source.rev,
      )
    ) {
      s.notify("Una fuente cambió. Genera una propuesta con el corte actual.");
      return;
    }
    const changes: Change[] = accept ? e.data.changes || [] : [];
    await s.apply(
      [
        ...changes,
        {
          id,
          kind: e.kind,
          expectedRev: e.rev,
          data: { ...e.data, status: accept ? "aprobado" : "descartado" },
        },
      ],
      accept ? "Propuesta aplicada" : "Propuesta descartada",
    );
  }
  return (
    <section className="st-page">
      <div className="st-heading">
        <div>
          <p className="st-eyebrow">INTELIGENCIA DE PROCESOS</p>
          <h1>Asistentes</h1>
          <p>Prepara un cambio y revisa su evidencia antes de aplicarlo.</p>
        </div>
      </div>
      <div className="st-split">
        <div className="st-card">
          <div className="st-choice-list">
            {caps.map(([id, label, desc, Icon]) => (
              <button
                key={id}
                className={cap === id ? "chosen" : ""}
                onClick={() => setCap(id)}
              >
                <Icon size={20} />
                <span>
                  <strong>{label}</strong>
                  <small>{desc}</small>
                </span>
                <ArrowRight size={15} />
              </button>
            ))}
          </div>
          <label className="st-field">
            Contexto para el análisis
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                cap === "map"
                  ? "Recibir solicitud → Validar insumos → Aprobar entrega"
                  : "¿Qué necesita decidir el equipo?"
              }
            />
          </label>
          {cap === "map" && (
            <label className="st-field">
              Alinear pasos al objetivo
              <select
                value={objectiveId}
                onChange={(e) => setObjectiveId(e.target.value)}
              >
                <option value="">General</option>
                {s.entities
                  .filter((e) => e.kind === "vdc-objective")
                  .map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.data.title}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <label className="st-check">
            <input
              type="checkbox"
              checked={model}
              onChange={(e) => setModel(e.target.checked)}
            />{" "}
            Interpretar con Ollama local
          </label>
          <button
            disabled={busy || !s.canEdit}
            className="st-primary"
            onClick={run}
          >
            <Bot size={16} />
            {busy ? "Analizando…" : "Generar propuesta"}
          </button>
        </div>
        <div>
          <h2>Registro de propuestas</h2>
          {!runs.length && (
            <p className="st-empty">
              Las propuestas aparecerán aquí con sus fuentes y los cambios
              sugeridos.
            </p>
          )}
          {runs.map((e) => (
            <article key={e.id} className="st-card">
              <small>
                {e.data.engine} · {e.data.status}
              </small>
              <h3>{caps.find((c) => c[0] === e.data.capability)?.[1]}</h3>
              <p>{e.data.summary}</p>
              {e.data.interpretation && (
                <blockquote>{e.data.interpretation}</blockquote>
              )}
              {e.data.limitation && <small>{e.data.limitation}</small>}
              <details>
                <summary>
                  Fuentes y cambios ({(e.data.changes || []).length})
                </summary>
                {(e.data.sources || []).map((v: any) => (
                  <p key={v.id}>
                    {v.title} · rev. {v.rev}
                  </p>
                ))}
                {(e.data.changes || []).map((v: any) => (
                  <div key={v.id}>+ {v.data.title || "Conexión"}</div>
                ))}
              </details>
              {e.data.status === "propuesto" && s.canEdit && (
                <div className="st-btnrow">
                  <button
                    className="st-primary"
                    onClick={() => decide(e.id, true)}
                  >
                    <Check size={14} />
                    Aprobar
                  </button>
                  <button onClick={() => decide(e.id, false)}>Descartar</button>
                </div>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
