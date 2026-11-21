import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Entity } from "./shared";
import { studioTemplates } from "./editor/templates";
import { seedVdc } from "./vdc/seed";
import {
  buildHistoricalCase,
  listHistoricalCases,
  type HistoricalCase,
} from "./editor/historicalCases";
import { validateMap } from "./editor/importMap";
export function prefabricated() {
  const entities = [
    ...studioTemplates.find((t) => t.id === "industrial")!.build(),
    ...seedVdc(),
  ] as Entity[];
  const design = entities.find((e) => e.id === "prefabricated-design");
  if (design) {
    design.data.factorId = "fc-qa";
    design.data.objectiveId = "prodo-via";
    design.data.owner = "Coordinación BIM";
    design.data.experts = ["Ingeniería de fábrica", "Control de calidad"];
    design.data.technology = "Modelo federado y registro BCF";
    design.data.metrics = [
      {
        code: "cycle-time",
        observed: 6.5,
        target: 8,
        period: "2026-W47",
        quality: "DATO_DEMO",
        source: "Registro simulado de inicio y revisión de un paquete",
      },
    ];
  }
  const fabrication = entities.find((e) => e.id === "step_industrial_1");
  if (fabrication) {
    fabrication.data.objectiveId = "prodo-ppm";
    fabrication.data.technology = "Registro de inspección del lote";
    fabrication.data.metrics = [
      {
        code: "first-pass-yield",
        observed: 90,
        target: 95,
        period: "2026-W47",
        quality: "DATO_DEMO",
        source: "Inspección simulada de 10 piezas; 9 aceptadas al primer pase",
      },
    ];
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
  const [library, setLibrary] = useState<HistoricalCase[]>([]);
  const [preview, setPreview] = useState<{
    title: string;
    entities: Entity[];
    id: string;
  } | null>(null);
  const [error, setError] = useState("");
  const historical = tpl.startsWith("legacy:");
  const copy = historical && preview?.id === tpl ? preview : null;
  const proposedName = name.trim() || (copy ? "Copia · " + copy.title : "");
  useEffect(() => {
    let live = true;
    listHistoricalCases()
      .then((items) => {
        if (live) setLibrary(items);
      })
      .catch(() => {
        if (live) setError("No se pudo cargar la biblioteca histórica.");
      });
    return () => {
      live = false;
    };
  }, []);
  useEffect(() => {
    if (!historical) return;
    let live = true;
    buildHistoricalCase(tpl.slice(7))
      .then((result) => {
        if (!live) return;
        const problems = validateMap(result.entities);
        if (problems.length) {
          setError(problems[0]);
          return;
        }
        setPreview({ ...result, id: tpl });
      })
      .catch(() => {
        if (live) setError("No se pudo abrir el caso seleccionado.");
      });
    return () => {
      live = false;
    };
  }, [tpl, historical]);
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
            if (historical && !copy) return;
            setBusy(true);
            try {
              const t = studioTemplates.find((v) => v.id === tpl);
              const entities = copy ? [...copy.entities] : t ? t.build() : [];
              if (kit && !historical) entities.push(...seedVdc());
              await create(proposedName, entities);
              close();
            } catch (reason) {
              setError(
                reason instanceof Error
                  ? reason.message
                  : "No se pudo crear el mapa.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label className="st-field">
            Nombre del proceso
            <input
              autoFocus
              required={!historical}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                copy
                  ? "Copia · " + copy.title
                  : "Ej. Liberación de paquetes de diseño"
              }
            />
          </label>
          <label className="st-field">
            Punto de partida
            <select
              value={tpl}
              onChange={(e) => {
                setError("");
                setPreview(null);
                setTpl(e.target.value);
              }}
            >
              <option value="blank">Lienzo en blanco</option>
              <optgroup label="Plantillas de proceso">
                {studioTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </optgroup>
              {library.length > 0 && (
                <optgroup label="Casos históricos">
                  {library.map((c) => (
                    <option key={c.id} value={"legacy:" + c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>
          <p>{studioTemplates.find((t) => t.id === tpl)?.description}</p>
          {copy && (
            <div className="mg-copy-preview">
              <strong>{copy.title}</strong>
              <p>
                {copy.entities.filter((e) => e.kind === "step").length} pasos ·{" "}
                {copy.entities.filter((e) => e.kind === "lane").length} carriles
                · {copy.entities.filter((e) => e.kind === "edge").length}{" "}
                conexiones
              </p>
            </div>
          )}
          {!historical && (
            <label className="st-check">
              <input
                type="checkbox"
                checked={kit}
                onChange={(e) => setKit(e.target.checked)}
              />{" "}
              Incluir kit VDC de ejemplo
            </label>
          )}
          {error && <p role="alert">{error}</p>}
          <button
            className="st-primary"
            disabled={busy || !proposedName || (historical && !copy)}
          >
            <Plus size={16} />
            {historical ? "Crear copia del caso" : "Crear mapa"}
          </button>
        </form>
      </section>
    </div>
  );
}
