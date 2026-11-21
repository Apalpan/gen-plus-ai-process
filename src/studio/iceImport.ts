import type { Change, Entity } from "./shared";
export type IceItem = {
  externalId: string;
  kind: string;
  title: string;
  owner: string;
  due: string;
  source: string;
};
export type IceDocument = {
  externalId: string;
  title: string;
  items: IceItem[];
  fingerprint: string;
};
export const sampleActa = JSON.stringify(
  {
    externalId: "DEMO-ICE-01",
    schemaVersion: 1,
    title: "DATO_DEMO · Liberación del lote de fachada",
    items: [
      {
        id: "D1",
        type: "decisión",
        title: "Liberar el despiece tras validar anclajes",
        source: "Acta demo · tema 1",
      },
      {
        id: "C1",
        type: "compromiso",
        title: "Verificar interfaces del lote antes de emitir a fábrica",
        owner: "Coordinación BIM",
        due: "2026-11-27",
        source: "Acta demo · acuerdo 2",
      },
      {
        id: "R1",
        type: "restricción",
        title: "Pendiente confirmación de ventana de izaje",
        source: "Acta demo · tema 3",
      },
    ],
  },
  null,
  2,
);
const kinds: Record<string, string> = {
  decisión: "ice-decision",
  decision: "ice-decision",
  restricción: "ice-restriction",
  restriccion: "ice-restriction",
  compromiso: "ice-action",
  acción: "ice-action",
  acuerdo: "ice-action",
  action: "ice-action",
};
async function digest(text: string) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)),
    ),
    (v) => v.toString(16).padStart(2, "0"),
  ).join("");
}
export async function parseActa(
  raw: string,
  key: string,
): Promise<IceDocument> {
  const text = raw.trim();
  if (!text || text.length > 64000)
    throw Error("Ingresa un acta de hasta 64 000 caracteres.");
  let externalId = key.trim(),
    title = key.trim(),
    items: IceItem[] = [];
  if (text.startsWith("{")) {
    const obj = JSON.parse(text);
    if (obj.schemaVersion !== undefined && obj.schemaVersion !== 1)
      throw Error("Versión de acta no compatible.");
    externalId = String(obj.externalId || key).trim();
    title = String(obj.title || externalId);
    if (!Array.isArray(obj.items)) throw Error("El JSON debe incluir items.");
    items = obj.items.map((i: any, index: number) => {
      const kind = kinds[String(i.type).toLowerCase()];
      if (!kind || !i.title || !i.id)
        throw Error("Cada tema requiere id, type y title.");
      return {
        externalId: String(i.id),
        kind,
        title: String(i.title),
        owner: String(i.owner || ""),
        due: String(i.due || ""),
        source: String(i.source || "Tema " + (index + 1)),
      };
    });
  } else {
    if (!externalId)
      throw Error("Asigna una referencia estable al acta de texto.");
    items = text.split(/\r?\n/).flatMap((line, n) => {
      const m = line
        .trim()
        .match(
          /^(decisi[oó]n|restricci[oó]n|acuerdo|compromiso|acci[oó]n)\s*:\s*(.+)$/i,
        );
      return m
        ? [
            {
              externalId: "L" + (n + 1),
              kind: kinds[m[1].toLowerCase()] || "ice-action",
              title: m[2],
              owner: "",
              due: "",
              source: "Línea " + (n + 1) + " · " + line.trim(),
            },
          ]
        : [];
    });
  }
  if (
    !externalId ||
    !items.length ||
    items.length > 100 ||
    new Set(items.map((i) => i.externalId)).size !== items.length
  )
    throw Error(
      "Se requiere referencia de acta y entre 1 y 100 temas con IDs únicos. Para texto usa «Acuerdo: …», «Decisión: …» o «Restricción: …».",
    );
  return { externalId, title, items, fingerprint: await digest(text) };
}
export async function importChanges(
  doc: IceDocument,
  entities: Entity[],
): Promise<Change[]> {
  const prefix = "ice-" + (await digest(doc.externalId)).slice(0, 24);
  const old = entities.find((e) => e.id === prefix);
  if (old?.data.fingerprint === doc.fingerprint) return [];
  const version = Number(old?.data.version || 0) + 1;
  const changes: Change[] = [
    {
      id: prefix,
      kind: "ice-session",
      expectedRev: old?.rev || 0,
      data: {
        ...old?.data,
        title: doc.title,
        externalId: doc.externalId,
        schemaVersion: 1,
        fingerprint: doc.fingerprint,
        version,
        status: "revisión",
        source: "Importación local",
        itemCount: doc.items.length,
      },
    },
  ];
  for (const item of doc.items) {
    const itemId = prefix + "-" + (await digest(item.externalId)).slice(0, 20);
    const prior = entities.find((e) => e.id === itemId);
    if (prior?.data.sourceSignature === JSON.stringify(item)) continue;
    changes.push({
      id: itemId,
      kind: item.kind,
      expectedRev: prior?.rev || 0,
      data: {
        ...item,
        sessionId: prefix,
        status: "propuesto",
        version,
        sourceSignature: JSON.stringify(item),
        previousStatus: prior?.data.status || "",
        factorId: prior?.data.factorId || "",
        stepId: prior?.data.stepId || "",
        evidence: "",
      },
    });
  }
  return changes;
}
