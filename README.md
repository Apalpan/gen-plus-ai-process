# GEN+ AI Process 2.0

Mapeo colaborativo, gestión VDC y coordinación ICE en un mismo espacio. [Abrir la aplicación en Vercel](https://gen-plus-ai-process-v2.vercel.app/)

Selecciona **Abrir demo** para recorrer el ejemplo de prefabricados en un espacio privado. Para reunir a tu equipo en un mismo mapa, cada integrante crea su cuenta y el propietario lo incorpora desde **Equipo y revisiones**.

La v2 usa React Flow y Node.js 24, con SQLite en desarrollo y PostgreSQL para la persistencia en Vercel.

```sh
npm ci
npm run dev
```

Abre [AI Process local](http://127.0.0.1:5178). **Abrir demo local** crea un espacio privado con la cadena de prefabricados, dos cortes de ejemplo y una restricción ICE. Para trabajar con cuentas, cada miembro se registra y el propietario lo incorpora desde **Equipo y revisiones**. El acceso al espacio y el rol operativo del perfil se configuran por separado.

**Recorrido del lote.** En Gerencial, abre un indicador para ver sus objetivos. En Interrelaciones VDC elige un factor y sigue su actividad o asunto ICE. En Sesiones ICE puedes preparar agenda, registrar una decisión en sesión, importar un acta, asignar responsable y verificar el cierre con evidencia. En Producción registra un nuevo corte para contrastar el resultado.

El editor admite ocho plantillas, importación por copia y exportación. El editor histórico sigue disponible en [la vista clásica](http://127.0.0.1:5178/?legacy).

### Ejecución y pruebas

- `npm test` comprueba colaboración, permisos, cambios concurrentes, cortes VDC, ciencia de operaciones, plantillas e importación ICE.
- `npm run build` valida TypeScript y genera el cliente de producción. Después, `npm start` sirve interfaz y API en [el mismo origen](http://127.0.0.1:8787).
- Los asistentes usan Ollama en el equipo del servidor con `gemma3:1b` por defecto. `AI_PROCESS_MODEL` permite elegir otro modelo instalado. La interfaz identifica cuándo se empleó el motor de reglas.
- Para conectar equipos distintos, configura en la infraestructura compartida un proxy HTTPS al servidor y `AI_PROCESS_TEAM_ORIGIN` con el origen externo exacto. El proxy conserva la cabecera Host. Guarda la base SQLite en un volumen persistente mediante `AI_PROCESS_DB_PATH`. La demo local escucha en loopback.

Con el servidor local en marcha, las pruebas de navegador se reproducen con Python, Playwright y Chrome instalados.

```sh
python tests/browser/collaboration.py
python tests/browser/vdc_workflow.py
```

La primera prueba modifica cinco actividades desde cinco sesiones independientes. La segunda registra un corte, consulta los dos dashboards y recorre el grafo hasta una decisión ICE. Las capturas y resultados se escriben bajo `AI_PROCESS_QA_DIR` o en un directorio temporal.

### Vercel

El despliegue compila el cliente Vite y publica una función Node 24 en `api/entry.mjs`. Las peticiones a `/api/*` pasan por esa función. La instancia usa `DATABASE_URL` en el servidor para persistir el estado en PostgreSQL y compartir presencia. Los datos de demostración se generan al entrar en cada espacio privado. La base local del equipo está excluida del paquete de despliegue.

Configura PostgreSQL en el mismo proyecto y entorno de Vercel que la aplicación. Para usar también la interpretación de lenguaje natural, configura `AI_PROCESS_GATEWAY_MODEL` durante la compilación y la ejecución. La aplicación verifica que el catálogo vigente indique precio cero de entrada y salida para el modelo elegido. La opción de enviar contexto a AI Gateway se activa en la interfaz. Las herramientas determinísticas y el proceso de revisión funcionan aunque el proveedor de modelos esté indisponible.

## Editor clásico

> Mapea procesos complejos desde ideas simples.

**GEN+ AI Process** es un **sistema de producción para mapear procesos empresariales**: describe cómo trabaja tu equipo hoy y obtén un proceso claro, visual, medible y rediseñado para operar **AI First** con agentes y automatizaciones.

> **Mapea tu proceso. Mide su desempeño. Rediséñalo con IA. Impleméntalo con agentes y automatizaciones.**

Mezcla **PPI / Operations Science** (flujo, WIP, cycle time, throughput, cuello de botella), **VDC** (cliente → proyecto → producción → factores controlables), **Lean/Last Planner**, **Scrum** (mejora iterativa) y **AI First** (agentes + automatizaciones).

## 🧭 Flujo guiado de 6 pasos

1. **Capturar** — describe el proceso en lenguaje natural (área, problema, resultado esperado).
2. **Mapear** — mapa visual editable con swimlanes, responsables, decisiones (rombo + Sí/No), colas/WIP; edítalo con el copilot.
3. **Validar** — reglas pedagógicas AEC/Lean (inicio/fin, responsable por rol, decisión = pregunta con dos caminos, actividad = verbo + objeto, evidencia, métricas) con "ir al nodo" y corrección.
4. **Medir** — Métricas + **Producción (PPI)** (cycle time, throughput, WIP, eficiencia de flujo, cuello de botella, 5 palancas) + Riesgos + **Process Health Score**.
5. **AI First** — proceso actual vs futuro, **AI First Score**, agentes IA y automatizaciones recomendadas, roadmap 30/60/90 y quick wins.
6. **Implementar** — ficha de implementación con exportaciones: Markdown ejecutivo/técnico (incluye capa de producción), JSON, Mermaid, PNG y prompts para Claude Code, n8n, Notion/Obsidian y dashboards.

Navegación en 6 módulos: **Dashboard · Procesos · Nuevo mapa · Métricas · AI First · Exportar** (+ Configuración).

**Scores:** Health Score · AI First Score · **Production Science Score** (PPI) · **Cobertura VDC**.

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
- **Capa de Producción (PPI / Operations Science)**: nodos Cola/WIP y Buffer, campos touch/wait time, capacidad, WIP y variabilidad por nodo; cálculo de cycle time, throughput (Little's Law TH=WIP/CT), eficiencia de flujo, cuello de botella y 5 palancas.
- **Validar (reglas AEC/Lean)**: la app revisa la calidad del flujo y enseña a corregirlo (rol no nombre, decisión como pregunta, verbo + objeto, evidencia, métrica con fórmula).
- **Cobertura VDC**: conecta objetivos cliente → proyecto → producción → factores controlables, ICE/BIM/PPM.
- **12 plantillas** precargadas (incl. AEC: RFI, Clash detection, Sesión ICE, Lookahead/Last Planner) + datos demo al primer uso.

### Plantillas incluidas
1. Coordinación de equipo / proyecto
2. **Gestión de RFI en obra** (con cola/WIP, cycle time y cuello de botella)
3. **Clash detection / coordinación BIM**
4. **Sesión ICE** (decisiones)
5. **Lookahead semanal / Last Planner** (restricciones, PPC)
6. Consultas técnicas en obra (RFI / CDE)
7. Control de pagos y cobranza (finanzas)
8. Matriz VDC / VIA / ICE / PPM
9. Proceso comercial B2B
10. Coordinación académica (AECODE)
11. Gestión de sponsors / eventos
12. Automatización administrativa

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
