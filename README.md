# GEN+ AI Process

> Mapea procesos complejos desde ideas simples.

**GEN+ AI Process** es un sistema visual y conversacional que transforma ideas vagas, notas operativas, problemas de proyecto, coordinaciones y descripciones en lenguaje natural en **mapas de procesos claros, interactivos, medibles y listos para implementación técnica**.

Pensado para ingeniería, construcción (BIM / VDC / VIA / ICE / PPM), educación, startups y gestión empresarial. Diseño premium **GEN+**: azul tecnológico, navy oscuro, jerarquía clara y estética de software enterprise.

Es un híbrido de **Figma + Miro + BPMN + Copilot + Dashboard de métricas**, especializado en procesos.

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

- **Constructor IA** — convierte texto natural en un `ProcessMap` completo (motor heurístico local, listo para conectar a un LLM real).
- **Canvas interactivo** — React Flow con swimlanes, nodos custom, zoom, pan, minimapa, arrastre y edición.
- **Inspector de nodo** — edita título, tipo, carril, responsable, RACI, entradas/salidas, herramientas, SLA, prioridad.
- **Process Copilot** — chat que **modifica el proceso**: "simplifica", "hazlo más técnico", "agrega métricas", "detecta cuellos de botella", "agrega responsables", "genera checklist", "pásalo a Mermaid/Markdown/JSON".
- **Métricas conectadas** — lista editable + **Metric Graph** causal (factores controlables → producción → proyecto → cliente).
- **Riesgos** — matriz probabilidad × impacto con mitigación.
- **Automatizaciones** — trigger → acción, input/output y human-in-the-loop.
- **Health Check** — score 0–100 con bandas (débil / incompleto / implementable / blindado).
- **6 plantillas** precargadas + ejemplo inicial cargado.

### Plantillas incluidas
1. Gestión de consultas técnicas en obra (RFI / CDE) — *ejemplo por defecto*
2. Matriz VDC / VIA / ICE / PPM
3. Proceso comercial B2B
4. Coordinación académica (AECODE)
5. Gestión de sponsors / eventos
6. Automatización administrativa

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

1. En el **Home**, pulsa *Crear proceso con IA* o *Ver ejemplo*.
2. En el **Constructor IA** (panel izquierdo), pega tu idea y elige tipo, detalle, formato y madurez. Pulsa **Generar mapa lógico**.
3. Edita el proceso en el **canvas** (arrastra nodos, conéctalos) o en el **Inspector** (panel derecho).
4. Usa el **Process Copilot** para transformar el proceso con lenguaje natural.
5. Revisa **Métricas**, **Riesgos**, **Automatizaciones** y el **Health Check** desde la barra lateral.
6. **Exporta** en el formato que necesites.

## 🤖 Conectar una IA real

La generación usa un **motor heurístico local** (`src/ai/ProcessGenerator.ts`) para funcionar sin backend. Para conectar un LLM:

1. Abre `src/ai/ProcessGenerator.ts` y reemplaza el cuerpo de `generateProcessFromAI` por una llamada real.
2. Usa el **prompt maestro** de `src/ai/masterPrompt.ts` como *system prompt* y `buildUserMessage()` como mensaje de usuario.
3. Endpoints sugeridos:
   - **OpenAI**: `POST https://api.openai.com/v1/chat/completions`
   - **Claude (Anthropic)**: `POST https://api.anthropic.com/v1/messages` (modelo `claude-opus-4-8`)
   - **Endpoint propio**: `POST /api/generate`
4. Persistencia opcional: Supabase / Firebase / GitHub storage.

El modelo debe devolver un JSON que cumpla el esquema `ProcessMap` (`src/types/process.ts`).

> ⚠️ No incrustes claves de API en el frontend en producción: usa un backend o función serverless como proxy.

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
    layout/       AppShell, Sidebar, Topbar, BottomBar, LeftPanel
    ui/           Button, Card, Badge, Field (Input/Textarea/Select)
    process/      Canvas, nodos, Inspector, paneles (métricas/riesgos/...)
    ai/           PromptComposer, AIConversationPanel (Copilot)
    home/         Hero
    brand/        Logo
  data/           templates.ts (6 plantillas + ejemplo)
  ai/             ProcessGenerator, copilot, masterPrompt
  lib/            processSchema, processEngine, health, exporters, prompts
  store/          useProcessStore (Zustand)
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
