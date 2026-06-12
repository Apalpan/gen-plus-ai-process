# GEN+ AI Process

> Mapea procesos complejos desde ideas simples.

**GEN+ AI Process** es un **sistema de producción para mapear procesos empresariales**: describe cómo trabaja tu equipo hoy y obtén un proceso claro, visual, medible y rediseñado para operar **AI First** con agentes y automatizaciones.

> **Mapea tu proceso. Mide su desempeño. Rediséñalo con IA. Impleméntalo con agentes y automatizaciones.**

## 🧭 Flujo guiado de 5 pasos

1. **Capturar** — describe el proceso en lenguaje natural (área, problema, resultado esperado).
2. **Mapear** — mapa visual editable con swimlanes, responsables y decisiones; edítalo con el copilot.
3. **Medir** — métricas conectadas al flujo, riesgos y **Process Health Score**.
4. **AI First** — comparación proceso actual vs futuro, **AI First Score**, agentes IA y automatizaciones recomendadas, roadmap 30/60/90 y quick wins.
5. **Implementar** — ficha de implementación con exportaciones: Markdown ejecutivo/técnico, JSON, Mermaid, PNG y prompts para Claude Code, n8n, Notion/Obsidian y dashboards.

Navegación en 6 módulos: **Dashboard · Procesos · Nuevo mapa · Métricas · AI First · Exportar** (+ Configuración).

- 🎨 **Tema claro por defecto** (toggle a oscuro), identidad premium **GEN+**.
- 🤖 **IA multi-proveedor configurable**: conecta tu API key (Claude / OpenAI / Gemini / compatible) y MCPs/integraciones. Sin key, motor heurístico local.
- 👥 **Para todo el equipo**: biblioteca local con estados, favoritos, filtros y scores; comparte vía export/import JSON.

---

## ✨ Qué hace

Escribe una idea desordenada, por ejemplo:

> "Necesito mapear cómo gestionamos consultas técnicas en obra desde que campo detecta una duda hasta que se cierra la consulta con trazabilidad documental y métricas."

…y la app genera automáticamente:

- Proceso estructurado con **swimlanes**, roles, actividades, decisiones, entradas y salidas.
- **Documentos, herramientas, métricas, riesgos, responsables, SLA y automatizaciones**.
- **Diagrama editable** (React Flow) con nodos por tipo y conexiones (secuencia, sí/no, dependencia, feedback, impacto métrico).
- **Resumen ejecutivo**, **Health Check** y **checklist de implementación**.
- **Exportación** a JSON, Markdown (ejecutivo y técnico), Mermaid, PNG y *prompts* para Codex/Claude Code, n8n, Obsidian y dashboards.

## 🧩 Funcionalidades

- **Dashboard** — total de procesos, por área, con métricas, alto potencial de automatización, sin responsable, riesgos críticos, AI First promedio, ahorro estimado y últimos editados.
- **Biblioteca de procesos** — estados (borrador → mapeado → medido → optimizado → en implementación → implementado → mejora continua), favoritos, búsqueda y filtros por área/estado; Health y AI First Score por proceso.
- **Captura guiada** — nombre, área, áreas involucradas, descripción natural, problema, resultado esperado, tipo y nivel de detalle → **Mapear proceso**.
- **Canvas interactivo** — React Flow con swimlanes, nodos custom, zoom, pan, minimapa, arrastre y edición; inspector lateral por nodo (responsable, input/output, herramientas, SLA, documentos).
- **Process Copilot** — chat que **modifica el proceso**: "simplifica", "agrega métricas", "detecta cuellos de botella", "agrega responsables", "pásalo a Mermaid/Markdown/JSON".
- **Medir** — métricas con fórmula/meta/dueño conectadas a nodos + Metric Graph causal, riesgos (probabilidad × impacto) y **Process Health Score** con problemas detectados.
- **AI First** — motor que clasifica cada actividad (humano decide / agente IA / automatizar / simplificar / eliminar), calcula **AI First Score** (0–100 con bandas), recomienda agentes y automatizaciones, y genera roadmap 30/60/90, quick wins y riesgos ocultos.
- **Implementar** — ficha ejecutiva + exportaciones (Markdown, JSON, Mermaid, PNG, prompts Claude Code / n8n / Notion-Obsidian / dashboard) y cambio de estado del proceso.
- **Configuración de IA** — proveedor + API key + modelo (Claude por defecto), prueba de conexión, MCPs/integraciones inyectadas en los prompts.
- **8 plantillas** precargadas + datos demo al primer uso.

### Plantillas incluidas
1. Coordinación de equipo / proyecto (atención de solicitudes internas)
2. Control de pagos y cobranza (finanzas)
3. Gestión de consultas técnicas en obra (RFI / CDE)
4. Matriz VDC / VIA / ICE / PPM
5. Proceso comercial B2B
6. Coordinación académica (AECODE)
7. Gestión de sponsors / eventos
8. Automatización administrativa (gestión documental)

## 🛠 Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** (design tokens GEN+)
- **Zustand** (estado global)
- **React Flow** (nodos, aristas, edición visual)
- **Framer Motion** (microinteracciones)
- **Lucide React** (iconografía lineal)
- **html-to-image** (export PNG)

## 🚀 Instalación

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera /dist
npm run preview  # previsualiza el build
```

Requiere Node 18+ (probado con Node 20/24).

## 🧭 Cómo usar

1. **Dashboard** te muestra el estado de tu sistema de procesos y las acciones sugeridas.
2. **Nuevo mapa (Capturar)**: describe el proceso como lo explicarías en una reunión y pulsa **Mapear proceso** (o parte de una plantilla).
3. **Mapear**: edita nodos en el canvas o pídele cambios al copilot; cada actividad debe tener responsable, entrada y salida.
4. **Medir**: revisa métricas, riesgos y el Health Score; corrige los problemas detectados.
5. **AI First**: genera el plan (comparación actual vs futuro, agentes, automatizaciones, roadmap 30/60/90).
6. **Implementar / Exportar**: descarga la ficha y los prompts, y marca el proceso "en implementación".
7. **Guardar** (topbar) almacena el proceso en tu biblioteca; compártelo exportando el JSON.

## 🤖 Conectar una IA real (sin código)

Ya no necesitas tocar el código: ve a **Configuración** (barra lateral) y:

1. Elige el **proveedor** (Claude por defecto, OpenAI, Gemini o un endpoint compatible con OpenAI).
2. Pega tu **API key** y el **modelo** (`claude-opus-4-8`, etc.). Para "compatible", define la **Base URL**.
3. Pulsa **Probar conexión**.

Con key configurada, *Generar mapa lógico* usa el LLM real (envía el **prompt maestro** de `src/ai/masterPrompt.ts` y espera un JSON `ProcessMap`); sin key, usa el **motor heurístico local** (`src/ai/ProcessGenerator.ts`). La capa de proveedores está en `src/ai/llm.ts`.

También puedes registrar **MCPs / integraciones** (Notion, Drive, n8n…) en Configuración; se incluyen en los prompts de implementación que exportas.

> ⚠️ **Seguridad:** la API key se guarda solo en tu navegador (localStorage) y se envía directo al proveedor. Es adecuado para una herramienta cliente donde cada quien usa su propia clave. Para un despliegue compartido/producción, enruta las llamadas por un backend/función serverless en vez de exponer la clave en el navegador.

## 📦 Despliegue

### GitHub Pages (automático)
El repo incluye `.github/workflows/deploy.yml`. Al hacer *push* a `main`:
1. Se construye con `BASE_PATH=/<nombre-del-repo>/`.
2. Se publica el contenido de `/dist`.
3. Activa **Settings → Pages → Source: GitHub Actions**.

### Vercel
1. Importa el repositorio en Vercel.
2. Framework: **Vite** (autodetectado). Build: `npm run build`. Output: `dist`.
3. Deploy. (No requiere `BASE_PATH` porque se sirve desde la raíz.)

## 🗂 Arquitectura

```
src/
  app/            App raíz (Home / AppShell)
  components/
    layout/       AppShell, Sidebar, Topbar, BottomBar, LeftPanel, StepBar
    ui/           Button, Card, Badge, Field (Input/Textarea/Select)
    capture/      CaptureView (Paso 1)
    process/      Canvas, nodos, Inspector, MeasurePanel, ImplementPanel
    aifirst/      AIFirstView (Paso 4: comparación, agentes, roadmap)
    dashboard/    Dashboard
    processes/    ProcessLibraryView (biblioteca + plantillas)
    ai/           AIConversationPanel (Copilot)
    home/         Hero
    brand/        Logo
  data/           templates.ts (8 plantillas)
  ai/             ProcessGenerator, copilot, masterPrompt, llm (multi-proveedor)
  lib/            processSchema, processEngine, health, aiFirst, exporters, prompts, storage
  store/          useProcessStore (Zustand: proceso, flujo, tema, LLM, integraciones, biblioteca)
  types/          process.ts (modelo de dominio)
  styles/         globals.css, tokens.css
```

## 🗺 Roadmap

- Integración OpenAI / Claude API y endpoint propio
- Login, multiusuario y versionado de procesos
- Comentarios y modo presentación
- Exportación BPMN real
- Integraciones: Miro, Notion, Obsidian, Google Drive, n8n
- Dashboard de métricas en tiempo real

## 📄 Licencia

MIT © GEN+ Design
