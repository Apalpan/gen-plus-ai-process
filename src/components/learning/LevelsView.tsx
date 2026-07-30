import { BookOpen, Clock3, Lock, Target } from 'lucide-react';
import { aecodeF3Route } from '../../data/aecodeF3Route';
import { useProcessStore } from '../../store/useProcessStore';
import type { LearningStatus, LevelType } from '../../types/learning';
import { LearningStatusBadge } from './LearningStatusBadge';

const TYPE_LABEL: Record<LevelType, string> = {
  core: 'Core',
  elective: 'Electivo',
  capstone: 'Capstone',
};

function levelStatus(levelNumber: number, activeLevelId: string, levelId: string): LearningStatus {
  if (levelId === activeLevelId) return 'active';
  return levelNumber === 1 ? 'available' : 'locked';
}

export function LevelsView() {
  const progress = useProcessStore((state) => state.learningProgress);
  const selectLearningItem = useProcessStore((state) => state.selectLearningItem);

  return (
    <div className="ae-levels">
      <header className="ae-view-intro">
        <div>
          <span className="ae-eyebrow">8 NIVELES · 27 CLUSTERS VISUALES</span>
          <h1>Una ruta legible antes que un catálogo de contenido</h1>
          <p>
            Las agrupaciones sintetizan una fuente de 118 módulos. No implican que los 118 estén producidos ni validados.
          </p>
        </div>
        <div className="ae-source-stamp">
          <b>{aecodeF3Route.source.version}</b>
          <span>{aecodeF3Route.source.validation}</span>
        </div>
      </header>

      <div className="ae-level-list">
        {aecodeF3Route.levels.map((level) => {
          const courses = aecodeF3Route.courses.filter((course) => course.levelId === level.id);
          const status = levelStatus(level.number, progress.currentLevelId, level.id);
          const selected = progress.selectedLevelId === level.id;
          return (
            <article key={level.id} className="ae-level-card" data-selected={selected || undefined}>
              <button
                type="button"
                className="ae-level-card__header"
                aria-expanded={selected}
                onClick={() =>
                  selectLearningItem({
                    selectedLevelId: level.id,
                    selectedCourseId: courses[0]?.id ?? progress.selectedCourseId,
                  })
                }
              >
                <span className="ae-level-number">{level.number}</span>
                <span className="ae-level-card__title">
                  <span>
                    <b>NIVEL {level.number}</b>
                    <em>{TYPE_LABEL[level.type]}</em>
                  </span>
                  <strong>{level.title}</strong>
                  <small><Target size={13} /> {level.outcome}</small>
                </span>
                <span className="ae-level-card__meta">
                  <span><Clock3 size={14} /> {level.durationHours} h estimadas</span>
                  <span><BookOpen size={14} /> {courses.length} cursos</span>
                  <span><Target size={14} /> {level.skillIds.length ? `${level.skillIds.length} skill` : 'Skills · Requiere validacion'}</span>
                  <LearningStatusBadge status={status} />
                </span>
              </button>

              {selected && (
                <div className="ae-level-card__body">
                  {status === 'locked' && (
                    <div className="ae-locked-note">
                      <Lock size={15} />
                      Nivel bloqueado en esta demo. Completa la secuencia anterior. {level.validation}
                    </div>
                  )}
                  <div className="ae-course-grid">
                    {courses.map((course) => (
                      <button
                        type="button"
                        key={course.id}
                        className="ae-course"
                        data-selected={progress.selectedCourseId === course.id || undefined}
                        onClick={() =>
                          selectLearningItem({
                            selectedLevelId: level.id,
                            selectedCourseId: course.id,
                            selectedModuleId: course.moduleIds[0] ?? progress.selectedModuleId,
                            activeSkillId: course.skillIds[0] ?? progress.activeSkillId,
                          })
                        }
                      >
                        <span className="ae-entity-label">CURSO · {course.code}</span>
                        <strong>{course.title}</strong>
                        <p>{course.outcome}</p>
                        <small>{course.durationHours} h · {course.skillIds.length || '—'} skills · {course.validation}</small>
                      </button>
                    ))}
                  </div>
                  {level.number === 1 && (
                    <div className="ae-level-slice">
                      <span><b>MÓDULO</b> M05 · Identificación y priorización de oportunidades</span>
                      <span><b>CÁPSULAS</b> 3 · 5–12 min</span>
                      <span><b>SKILL</b> Prioriza un caso IA aplicable a AEC</span>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
