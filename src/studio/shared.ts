import { createContext, useContext, type MutableRefObject } from "react";

export type Entity = {
  id: string;
  kind: string;
  data: Record<string, any>;
  rev: number;
};
export type Change = {
  id: string;
  kind: string;
  data?: Record<string, any>;
  remove?: boolean;
  expectedRev?: number;
};
export type View =
  | "inicio"
  | "objetivos"
  | "mapa"
  | "vdc"
  | "gerencia"
  | "operacion"
  | "produccion"
  | "ice"
  | "agentes"
  | "equipo";
export type User = {
  id: string;
  name: string;
  email?: string;
  guest?: boolean;
  discipline?: string;
  jobRole?: string;
};
export type Member = {
  userId: string;
  name: string;
  role: string;
  email?: string;
  jobRole?: string;
  discipline?: string;
};
export type Presence = {
  userId: string;
  name: string;
  cursor?: { x: number; y: number } | null;
  selection?: string | null;
  view?: string;
};
export type Board = {
  id: string;
  title: string;
  workspaceId: string;
  revision: number;
  role: string;
  entities: Entity[];
};
export type Studio = {
  board: Board;
  entities: Entity[];
  user: User;
  role: string;
  canEdit: boolean;
  members: Member[];
  apply: (changes: Change[], description?: string) => Promise<boolean>;
  flushMap: MutableRefObject<(() => Promise<boolean>) | null>;
  selection: string | null;
  select: (id: string | null) => void;
  navigate: (view: View, id?: string) => void;
  presence: Presence[];
  pointer: (x: number, y: number) => void;
  notify: (message: string) => void;
  createCopy: (title: string, entities: Entity[]) => Promise<boolean>;
};
export const StudioContext = createContext<Studio | null>(null);
export function useStudio() {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("Falta contexto del espacio");
  return ctx;
}
export class ApiError extends Error {
  constructor(
    public status: number,
    public body: Record<string, any>,
  ) {
    super(body.message || body.error || body.code || "Error de conexión");
  }
}
export async function api<T = any>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const payload = body === undefined ? undefined : JSON.stringify(body);
  const response = await fetch("/api" + path, {
    method,
    credentials: "same-origin",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: payload,
    keepalive:
      method === "POST" &&
      path.endsWith("/batch") &&
      payload !== undefined &&
      new Blob([payload]).size < 48 * 1024,
  });
  if (response.status === 204) return undefined as T;
  const data = await response
    .json()
    .catch(() => ({ message: "El servidor no está disponible." }));
  if (!response.ok || data.message === "El servidor no está disponible.")
    throw new ApiError(response.status, data);
  return data;
}
export const uid = (prefix: string) => prefix + "-" + crypto.randomUUID();
