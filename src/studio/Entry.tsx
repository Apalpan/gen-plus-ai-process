import { useState } from "react";
import {
  ArrowRight,
  Boxes,
  Factory,
  Truck,
  Construction,
  Workflow,
  LogIn,
} from "lucide-react";
import { api, type User } from "./shared";
const stages = [
  ["Diseño", "Paquete coordinado", Boxes],
  ["Fabricación", "Lote conforme", Factory],
  ["Transporte", "Carga recibida", Truck],
  ["Montaje", "Frente aceptado", Construction],
] as const;
export function ProcessStrip({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={"st-diagram " + (dark ? "on-dark" : "")}
      aria-label="Etapas del proceso industrializado"
    >
      <div className="st-diagram-head">
        <Workflow size={16} />
        <span>Cadena industrializada</span>
        <small>4 etapas</small>
      </div>
      <div className="st-stages">
        {stages.map(([title, desc, Icon], i) => (
          <div key={title} className="st-stage">
            <span className="st-stage-icon">
              <Icon size={19} />
            </span>
            <strong>{title}</strong>
            <small>{desc}</small>
            {i < 3 && <i aria-hidden="true">→</i>}
          </div>
        ))}
      </div>
      <div className="st-diagram-foot">
        <span className="st-line" />
        <span>Unidad de flujo</span>
        <b>Lote prefabricado</b>
      </div>
    </div>
  );
}
export default function Entry({
  onUser,
}: {
  onUser: (u: User) => Promise<void>;
}) {
  const [mode, setMode] = useState<"intro" | "login" | "register">("intro"),
    [busy, setBusy] = useState(false),
    [err, setErr] = useState(""),
    [email, setEmail] = useState(""),
    [name, setName] = useState(""),
    [pass, setPass] = useState("");
  async function submit(action: string) {
    setBusy(true);
    setErr("");
    try {
      const { user } = await api("/auth/" + action, "POST", {
        email,
        password: pass,
        displayName: name.trim() || "Visitante",
      });
      await onUser({ ...user, name: user.displayName });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Conexión interrumpida");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="st-entry">
      <header>
        <div className="st-brand">
          <img
            src={import.meta.env.BASE_URL + "gen-logo-white.png"}
            alt="GEN+"
          />
          <i />
          <strong>AI Process</strong>
        </div>
        <span className="st-entry-context">
          <span className="st-dot" /> Espacio local
        </span>
      </header>
      <div className="st-entry-grid">
        <div className="st-entry-copy">
          <div className="st-overline">PLATAFORMA DE PROCESOS</div>
          <h1>
            Del mapa a la
            <br />
            <em>decisión.</em>
          </h1>
          <p>
            Mapea el trabajo con tu equipo. Conecta cada entrega, restricción y
            decisión con los objetivos del proyecto.
          </p>
          <div className="st-entry-features">
            VDC <i /> Producción <i /> Coordinación ICE
          </div>
        </div>
        <div className="st-entry-panel">
          {mode === "intro" ? (
            <>
              <ProcessStrip dark />
              <div className="st-entry-actions">
                <h2>Explora la mesa de trabajo</h2>
                <p>
                  Abre un espacio privado con un proyecto de prefabricados y dos
                  cortes de producción de ejemplo.
                </p>
                <button
                  className="st-primary"
                  disabled={busy}
                  onClick={() => submit("guest")}
                >
                  {busy ? "Abriendo…" : "Abrir demo local"}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="st-entry-secondary"
                  onClick={() => setMode("login")}
                >
                  <LogIn size={15} />
                  Acceder con mi cuenta
                </button>
              </div>
            </>
          ) : (
            <form
              className="st-entry-actions"
              onSubmit={(e) => {
                e.preventDefault();
                submit(mode);
              }}
            >
              <button type="button" onClick={() => setMode("intro")}>
                ← Volver
              </button>
              <h2>
                {mode === "login" ? "Acceso de equipo" : "Crear cuenta local"}
              </h2>
              {mode === "register" && (
                <label className="st-field">
                  Nombre
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
              )}
              <label className="st-field">
                Correo
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
              <label className="st-field">
                Contraseña
                <input
                  type="password"
                  required
                  minLength={mode === "register" ? 10 : 1}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                />
              </label>
              <button className="st-primary" disabled={busy}>
                {busy
                  ? "Verificando…"
                  : mode === "login"
                    ? "Entrar"
                    : "Crear cuenta"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setErr("");
                }}
              >
                {mode === "login"
                  ? "Crear una cuenta local"
                  : "Ya tengo cuenta"}
              </button>
            </form>
          )}
          {err && (
            <div role="alert" className="st-error">
              {err}
            </div>
          )}
        </div>
      </div>
      <footer>
        <span>GEN+ · Ingeniería y producción</span>
        <a href="?legacy">Abrir versión clásica ↗</a>
      </footer>
    </main>
  );
}
