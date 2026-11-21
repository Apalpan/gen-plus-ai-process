import { useState } from "react";
import { FileText, Plus, ArrowUpRight } from "lucide-react";
import { useStudio, uid, type Entity } from "./shared";

export function IceMeeting({
  sessions,
  selectTopic,
}: {
  sessions: Entity[];
  selectTopic: (id: string) => void;
}) {
  const s = useStudio();
  const [sessionId, setSessionId] = useState(sessions[0]?.id || "");
  const [draft, setDraft] = useState({
    title: "",
    alternatives: "",
    rationale: "",
    authority: "",
    scope: "",
    owner: "",
    due: "",
    objectiveId: "",
    factorId: "",
    stepId: "",
    criterion: "",
    outcome: "pendiente",
  });
  const set = (key: keyof typeof draft, value: string) =>
    setDraft((old) => ({ ...old, [key]: value }));
  const meeting = sessions.find((item) => item.id === sessionId);
  const topics = s.entities.filter(
    (item) =>
      item.data.sessionId === sessionId &&
      ["ice-action", "ice-decision", "ice-restriction"].includes(item.kind),
  );
  async function record() {
    if (!meeting || !draft.title.trim())
      return s.notify("Elige una sesión y escribe el tema.");
    if (
      draft.outcome === "decidido" &&
      (!draft.authority.trim() || !draft.rationale.trim())
    )
      return s.notify("Registra quién decide y por qué.");
    const id = uid("tema");
    const ok = await s.apply(
      [
        {
          id,
          kind:
            draft.outcome === "escalado" ? "ice-restriction" : "ice-decision",
          data: {
            ...draft,
            sessionId,
            status: "propuesto",
            source: "Registro en sesión · " + meeting.data.title,
            recordedAt: new Date().toISOString(),
            recordedBy: s.user.id,
            evidence: "",
          },
        },
      ],
      "Tema registrado para revisión",
    );
    if (ok) selectTopic(id);
  }
  return (
    <div className="st-split">
      <section className="st-card">
        <div className="st-cardtitle">
          <FileText size={18} />
          <h2>Mesa de decisión</h2>
        </div>
        <label className="st-field">
          Sesión de trabajo
          <select
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
          >
            <option value="">Seleccionar sesión</option>
            {sessions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.data.title}
              </option>
            ))}
          </select>
        </label>
        {meeting ? (
          <>
            <p>{meeting.data.agenda || meeting.data.title}</p>
            {meeting.data.scheduledAt && (
              <p>
                Sesión ·{" "}
                {new Date(meeting.data.scheduledAt).toLocaleString("es-PE")}
              </p>
            )}
            {meeting.data.preReadDueAt && (
              <p>
                Pre-read previsto ·{" "}
                {new Date(meeting.data.preReadDueAt).toLocaleString("es-PE")}
              </p>
            )}
            <div className="st-list">
              {topics.map((item) => (
                <button key={item.id} onClick={() => selectTopic(item.id)}>
                  <strong>{item.data.title}</strong>
                  <small>
                    {item.data.outcome || "Acta importada"} · {item.data.status}
                  </small>
                  <ArrowUpRight size={14} />
                </button>
              ))}
            </div>
          </>
        ) : (
          <p>Prepara una agenda en Pre-ICE o importa el acta de una sesión.</p>
        )}
      </section>
      {s.canEdit && meeting && (
        <form
          className="st-card"
          onSubmit={(e) => {
            e.preventDefault();
            void record();
          }}
        >
          <h2>Registrar tema</h2>
          {(
            [
              ["title", "Tema o decisión"],
              ["alternatives", "Alternativas consideradas"],
              ["authority", "Decisor con autoridad"],
              ["rationale", "Motivo"],
              ["scope", "Frente o disciplinas afectadas"],
              ["criterion", "Criterio de cierre"],
            ] as const
          ).map(([key, label]) => (
            <label className="st-field" key={key}>
              {label}
              <input
                required={key === "title"}
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
              />
            </label>
          ))}
          <div className="st-cols">
            <label className="st-field">
              Responsable del seguimiento
              <input
                value={draft.owner}
                onChange={(e) => set("owner", e.target.value)}
              />
            </label>
            <label className="st-field">
              Fecha compromiso
              <input
                type="date"
                value={draft.due}
                onChange={(e) => set("due", e.target.value)}
              />
            </label>
          </div>
          {(
            [
              ["objectiveId", "Objetivo afectado", "vdc-objective"],
              ["factorId", "Práctica controlable", "vdc-factor"],
              ["stepId", "Paso del mapa", "step"],
            ] as const
          ).map(([key, label, kind]) => (
            <label className="st-field" key={key}>
              {label}
              <select
                value={draft[key]}
                onChange={(e) => set(key, e.target.value)}
              >
                <option value="">Por vincular</option>
                {s.entities
                  .filter((x) => x.kind === kind)
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.data.title}
                    </option>
                  ))}
              </select>
            </label>
          ))}
          <label className="st-field">
            Resultado de la discusión
            <select
              value={draft.outcome}
              onChange={(e) => set("outcome", e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="decidido">Decidido</option>
              <option value="escalado">Escalado</option>
            </select>
          </label>
          <button className="st-primary">
            <Plus size={15} />
            Registrar para revisión
          </button>
        </form>
      )}
    </div>
  );
}
