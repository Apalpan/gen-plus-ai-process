# GEN+ AI Process

> Mapea procesos complejos desde ideas simples.

**GEN+ AI Process** es una herramienta visual y conversacional para **mapear procesos de coordinación**: un equipo describe un flujo de trabajo en lenguaje natural y obtiene un **mapa de proceso claro, editable, medible, guardable y exportable**.

- 🎨 **Versión principal en tema claro** (con toggle a oscuro), identidad premium **GEN+**.
- 🤖 **IA multi-proveedor configurable**: conecta tu API key (Claude / OpenAI / Gemini / endpoint compatible) y MCPs/integraciones desde la app. Sin key, usa un motor heurístico local.
- 👥 **Para todo el equipo**: guarda tus mapeos en una biblioteca local y compártelos vía export/import JSON.

Pensado para coordinación entre áreas, PMO, ingeniería/construcción (BIM / VDC / VIA / ICE / PPM), educación, startups y gestión empresarial. Híbrido de **Figma + Miro + BPMN + Copilot + Métricas**, especializado en procesos.

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
- **Configuración de IA** — proveedor + API key + modelo (Claude por defecto), prueba de conexión, y registro de **MCPs / integraciones** que se inyectan en los prompts de implementación.
- **Mis procesos (biblioteca)** — guardar, abrir, renombrar, duplicar, eliminar e importar (localStorage; comparte por JSON).
- **Tema claro/oscuro** persistente; tema claro por defecto.
- **7 plantillas** precargadas (incl. *Coordinación de equipo / proyecto*) + ejemplo inicial cargado.

### Plantillas incluidas
1. Coordinación de equipo / proyecto — *flujo de coordinación*
2. Gestión de consultas técnicas en obra (RFI / CDE) — *ejemplo por defecto*
3. Matriz VDC / VIA / ICE / PPM
4. Proceso comercial B2B
5. Coordinación académica (AECODE)
6. Gestión de sponsors / eventos
7. Automatización administrativa

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
    layout/       AppShell, Sidebar, Topbar, BottomBar, LeftPanel
    ui/           Button, Card, Badge, Field (Input/Textarea/Select)
    process/      Canvas, nodos, Inspector, paneles (métricas/riesgos/...)
    ai/           PromptComposer, AIConversationPanel (Copilot)
    home/         Hero
    brand/        Logo
  data/           templates.ts (7 plantillas + ejemplo)
  ai/             ProcessGenerator, copilot, masterPrompt, llm (multi-proveedor)
  lib/            processSchema, processEngine, health, exporters, prompts, storage
  store/          useProcessStore (Zustand: proceso, tema, LLM, integraciones, biblioteca)
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
