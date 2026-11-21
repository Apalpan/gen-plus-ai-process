import { useState } from "react";
import {
  ArrowUpRight,
  Layers,
  GitFork,
  Plus,
  ClipboardCheck,
  Target,
  ChevronRight,
  Workflow,
  Gauge,
} from "lucide-react";
import { useStudio, type Entity } from "./shared";
import { studioTemplates } from "./editor/templates";
import { seedVdc } from "./vdc/seed";
export function prefabricated() {
  const entities = [
    ...studioTemplates.find((t) => t.id === "industrial")!.build(),
    ...seedVdc(),
  ] as Entity[];
  const design = entities.find((e) => e.id === "prefabricated-design");
  if (design) {
    design.data.factorId = "fc-qa";
    design.data.objectiveId = "prodo-via";
  }
  entities.push({
    id: "ice-initial",
    kind: "ice-restriction",
    rev: 0,
    data: {
      title: "Liberar el despiece de anclajes",
      status: "propuesto",
      owner: "Coordinación BIM",
      due: "2026-11-27",
      factorId: "fc-qa",
      stepId: "prefabricated-design",
      source: "DATO_DEMO · Revisión de interfaces",
      evidence: "",
    },
  });
  return entities;
}
export function BoardCreator({
  create,
  close,
}: {
  create: (name: string, entities: Entity[]) => Promise<void>;
  close: () => void;
}) {
  const [name, setName] = useState(""),
    [tpl, setTpl] = useState("blank"),
    [kit, setKit] = useState(false),
    [busy, setBusy] = useState(false);
  return (
    <div className="st-dialog-back">
      <section
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo proceso"
        className="st-dialog"
      >
        <div className="st-cardtitle">
          <h2>Nuevo proceso</h2>
          <button onClick={close} aria-label="Cerrar">
            ×
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              const t = studioTemplates.find((v) => v.id === tpl);
              const entities = t ? t.build() : [];
              if (kit) entities.push(...seedVdc());
              await create(name.trim(), entities);
              close();
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="st-field">
            Nombre del proceso
            <input
              autoFocus
              required
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Liberación de paquetes de diseño"
            />
          </label>
          <label className="st-field">
            Punto de partida
            <select value={tpl} onChange={(e) => setTpl(e.target.value)}>
              <option value="blank">Lienzo en blanco</option>
              {studioTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <p>{studioTemplates.find((t) => t.id === tpl)?.description}</p>
          <label className="st-check">
            <input
              type="checkbox"
              checked={kit}
              onChange={(e) => setKit(e.target.checked)}
            />{" "}
            Incluir kit VDC de ejemplo
          </label>
          <button className="st-primary" disabled={busy || !name.trim()}>
            <Plus size={16} />
            Crear mapa
          </button>
        </form>
      </section>
    </div>
  );
}
export default function Overview({ newBoard }: { newBoard: () => void }) {
  const s = useStudio(),
    steps = s.entities.filter((e) => e.kind === "step"),
    links = s.entities.filter((e) => e.kind === "edge"),
    objectives = s.entities.filter((e) => e.kind === "vdc-objective"),
    pending = s.entities.filter(
      (e) =>
        ["ice-action", "ice-restriction", "ice-decision"].includes(e.kind) &&
        !["verificado", "descartado"].includes(e.data.status),
    );
  return (
    <section className="st-page">
      <div className="st-heading">
        <div>
          <p className="st-eyebrow">ESPACIO DE TRABAJO</p>
          <h1>Inicio</h1>
        </div>
        {s.canEdit && (
          <button className="st-primary" onClick={newBoard}>
            <Plus size={16} />
            Nuevo proceso
          </button>
        )}
      </div>
      <div className="st-overview-hero">
        <div>
          <p className="st-overline">
            PROCESO ACTIVO
            {s.entities.some((e) => e.data.quality === "DATO_DEMO")
              ? " · DATOS DE EJEMPLO"
              : ""}
          </p>
          <h2>{s.board.title}</h2>
          <button onClick={() => s.navigate("mapa")}>
            Abrir mapa <ArrowUpRight size={16} />
          </button>
        </div>
        <div className="st-mini-flow">
          {steps
            .filter(
              (e) => !["queue", "decision", "buffer"].includes(e.data.type),
            )
            .sort((a, b) => (Number(a.data.x) || 0) - (Number(b.data.x) || 0))
            .slice(0, 4)
            .map((e, i) => (
              <button key={e.id} onClick={() => s.navigate("mapa", e.id)}>
                <Workflow size={15} />
                <strong>{e.data.title}</strong>
                {i < 3 && <span>→</span>}
              </button>
            ))}
        </div>
      </div>
      <div className="st-stats">
        {[
          [Layers, steps.length, "Pasos del proceso", "mapa"],
          [GitFork, links.length, "Conexiones", "mapa"],
          [Target, objectives.length, "Objetivos VDC", "vdc"],
          [ClipboardCheck, pending.length, "Asuntos ICE abiertos", "ice"],
        ].map(([I, n, t, v]) => {
          const Icon = I as typeof Layers;
          return (
            <button key={String(t)} onClick={() => s.navigate(v as any)}>
              <Icon size={18} />
              <strong>{String(n)}</strong>
              <span>{String(t)}</span>
            </button>
          );
        })}
      </div>
      <div className="st-split">
        <div className="st-card">
          <div className="st-cardtitle">
            <ClipboardCheck size={19} />
            <h2>Pendientes de coordinación</h2>
          </div>
          {pending.length ? (
            pending.slice(0, 5).map((e) => (
              <button
                className="st-row"
                key={e.id}
                onClick={() => s.navigate("ice", e.id)}
              >
                <span>
                  <strong>{e.data.title}</strong>
                  <small>
                    {e.data.owner || "Por asignar"} · {e.data.status}
                  </small>
                </span>
                <ChevronRight size={16} />
              </button>
            ))
          ) : (
            <p>El equipo está al día.</p>
          )}
        </div>
        <div className="st-card">
          <div className="st-cardtitle">
            <Gauge size={19} />
            <h2>Revisión del proyecto</h2>
          </div>
          {[
            ["gerencia", "Objetivos y decisiones", "Dashboard gerencial"],
            [
              "operacion",
              "Restricciones y responsables",
              "Dashboard operativo",
            ],
            ["vdc", "Mapa de interrelaciones", "Factores y objetivos"],
          ].map(([v, title, subtitle]) => (
            <button
              className="st-row"
              key={v}
              onClick={() => s.navigate(v as any)}
            >
              <span>
                <strong>{title}</strong>
                <small>{subtitle}</small>
              </span>
              <ArrowUpRight size={16} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
