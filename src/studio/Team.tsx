import { useEffect, useState } from "react";
import { Users, Stamp, History, UserPlus, Copy } from "lucide-react";
import { api, useStudio } from "./shared";
export default function Team({ reload }: { reload: () => Promise<void> }) {
  const s = useStudio(),
    [email, setEmail] = useState(""),
    [role, setRole] = useState("editor"),
    [revisions, setRevisions] = useState<any[]>([]),
    [busy, setBusy] = useState(false),
    [profile, setProfile] = useState(s.user.name),
    [discipline, setDiscipline] = useState(s.user.discipline || ""),
    [jobRole, setJobRole] = useState(s.user.jobRole || "");
  async function history() {
    try {
      setRevisions(
        (await api("/boards/" + s.board.id + "/revisions")).revisions || [],
      );
    } catch (e) {
      s.notify(String(e));
    }
  }
  useEffect(() => {
    history();
  }, [s.board.id]);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      s.notify(String(e));
    } finally {
      setBusy(false);
    }
  }
  const access = s.role === "owner";
  return (
    <div className="st-page">
      <div className="st-heading">
        <div>
          <p className="st-eyebrow">GOBIERNO DEL ESPACIO</p>
          <h1>Equipo y revisiones</h1>
        </div>
      </div>
      <div className="st-split">
        <section className="st-card">
          <div className="st-cardtitle">
            <Users size={18} />
            <h2>Miembros</h2>
          </div>
          {s.members.map((m) => (
            <div key={m.userId} className="st-row">
              <span>
                <strong>{m.name}</strong>
                <small>
                  {[m.role, m.jobRole, m.discipline]
                    .filter(Boolean)
                    .join(" · ")}
                </small>
              </span>
              {access && m.userId !== s.user.id && (
                <button
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await api(
                        "/workspaces/" +
                          s.board.workspaceId +
                          "/members/" +
                          m.userId,
                        "DELETE",
                      );
                      await reload();
                    })
                  }
                >
                  Revocar
                </button>
              )}
            </div>
          ))}
          {access && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api(
                    "/workspaces/" + s.board.workspaceId + "/members",
                    "POST",
                    { email, role },
                  );
                  await reload();
                  setEmail("");
                  s.notify("Membresía guardada");
                });
              }}
            >
              <label className="st-field">
                Correo de una cuenta registrada
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="st-field">
                Permiso
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  {["editor", "reviewer", "reader"].map((r, i) => (
                    <option key={r} value={r}>
                      {["Editor", "Revisor", "Lector"][i]}
                    </option>
                  ))}
                </select>
              </label>
              <button disabled={busy} className="st-primary">
                <UserPlus size={15} />
                Guardar miembro
              </button>
            </form>
          )}
          <hr />
          <h2>Mi perfil</h2>
          <label className="st-field">
            Nombre visible
            <input
              value={profile}
              onChange={(e) => setProfile(e.target.value)}
            />
          </label>
          <label className="st-field">
            Rol operativo
            <input
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="Jefe de producción"
            />
          </label>
          <label className="st-field">
            Disciplina
            <input
              value={discipline}
              onChange={(e) => setDiscipline(e.target.value)}
              placeholder="Estructuras"
            />
          </label>
          <button
            disabled={busy || !profile.trim()}
            onClick={() =>
              act(async () => {
                await api("/auth/profile", "POST", {
                  displayName: profile,
                  discipline,
                  jobRole,
                });
                location.reload();
              })
            }
          >
            Guardar perfil
          </button>
        </section>
        <section className="st-card">
          <div className="st-cardtitle">
            <History size={18} />
            <h2>Revisiones publicadas</h2>
          </div>
          <p>
            Cada publicación conserva una copia consultable del tablero y su
            evidencia.
          </p>
          {["owner", "reviewer"].includes(s.role) && (
            <button
              disabled={busy}
              className="st-primary"
              onClick={() =>
                act(async () => {
                  await api("/boards/" + s.board.id + "/publish", "POST", {
                    expectedRev: s.board.revision,
                  });
                  await history();
                  s.notify("Revisión publicada en el espacio");
                })
              }
            >
              <Stamp size={15} />
              Publicar revisión
            </button>
          )}
          {revisions.map((r) => (
            <div className="st-row" key={r.id}>
              <span>
                <strong>Revisión {r.boardRev ?? r.revision}</strong>
                <small>{new Date(r.createdAt).toLocaleString("es-PE")}</small>
              </span>
              <a href={"?revision=" + encodeURIComponent(r.id)}>Abrir</a>
            </div>
          ))}
          <button
            className="st-row"
            onClick={() =>
              act(async () => {
                await navigator.clipboard.writeText(
                  location.origin + location.pathname + "?board=" + s.board.id,
                );
                s.notify("Enlace copiado. El acceso depende de la membresía.");
              })
            }
          >
            <Copy size={14} />
            Copiar enlace al proceso
          </button>
        </section>
      </div>
    </div>
  );
}
