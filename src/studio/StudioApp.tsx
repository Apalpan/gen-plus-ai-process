import { isCloud } from "./platform";
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  LayoutDashboard,
  Target,
  Workflow,
  Network,
  Factory,
  Presentation,
  BarChart3,
  AudioLines,
  Bot,
  Users,
  PanelLeftClose,
  Menu,
  ChevronDown,
  LogOut,
  ArrowLeft,
  RefreshCw,
  Check,
  Plus,
} from "lucide-react";
import Entry from "./Entry";
import { BoardCreator, prefabricated } from "./Overview";
import ManagementDashboard from "./ManagementDashboard";
import {
  StudioContext,
  api,
  ApiError,
  uid,
  type Board,
  type Entity,
  type Member,
  type Change,
  type Presence,
  type User,
  type View,
} from "./shared";
import "./studio.css";
const Editor = lazy(() =>
  import("./editor/Editor").then((m) => ({ default: m.Editor })),
);
const Vdc = lazy(() =>
  import("./vdc/VdcView").then((m) => ({ default: m.VdcView })),
);
const Ice = lazy(() => import("./Ice"));
const Agents = lazy(() => import("./Agents"));
const Team = lazy(() => import("./Team"));
type Space = {
  id: string;
  name: string;
  role: string;
  boards: { id: string; title: string }[];
};
type Pending = {
  changes: Change[];
  key: string;
  boardId: string;
  userId: string;
};
const nav = [
  ["inicio", "Dashboard", LayoutDashboard],
  ["objetivos", "Objetivos", Target],
  ["vdc", "Framework BDC", Network],
  ["mapa", "Mapa de proceso", Workflow],
  ["produccion", "Producción", Factory],
  ["gerencia", "Gerencial", Presentation],
  ["operacion", "Operativo", BarChart3],
  ["ice", "Sesiones ICE", AudioLines],
  ["agentes", "Asistentes", Bot],
  ["equipo", "Equipo y revisiones", Users],
] as const;
const normalized = (b: any): Board => ({
  ...b,
  revision: b.revision ?? b.boardRev ?? 0,
});
function pendingKey(user: string, board: string) {
  return "ai-process-pending:" + user + ":" + board;
}
function getPending(user: string, board: string): Pending | null {
  try {
    return JSON.parse(
      sessionStorage.getItem(pendingKey(user, board)) || "null",
    );
  } catch {
    return null;
  }
}
export default function StudioApp() {
  const [user, setUser] = useState<User | null>(null),
    [spaces, setSpaces] = useState<Space[]>([]),
    [board, setBoard] = useState<Board | null>(null),
    [members, setMembers] = useState<Member[]>([]),
    [presence, setPresence] = useState<Presence[]>([]),
    [view, setView] = useState<View>("inicio"),
    [selection, setSelection] = useState<string | null>(null);
  const [ready, setReady] = useState(false),
    [startupError, setStartupError] = useState(""),
    [toast, setToast] = useState(""),
    [rail, setRail] = useState(() => window.innerWidth >= 1000),
    [showTracking, setShowTracking] = useState(true),
    [newOpen, setNewOpen] = useState(false),
    [sync, setSync] = useState("Al día"),
    [retry, setRetry] = useState<Pending | null>(null),
    [conflict, setConflict] = useState(false),
    [published, setPublished] = useState<any>(null);
  const boardRef = useRef(board);
  boardRef.current = board;
  const activeId = useRef(""),
    identity = useRef(""),
    locationInfo = useRef<{
      selection: string | null;
      cursor: { x: number; y: number } | null;
      view: View;
    }>({ selection: null, cursor: null, view: "inicio" });
  locationInfo.current.selection = selection;
  locationInfo.current.view = view;
  useEffect(() => {
    document.querySelector(".st-work")?.scrollTo(0, 0);
  }, [view, board?.id]);
  const init = useRef(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(t);
  }, [toast]);
  function navigate(v: View, id?: string) {
    if (nav.slice(4).some(([key]) => key === v)) setShowTracking(true);
    setView(v);
    if (id !== undefined) setSelection(id);
    if (window.innerWidth < 1000) setRail(false);
  }
  function acceptBoard(b: Board) {
    if (activeId.current !== b.id) return;
    setBoard((old) =>
      old && old.id === b.id && old.revision > b.revision ? old : b,
    );
  }
  async function reloadMembers(b: Board) {
    const data = await api("/workspaces/" + b.workspaceId + "/members");
    if (activeId.current === b.id)
      setMembers(
        data.members.map((m: any) => ({
          userId: m.id ?? m.userId,
          name: m.displayName ?? m.name,
          role: m.role,
          email: m.email,
          discipline: m.discipline,
          jobRole: m.jobRole,
        })),
      );
  }
  async function openBoard(id: string) {
    const data = await api("/boards/" + encodeURIComponent(id));
    const b = normalized(data.board ?? data);
    activeId.current = id;
    setBoard(b);
    boardRef.current = b;
    setSelection(null);
    setPresence([]);
    setMembers([]);
    setConflict(false);
    setRetry(getPending(identity.current, id));
    setSync("Al día");
    const url = new URL(location.href);
    url.searchParams.set("board", id);
    history.replaceState(null, "", url);
    await reloadMembers(b);
  }
  async function createBoard(
    spaceId: string,
    title: string,
    entities: Entity[],
  ) {
    const data = await api("/boards", "POST", {
      workspaceId: spaceId,
      title,
      entities,
    });
    await openBoard(data.board.id);
    const refreshed: Space[] = (await api("/workspaces")).workspaces;
    setSpaces(refreshed);
    return refreshed;
  }
  async function enter(u: User) {
    identity.current = u.id;
    setUser(u);
    setStartupError("");
    const rev = new URLSearchParams(location.search).get("revision");
    if (rev) {
      const d = await api("/revisions/" + encodeURIComponent(rev));
      setPublished(d.revision ?? d);
      return;
    }
    const data = await api("/workspaces");
    let ws: Space[] = data.workspaces;
    if (!ws.length) {
      const { workspace } = await api("/workspaces", "POST", {
        name: u.guest ? "Demo privada" : "Mi equipo",
      });
      ws = [{ ...workspace, boards: [] }];
    }
    const requested = new URLSearchParams(location.search).get("board");
    const available = ws.flatMap((s) => s.boards || []);
    const target = available.find((b) => b.id === requested) || available[0];
    if (target) {
      await openBoard(target.id);
      if (requested && target.id !== requested)
        setToast(
          "El enlace requiere acceso a otro espacio. Abierto tu proceso disponible.",
        );
    } else {
      ws = await createBoard(
        ws[0].id,
        "Producción de prefabricados",
        prefabricated(),
      );
    }
    setSpaces(ws);
    setView("inicio");
  }
  useEffect(() => {
    if (init.current) return;
    init.current = true;
    api("/auth/session")
      .then(async (r) => {
        if (r.user) await enter({ ...r.user, name: r.user.displayName });
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401))
          setStartupError(String(e));
      })
      .finally(() => setReady(true));
  }, []);
  useEffect(() => {
    const id = board?.id;
    if (!id) return;
    let stopped = false,
      running = false,
      count = 0;
    const poll = async () => {
      if (
        stopped ||
        running ||
        activeId.current !== id ||
        document.visibilityState === "hidden"
      )
        return;
      running = true;
      try {
        const p = await api("/boards/" + id + "/presence", "POST", {
          ...locationInfo.current,
          selection: locationInfo.current.selection
            ? [locationInfo.current.selection]
            : [],
        });
        if (stopped) return;
        const list = p.presence ?? p.peers ?? [];
        setPresence(
          list.map((v: any) => ({
            ...v,
            name: v.user?.displayName ?? v.name,
            userId: v.user?.id ?? v.userId,
            selection: Array.isArray(v.selection)
              ? v.selection[0]
              : v.selection,
          })),
        );
        const serverRev = p.revision ?? p.boardRev;
        if (
          serverRev !== boardRef.current?.revision ||
          p.role !== boardRef.current?.role ||
          count % 12 === 0
        ) {
          const r = await api("/boards/" + id);
          if (!stopped) {
            const b = normalized(r.board ?? r);
            acceptBoard(b);
            if (count % 12 === 0) await reloadMembers(b);
          }
        }
        if (!stopped) setSync("Al día");
        count++;
      } catch (e) {
        if (stopped) return;
        if (e instanceof ApiError && [403, 401, 404].includes(e.status)) {
          activeId.current = "";
          setBoard(null);
          setStartupError(
            "La sesión o el acceso al espacio cambió. Vuelve a entrar.",
          );
        } else setSync("Sin conexión");
      } finally {
        running = false;
      }
    };
    void poll();
    const timer = setInterval(poll, isCloud ? 2400 : 700);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [board?.id, tick]);
  useEffect(() => {
    if (!newOpen) return;
    const last = document.activeElement as HTMLElement;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNewOpen(false);
      if (e.key === "Tab") {
        const els = Array.from(
          document.querySelectorAll<HTMLElement>(
            '[role="dialog"] button:not(:disabled),[role="dialog"] input,[role="dialog"] select',
          ),
        );
        if (e.shiftKey && document.activeElement === els[0]) {
          e.preventDefault();
          els[els.length - 1]?.focus();
        } else if (
          !e.shiftKey &&
          document.activeElement === els[els.length - 1]
        ) {
          e.preventDefault();
          els[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      last?.focus();
    };
  }, [newOpen]);
  async function logout() {
    try {
      await api("/auth/logout", "POST", {});
      activeId.current = "";
      location.assign(location.pathname);
    } catch (e) {
      setToast(String(e));
    }
  }
  function remember(p: Pending | null) {
    if (!board) return;
    const key = pendingKey(identity.current, board.id);
    if (p) sessionStorage.setItem(key, JSON.stringify(p));
    else sessionStorage.removeItem(key);
    setRetry(p);
  }
  async function submit(p: Pending, desc?: string) {
    if (p.boardId !== activeId.current || p.userId !== identity.current)
      return false;
    try {
      await api("/boards/" + p.boardId + "/batch", "POST", {
        changes: p.changes,
        idempotencyKey: p.key,
      });
      const r = await api("/boards/" + p.boardId);
      acceptBoard(normalized(r.board ?? r));
      remember(null);
      setConflict(false);
      if (desc) setToast(desc);
      return true;
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        remember(p);
        setConflict(true);
        setToast(
          "Hay una edición simultánea. Tu propuesta está disponible para comparar.",
        );
        setTick((t) => t + 1);
      } else if (
        e instanceof TypeError ||
        (e instanceof ApiError && e.status >= 500)
      ) {
        remember(p);
        setToast(
          "Conexión interrumpida. Conservamos tu cambio en esta pestaña.",
        );
      } else setToast(String(e));
      return false;
    }
  }
  const apply = useCallback(
    async (changes: Change[], desc?: string) => {
      const b = boardRef.current;
      if (!b || !changes.length) return false;
      if (getPending(identity.current, b.id)) {
        setToast("Resuelve primero el cambio pendiente.");
        return false;
      }
      const p = {
        userId: identity.current,
        boardId: b.id,
        key: uid("op"),
        changes: changes.map((c) => ({
          ...c,
          data: c.data || {},
          expectedRev:
            c.expectedRev ?? b.entities.find((e) => e.id === c.id)?.rev ?? 0,
        })),
      };
      return submit(p, desc);
    },
    [board?.id],
  );
  if (!ready) return <div className="st-loading">Abriendo AI Process…</div>;
  if (startupError)
    return (
      <div className="st-loading">
        <p>{startupError}</p>
        <a href={location.pathname}>Volver al inicio</a>
        <button onClick={logout}>Cerrar sesión</button>
      </div>
    );
  if (!user)
    return (
      <Entry
        onUser={async (u) => {
          setReady(false);
          try {
            await enter(u);
          } catch (e) {
            setStartupError(String(e));
          } finally {
            setReady(true);
          }
        }}
      />
    );
  if (published) {
    const snapshot = published.snapshot ?? published.board ?? published;
    return (
      <main className="st-page">
        <a href={location.pathname}>← Inicio</a>
        <h1>Revisión publicada</h1>
        <h2>{snapshot.title}</h2>
        <p>{published.createdAt} · Solo lectura</p>
        {(snapshot.entities || []).map((e: Entity) => (
          <div className="st-row" key={e.id}>
            <strong>{e.data.title || e.data.label || e.id}</strong>
            <small>{e.kind}</small>
          </div>
        ))}
      </main>
    );
  }
  if (!board) return <div className="st-loading">Preparando tu espacio…</div>;
  const space = spaces.find((w) => w.id === board.workspaceId);
  const canEdit = ["owner", "editor"].includes(board.role);
  const createCopy = async (title: string, items: Entity[]) => {
    try {
      await createBoard(board.workspaceId, title, items);
      navigate("mapa");
      return true;
    } catch (e) {
      setToast(String(e));
      return false;
    }
  };
  return (
    <StudioContext.Provider
      value={{
        board,
        entities: board.entities,
        user,
        members,
        role: board.role,
        canEdit,
        apply,
        selection,
        select: setSelection,
        navigate,
        presence,
        pointer: (x, y) => {
          locationInfo.current.cursor = { x, y };
        },
        notify: setToast,
        createCopy,
      }}
    >
      <div className={"st-app " + (rail ? "rail-on" : "rail-off")}>
        <header className="st-top">
          <button
            aria-label={rail ? "Ocultar navegación" : "Abrir navegación"}
            onClick={() => setRail(!rail)}
          >
            {rail ? <PanelLeftClose size={18} /> : <Menu size={18} />}
          </button>
          <div className="st-brand">
            <img alt="GEN+" src={import.meta.env.BASE_URL + "gen-logo.png"} />
            <i />
            <strong>AI Process</strong>
          </div>
          <div className="st-top-right">
            <span className={"st-sync " + (sync === "Al día" ? "" : "offline")}>
              <i />
              {sync}
            </span>
            <button title="Ver equipo" onClick={() => navigate("equipo")}>
              <Users size={15} />
              {Math.max(1, presence.length)}
            </button>
            <span className="st-identity">
              {user.guest
                ? isCloud
                  ? "Demo privada"
                  : "Demo local"
                : user.name}
            </span>
            <button onClick={logout} aria-label="Cerrar sesión">
              <LogOut size={16} />
            </button>
          </div>
        </header>
        {rail && (
          <>
            <button
              className="st-scrim"
              aria-label="Cerrar navegación"
              onClick={() => setRail(false)}
            />
            <aside className="st-rail">
              <p className="st-eyebrow">{space?.name || "ESPACIO"}</p>
              <label className="st-board-choice">
                <Workflow size={15} />
                <select
                  aria-label="Proceso activo"
                  value={board.id}
                  onChange={async (e) => {
                    try {
                      await openBoard(e.target.value);
                      navigate("inicio");
                    } catch (err) {
                      setToast(String(err));
                    }
                  }}
                >
                  {spaces.map((w) => (
                    <optgroup key={w.id} label={w.name}>
                      {w.boards.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.title}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={13} />
              </label>
              <nav>
                {nav.slice(0, 4).map(([key, title, Icon]) => (
                  <button
                    key={key}
                    aria-current={view === key ? "page" : undefined}
                    className={view === key ? "active" : ""}
                    onClick={() => navigate(key)}
                  >
                    <Icon size={17} />
                    {title}
                  </button>
                ))}
                <button
                  className="st-nav-disclosure"
                  aria-expanded={showTracking}
                  aria-controls="tracking-nav"
                  onClick={() => setShowTracking(!showTracking)}
                >
                  Seguimiento y equipo <ChevronDown size={14} />
                </button>
                {showTracking && (
                  <div id="tracking-nav">
                    {nav.slice(4).map(([key, title, Icon]) => (
                      <button
                        key={key}
                        aria-current={view === key ? "page" : undefined}
                        className={view === key ? "active" : ""}
                        onClick={() => navigate(key)}
                      >
                        <Icon size={17} />
                        {title}
                      </button>
                    ))}
                  </div>
                )}
              </nav>
              <div className="st-rail-foot">
                {canEdit && (
                  <button onClick={() => setNewOpen(true)}>
                    <Plus size={16} />
                    Nuevo proceso
                  </button>
                )}
                <a href="?legacy">
                  <ArrowLeft size={14} />
                  Editor clásico
                </a>
              </div>
            </aside>
          </>
        )}
        <main
          className={"st-work " + (view === "mapa" ? "st-canvas-work" : "")}
          key={board.id}
        >
          <Suspense
            fallback={<div className="st-loading">Abriendo vista…</div>}
          >
            {view === "inicio" ? (
              <ManagementDashboard
                workspace={space?.name || "Mi espacio"}
                newBoard={() => setNewOpen(true)}
                openMap={async (id) => {
                  try {
                    if (id !== board.id) await openBoard(id);
                    navigate("mapa");
                  } catch (error) {
                    setToast(String(error));
                  }
                }}
              />
            ) : view === "mapa" ? (
              <Editor />
            ) : view === "ice" ? (
              <Ice />
            ) : view === "agentes" ? (
              <Agents />
            ) : view === "equipo" ? (
              <Team reload={() => reloadMembers(board)} />
            ) : (
              <Vdc mode={view} />
            )}
          </Suspense>
        </main>
        {newOpen && (
          <BoardCreator
            close={() => setNewOpen(false)}
            create={async (n, es) => {
              try {
                await createBoard(board.workspaceId, n, es);
                navigate("mapa");
              } catch (e) {
                setToast(String(e));
                throw e;
              }
            }}
          />
        )}
        {retry && (
          <aside className="st-pending">
            <strong>
              {conflict ? "Conflicto de revisión" : "Cambio pendiente"}
            </strong>
            <details>
              <summary>Comparar cambios</summary>
              <pre>
                {JSON.stringify(
                  retry.changes.map((c) => ({
                    propuesta: c.data,
                    confirmado: board.entities.find((e) => e.id === c.id)?.data,
                  })),
                  null,
                  2,
                )}
              </pre>
            </details>
            <button
              onClick={() => {
                const p = conflict
                  ? {
                      ...retry,
                      key: uid("op"),
                      changes: retry.changes.map((c) => ({
                        ...c,
                        expectedRev:
                          board.entities.find((e) => e.id === c.id)?.rev ?? 0,
                      })),
                    }
                  : retry;
                void submit(p);
              }}
            >
              <RefreshCw size={14} />
              {conflict ? "Aplicar mi versión" : "Reintentar"}
            </button>
            <button
              onClick={() => {
                remember(null);
                setConflict(false);
              }}
            >
              Conservar estado confirmado
            </button>
          </aside>
        )}
        {toast && (
          <div className="st-toast" role="status">
            <Check size={15} />
            {toast}
            <button aria-label="Cerrar aviso" onClick={() => setToast("")}>
              ×
            </button>
          </div>
        )}
      </div>
    </StudioContext.Provider>
  );
}
