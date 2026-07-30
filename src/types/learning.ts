export type LearningStatus =
  | 'locked'
  | 'available'
  | 'active'
  | 'evidence-draft'
  | 'submitted'
  | 'needs-changes'
  | 'verified';

export type LearningRouteView = 'summary' | 'levels' | 'map';
export type LevelType = 'core' | 'elective' | 'capstone';

export interface CurriculumSource {
  title: string;
  sheet: string;
  url: string;
  version: string;
  milestoneCount: 8;
  visualClusterCount: 27;
  sourceModuleCount: 118;
  validation: string;
}

export interface Capsule {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  durationMinutes: { min: number; max: number };
  outcome: string;
}

export interface Module {
  id: string;
  courseId: string;
  code: string;
  title: string;
  outcome: string;
  capsuleIds: string[];
  skillIds: string[];
  validation: string;
}

export interface Course {
  id: string;
  levelId: string;
  code: string;
  title: string;
  outcome: string;
  durationHours: number;
  moduleIds: string[];
  skillIds: string[];
  clusterOrder: number;
  validation: string;
}

export interface Level {
  id: string;
  number: number;
  title: string;
  outcome: string;
  type: LevelType;
  durationHours: number;
  courseIds: string[];
  skillIds: string[];
  validation: string;
}

export interface Skill {
  id: string;
  title: string;
  statement: string;
  practiceId?: string;
  evidenceId?: string;
  validation: string;
}

export interface Practice {
  id: string;
  skillId: string;
  title: string;
  brief: string;
  deliverable: string;
  validation: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  scale: { min: 1; max: 4 };
}

export interface Evidence {
  id: string;
  skillId: string;
  title: string;
  requiredFields: Array<keyof EvidenceDraft>;
  rubric: {
    criteria: RubricCriterion[];
    proposedThreshold: 3;
    reviewMode: 'human';
    validation: string;
  };
}

export interface EvidenceDraft {
  problem: string;
  user: string;
  impact: string;
  feasibility: string;
  risk: string;
  initialMetric: string;
}

export interface LearningViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface LearnerProgress {
  schemaVersion: 1;
  routeId: string;
  view: LearningRouteView;
  currentLevelId: string;
  recommendedLevelId: string;
  destinationLevelId: string;
  selectedLevelId: string;
  selectedCourseId: string;
  selectedModuleId: string;
  selectedCapsuleId: string;
  activeSkillId: string;
  startedCapsuleIds: string[];
  completedCapsuleIds: string[];
  practiceCompleted: boolean;
  skillStatus: LearningStatus;
  evidenceDraft: EvidenceDraft;
  evidenceSubmittedAt?: string;
  mapPositions: Record<string, { x: number; y: number }>;
  mapViewport?: LearningViewport;
}

export interface LearningRoute {
  id: string;
  title: string;
  promise: string;
  audience: string;
  source: CurriculumSource;
  levelIds: string[];
  levels: Level[];
  courses: Course[];
  modules: Module[];
  capsules: Capsule[];
  skills: Skill[];
  practices: Practice[];
  evidences: Evidence[];
}
