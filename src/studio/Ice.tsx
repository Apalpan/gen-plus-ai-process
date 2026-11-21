import { useEffect, useState } from "react";
import { ClipboardList, FileInput, Plus, CalendarClock } from "lucide-react";
import { useStudio, type Entity, uid } from "./shared";
import {
  importChanges,
  parseActa,
  sampleActa,
  type IceDocument,
} from "./iceImport";
import { IceMeeting } from "./IceMeeting";
const labels: Record<string, string> = {
  "ice-action": "Compromiso",
  "ice-decision": "Decisión",
  "ice-restriction": "Restricción",
};
function Review({ item }: { item: Entity }) {
  const s = useStudio(),
    [draft, setDraft] = useState({ ...item.data }),
    [base, setBase] = useState(item),
    [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!dirty && !busy && item.rev > base.rev) {
      setBase(item);
      setDraft({ ...item.data });
    }
  }, [item.rev, base.rev, dirty, busy]);
  const canReview = s.role === "owner" || s.role === "reviewer",
    canWork = s.canEdit || canReview;
  const field = (k: string, v: string) => {
    setDirty(true);
    setDraft({ ...draft, [k]: v });
  };
  async function save(status: string) {
    if (!draft.title?.trim()) return s.notify("Escribe el acuerdo.");
    if (
      ["aceptado", "ejecutado", "verificado"].includes(status) &&
      (!draft.owner?.trim() || !draft.due)
    )
      return s.notify("Confirma responsable y fecha.");
    if (status === "verificado" && !draft.evidence?.trim())
      return s.notify("Vincula evidencia para verificar el cierre.");
    setBusy(true);
    const data = {
      ...draft,
      status,
      updatedBy: s.user.id,
      verifiedBy: status === "verificado" ? s.user.id : null,
    };
    try {
      if (
        await s.apply(
          [{ id: item.id, kind: item.kind, expectedRev: base.rev, data }],
          "Seguimiento actualizado",
        )
      ) {
        setDraft(data);
        setBase({ ...item, data, rev: base.rev + 1 });
        setDirty(false);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <aside className="st-card">
      <fieldset disabled={busy || !canWork}>
        <div className="st-cardtitle">
          <ClipboardList size={18} />
          <h2>Revisar {labels[item.kind]?.toLowerCase()}</h2>
        </div>
        <small>
          {base.data.status} · rev. {base.rev}
        </small>
        <label className="st-field">
          Asunto
          <textarea
            value={draft.title || ""}
            onChange={(e) => field("title", e.target.value)}
          />
        </label>
        <div className="st-cols">
          <label className="st-field">
            Responsable
            <input
              list="ice-owners"
              value={draft.owner || ""}
              onChange={(e) => field("owner", e.target.value)}
            />
            <datalist id="ice-owners">
              {s.members.map((m) => (
                <option key={m.userId} value={m.name} />
              ))}
            </datalist>
          </label>
          <label className="st-field">
            Fecha
            <input
              type="date"
              value={draft.due || ""}
              onChange={(e) => field("due", e.target.value)}
            />
          </label>
        </div>
        {(
          [
            ["objectiveId", "Objetivo afectado", "vdc-objective"],
            ["factorId", "Factor controlable", "vdc-factor"],
            ["stepId", "Actividad", "step"],
          ] as const
        ).map(([k, title, kind]) => (
          <label className="st-field" key={k}>
            {title}
            <select
              value={draft[k] || ""}
              onChange={(e) => field(k, e.target.value)}
            >
              <option value="">Por vincular</option>
              {s.entities
                .filter((e) => e.kind === kind)
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.data.title}
                  </option>
                ))}
            </select>
          </label>
        ))}
        <label className="st-field">
          Evidencia de ejecución
          <input
            value={draft.evidence || ""}
            placeholder="Documento, registro o referencia verificable"
            onChange={(e) => field("evidence", e.target.value)}
          />
        </label>
        <blockquote>{draft.source}</blockquote>
        {draft.criterion && <p>Criterio de cierre · {draft.criterion}</p>}
        {draft.authority && (
          <p>
            Decisor · {draft.authority} · {draft.rationale}
          </p>
        )}
        <div className="st-btnrow">
          {draft.factorId && (
            <button onClick={() => s.navigate("vdc", draft.factorId)}>
              Ver factor en el mapa VDC
            </button>
          )}
          {draft.stepId && (
            <button onClick={() => s.navigate("mapa", draft.stepId)}>
              Ver actividad
            </button>
          )}
        </div>
        {canWork && (
          <div className="st-btnrow">
            <button onClick={() => save(base.data.status)}>
              Guardar ficha
            </button>
            {canReview && base.data.status === "propuesto" && (
              <>
                <button className="st-primary" onClick={() => save("aceptado")}>
                  Aceptar
                </button>
                <button onClick={() => save("descartado")}>Descartar</button>
              </>
            )}
            {base.data.status === "aceptado" && (
              <button className="st-primary" onClick={() => save("ejecutado")}>
                Marcar ejecutado
              </button>
            )}
            {canReview && base.data.status === "ejecutado" && (
              <button className="st-primary" onClick={() => save("verificado")}>
                Verificar cierre
              </button>
            )}
            {canReview &&
              ["descartado", "verificado"].includes(base.data.status) && (
                <button onClick={() => save("propuesto")}>Reabrir</button>
              )}
          </div>
        )}
      </fieldset>
    </aside>
  );
}
export default function Ice() {
  const s = useStudio(),
    sessions = s.entities.filter((e) => e.kind === "ice-session"),
    items = s.entities.filter((e) => labels[e.kind]);
  const [tab, setTab] = useState("seguimiento"),
    [text, setText] = useState(""),
    [ref, setRef] = useState(""),
    [preview, setPreview] = useState<IceDocument | null>(null),
    [agenda, setAgenda] = useState(""),
    [when, setWhen] = useState(""),
    [lead, setLead] = useState(24),
    [sessionFilter, setSessionFilter] = useState("");
  const selected = s.entities.find(
    (x) => x.id === s.selection && labels[x.kind],
  );
  async function inspect() {
    try {
      setPreview(await parseActa(text, ref));
    } catch (e) {
      s.notify(String(e));
    }
  }
  async function ingest() {
    if (!preview) return;
    const changes = await importChanges(preview, s.entities);
    if (!changes.length) {
      s.notify("Esta versión del acta ya está registrada.");
      return;
    }
    if (await s.apply(changes, "Acta incorporada a revisión")) {
      setPreview(null);
      setText("");
      setTab("seguimiento");
      s.select(changes[1]?.id || null);
    }
  }
  async function createAgenda() {
    if (!agenda.trim() || !when)
      return s.notify("Indica temas y fecha de sesión.");
    const sessionDate = new Date(when);
    if (
      await s.apply(
        [
          {
            id: uid("ice"),
            kind: "ice-session",
            data: {
              title: "Pre-ICE · " + sessionDate.toLocaleDateString("es-PE"),
              agenda,
              scheduledAt: sessionDate.toISOString(),
              preReadDueAt: new Date(
                +sessionDate - lead * 3600000,
              ).toISOString(),
              status: "preparación",
              source: "Agenda del equipo",
            },
          },
        ],
        "Agenda guardada",
      )
    ) {
      setAgenda("");
      setTab("seguimiento");
    }
  }
  return (
    <section className="st-page">
      <div className="st-heading">
        <div>
          <p className="st-eyebrow">COORDINACIÓN</p>
          <h1>Sesiones ICE</h1>
          <p>Decisiones, restricciones y compromisos vinculados al proceso.</p>
        </div>
        <span className="st-tag">ICEBOT · Importar actas</span>
      </div>
      <div className="st-tabs">
        {[
          ["seguimiento", "Seguimiento"],
          ["pre", "Pre-ICE"],
          ["sesion", "En sesión"],
          ["acta", "Importar acta"],
        ].map(([key, title]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
          >
            {title}
          </button>
        ))}
      </div>
      {tab === "acta" ? (
        <div className="st-card st-narrow">
          <h2>Acta de la sesión</h2>
          <p>
            Importa JSON o pega un tema por línea con el prefijo Decisión,
            Acuerdo o Restricción seguido de dos puntos.
          </p>
          <label className="st-field">
            Referencia para acta de texto
            <input
              value={ref}
              onChange={(e) => {
                setRef(e.target.value);
                setPreview(null);
              }}
              placeholder="ICE · semana 48"
            />
          </label>
          <label className="st-field">
            Acta
            <textarea
              rows={8}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setPreview(null);
              }}
            />
          </label>
          <div className="st-btnrow">
            <button
              onClick={() => {
                setText(sampleActa);
                setPreview(null);
              }}
            >
              Cargar ejemplo
            </button>
            <label className="st-file">
              Abrir archivo
              <input
                type="file"
                accept=".json,.txt"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (f && f.size < 160000) {
                    setText(await f.text());
                    setPreview(null);
                  }
                }}
              />
            </label>
            <button className="st-primary" onClick={inspect}>
              <FileInput size={16} />
              Previsualizar
            </button>
          </div>
          {preview && (
            <div className="st-preview">
              <h3>{preview.title}</h3>
              {preview.items.map((i) => (
                <p key={i.externalId}>
                  {labels[i.kind]} · {i.title}
                </p>
              ))}
              <button
                disabled={!s.canEdit}
                className="st-primary"
                onClick={ingest}
              >
                Incorporar a revisión
              </button>
            </div>
          )}
        </div>
      ) : tab === "sesion" ? (
        <IceMeeting
          sessions={sessions}
          selectTopic={(id) => {
            s.select(id);
            setTab("seguimiento");
          }}
        />
      ) : tab === "pre" ? (
        <div className="st-card st-narrow">
          <h2>Preparar sesión</h2>
          <label className="st-field">
            Agenda, opciones y decisores
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
            />
          </label>
          <button
            onClick={() =>
              setAgenda(
                items
                  .filter(
                    (e) =>
                      e.data.status !== "verificado" &&
                      e.data.status !== "descartado",
                  )
                  .map(
                    (e) =>
                      e.data.title +
                      " · " +
                      (e.data.owner || "Confirmar decisor"),
                  )
                  .join("\n"),
              )
            }
          >
            Traer temas abiertos
          </button>
          <label className="st-field">
            Fecha de la sesión
            <input
              type="datetime-local"
              value={when}
              onChange={(e) => setWhen(e.target.value)}
            />
          </label>
          <label className="st-field">
            Anticipación del pre-read (horas)
            <input
              type="number"
              min="0"
              max="720"
              value={lead}
              onChange={(e) =>
                setLead(Math.max(0, Math.min(720, Number(e.target.value))))
              }
            />
          </label>
          <button
            disabled={!s.canEdit}
            className="st-primary"
            onClick={createAgenda}
          >
            <Plus size={16} />
            Guardar agenda
          </button>
        </div>
      ) : (
        <div className="st-split">
          <div>
            <label className="st-field">
              Sesión
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
              >
                <option value="">Todas las sesiones</option>
                {sessions.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.data.title}
                  </option>
                ))}
              </select>
            </label>
            {sessionFilter && (
              <div className="st-card">
                <CalendarClock size={18} />
                <p>
                  {sessions.find((e) => e.id === sessionFilter)?.data.agenda ||
                    sessions.find((e) => e.id === sessionFilter)?.data.source}
                </p>
              </div>
            )}
            <div className="st-card st-list">
              {items
                .filter(
                  (e) => !sessionFilter || e.data.sessionId === sessionFilter,
                )
                .map((e) => (
                  <button
                    key={e.id}
                    aria-pressed={e.id === s.selection}
                    onClick={() => {
                      s.select(e.id);
                    }}
                  >
                    <small>
                      {labels[e.kind]} · {e.data.status}
                    </small>
                    <strong>{e.data.title}</strong>
                    <span>
                      {e.data.owner || "Por asignar"} ·{" "}
                      {e.data.due || "Fecha pendiente"}
                    </span>
                  </button>
                ))}
              {!items.length && (
                <p className="st-empty">
                  Importa un acta para revisar los acuerdos.
                </p>
              )}
            </div>
          </div>
          {selected ? (
            <Review key={selected.id} item={selected} />
          ) : (
            <div className="st-empty">
              Selecciona un tema para revisar su fuente, responsable y
              evidencia.
            </div>
          )}
        </div>
      )}
    </section>
  );
}
