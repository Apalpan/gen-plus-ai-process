import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlowProvider,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeChange,
  type NodeProps,
  useReactFlow,
} from 'reactflow';
import { Eye, Maximize, Pencil, Target } from 'lucide-react';
import { aecodeF3Route } from '../../data/aecodeF3Route';
import { useProcessStore } from '../../store/useProcessStore';
import type { Course, Level } from '../../types/learning';
import { LearningStatusBadge } from './LearningStatusBadge';

interface CourseNodeData {
  course: Course;
  level: Level;
  selected: boolean;
}

interface BandNodeData {
  level: Level;
}

const COURSE_WIDTH = 236;
const COURSE_GAP = 28;
const BAND_HEIGHT = 188;
const BAND_GAP = 34;
const BAND_WIDTH = 1510;

function BandNode({ data }: NodeProps<BandNodeData>) {
  return (
    <div className="ae-map-band" aria-label={`Nivel ${data.level.number}: ${data.level.title}`}>
      <span>NIVEL {data.level.number}</span>
      <strong>{data.level.title}</strong>
      <small>{data.level.type === 'core' ? 'CORE' : data.level.type === 'elective' ? 'ELECTIVO' : 'CAPSTONE'}</small>
    </div>
  );
}

function CourseNode({ data }: NodeProps<CourseNodeData>) {
  return (
    <div className="ae-map-course" data-selected={data.selected || undefined}>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <span>CURSO · {data.course.code}</span>
      <strong>{data.course.title}</strong>
      <small>{data.course.durationHours} h · {data.course.validation}</small>
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
}

const nodeTypes = { band: BandNode, course: CourseNode };

function createMapNodes(
  positions: Record<string, { x: number; y: number }>,
  selectedCourseId: string,
): Node[] {
  const nodes: Node[] = [];
  aecodeF3Route.levels.forEach((level, levelIndex) => {
    const y = levelIndex * (BAND_HEIGHT + BAND_GAP);
    nodes.push({
      id: `band-${level.id}`,
      type: 'band',
      position: { x: 0, y },
      draggable: false,
      selectable: false,
      focusable: true,
      ariaLabel: `Nivel ${level.number}, ${level.title}`,
      data: { level },
      style: { width: BAND_WIDTH, height: BAND_HEIGHT, zIndex: 0 },
    });
    const levelCourses = aecodeF3Route.courses.filter((course) => course.levelId === level.id);
    levelCourses.forEach((course, index) => {
      const defaultPosition = { x: 180 + index * (COURSE_WIDTH + COURSE_GAP), y: y + 48 };
      nodes.push({
        id: course.id,
        type: 'course',
        position: positions[course.id] ?? defaultPosition,
        ariaLabel: `Curso ${course.code}: ${course.title}`,
        data: { course, level, selected: course.id === selectedCourseId },
        style: { width: COURSE_WIDTH, zIndex: 10 },
      });
    });
  });
  return nodes;
}

function createMapEdges(): Edge[] {
  const ordered = [...aecodeF3Route.courses].sort((a, b) => a.clusterOrder - b.clusterOrder);
  return ordered.slice(0, -1).map((course, index) => ({
    id: `route-edge-${course.id}-${ordered[index + 1].id}`,
    source: course.id,
    target: ordered[index + 1].id,
    type: 'smoothstep',
    ariaLabel: `Secuencia desde ${course.code} hasta ${ordered[index + 1].code}`,
    style: { stroke: '#7C7EDF', strokeWidth: 2 },
  }));
}

function MapCanvas() {
  const progress = useProcessStore((state) => state.learningProgress);
  const user = useProcessStore((state) => state.user);
  const setPosition = useProcessStore((state) => state.setLearningNodePosition);
  const setViewport = useProcessStore((state) => state.setLearningViewport);
  const selectLearningItem = useProcessStore((state) => state.selectLearningItem);
  const [editing, setEditing] = useState(false);
  const [nodes, setNodes] = useState<Node[]>(() =>
    createMapNodes(progress.mapPositions, progress.selectedCourseId),
  );
  const edges = useMemo(createMapEdges, []);
  const { fitView } = useReactFlow();
  const canEdit = Boolean(user && user.toLowerCase() !== 'invitado');

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const selectedCourse = aecodeF3Route.courses.find((course) => course.id === progress.selectedCourseId);
  const selectedLevel = aecodeF3Route.levels.find((level) => level.id === selectedCourse?.levelId);

  return (
    <div className="ae-map-layout">
      <div className="ae-map-toolbar">
        <div>
          <strong>Mapa completo · 8 bandas / 27 clusters</strong>
          <span>Participante por defecto. La edición académica guarda posiciones en este navegador.</span>
        </div>
        <div className="ae-map-toolbar__actions">
          {canEdit ? (
            <button
              type="button"
              className="ae-ghost-action"
              aria-pressed={editing}
              onClick={() => setEditing((value) => !value)}
            >
              {editing ? <Pencil size={16} /> : <Eye size={16} />}
              {editing ? 'Edición académica activa' : 'Modo participante'}
            </button>
          ) : (
            <span className="ae-map-readonly">
              <Eye size={16} aria-hidden="true" /> Solo lectura · invitado
            </span>
          )}
          <button type="button" className="ae-ghost-action" onClick={() => fitView({ padding: 0.08, duration: 320 })}>
            <Maximize size={16} /> Ajustar mapa
          </button>
        </div>
      </div>

      <div className="ae-map-canvas" aria-label="Mapa completo de la Ruta IA">
        <ReactFlow
          nodes={nodes.map((node) =>
            node.type === 'course'
              ? {
                  ...node,
                  draggable: editing,
                  data: { ...node.data, selected: node.id === progress.selectedCourseId },
                }
              : node,
          )}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(_, node) => {
            if (node.type !== 'course') return;
            const course = aecodeF3Route.courses.find((item) => item.id === node.id);
            if (!course) return;
            selectLearningItem({ selectedCourseId: course.id, selectedLevelId: course.levelId });
          }}
          onNodeDragStop={(_, node) => {
            if (node.type === 'course') setPosition(node.id, node.position);
          }}
          onMoveEnd={(_, viewport) => setViewport(viewport)}
          defaultViewport={progress.mapViewport ?? { x: 36, y: 28, zoom: 0.68 }}
          fitView={false}
          minZoom={0.25}
          maxZoom={1.5}
          nodesDraggable={editing}
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable
          edgesFocusable
          panOnDrag
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          aria-label="Mapa curricular AECODE F3"
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(166,167,255,.16)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            nodeColor={(node) => (node.type === 'band' ? '#1B1E3C' : '#4A3AC1')}
            maskColor="rgba(13,15,31,.76)"
          />
        </ReactFlow>
      </div>

      {selectedCourse && selectedLevel ? (
        <aside className="ae-map-selection" aria-live="polite">
          <div>
            <span className="ae-entity-label">CURSO SELECCIONADO · NIVEL {selectedLevel.number}</span>
            <h2>{selectedCourse.code} · {selectedCourse.title}</h2>
            <p>{selectedCourse.outcome}</p>
          </div>
          <LearningStatusBadge status={selectedLevel.number === 1 ? 'active' : 'locked'} />
        </aside>
      ) : (
        <div className="ae-state ae-state--compact">
          <Target size={18} />
          <div><strong>Selecciona un cluster.</strong><p>Verás aquí el outcome y su estado.</p></div>
        </div>
      )}
    </div>
  );
}

function MobileRouteMap() {
  const progress = useProcessStore((state) => state.learningProgress);
  const selectLearningItem = useProcessStore((state) => state.selectLearningItem);

  return (
    <div className="ae-mobile-map">
      <header className="ae-view-intro">
        <div>
          <span className="ae-eyebrow">MAPA COMPLETO · VISTA MÓVIL</span>
          <h1>8 niveles y 27 clusters en una secuencia legible</h1>
          <p>
            En móvil priorizamos lectura y selección. El canvas editable queda reservado
            a coordinación en escritorio.
          </p>
        </div>
      </header>

      <div className="ae-mobile-map__levels">
        {aecodeF3Route.levels.map((level) => {
          const courses = aecodeF3Route.courses.filter((course) => course.levelId === level.id);
          const typeLabel =
            level.type === 'core' ? 'CORE' : level.type === 'elective' ? 'ELECTIVO' : 'CAPSTONE';
          return (
            <section key={level.id} className="ae-mobile-map__level">
              <div className="ae-mobile-map__level-heading">
                <span>{level.number}</span>
                <div>
                  <small>NIVEL {level.number} · {typeLabel}</small>
                  <h2>{level.title}</h2>
                  <p>{level.outcome}</p>
                </div>
              </div>
              <div className="ae-mobile-map__courses">
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
                    <span>CURSO · {course.code}</span>
                    <strong>{course.title}</strong>
                    <small>{course.durationHours} h · {course.validation}</small>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
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
      <MapCanvas />
    </ReactFlowProvider>
  );
}
