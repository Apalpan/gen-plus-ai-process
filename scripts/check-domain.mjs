import assert from "node:assert/strict";
import { createServer } from "vite";
import { runAnalysis } from "../intelligence/run.mjs";
const vite = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "silent",
});
try {
  const { runVdcFixtures } = await vite.ssrLoadModule(
    "/src/studio/vdc/metrics.test.ts",
  );
  runVdcFixtures();
  const { templates } = await vite.ssrLoadModule("/src/data/templates.ts");
  const { readMap, validateMap, recoverOriginal } = await vite.ssrLoadModule(
    "/src/studio/editor/importMap.ts",
  );
  assert.equal(templates.length, 12);
  for (const t of templates) {
    const v1 = t.build(),
      upgraded = readMap(JSON.stringify(v1));
    assert.deepEqual(validateMap(upgraded), []);
    const copy = recoverOriginal(upgraded);
    assert.equal(copy.nodes.length, v1.nodes.length);
    assert.deepEqual(copy.nodes.map(n=>n.type), v1.nodes.map(n=>n.type));
    assert.deepEqual(copy.edges.map(e=>e.type), v1.edges.map(e=>e.type));
    assert.deepEqual(copy.metrics, v1.metrics);
    assert.deepEqual(copy.implementationChecklist, v1.implementationChecklist);
  }
  const { studioTemplates } = await vite.ssrLoadModule(
    "/src/studio/editor/templates.ts",
  );
  const { seedVdc } = await vite.ssrLoadModule("/src/studio/vdc/seed.ts");
  const { parseActa, importChanges, sampleActa } = await vite.ssrLoadModule(
    "/src/studio/iceImport.ts",
  );
  assert.equal(studioTemplates.length, 8);
  for (const template of studioTemplates) {
    const entities = template.build(),
      ids = new Set(entities.map((e) => e.id));
    assert.equal(ids.size, entities.length);
    for (const edge of entities.filter((e) => e.kind === "edge"))
      assert.ok(ids.has(edge.data.source) && ids.has(edge.data.target));
  }
  const doc = await parseActa(sampleActa, "");
  const changes = await importChanges(doc, []);
  const existing = changes.map((change) => ({ ...change, rev: 1 }));
  assert.equal(changes.length, 4);
  assert.equal((await importChanges(doc, existing)).length, 0);
  await assert.rejects(() => parseActa('{"schemaVersion":20,"items":[]}', ""));
  const changed = await parseActa(
    sampleActa.replace("ventana de izaje", "horario de transporte"),
    "",
  );
  const version = await importChanges(changed, existing);
  assert.equal(version.length, 2);
  assert.equal(version[0].data.version, 2);
  const entities = [...studioTemplates[7].build(), ...seedVdc()];
  for (const capability of ["map", "ice", "executive", "production"]) {
    const r = await runAnalysis({
      entities,
      revision: 10,
      userId: "fixture",
      request: { capability, input: "Revisar → Liberar", useModel: false },
    });
    assert.equal(r.baseRevision, 10);
    assert.ok(r.sources.every((src) => entities.some((e) => e.id === src.id)));
    if (capability === "production") assert.match(r.summary, /PPC/);
    if (capability === "map")
      assert.equal(r.changes.filter((c) => c.kind === "step").length, 2);
  }
  console.log(
    "VDC, producción, ocho plantillas, importación ICE versionada y cuatro asistentes verificados.",
  );
} finally {
  await vite.close();
}
