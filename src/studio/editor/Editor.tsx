import { validateMap, readMap, recoverOriginal } from "./importMap";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  applyNodeChanges,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type ReactFlowInstance,
  useViewport,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  AlignHorizontalSpaceAround,
  CheckCircle2,
  Download,
  GitCompareArrows,
  Plus,
  Save,
  Send,
  Trash2,
  Upload,
  Users,
} from "lucide-react";
import { api, uid, useStudio, type Change, type Entity } from "../shared";
import { createTemplateEntities, launchTemplates } from "./templateFactory";
import { asEdge, asStep, type StepData, type StudioEntity } from "./types";

type UndoEntry = { before: Entity[]; after: Entity[]; ids: Set<string> };
type View = "canvas" | "table" | "chain" | "compare";
type Revision = { id: string; createdAt?: string; description?: string };
const box = "rounded-xl border border-[#dce5f2] bg-white shadow-sm";
const copy = (items: Entity[]) =>
  items.map((item) => ({ ...item, data: structuredClone(item.data) }));
const local = (item: Entity) => item as StudioEntity;
function saveFile(name: string, content: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
function mermaid(items: Entity[]) {
  const safe = (value: string) => value.replace(/[^a-zA-Z0-9_]/g, "_");
  return [
    "flowchart LR",
    ...items
      .filter((item) => item.kind === "step")
      .map(
        (item) =>
          `  ${safe(item.id)}["${asStep(local(item)).title.replace(/"/g, "'")}"]`,
      ),
    ...items
      .filter((item) => item.kind === "edge")
      .map((item) => {
        const data = asEdge(local(item));
        return `  ${safe(data.source)} --> ${safe(data.target)}`;
      }),
  ].join("\n");
}

export function Editor() {
  const studio = useStudio();
  const {
    entities: remote,
    apply,
    board,
    canEdit,
    members,
    user,
    presence,
    selection,
    select,
    notify,
    pointer,
  } = studio;
  const [view, setView] = useState<View>("canvas");
  const cacheKey = "ai-process-editor:" + user.id + ":" + board.id;
  const cached = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem(cacheKey) || "null") as {
        draft: Entity[];
        base: Entity[];
      } | null;
    } catch {
      return null;
    }
  }, [cacheKey]);
  const [draft, setDraft] = useState<Entity[]>(
    () => cached?.draft || copy(remote),
  );
  const [baseDraft, setBaseDraft] = useState<Entity[]>(
    () => cached?.base || copy(remote),
  );
  const [tombstones, setTombstones] = useState<Record<string, number>>({});
  const [dirty, setDirty] = useState(Boolean(cached));
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const editSerial = useRef(0);
  const [inspector, setInspector] = useState(() => window.innerWidth >= 1130);
  const [panelWidth, setPanelWidth] = useState(306);
  const [autoShare, setAutoShare] = useState(true);
  const [selected, setSelected] = useState<string | null>(selection);
  const [filter, setFilter] = useState("");
  const [orientation, setOrientation] = useState<"horizontal" | "vertical">(
    "horizontal",
  );
  const [history, setHistory] = useState<UndoEntry[]>([]);
  const [redo, setRedo] = useState<UndoEntry[]>([]);
  const [preview, setPreview] = useState<Entity[] | null>(null);
  const [previewErrors, setPreviewErrors] = useState<string[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [baseId, setBaseId] = useState("");
  const [revisionBase, setRevisionBase] = useState<Entity[] | null>(null);
  const [laneName, setLaneName] = useState("");
  const [comment, setComment] = useState("");
  const flow = useRef<ReactFlowInstance | null>(null);
  const [layoutPreview, setLayoutPreview] = useState(false);
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  useEffect(() => {
    if (!dirty) {
      setDraft(copy(remote));
      setBaseDraft(copy(remote));
    }
  }, [remote, dirty]);
  useEffect(() => {
    try {
      if (dirty)
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({ draft, base: baseDraft }),
        );
      else sessionStorage.removeItem(cacheKey);
    } catch {
      notify("No hay espacio para guardar el borrador en esta pestaña.");
    }
  }, [dirty, draft, baseDraft, cacheKey]);
  useEffect(() => {
    const reconcile = () => {
      setDirty(false);
      setHistory([]);
      setRedo([]);
      setDraft(copy(remote));
      setBaseDraft(copy(remote));
    };
    window.addEventListener("studio:reconciled", reconcile);
    return () => window.removeEventListener("studio:reconciled", reconcile);
  }, [remote]);
  useEffect(() => setSelected(selection), [selection]);
  useEffect(() => {
    void api<{ revisions: Revision[] }>(`/boards/${board.id}/revisions`)
      .then((result) => setRevisions(result.revisions ?? []))
      .catch(() => setRevisions([]));
  }, [board.id]);
  const steps = useMemo(
    () => draft.filter((item) => item.kind === "step"),
    [draft],
  );
  const lanes = useMemo(
    () => draft.filter((item) => item.kind === "lane"),
    [draft],
  );
  const edges = useMemo(
    () => draft.filter((item) => item.kind === "edge"),
    [draft],
  );
  const objectives = useMemo(
    () => draft.filter((item) => item.kind === "vdc-objective"),
    [draft],
  );
  const factors = useMemo(
    () => draft.filter((item) => item.kind === "vdc-factor"),
    [draft],
  );
  const selectedStep = steps.find((item) => item.id === selected) ?? null;
  const change = (next: Entity[]) => {
    if (!canEdit) return;
    editSerial.current++;
    if (!dirty) setBaseDraft(copy(remote));
    const before = new Map(draft.map((e) => [e.id, e]));
    const after = new Map(next.map((e) => [e.id, e]));
    const ids = new Set(
      [...new Set([...before.keys(), ...after.keys()])].filter(
        (id) =>
          JSON.stringify(before.get(id)?.data) !==
          JSON.stringify(after.get(id)?.data),
      ),
    );
    if (!ids.size) return;
    setHistory((items) => [
      ...items.slice(-19),
      {
        before: draft.filter((e) => ids.has(e.id)),
        after: next.filter((e) => ids.has(e.id)),
        ids,
      },
    ]);
    setRedo([]);
    setDraft(next);
    setDirty(true);
  };
  const upsert = (item: Entity) =>
    change([...draft.filter((current) => current.id !== item.id), item]);
  const create = (type: StepData["type"] = "activity") => {
    const objectiveId = objectives.some((item) => item.id === selection)
      ? selection
      : undefined;
    const defaultLane: Entity = {
      id: uid("lane"),
      kind: "lane",
      rev: 0,
      data: { name: "Proceso", color: "#2862d7" },
    };
    const item: Entity = {
      id: uid("step"),
      kind: "step",
      rev: 0,
      data: {
        title: type === "decision" ? "¿Qué se decide?" : "Nueva actividad",
        type,
        laneId: lanes[0]?.id ?? defaultLane.id,
        owner: user.name,
        x: 160 + steps.length * 30,
        y: 140 + (steps.length % 3) * 110,
        status: "draft",
        objectiveId,
      },
    };
    change([...draft, ...(lanes.length ? [] : [defaultLane]), item]);
    setInspector(true);
    setSelected(item.id);
    select(item.id);
  };
  const deleteStep = (id: string) => {
    const edgeIds = edges
      .filter((edge) => {
        const data = asEdge(local(edge));
        return data.source === id || data.target === id;
      })
      .map((edge) => edge.id);
    change(
      draft.filter((item) => item.id !== id && !edgeIds.includes(item.id)),
    );
    setSelected(null);
    select(null);
  };
  function travel(back: boolean) {
    if (!canEdit || saving) return;
    const source = back ? history : redo,
      entry = source[source.length - 1];
    if (!entry) return;
    const expected = back ? entry.after : entry.before,
      replacement = back ? entry.before : entry.after;
    const changed = Array.from(entry.ids).some(
      (id) =>
        JSON.stringify(draft.find((e) => e.id === id)?.data) !==
        JSON.stringify(expected.find((e) => e.id === id)?.data),
    );
    if (changed) {
      notify(
        "Este cambio tiene una edición posterior. Revisa su estado actual.",
      );
      return;
    }
    if (!dirty) setBaseDraft(copy(remote));
    editSerial.current++;
    setDraft([...draft.filter((e) => !entry.ids.has(e.id)), ...replacement]);
    if (back) {
      setHistory(history.slice(0, -1));
      setRedo((r) => [...r, entry]);
    } else {
      setRedo(redo.slice(0, -1));
      setHistory((h) => [...h, entry]);
    }
    setDirty(true);
  }
  const undo = () => travel(true),
    doRedo = () => travel(false);
  const commit = async () => {
    if (inFlight.current) return;
    const issues = validateMap(draft);
    if (issues.length) {
      notify(issues[0]);
      return;
    }
    const baseById = new Map(baseDraft.map((item) => [item.id, item]));
    const draftById = new Map(draft.map((item) => [item.id, item]));
    const changes: Change[] = draft
      .filter(
        (item) =>
          !baseById.has(item.id) ||
          JSON.stringify(baseById.get(item.id)?.data) !==
            JSON.stringify(item.data),
      )
      .map((item) => ({
        id: item.id,
        kind: item.kind,
        data: item.data,
        expectedRev: baseById.get(item.id)?.rev ?? tombstones[item.id] ?? 0,
      }));
    baseDraft
      .filter((item) => !draftById.has(item.id))
      .forEach((item) =>
        changes.push({
          id: item.id,
          kind: item.kind,
          data: item.data,
          remove: true,
          expectedRev: item.rev,
        }),
      );
    if (!changes.length) {
      setDirty(false);
      return;
    }
    const serial = editSerial.current;
    inFlight.current = true;
    setSaving(true);
    const ok = await apply(changes, "Borrador actualizado desde editor");
    inFlight.current = false;
    setSaving(false);
    if (ok) {
      const deleted = changes
        .filter((item) => item.remove)
        .reduce<
          Record<string, number>
        >((out, item) => ({ ...out, [item.id]: (item.expectedRev ?? 0) + 1 }), {});
      setTombstones((prior) => {
        const next = { ...prior, ...deleted };
        changes
          .filter((item) => !item.remove)
          .forEach((item) => delete next[item.id]);
        return next;
      });
      if (serial === editSerial.current) {
        setDirty(false);
      } else {
        const sent = new Map(changes.map((c) => [c.id, c]));
        setBaseDraft(
          draft.map((e) =>
            sent.has(e.id)
              ? { ...e, rev: (sent.get(e.id)?.expectedRev || 0) + 1 }
              : e,
          ),
        );
      }
    } else {
      setAutoShare(false);
      notify(
        "Cambios en borrador: la compartición automática se pausó para evitar una sobrescritura.",
      );
    }
  };
  useEffect(() => {
    if (!autoShare || !dirty || saving) return;
    const timer = window.setTimeout(() => void commit(), 1100);
    return () => window.clearTimeout(timer);
  }, [autoShare, dirty, draft, saving]);
  const connect = (connection: Connection) => {
    if (connection.source && connection.target)
      upsert({
        id: uid("edge"),
        kind: "edge",
        rev: 0,
        data: {
          source: connection.source,
          target: connection.target,
          type: "sequence",
        },
      });
  };
  const move = (changes: NodeChange[]) => {
    setFlowNodes((current) => applyNodeChanges(changes, current));
    changes.forEach((item) => {
      if (item.type === "position" && item.position && !item.dragging) {
        const source = draft.find((current) => current.id === item.id);
        if (source?.kind === "step")
          upsert({
            ...source,
            data: {
              ...asStep(local(source)),
              x: item.position.x,
              y: item.position.y,
            },
          });
      }
    });
  };
  const align = () =>
    change(
      draft.map((item) => {
        if (item.kind !== "step") return item;
        const index = steps.findIndex((step) => step.id === item.id);
        const data = asStep(local(item));
        return {
          ...item,
          data: {
            ...data,
            x: orientation === "horizontal" ? 110 + index * 230 : 160,
            y:
              orientation === "horizontal"
                ? 160 + (index % 2) * 125
                : 90 + index * 125,
          },
        };
      }),
    );
  const parse = async (file: File) => {
    try {
      const items = readMap(await file.text());
      setPreview(items);
      setPreviewErrors(validateMap(items));
    } catch (err) {
      notify(err instanceof Error ? err.message : "Archivo incompatible");
    }
  };
  const importCopy = async () => {
    if (!preview || previewErrors.length) return;
    if (await studio.createCopy("Copia importada · " + board.title, preview)) {
      setPreview(null);
      notify("Copia importada creada.");
    }
  };
  const loadRevision = async (id: string) => {
    setBaseId(id);
    if (!id) {
      setRevisionBase(null);
      return;
    }
    try {
      const response = await api<{
        revision: { snapshot: { entities: Entity[] } };
      }>(`/revisions/${id}`);
      setRevisionBase(response.revision.snapshot.entities);
    } catch {
      notify("No se pudo cargar la revisión.");
    }
  };
  const addComment = async () => {
    if (!selectedStep || !comment.trim() || studio.role === "reader") return;
    const item = {
      id: uid("comment"),
      kind: "comment",
      rev: 0,
      data: {
        stepId: selectedStep.id,
        text: comment.trim(),
        authorId: user.id,
        author: user.name,
        createdAt: new Date().toISOString(),
        resolved: false,
      },
    };
    if (canEdit) {
      upsert(item);
      setComment("");
    } else if (await apply([item], "Comentario publicado")) setComment("");
  };
  const nodes: Node[] = useMemo(
    () =>
      steps
        .filter((item) =>
          asStep(local(item))
            .title.toLowerCase()
            .includes(filter.toLowerCase()),
        )
        .map((item) => {
          const data = asStep(local(item));
          return {
            id: item.id,
            position: { x: data.x, y: data.y },
            data: { label: <Card item={item} /> },
            style: {
              width: 190,
              borderRadius: 12,
              border:
                selected === item.id
                  ? "2px solid #2165ff"
                  : "1px solid #dce5f2",
              background: "#fff",
            },
          };
        }),
    [filter, selected, steps],
  );
  useEffect(() => setFlowNodes(nodes), [draft, filter, selected]);
  const flowEdges: Edge[] = edges.map((item) => {
    const data = asEdge(local(item));
    return {
      id: item.id,
      source: data.source,
      target: data.target,
      label: data.label,
      style: { stroke: "#5b6c87" },
    };
  });
  return (
    <section className="ed-workbench flex h-full min-h-0 flex-col bg-[#f7f9fd] text-[#0e2a6b]">
      <header className="flex flex-wrap items-center gap-2 border-b border-[#dce5f2] bg-white px-4 py-3">
        <div className="mr-auto">
          <b className="text-sm">Mapa de proceso</b>
          <p className="text-xs text-[#5b6c87]">
            {steps.length} pasos · {edges.length} conexiones ·{" "}
            {saving
              ? "compartiendo…"
              : dirty
                ? "borrador con cambios"
                : "guardado"}
          </p>
        </div>
        <label className="flex items-center gap-1 text-xs text-[#5b6c87]">
          <input
            type="checkbox"
            checked={autoShare}
            onChange={(event) => setAutoShare(event.target.checked)}
          />
          Compartir automáticamente
        </label>
        <input
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Buscar paso"
          className="h-9 rounded-lg border border-[#dce5f2] px-3 text-sm"
        />
        <button
          disabled={!canEdit}
          onClick={() => create()}
          className="btn-primary"
        >
          <Plus size={16} />
          Actividad
        </button>
        <button
          disabled={!canEdit}
          onClick={() => create("decision")}
          className="btn-secondary"
        >
          <GitCompareArrows size={16} />
          Decisión
        </button>
        <button
          disabled={!canEdit || !dirty || saving}
          onClick={() => void commit()}
          className="btn-primary"
        >
          <Save size={15} />
          Guardar
        </button>
        <button
          disabled={!history.length}
          onClick={undo}
          className="btn-secondary"
        >
          Deshacer
        </button>
        <button
          disabled={!redo.length}
          onClick={doRedo}
          className="btn-secondary"
        >
          Rehacer
        </button>
      </header>
      <nav className="flex gap-1 border-b border-[#dce5f2] bg-white px-4 py-2">
        {(["canvas", "table", "chain", "compare"] as View[]).map((item) => (
          <button
            key={item}
            onClick={() => setView(item)}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${view === item ? "bg-[#e9f0ff] text-[#2165ff]" : "text-[#5b6c87]"}`}
          >
            {
              {
                canvas: "Lienzo",
                table: "Tabla",
                chain: "Carriles",
                compare: "Comparar",
              }[item]
            }
          </button>
        ))}
        <button
          className="btn-secondary ml-auto"
          aria-expanded={inspector}
          onClick={() => setInspector(!inspector)}
        >
          {inspector ? "Ocultar panel" : "Abrir panel"}
        </button>
        <span className="inline-flex items-center gap-1 text-xs text-[#5b6c87]">
          <Users size={14} />
          {Math.max(presence.length, 1)} en línea
        </span>
      </nav>
      <div className="flex min-h-0 flex-1">
        <main className="min-w-0 flex-1 p-4">
          {view === "canvas" && (
            <div
              onPointerMove={(e) => {
                const point = flow.current?.screenToFlowPosition({
                  x: e.clientX,
                  y: e.clientY,
                });
                if (point) pointer(point.x, point.y);
              }}
              className="ed-canvas relative h-full min-h-[520px] overflow-hidden rounded-xl border border-[#dce5f2] bg-[radial-gradient(circle_at_top,#e9f0ff,white_48%)]"
            >
              <div className="absolute z-10 m-3">
                <button
                  className="btn-secondary"
                  disabled={!canEdit}
                  onClick={() => setLayoutPreview(!layoutPreview)}
                >
                  <AlignHorizontalSpaceAround size={15} />
                  Organizar
                </button>
                {layoutPreview && (
                  <div className="ed-layout">
                    <label>
                      Orientación{" "}
                      <select
                        value={orientation}
                        onChange={(e) =>
                          setOrientation(e.target.value as typeof orientation)
                        }
                      >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                      </select>
                    </label>
                    <div className={"ed-layout-sketch " + orientation}>
                      {steps.slice(0, 4).map((n) => (
                        <span key={n.id}>{n.data.title}</span>
                      ))}
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => {
                        align();
                        setLayoutPreview(false);
                      }}
                    >
                      Aplicar al lienzo
                    </button>
                  </div>
                )}
              </div>
              <ReactFlow
                onInit={(v) => {
                  flow.current = v;
                }}
                nodes={flowNodes}
                edges={flowEdges}
                nodesDraggable={canEdit}
                nodesConnectable={canEdit}
                onPaneClick={() => {
                  setSelected(null);
                  select(null);
                }}
                onConnect={canEdit ? connect : undefined}
                onNodesChange={move}
                onNodeClick={(_, node) => {
                  setInspector(true);
                  setSelected(node.id);
                  select(node.id);
                }}
                minZoom={0.08}
                fitView
              >
                <Background gap={24} color="#dce5f2" />
                <Cursors />
                <Controls />
                <MiniMap nodeColor="#2165ff" />
              </ReactFlow>
            </div>
          )}
          {view === "table" && (
            <Table
              steps={steps}
              lanes={lanes}
              selected={selected}
              onSelect={(id) => {
                setInspector(true);
                setSelected(id);
                select(id);
              }}
            />
          )}
          {view === "chain" && (
            <Chain steps={steps} lanes={lanes} orientation={orientation} />
          )}{" "}
          {view === "compare" && (
            <Compare
              base={revisionBase}
              current={draft}
              revisions={revisions}
              value={baseId}
              onLoad={loadRevision}
            />
          )}
        </main>
        {inspector && (
          <>
            <div
              className="ed-grip"
              role="separator"
              aria-orientation="vertical"
              aria-label="Ancho del panel"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft" || e.key === "ArrowRight")
                  setPanelWidth((w) =>
                    Math.min(
                      500,
                      Math.max(230, w + (e.key === "ArrowLeft" ? 16 : -16)),
                    ),
                  );
              }}
              onPointerDown={(e) =>
                e.currentTarget.setPointerCapture(e.pointerId)
              }
              onPointerMove={(e) => {
                if (e.currentTarget.hasPointerCapture(e.pointerId))
                  setPanelWidth(
                    Math.min(500, Math.max(230, innerWidth - e.clientX)),
                  );
              }}
            />
            <aside
              className="ed-inspector shrink-0 overflow-y-auto bg-white p-4"
              style={{ width: panelWidth }}
            >
              <div className="ed-panel-top">
                <button
                  onClick={() => {
                    setSelected(null);
                    select(null);
                  }}
                >
                  Herramientas
                </button>
                <button
                  aria-label="Cerrar panel del mapa"
                  onClick={() => setInspector(false)}
                >
                  ×
                </button>
              </div>
              {canEdit && !selectedStep && (
                <details className="ed-lanes st-card">
                  <summary>Carriles del proceso ({lanes.length})</summary>
                  {lanes.map((l) => (
                    <label className="st-field" key={l.id}>
                      Carril
                      <input
                        defaultValue={l.data.name}
                        onBlur={(e) => {
                          if (
                            e.target.value.trim() &&
                            e.target.value !== l.data.name
                          )
                            upsert({
                              ...l,
                              data: { ...l.data, name: e.target.value.trim() },
                            });
                        }}
                      />
                    </label>
                  ))}
                  <label className="st-field">
                    Nuevo carril
                    <input
                      value={laneName}
                      onChange={(e) => setLaneName(e.target.value)}
                    />
                  </label>
                  <button
                    className="btn-secondary"
                    disabled={!laneName.trim()}
                    onClick={() => {
                      upsert({
                        id: uid("lane"),
                        kind: "lane",
                        data: { name: laneName.trim(), color: "#376cad" },
                        rev: 0,
                      });
                      setLaneName("");
                    }}
                  >
                    Crear carril
                  </button>
                </details>
              )}
              {canEdit && selectedStep && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    const n = {
                      ...selectedStep,
                      id: uid("step"),
                      rev: 0,
                      data: {
                        ...selectedStep.data,
                        title: selectedStep.data.title + " (copia)",
                        x: Number(selectedStep.data.x) + 40,
                        y: Number(selectedStep.data.y) + 80,
                      },
                    };
                    upsert(n);
                    setSelected(n.id);
                    select(n.id);
                  }}
                >
                  Duplicar actividad
                </button>
              )}
              {recoverOriginal(draft) && (
                <button
                  className="btn-secondary"
                  onClick={() =>
                    saveFile(
                      "proceso-clasico.json",
                      JSON.stringify(recoverOriginal(draft), null, 2),
                      "application/json",
                    )
                  }
                >
                  Exportar copia clásica
                </button>
              )}
              {selectedStep ? (
                <Inspector
                  item={selectedStep}
                  lanes={lanes}
                  objectives={objectives}
                  factors={factors}
                  members={members}
                  comments={draft.filter(
                    (item) =>
                      item.kind === "comment" &&
                      item.data.stepId === selectedStep.id,
                  )}
                  comment={comment}
                  onComment={setComment}
                  onAdd={addComment}
                  onNavigate={(id) => studio.navigate("vdc", id)}
                  onPatch={(patch) =>
                    upsert({
                      ...selectedStep,
                      data: { ...asStep(local(selectedStep)), ...patch },
                    })
                  }
                  onDelete={() => deleteStep(selectedStep.id)}
                />
              ) : (
                <Tools
                  onTemplate={async (id) => {
                    const t = launchTemplates.find((t) => t.id === id);
                    if (t && canEdit)
                      await studio.createCopy(
                        t.name,
                        createTemplateEntities(id),
                      );
                  }}
                  onExport={(type) => {
                    if (type === "json")
                      saveFile(
                        "proceso-v2.json",
                        JSON.stringify(
                          { schemaVersion: 2, entities: draft },
                          null,
                          2,
                        ),
                        "application/json",
                      );
                    if (type === "mermaid")
                      saveFile("proceso.mmd", mermaid(draft));
                    if (type === "markdown")
                      saveFile(
                        "proceso.md",
                        "# Mapa de proceso\n\n" +
                          steps
                            .map((item) => `- ${asStep(local(item)).title}`)
                            .join("\n"),
                      );
                  }}
                  onImport={parse}
                />
              )}
            </aside>
          </>
        )}
      </div>
      {preview && (
        <ImportModal
          count={preview.length}
          errors={previewErrors}
          onCancel={() => setPreview(null)}
          onConfirm={() => void importCopy()}
        />
      )}
    </section>
  );
}

function Card({ item }: { item: Entity }) {
  const data = asStep(local(item));
  return (
    <div className="p-2.5">
      <span className="text-[10px] font-bold uppercase text-[#2165ff]">
        {data.type}
      </span>
      <p className="mt-1 text-sm font-semibold">{data.title}</p>
      <p className="mt-1 text-xs text-[#5b6c87]">
        {data.owner || "Sin asignar"}
        {data.groupId ? ` · ${data.groupId}` : ""}
      </p>
    </div>
  );
}
function Cursors() {
  const s = useStudio(),
    v = useViewport();
  return (
    <>
      {s.presence
        .filter((p) => p.userId !== s.user.id && p.view === "mapa" && p.cursor)
        .map((p) => (
          <span
            key={p.userId}
            className="ed-peer"
            style={{
              left: p.cursor!.x * v.zoom + v.x,
              top: p.cursor!.y * v.zoom + v.y,
            }}
          >
            ↖ {p.name}
          </span>
        ))}
    </>
  );
}
function Table({
  steps,
  lanes,
  selected,
  onSelect,
}: {
  steps: Entity[];
  lanes: Entity[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className={`${box} overflow-auto`}>
      <table className="min-w-full text-left text-sm">
        <thead className="bg-[#f7f9fd] text-xs uppercase text-[#5b6c87]">
          <tr>
            <th className="p-3">Paso</th>
            <th>Carril</th>
            <th>Responsable</th>
            <th>Objetivo</th>
          </tr>
        </thead>
        <tbody>
          {steps.map((item) => {
            const data = asStep(local(item));
            return (
              <tr
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`cursor-pointer border-t border-[#eef2f8] ${selected === item.id ? "bg-[#e9f0ff]" : ""}`}
              >
                <td className="p-3 font-semibold">{data.title}</td>
                <td>
                  {String(
                    lanes.find((lane) => lane.id === data.laneId)?.data.name ??
                      "Sin carril",
                  )}
                </td>
                <td>{data.owner || "Sin asignar"}</td>
                <td>{data.objectiveId ? "Vinculado" : "Pendiente"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Chain({
  steps,
  lanes,
  orientation,
}: {
  steps: Entity[];
  lanes: Entity[];
  orientation: "horizontal" | "vertical";
}) {
  const [closed, setClosed] = useState<string[]>([]);
  return (
    <div
      className={
        orientation === "horizontal" ? "grid gap-3 lg:grid-cols-2" : "space-y-3"
      }
    >
      {lanes.map((lane) => {
        const collapsed = closed.includes(lane.id);
        return (
          <div key={lane.id} className={`${box} p-4`}>
            <button
              className="flex w-full items-center justify-between text-left"
              onClick={() =>
                setClosed((ids) =>
                  collapsed
                    ? ids.filter((id) => id !== lane.id)
                    : [...ids, lane.id],
                )
              }
            >
              <b>{String(lane.data.name)}</b>
              <span className="text-xs text-[#5b6c87]">
                {collapsed ? "Desplegar" : "Plegar"}
              </span>
            </button>
            {!collapsed && (
              <div className="mt-3 flex flex-wrap gap-2">
                {steps
                  .filter((step) => asStep(local(step)).laneId === lane.id)
                  .map((step) => (
                    <span
                      key={step.id}
                      className="rounded-lg border border-[#dce5f2] bg-[#f7f9fd] px-3 py-2 text-sm"
                    >
                      {asStep(local(step)).title}
                    </span>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function Compare({
  base,
  current,
  revisions,
  value,
  onLoad,
}: {
  base: Entity[] | null;
  current: Entity[];
  revisions: Revision[];
  value: string;
  onLoad: (id: string) => void;
}) {
  const old = new Map((base ?? []).map((item) => [item.id, item]));
  const changed = [
    ...current
      .filter(
        (e) => JSON.stringify(old.get(e.id)?.data) !== JSON.stringify(e.data),
      )
      .map((e) => ({
        id: e.id,
        title: e.data.title || e.data.label || e.id,
        status: old.has(e.id) ? "Modificado" : "Añadido",
      })),
    ...(base || [])
      .filter((e) => !current.some((item) => item.id === e.id))
      .map((e) => ({
        id: e.id,
        title: e.data.title || e.id,
        status: "Retirado",
      })),
  ];
  return (
    <div className={`${box} p-5`}>
      <label className="text-sm font-bold">
        Revisión de referencia
        <select
          value={value}
          onChange={(event) => void onLoad(event.target.value)}
          className="mt-2 block w-full rounded-lg border border-[#dce5f2] p-2"
        >
          <option value="">Elegir revisión publicada</option>
          {revisions.map((revision) => (
            <option key={revision.id} value={revision.id}>
              {revision.description || revision.id}
            </option>
          ))}
        </select>
      </label>
      {base && (
        <ul className="mt-5 space-y-2">
          {changed.map((item) => (
            <li key={item.id} className="rounded-lg bg-[#f7f9fd] p-3 text-sm">
              <b>{item.status}</b> · {item.title}
            </li>
          ))}
          {!changed.length && (
            <li className="text-sm text-[#5b6c87]">Sin diferencias.</li>
          )}
        </ul>
      )}
    </div>
  );
}
function Inspector({
  item,
  lanes,
  objectives,
  factors,
  members,
  comments,
  comment,
  onComment,
  onAdd,
  onNavigate,
  onPatch,
  onDelete,
}: {
  item: Entity;
  lanes: Entity[];
  objectives: Entity[];
  factors: Entity[];
  members: { userId: string; name: string; role: string }[];
  comments: Entity[];
  comment: string;
  onComment: (value: string) => void;
  onAdd: () => void;
  onNavigate: (id: string) => void;
  onPatch: (patch: Partial<StepData>) => void;
  onDelete: () => void;
}) {
  const data = asStep(local(item));
  return (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase text-[#2165ff]">
        Inspector · borrador local
      </p>
      <Field
        label="Título"
        value={data.title}
        onChange={(title) => onPatch({ title })}
      />
      <Select
        label="Responsable"
        value={data.owner || ""}
        onChange={(owner) => onPatch({ owner })}
        items={[
          { id: "", name: "Sin asignar" },
          ...members.map((member) => ({
            id: member.name,
            name: `${member.name} · ${member.role}`,
          })),
        ]}
      />
      <Select
        label="Carril"
        value={data.laneId}
        onChange={(laneId) => onPatch({ laneId })}
        items={lanes.map((lane) => ({
          id: lane.id,
          name: String(lane.data.name),
        }))}
      />
      <Select
        label="Objetivo VDC"
        value={data.objectiveId || ""}
        onChange={(objectiveId) =>
          onPatch({ objectiveId: objectiveId || undefined })
        }
        items={[
          { id: "", name: "Sin vínculo" },
          ...objectives.map((objective) => ({
            id: objective.id,
            name: String(objective.data.title || objective.data.name),
          })),
        ]}
      />
      <Select
        label="Factor controlable"
        value={data.factorId || ""}
        onChange={(factorId) => onPatch({ factorId: factorId || undefined })}
        items={[
          { id: "", name: "Sin vínculo" },
          ...factors.map((factor) => ({
            id: factor.id,
            name: String(factor.data.title || factor.data.name),
          })),
        ]}
      />
      <div className="flex gap-2 text-xs">
        {data.objectiveId && (
          <button
            className="text-[#2165ff] underline"
            onClick={() => onNavigate(data.objectiveId!)}
          >
            Ver objetivo
          </button>
        )}
        {data.factorId && (
          <button
            className="text-[#2165ff] underline"
            onClick={() => onNavigate(data.factorId!)}
          >
            Ver factor
          </button>
        )}
      </div>
      <Field
        label="Grupo"
        value={data.groupId || ""}
        onChange={(groupId) => onPatch({ groupId: groupId || undefined })}
      />
      <Field
        label="Evidencia"
        value={data.evidence || ""}
        onChange={(evidence) => onPatch({ evidence })}
      />
      <section className="border-t border-[#dce5f2] pt-4">
        <p className="text-sm font-bold">Conversación</p>
        {comments.map((entry) => (
          <p
            key={entry.id}
            className="mt-2 rounded-lg bg-[#f7f9fd] p-2 text-xs"
          >
            <b>{String(entry.data.author)}</b> · {String(entry.data.text)}
          </p>
        ))}
        <textarea
          value={comment}
          onChange={(event) => onComment(event.target.value)}
          placeholder="Comentar o pedir una acción"
          className="mt-2 w-full rounded-lg border border-[#dce5f2] p-2 text-sm"
        />
        <button onClick={onAdd} className="btn-primary mt-2">
          <Send size={14} />
          Publicar
        </button>
      </section>
      <button
        onClick={onDelete}
        className="inline-flex items-center gap-1 text-sm font-semibold text-red-600"
      >
        <Trash2 size={15} />
        Eliminar paso y conexiones
      </button>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-[#5b6c87]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[#dce5f2] p-2 text-sm"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  items,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: string; name: string }[];
}) {
  return (
    <label className="block text-xs font-semibold text-[#5b6c87]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-[#dce5f2] p-2 text-sm"
      >
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
function Tools({
  onTemplate,
  onExport,
  onImport,
}: {
  onTemplate: (id: string) => void;
  onExport: (type: "json" | "mermaid" | "markdown") => void;
  onImport: (file: File) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase text-[#2165ff]">Plantillas</p>
      <div className="mt-3 space-y-2">
        {launchTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onTemplate(template.id)}
            className="w-full rounded-lg border border-[#dce5f2] p-3 text-left hover:border-[#2165ff]"
          >
            <b className="text-sm">{template.name}</b>
            <span className="mt-1 block text-xs text-[#5b6c87]">
              {template.description}
            </span>
          </button>
        ))}
      </div>
      <section className="mt-5 border-t border-[#dce5f2] pt-4">
        <p className="text-sm font-bold">Exportar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {(["json", "mermaid", "markdown"] as const).map((type) => (
            <button
              key={type}
              onClick={() => onExport(type)}
              className="btn-secondary"
            >
              <Download size={14} />
              {type}
            </button>
          ))}
        </div>
        <label className="btn-secondary mt-3 inline-flex cursor-pointer">
          <Upload size={14} />
          Importar en copia
          <input
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) =>
              event.target.files?.[0] && onImport(event.target.files[0])
            }
          />
        </label>
      </section>
    </div>
  );
}
function ImportModal({
  count,
  errors,
  onCancel,
  onConfirm,
}: {
  count: number;
  errors: string[];
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#040f20]/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold">Previsualizar importación</h2>
        <p className="mt-2 text-sm text-[#5b6c87]">
          {count} entidades se importarán en una copia nueva.
        </p>
        {errors.length ? (
          <ul className="mt-3 space-y-1 text-sm text-red-700">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-1 text-sm text-green-700">
            <CheckCircle2 size={16} />
            Referencias verificadas.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <button className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            disabled={!!errors.length}
            className="btn-primary"
            onClick={onConfirm}
          >
            Crear copia
          </button>
        </div>
      </div>
    </div>
  );
}
