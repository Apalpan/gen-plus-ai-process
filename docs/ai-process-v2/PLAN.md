# GEN+ AI Process 2.0 — diagnóstico y plan

**Corte:** 21 de noviembre de 2026, Lima. **Base:** [3d78140](https://github.com/Apalpan/gen-plus-ai-process/commit/3d78140ea2d95a9ae559f9e6c8b1991aada3c3d7). **Implementación:** [prompt completo para Codex](PROMPT-CODEX.md).

## Decisión de producto

Convertir el mapeador individual en una mesa de trabajo colaborativa. Cinco personas abren un mismo proceso, construyen el mapa, asignan responsabilidades, contrastan la evidencia y aprueban una versión que el equipo puede consultar y mejorar. Una persona sin formación en procesos puede empezar en blanco, con texto o con una plantilla. El especialista activa el análisis de producción con datos y supuestos explícitos.

**Primer piloto:** un lote prefabricado desde la liberación del diseño hasta la aceptación del montaje. Es suficientemente completo para probar los traspasos entre disciplinas y comparar una mejora operativa. Validar también un flujo general de aprobación con gente fuera de AEC.

**Flujo:** Capturar → Mapear → Validar → Medir → Mejorar con IA → Implementar y revisar. El mapa abre directo desde Inicio y la guía de seis pasos acompaña el trabajo cuando se necesita. Cerrar el ciclo con una acción, responsable, fecha, indicador y revisión de evidencia.

## Qué se recuperó

| Fecha de Lima | Evidencia | Resultado |
| --- | --- | --- |
| 7 jun. 2026 | [e5184fc](https://github.com/Apalpan/gen-plus-ai-process/commit/e5184fc), [267b099](https://github.com/Apalpan/gen-plus-ai-process/commit/267b099) | Lanzamiento 1.0, generación conversacional, tema claro, configuración de IA y biblioteca local. |
| 12–13 jun. | [d6ce335](https://github.com/Apalpan/gen-plus-ai-process/commit/d6ce335), [ffdcdca](https://github.com/Apalpan/gen-plus-ai-process/commit/ffdcdca), [99cecdf](https://github.com/Apalpan/gen-plus-ai-process/commit/99cecdf), [2f4d8f3](https://github.com/Apalpan/gen-plus-ai-process/commit/2f4d8f3) | Flujo guiado, decisiones, validación, PPM, VDC, vistas Básico/2D/3D y rediseño de portada. |
| 30 jul. | [PR #1](https://github.com/Apalpan/gen-plus-ai-process/pull/1), [#2](https://github.com/Apalpan/gen-plus-ai-process/pull/2), [#3](https://github.com/Apalpan/gen-plus-ai-process/pull/3) | Experimentos con una ruta de aprendizaje y un mapa tipo pizarra. El historial conserva esos cambios. |
| 31 jul. | [PR #4](https://github.com/Apalpan/gen-plus-ai-process/pull/4), [ejecución Pages](https://github.com/Apalpan/gen-plus-ai-process/actions/runs/30612906934) | Restauración del núcleo GEN+ y ejecución exitosa del despliegue histórico de la base auditada. |

**Activos reutilizables.** React 18, TypeScript, Vite, Tailwind, Zustand y React Flow. Hay tipos de dominio, nodos personalizados, decisiones, carriles, inspector, alineación, vistas Básico/2D/3D, biblioteca, generador heurístico, copilot, validación, VDC y exportadores. El catálogo registra **12 plantillas**. La vista de producción y parte de sus cálculos viven en [productionScience.ts](https://github.com/Apalpan/gen-plus-ai-process/blob/3d78140/src/lib/productionScience.ts). El despliegue histórico está en [GitHub Pages](https://apalpan.github.io/gen-plus-ai-process/).

**Brechas que cambian la arquitectura.**

| Hallazgo en la base | Qué resolver |
| --- | --- |
| El acceso acepta cualquier clave y el estado de sesión, biblioteca y configuración se guarda en el navegador. «Equipo» depende de exportar e importar. | Autenticación real, membresías, persistencia por organización, permisos en servidor y ensayo con cinco identidades. |
| Las llaves de IA viven en el navegador y el cliente llama al proveedor. La conectividad depende de configuración local. | IA desde servidor con alcance mínimo, validación del resultado y aprobación de cambios. Mantener un generador local sin llave. |
| WIP calculado como número de nodos de trabajo; throughput inferido con ese WIP; cola vacía toma un día; la mayor duración se usa para señalar el cuello. | Medidas por unidad, frontera y periodo. WIP promedio por unidades abiertas; throughput observado por salidas; atraso y restricción de capacidad como diagnósticos distintos. |
| La importación JSON comprueba ID, nodos y carriles a grandes rasgos. No hay esquema versionado, protección de referencias ni historial compartido. | Importación v1→v2 con previsualización, validación, remapeo y copia. Revisiones publicadas inmutables y recuperación. |
| El repositorio no define una suite de pruebas en `package.json`. El bundle inicial previo a la v2 fue de ~734 kB JS y la vista 3D, en un bloque separado, ~978 kB JS sin comprimir. | Cobertura de los recorridos críticos, medición de carga y render, 2D como vista principal y 3D bajo demanda. |

**Verificación reproducible.** `npm ci` y `npm run build` pasaron en la base con Node 24.16.0. En Playwright a 1440 y 1024 px abrieron el acceso local y el mapa RFI. A 1440 px se renombró, guardó, abrió Producción y descargó el JSON con 14 nodos y 15 enlaces. El acceso a Pages respondió HTTP 200. A 1024 px, ambos paneles abiertos dejan un canvas estrecho y se solapan controles y etiquetas. Las capturas se revisaron a ambos anchos. La revisión de IA se hizo a nivel de código y modo local. Las llamadas con llaves externas quedan pendientes de validación.

## Siete resultados verificables

| Capacidad | Resultado exigido en v2 | Prueba |
| --- | --- | --- |
| Mapear | Crear en blanco, desde frase o plantilla. Insertar y conectar con puntero y teclado. Editar carriles, agrupar y expandir subprocesos. | Un nuevo usuario construye ocho pasos desde un brief de una página. Meta piloto de 10 min al primer mapa válido. |
| Ver | Canvas, carriles, tabla, cadena de producción y comparación actual/propuesta sobre los mismos IDs. | Editar en tabla y abrir el mismo nodo en todas las vistas compatibles, conservando el foco y los datos. |
| Colaborar | Cinco sesiones autenticadas, edición simultánea, cursores, comentarios anclados, permisos y reconexión. | Probar cinco contextos, dos ediciones concurrentes, misma revisión al cerrar y reabrir, acceso ajeno rechazado. |
| Responsabilizar | Perfil, equipo, función por paso, persona asignada y bandeja de pendientes. | Cambiar la persona sin cambiar el rol. La acción aparece para su titular y conserva evidencia e historial. |
| Medir producción | Medidas observadas, escenarios explícitos, colas, lotes, buffers, recursos compartidos, retrabajo y variabilidad. | Pruebas con caso conocido, datos insuficientes, rutas paralelas y bucles. |
| Mejorar | Copilot lee el mapa y propone cambios revisables. Comparar escenarios, aprobar versión y abrir acción de mejora. | Aplicar una propuesta a un borrador, revisar el cambio y conservar la línea base. |
| Reutilizar | Ocho plantillas revisadas, biblioteca privada y export/import con esquema. | Instanciar las ocho, comprobar referencias y completar ida y vuelta sin perder semántica. |

**Cómo medir el objetivo ×5–×7.** Es una meta propuesta, sin multiplicador observado. Ejecutar el mismo taller en la base y la v2 con al menos dos casos equivalentes. En ambos registrar tiempo de reloj y minutos-persona, contar resultados que un tercero acepte con evidencia y medir resultados válidos por hora-persona. Usar la misma rúbrica de claridad de alcance, responsables, traspasos, revisión y reproducibilidad. Registrar por separado tiempo al primer mapa válido, traspasos sin responsable, conflictos sin recuperar y tiempo para retomar el mapa. Evitar ratios cuando la base sea cero. Reportar la mejora medida junto con el número de ensayos.

## Ocho plantillas de lanzamiento

Cada plantilla declara unidad de flujo, objetivo, frontera, entrada, salida aceptada, roles y traspasos. Incluye una decisión, una excepción, evidencia, indicador y condición de término. Los valores de ejemplo se marcan `DATO_DEMO`. Los 12 IDs históricos se conservan para compatibilidad y navegación por el catálogo legado.

| Plantilla | Unidad y límite | Decisión o restricción principal |
| --- | --- | --- |
| Aprobación de solicitud | Solicitud recibida → decisión registrada | Expediente completo, devolución y SLA por etapa. |
| Gestión de incidencia | Caso registrado → solución verificada | Prioridad, triage, escalamiento y reapertura. |
| RFI técnico | RFI recibido → respuesta formal distribuida | Cola de especialista, aceptación y reapertura. |
| Diseño y liberación DfMA | Paquete de diseño → revisión liberada para fábrica | Constructibilidad, congelamiento, control de cambios y evidencia. |
| Fabricación y QA | Lote liberado → lote conforme embalado | Capacidad de estación, lote, retrabajo y merma. |
| Transporte y recepción | Carga liberada → recepción comprobada | Ventana, vehículo, secuencia de carga y contingencia. |
| Montaje y aceptación | Lote recibido → instalación aceptada | Frente disponible, recurso de izaje, inspección y rechazo. |
| Cadena industrializada integral | Lote requerido → montaje aceptado | Agrupa diseño, fábrica, viaje y montaje. Expone buffers, cambio de unidad, liberaciones y capacidad por fase. |

## Método de operaciones

Definir la unidad y frontera antes de activar PPM. Distinguir entrada, salida, demanda, proceso, recursos y unidad de flujo. Una etapa de diseño puede gestionar **paquetes**, fabricación **lotes**, transporte **cargas** y montaje **módulos**. Para comparar de extremo a extremo usar un ID de lote trazable y conversiones explícitas o mantener los indicadores por fase. Separar tiempo activo, tiempo de espera y tiempo total desde entrada hasta salida. Incluir retrabajo, rechazo, calendarios, tamaño de lote, recurso compartido y tres clases de buffer: tiempo, inventario y capacidad. Identificar el recurso candidato a restricción mediante carga/capacidad y corroborar con colas y salidas. [PPI, definición de sistema de producción](https://projectproduction.org/journal/ppi-position-paper-defining-production-system-from-an-operations-science-and-project-production-management-perspective/) · [PPI, mediciones](https://projectproduction.org/technical-conference/six-fundamental-production-system-measurements/) · [PPI, industrialización](https://projectproduction.org/journal/project-production-management-as-an-enabler-of-the-industrialization-of-construction/)

Proponer un escenario de capacidad o liberación para comparar con la base usando las cinco palancas de PPI: diseño del entregable, diseño del proceso, inventario, capacidad y variabilidad. Mantener unidad, frontera, calendario y periodo comparables. Aplicar Little con promedios compatibles en una ventana suficientemente estable, mostrando método y datos de origen. Un cuello estimado o un escenario se rotula como tal. [PPI, cinco palancas](https://projectproduction.org/journal/digital-technology-and-project-production-management-what-is-the-relationship/) · [Little, 1961](https://doi.org/10.1287/opre.9.3.383)

## Referencias que sí conviene reutilizar

| Referencia | Uso en GEN+ |
| --- | --- |
| [xyflow/xyflow](https://github.com/xyflow/xyflow) | Base del editor. Nodos, handles, aristas, grupos y navegación. Migrar con regresiones cubiertas y verificar la versión compatible al iniciar. [Guía de migración](https://reactflow.dev/learn/troubleshooting/migrate-to-v12) |
| [SweetRetry/flowpocus](https://github.com/SweetRetry/flowpocus) | Referencia concreta React Flow + Yjs + Hocuspocus. Estudiar cursores, selección remota, sincronización y undo por usuario. |
| [bpmn-io/bpmn-js](https://github.com/bpmn-io/bpmn-js) | Referencia de semántica y de importación/exportación BPMN en una etapa posterior. Validar el subconjunto y condiciones de su licencia antes de integrar. [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/) · [Licencia bpmn-js](https://github.com/bpmn-io/bpmn-js/blob/develop/LICENSE) |
| [PPI Process Mapper](https://projectproduction.org/resources/process-mapper/) | Referencia de dominio para operaciones, flujos, colas y stocks. Se consultó la descripción pública. |
| [tldraw Sync](https://tldraw.dev/docs/sync) | Benchmark de interacción de pizarra. La integración queda fuera del alcance inicial por el costo de introducir un segundo editor y su licencia para producción. [Licencia](https://tldraw.dev/community/license) |

## Experiencia visual

La web de GEN+ usa navy oscuro, una cuadrícula ligera, un titular amplio y una sola llamada a la acción azul dominante. Se revisó en navegador a 1440 y 1024 px. El producto lleva esa intención a un **Inicio claro y un canvas protagonista**, con menos decoración y más espacio útil. Logo oficial, navy `#0E2A6B`, CTA y selección `#2165FF`, superficies claras, canvas celeste pastel e iconografía lineal. Plus Jakarta Sans para interfaz y Ruberoid para títulos donde haya licencia y asset disponible. El rail izquierdo y el inspector derecho se redimensionan, cierran y reabren. En escritorio compacto, abrir un panel ancho contrae el otro para preservar el mapa. Selección, zoom, filtros y atajos son descubribles. En móvil priorizar consulta, comentarios y aprobación con lista e inspector en panel accesible. [Sitio oficial GEN+](https://www.genplusdesign.com/)

## Arquitectura y secuencia de entrega

**Decisión técnica propuesta.** Conservar Vite/React/TS. Mantener un modelo de grafo tipado independiente de la vista. El grafo y sus operaciones viven en Postgres; reglas multiempresa mediante Auth, membresías y RLS. Usar broadcast privado para anunciar la revisión confirmada y para cursores efímeros, con permisos diferenciados. El servidor valida y guarda lotes pequeños de cambios por entidad con revisión esperada, operaciones idempotentes y registro de actor. Al volver en línea, actualizar desde el último número de revisión válido y resolver colisiones sin sobrescribir. Esta solución cubre el piloto con menos piezas operativas. Evaluar Yjs/Hocuspocus si el piloto exige coedición de un mismo texto o edición offline prolongada. [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast) · [Autorización](https://supabase.com/docs/guides/realtime/authorization) · [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

| Bloque | Construcción y puerta de salida |
| --- | --- |
| 0 · Base y diseño | Recorrido reproducible v1, datos demo, contratos y estados de UX. Enumerar deuda, migración y criterios de prueba. |
| 1 · Mapa útil individual | Modelo v2, importación v1, Inicio, edición en canvas/carriles/tabla, ocho plantillas, export. Una persona completa el recorrido general y el industrializado. |
| 2 · Mesa de cinco | Auth, perfil, organizaciones, roles, asignaciones, comentarios, eventos transaccionales, versiones, aprobación y sincronización. Cinco identidades y permisos verificados con backend local de prueba. |
| 3 · Producción y copilot | Datos de flujo, panel PPM, escenarios, mejora con aprobación, bitácora y bandeja. Validar el caso industrializado y el general. |
| 4 · Piloto y cierre | Benchmark contra v1, QA accesible, latencia y evidencia, recuperación e instrucciones de operación. Candidato a pilotear con un equipo autorizado. |

**Alcance posterior al piloto.** Simulación de eventos discretos, importación BPMN/XML homologada, integración con BIM/CDE y ERP, SSO empresarial, automatizaciones externas y analítica de múltiples proyectos. La primera versión entrega escenarios determinísticos trazables, export JSON/Mermaid/Markdown y edición compartida comprobada.

## Inicio en Codex

Abre el repositorio original desde la rama del plan `ai-process/plan-v2` y usa [PROMPT-CODEX.md](PROMPT-CODEX.md). El prompt contiene las instrucciones para crear un worktree de implementación, construir por bloques y producir evidencia. Este documento es el plan de la v2. La prueba de cinco personas y las mejoras de desempeño corresponden al piloto futuro.
