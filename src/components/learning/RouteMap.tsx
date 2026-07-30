import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlowProvider,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  useReactFlow,
} from 'reactflow';
import {
  BookOpenCheck,
  Eye,
  Focus,
  Hand,
  Layers3,
  Maximize2,
  MousePointer2,
  Pencil,
  RotateCcw,
  Search,
  ShieldCheck,
  Waypoints,
  X,
} from 'lucide-react';
import { aecodeF3Route } from '../../data/aecodeF3Route';
import {
  LEARNING_MAP_SIZE,
  learningLevelNodeDefaults,
  learningMapEdges,
  learningMapLanes,
  learningMapProcessNodes,
  learningMapStages,
  mobileLearningSequence,
} from '../../data/learningProcessMap';
import { useProcessStore } from '../../store/useProcessStore';
import type { Course } from '../../types/learning';
import {
  learningMapNodeTypes,
  type LevelNodeData,
  type ProcessNodeData,
} from './map/LearningMapNodes';

type CanvasTool = 'select' | 'hand';

const edgeTones = {
  route: '#8d8ff0',
  feedback: '#f59e0b',
  support: '#6f91da',
  verified: '#17b14e',
} as const;

function buildEdges(): Edge[] {
  return learningMapEdges.map((edge) => {
    const tone = edge.tone ?? 'route';
    return {
      ...edge,
      type: 'smoothstep',
      animated: edge.animated,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: edgeTones[tone],
      },
      style: {
        stroke: edgeTones[tone],
        strokeWidth: tone === 'verified' ? 2.5 : 2,
        strokeDasharray: tone === 'support' ? '5 5' : undefined,
      },
      labelStyle: {
        fill: tone === 'verified' ? '#83eba4' : tone === 'feedback' ? '#f7c66f' : '#c5c7ff',
        fontSize: 12,
        fontWeight: 800,
      },
      labelBgStyle: {
        fill: '#13172f',
        fillOpacity: 0.96,
      },
      labelBgPadding: [6, 4] as [number, number],
      labelBgBorderRadius: 6,
      ariaLabel: edge.label
        ? `${edge.source} a ${edge.target}: ${edge.label}`
        : `${edge.source} a ${edge.target}`,
    };
  });
}

function CanvasMap() {
  const progress = useProcessStore((state) => state.learningProgress);
  const user = useProcessStore((state) => state.user);
  const setPosition = useProcessStore((state) => state.setLearningNodePosition);
  const setViewport = useProcessStore((state) => state.setLearningViewport);
  const selectLearningItem = useProcessStore((state) => state.selectLearningItem);
  const setLearningView = useProcessStore((state) => state.setLearningView);
  const startLearningCapsule = useProcessStore((state) => state.startLearningCapsule);
  const [tool, setTool] = useState<CanvasTool>('hand');
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('active-module');
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(
    () => new Set(['level-1']),
  );
  const { fitView, setCenter } = useReactFlow();
  const canEdit = Boolean(user && user.toLowerCase() !== 'invitado');

  const toggleLevel = useCallback((levelId: string) => {
    setExpandedLevels((current) => {
      const next = new Set(current);
      if (next.has(levelId)) next.delete(levelId);
      else next.add(levelId);
      return next;
    });
  }, []);

  const selectCourse = useCallback(
    (course: Course) => {
      selectLearningItem({
        selectedLevelId: course.levelId,
        selectedCourseId: course.id,
      });
      setSelectedNodeId(`map-${course.levelId}`);
    },
    [selectLearningItem],
  );

  const makeNodes = useCallback((): Node[] => {
    const laneNodes: Node[] = learningMapLanes.map((lane) => ({
      id: `lane-${lane.id}`,
      type: 'mapLane',
      position: { x: 0, y: lane.y },
      data: { lane },
      draggable: false,
      selectable: false,
      focusable: false,
      style: {
        width: LEARNING_MAP_SIZE.width,
        height: lane.height,
        zIndex: 0,
        pointerEvents: 'none',
      },
    }));

    const stageNodes: Node[] = learningMapStages.map((stage) => ({
      id: `stage-${stage.id}`,
      type: 'mapStage',
      position: { x: stage.x, y: 10 },
      data: { stage },
      draggable: false,
      selectable: false,
      focusable: false,
      style: {
        width: stage.width,
        height: 82,
        zIndex: 2,
        pointerEvents: 'none',
      },
    }));

    const levelNodes: Node<LevelNodeData>[] = learningLevelNodeDefaults.map((item) => {
      const level = aecodeF3Route.levels.find((candidate) => candidate.id === item.levelId)!;
      const courses = aecodeF3Route.courses.filter((course) => course.levelId === level.id);
      return {
        id: item.id,
        type: 'mapLevel',
        position: progress.mapPositions[item.id] ?? item.position,
        data: {
          level,
          courses,
          expanded: expandedLevels.has(level.id),
          selected:
            selectedNodeId === item.id || progress.selectedLevelId === level.id,
          selectedCourseId: progress.selectedCourseId,
          onToggle: toggleLevel,
          onSelectCourse: selectCourse,
        },
        ariaLabel: `Nivel ${level.number}: ${level.title}`,
        draggable: editing && tool === 'select',
        selectable: tool === 'select',
        style: { width: item.width, zIndex: 8 },
      };
    });

    const processNodes: Node<ProcessNodeData>[] = learningMapProcessNodes.map((item) => ({
      id: item.id,
      type: 'mapProcess',
      position: progress.mapPositions[item.id] ?? item.position,
      data: { item, selected: item.id === selectedNodeId },
      ariaLabel: `${item.eyebrow}: ${item.title}`,
      draggable: editing && tool === 'select',
      selectable: tool === 'select',
      style: {
        width: item.width ?? 230,
        height: item.height,
        zIndex: 10,
      },
    }));

    return [...laneNodes, ...stageNodes, ...levelNodes, ...processNodes];
  }, [
    editing,
    expandedLevels,
    progress.mapPositions,
    progress.selectedCourseId,
    progress.selectedLevelId,
    selectCourse,
    selectedNodeId,
    toggleLevel,
    tool,
  ]);

  const [nodes, setNodes] = useState<Node[]>(makeNodes);
  const edges = useMemo(buildEdges, []);

  useEffect(() => {
    setNodes((current) => {
      const fresh = makeNodes();
      const currentById = new Map(current.map((node) => [node.id, node]));
      return fresh.map((node) => {
        const existing = currentById.get(node.id);
        if (!existing || progress.mapPositions[node.id]) return node;
        return { ...node, position: existing.position, selected: existing.selected };
      });
    });
  }, [makeNodes, progress.mapPositions]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((current) => applyNodeChanges(changes, current));
      if (!editing) return;
      changes.forEach((change) => {
        if (
          change.type === 'position' &&
          change.dragging !== true &&
          change.position &&
          !change.id.startsWith('lane-') &&
          !change.id.startsWith('stage-')
        ) {
          setPosition(change.id, change.position);
        }
      });
    },
    [editing, setPosition],
  );

  const resetLayout = useCallback(() => {
    const movable = [
      ...learningMapProcessNodes.map((item) => ({ id: item.id, position: item.position })),
      ...learningLevelNodeDefaults.map((item) => ({ id: item.id, position: item.position })),
    ];
    movable.forEach((item) => setPosition(item.id, item.position));
    setNodes(makeNodes());
    requestAnimationFrame(() => fitView({ padding: 0.035, duration: 260 }));
  }, [fitView, makeNodes, setPosition]);

  const focusRoute = useCallback(() => {
    setCenter(2220, 945, { zoom: 0.72, duration: 260 });
    setSelectedNodeId('active-module');
  }, [setCenter]);

  const runSearch = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      const normalized = query.trim().toLowerCase();
      if (!normalized) return;

      const processMatch = learningMapProcessNodes.find((item) =>
        `${item.eyebrow} ${item.title} ${item.description ?? ''}`
          .toLowerCase()
          .includes(normalized),
      );
      if (processMatch) {
        setSelectedNodeId(processMatch.id);
        const position = progress.mapPositions[processMatch.id] ?? processMatch.position;
        setCenter(position.x + (processMatch.width ?? 230) / 2, position.y + 70, {
          zoom: 1,
          duration: 220,
        });
        return;
      }

      const levelMatch = aecodeF3Route.levels.find((level) => {
        const courses = aecodeF3Route.courses.filter((course) => course.levelId === level.id);
        return `${level.number} ${level.title} ${courses.map((course) => `${course.code} ${course.title}`).join(' ')}`
          .toLowerCase()
          .includes(normalized);
      });
      if (!levelMatch) return;
      const nodeId = `map-${levelMatch.id}`;
      const defaults = learningLevelNodeDefaults.find((item) => item.id === nodeId);
      if (!defaults) return;
      setExpandedLevels((current) => new Set(current).add(levelMatch.id));
      setSelectedNodeId(nodeId);
      const position = progress.mapPositions[nodeId] ?? defaults.position;
      setCenter(position.x + defaults.width / 2, position.y + 120, {
        zoom: 0.9,
        duration: 220,
      });
    },
    [progress.mapPositions, query, setCenter],
  );

  const selectedProcess = learningMapProcessNodes.find((item) => item.id === selectedNodeId);
  const selectedLevelId = selectedNodeId.startsWith('map-level-')
    ? selectedNodeId.replace('map-', '')
    : null;
  const selectedLevel = selectedLevelId
    ? aecodeF3Route.levels.find((level) => level.id === selectedLevelId)
    : undefined;
  const selectedCourses = selectedLevel
    ? aecodeF3Route.courses.filter((course) => course.levelId === selectedLevel.id)
    : [];

  const openSelectedFlow = () => {
    if (!selectedProcess) return;
    const capsuleIndex = ['capsule-1', 'capsule-2', 'capsule-3'].indexOf(selectedProcess.id);
    if (capsuleIndex >= 0) {
      const capsule = aecodeF3Route.capsules[capsuleIndex];
      selectLearningItem({
        selectedLevelId: 'level-1',
        selectedCourseId: aecodeF3Route.courses[0].id,
        selectedModuleId: 'module-c01-m05',
        selectedCapsuleId: capsule.id,
      });
      startLearningCapsule(capsule.id);
    }
    setLearningView('summary');
  };

  return (
    <section className="ae-miro-map" aria-labelledby="learning-map-title">
      <header className="ae-miro-map__header">
        <div>
          <span className="ae-eyebrow">LIENZO DE APRENDIZAJE · AECODE F3</span>
          <h1 id="learning-map-title">La ruta completa, mapeada como un proceso</h1>
          <p>
            Sigue el flujo de izquierda a derecha. Los carriles muestran quién actúa;
            los conectores explican cómo una cápsula termina en evidencia verificable.
          </p>
        </div>
        <div className="ae-miro-map__legend" aria-label="Leyenda del mapa">
          <span><i data-tone="active" /> Ruta activa</span>
          <span><i data-tone="review" /> Revisión</span>
          <span><i data-tone="verified" /> Verificado</span>
          <b>8 niveles · 27 cursos</b>
        </div>
      </header>

      <div className="ae-miro-toolbar" aria-label="Herramientas del lienzo">
        <div className="ae-miro-toolbar__group" role="group" aria-label="Modo de interacción">
          <button
            type="button"
            aria-pressed={tool === 'select'}
            onClick={() => setTool('select')}
            title="Seleccionar bloques"
          >
            <MousePointer2 size={17} />
            <span>Seleccionar</span>
          </button>
          <button
            type="button"
            aria-pressed={tool === 'hand'}
            onClick={() => setTool('hand')}
            title="Mover el lienzo"
          >
            <Hand size={17} />
            <span>Mano</span>
          </button>
        </div>

        <form className="ae-miro-search" onSubmit={runSearch}>
          <Search size={16} aria-hidden="true" />
          <label htmlFor="learning-map-search" className="sr-only">Buscar en la ruta</label>
          <input
            id="learning-map-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar nivel, curso o evidencia"
          />
          {query ? (
            <button type="button" onClick={() => setQuery('')} aria-label="Limpiar búsqueda">
              <X size={15} />
            </button>
          ) : null}
        </form>

        <div className="ae-miro-toolbar__group ae-miro-toolbar__group--right">
          <button type="button" onClick={focusRoute}>
            <Focus size={17} />
            <span>Ruta activa</span>
          </button>
          <button type="button" onClick={() => fitView({ padding: 0.035, duration: 260 })}>
            <Maximize2 size={17} />
            <span>Ver todo</span>
          </button>
          {canEdit ? (
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => {
                setEditing((value) => !value);
                setTool('select');
              }}
            >
              <Pencil size={17} />
              <span>{editing ? 'Editando' : 'Editar mapa'}</span>
            </button>
          ) : (
            <span className="ae-miro-readonly">
              <Eye size={16} /> Explorar
            </span>
          )}
          {editing ? (
            <button type="button" onClick={resetLayout} title="Restablecer posiciones originales">
              <RotateCcw size={17} />
              <span>Restablecer</span>
            </button>
          ) : null}
        </div>
      </div>

      <div className="ae-miro-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={learningMapNodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            if (node.id.startsWith('lane-') || node.id.startsWith('stage-')) return;
            setSelectedNodeId(node.id);
            if (node.id.startsWith('map-level-')) {
              const levelId = node.id.replace('map-', '');
              selectLearningItem({ selectedLevelId: levelId });
            }
          }}
          onNodeDragStop={(_, node) => {
            if (!editing || node.id.startsWith('lane-') || node.id.startsWith('stage-')) return;
            setPosition(node.id, node.position);
          }}
          onPaneClick={() => setSelectedNodeId('')}
          onMoveEnd={(_, viewport) => setViewport(viewport)}
          defaultViewport={progress.mapViewport ?? { x: 12, y: 34, zoom: 0.285 }}
          minZoom={0.18}
          maxZoom={1.45}
          nodesDraggable={editing && tool === 'select'}
          nodesConnectable={false}
          elementsSelectable={tool === 'select'}
          selectionOnDrag={tool === 'select'}
          multiSelectionKeyCode={['Meta', 'Control']}
          panOnDrag={tool === 'hand' ? true : [1, 2]}
          panActivationKeyCode="Space"
          zoomOnDoubleClick={false}
          zoomOnPinch
          zoomOnScroll
          nodesFocusable
          edgesFocusable
          proOptions={{ hideAttribution: true }}
          aria-label="Mapa interactivo de la ruta de aprendizaje AECODE F3"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={22}
            size={1}
            color="rgba(166,167,255,.18)"
          />
          <Controls showInteractive={false} position="bottom-left" />
          <MiniMap
            pannable
            zoomable
            position="bottom-right"
            nodeColor={(node) => {
              if (node.type === 'mapLane') return '#151936';
              if (node.type === 'mapLevel') return '#4a3ac1';
              const item = (node.data as ProcessNodeData | undefined)?.item;
              return item?.status === 'verified' ? '#17b14e' : '#6d70f9';
            }}
            maskColor="rgba(8,10,24,.76)"
          />
        </ReactFlow>
        <div className="ae-miro-canvas__hint">
          <Hand size={14} /> Arrastra el fondo para recorrer · rueda para zoom · espacio para mano
        </div>
      </div>

      {selectedProcess || selectedLevel ? (
        <aside className="ae-miro-inspector" aria-live="polite">
          <div className="ae-miro-inspector__icon" data-verified={selectedProcess?.status === 'verified' || undefined}>
            {selectedLevel ? <Layers3 size={20} /> : selectedProcess?.kind === 'document' ? <ShieldCheck size={20} /> : <Waypoints size={20} />}
          </div>
          <div className="ae-miro-inspector__copy">
            <span>{selectedLevel ? `NIVEL ${selectedLevel.number}` : selectedProcess?.eyebrow}</span>
            <h2>{selectedLevel?.title ?? selectedProcess?.title}</h2>
            <p>{selectedLevel?.outcome ?? selectedProcess?.description ?? 'Selecciona un bloque para revisar su función dentro de la ruta.'}</p>
            {selectedLevel ? (
              <div className="ae-miro-inspector__courses">
                {selectedCourses.map((course) => (
                  <button type="button" key={course.id} onClick={() => selectCourse(course)}>
                    <BookOpenCheck size={14} />
                    {course.code} · {course.title}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          {selectedProcess ? (
            <button type="button" className="ae-secondary-action" onClick={openSelectedFlow}>
              Abrir flujo de aprendizaje
            </button>
          ) : null}
        </aside>
      ) : (
        <div className="ae-miro-empty-selection">
          <MousePointer2 size={17} />
          Selecciona un bloque para entender su función, estado y siguiente acción.
        </div>
      )}
    </section>
  );
}

function MobileRouteMap() {
  const progress = useProcessStore((state) => state.learningProgress);
  const selectLearningItem = useProcessStore((state) => state.selectLearningItem);
  const setLearningView = useProcessStore((state) => state.setLearningView);

  return (
    <section className="ae-mobile-process">
      <header className="ae-view-intro">
        <div>
          <span className="ae-eyebrow">RUTA GUIADA · VISTA MÓVIL</span>
          <h1>Del diagnóstico a una skill verificada</h1>
          <p>
            En móvil el lienzo se convierte en una secuencia vertical legible. La ruta
            completa sigue disponible por niveles y conserva el mismo progreso.
          </p>
        </div>
      </header>

      <ol className="ae-mobile-process__steps">
        {mobileLearningSequence.map((step, index) => (
          <li key={step.id} data-active={index === 2 || undefined}>
            <span>{index + 1}</span>
            <div>
              <small>{step.stage}</small>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="ae-mobile-process__route">
        <div className="ae-mobile-process__heading">
          <div>
            <span className="ae-eyebrow">ESTRUCTURA COMPLETA</span>
            <h2>8 niveles · 27 cursos</h2>
          </div>
          <button type="button" onClick={() => setLearningView('levels')}>
            Ver por niveles
          </button>
        </div>
        {aecodeF3Route.levels.map((level) => {
          const courses = aecodeF3Route.courses.filter((course) => course.levelId === level.id);
          return (
            <details key={level.id} open={level.id === progress.selectedLevelId}>
              <summary>
                <span>{level.number}</span>
                <div>
                  <small>NIVEL {level.number}</small>
                  <strong>{level.title}</strong>
                  <p>{courses.length} cursos · {level.durationHours} h</p>
                </div>
              </summary>
              <div>
                {courses.map((course) => (
                  <button
                    type="button"
                    key={course.id}
                    data-selected={course.id === progress.selectedCourseId || undefined}
                    onClick={() =>
                      selectLearningItem({
                        selectedLevelId: level.id,
                        selectedCourseId: course.id,
                      })
                    }
                  >
                    <BookOpenCheck size={15} />
                    <span><b>{course.code}</b>{course.title}</span>
                  </button>
                ))}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

export function RouteMap() {
  const [isCompact, setIsCompact] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches,
  );

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  if (isCompact) return <MobileRouteMap />;

  return (
    <ReactFlowProvider>
      <CanvasMap />
    </ReactFlowProvider>
  );
}
