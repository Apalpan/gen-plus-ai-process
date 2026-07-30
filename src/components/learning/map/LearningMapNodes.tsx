import {
  BadgeCheck,
  BookOpenCheck,
  Bot,
  CircleDot,
  FileCheck2,
  GitBranch,
  Layers3,
  RotateCcw,
} from 'lucide-react';
import { Handle, Position, type NodeProps } from 'reactflow';
import type { Course, Level } from '../../../types/learning';
import type {
  LearningMapLane,
  LearningMapProcessNode,
  LearningMapStage,
} from '../../../data/learningProcessMap';

export interface StageNodeData {
  stage: LearningMapStage;
}

export interface LaneNodeData {
  lane: LearningMapLane;
}

export interface ProcessNodeData {
  item: LearningMapProcessNode;
  selected: boolean;
}

export interface LevelNodeData {
  level: Level;
  courses: Course[];
  expanded: boolean;
  selected: boolean;
  selectedCourseId: string;
  onToggle: (levelId: string) => void;
  onSelectCourse: (course: Course) => void;
}

const processIcons = {
  terminal: CircleDot,
  process: Bot,
  decision: GitBranch,
  document: FileCheck2,
  result: BadgeCheck,
} as const;

function MapHandles() {
  return (
    <>
      <Handle
        id="target-left"
        type="target"
        position={Position.Left}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="target-right"
        type="target"
        position={Position.Right}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="target-top"
        type="target"
        position={Position.Top}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="target-bottom"
        type="target"
        position={Position.Bottom}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="source-left"
        type="source"
        position={Position.Left}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="source-right"
        type="source"
        position={Position.Right}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="source-top"
        type="source"
        position={Position.Top}
        className="ae-process-handle"
        isConnectable={false}
      />
      <Handle
        id="source-bottom"
        type="source"
        position={Position.Bottom}
        className="ae-process-handle"
        isConnectable={false}
      />
    </>
  );
}

export function MapStageNode({ data }: NodeProps<StageNodeData>) {
  const { stage } = data;
  return (
    <div className="ae-map-stage" aria-label={`Etapa ${stage.index}: ${stage.title}`}>
      <span>{stage.index}</span>
      <div>
        <strong>{stage.title}</strong>
        <small>{stage.subtitle}</small>
      </div>
    </div>
  );
}

export function MapLaneNode({ data }: NodeProps<LaneNodeData>) {
  const { lane } = data;
  return (
    <div className="ae-map-lane" data-tone={lane.tone} aria-label={lane.title}>
      <div className="ae-map-lane__rail">
        <strong>{lane.shortTitle}</strong>
        <span>{lane.description}</span>
      </div>
    </div>
  );
}

export function MapProcessNode({ data }: NodeProps<ProcessNodeData>) {
  const { item, selected } = data;
  const Icon = processIcons[item.kind];
  return (
    <article
      className={`ae-process-node ae-process-node--${item.kind}`}
      data-status={item.status}
      data-selected={selected || undefined}
      aria-label={`${item.eyebrow}: ${item.title}`}
    >
      <MapHandles />
      <div className="ae-process-node__content">
        <span className="ae-process-node__eyebrow">
          <Icon size={13} aria-hidden="true" />
          {item.eyebrow}
        </span>
        <strong>{item.title}</strong>
        {item.description ? <p>{item.description}</p> : null}
      </div>
    </article>
  );
}

export function MapLevelNode({ data }: NodeProps<LevelNodeData>) {
  const { level, courses, expanded, selected, selectedCourseId, onToggle, onSelectCourse } =
    data;
  const typeLabel =
    level.type === 'core' ? 'CORE' : level.type === 'elective' ? 'ELECTIVO' : 'CAPSTONE';

  return (
    <article
      className="ae-level-frame"
      data-expanded={expanded || undefined}
      data-selected={selected || undefined}
      aria-label={`Nivel ${level.number}: ${level.title}, ${courses.length} cursos`}
    >
      <MapHandles />
      <header className="ae-level-frame__header">
        <span className="ae-level-frame__number">{level.number}</span>
        <div>
          <small>NIVEL {level.number} · {typeLabel}</small>
          <strong>{level.title}</strong>
        </div>
        <button
          type="button"
          className="nodrag nopan"
          aria-expanded={expanded}
          aria-label={`${expanded ? 'Colapsar' : 'Expandir'} nivel ${level.number}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggle(level.id);
          }}
        >
          {expanded ? <RotateCcw size={15} /> : <Layers3 size={15} />}
        </button>
      </header>
      {expanded ? <p className="ae-level-frame__outcome">{level.outcome}</p> : null}
      <div className="ae-level-frame__courses" data-expanded={expanded || undefined}>
        {courses.map((course) => (
          <button
            type="button"
            key={course.id}
            className="nodrag nopan"
            data-selected={course.id === selectedCourseId || undefined}
            aria-pressed={course.id === selectedCourseId}
            onClick={(event) => {
              event.stopPropagation();
              onSelectCourse(course);
            }}
          >
            <BookOpenCheck size={14} aria-hidden="true" />
            <span>{course.code}</span>
            {expanded ? <strong>{course.title}</strong> : null}
          </button>
        ))}
      </div>
      <footer>
        <span>{courses.length} cursos</span>
        <span>{level.durationHours} h</span>
        <span>{level.validation}</span>
      </footer>
    </article>
  );
}

export const learningMapNodeTypes = {
  mapStage: MapStageNode,
  mapLane: MapLaneNode,
  mapProcess: MapProcessNode,
  mapLevel: MapLevelNode,
};
