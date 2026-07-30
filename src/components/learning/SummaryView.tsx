import { useMemo } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  FileCheck2,
  Lock,
  Save,
  Send,
  Sparkles,
  Target,
} from 'lucide-react';
import { aecodeF3Route } from '../../data/aecodeF3Route';
import { useProcessStore } from '../../store/useProcessStore';
import type { Capsule, EvidenceDraft, LearningStatus } from '../../types/learning';
import { LearningStatusBadge } from './LearningStatusBadge';

const EVIDENCE_FIELDS: Array<{
  key: keyof EvidenceDraft;
  label: string;
  placeholder: string;
}> = [
  { key: 'problem', label: 'Problema', placeholder: '¿Qué fricción observable quieres resolver?' },
  { key: 'user', label: 'Usuario', placeholder: '¿Quién vive el problema y en qué contexto?' },
  { key: 'impact', label: 'Impacto', placeholder: '¿Qué resultado mejoraría y por qué importa?' },
  { key: 'feasibility', label: 'Factibilidad', placeholder: 'Datos, herramientas y dependencias disponibles.' },
  { key: 'risk', label: 'Riesgo', placeholder: 'Error, privacidad, adopción o control humano.' },
  { key: 'initialMetric', label: 'Métrica inicial', placeholder: 'Ej. tiempo de revisión por RFI antes/después.' },
];

function capsuleStatus(
  capsule: Capsule,
  completedIds: string[],
  startedIds: string[],
): LearningStatus {
  if (completedIds.includes(capsule.id)) return 'verified';
  if (startedIds.includes(capsule.id)) return 'active';
  const previous = aecodeF3Route.capsules.find((item) => item.order === capsule.order - 1);
  return !previous || completedIds.includes(previous.id) ? 'available' : 'locked';
}

export function SummaryView() {
  const progress = useProcessStore((state) => state.learningProgress);
  const startCapsule = useProcessStore((state) => state.startLearningCapsule);
  const completeCapsule = useProcessStore((state) => state.completeLearningCapsule);
  const completePractice = useProcessStore((state) => state.completeLearningPractice);
  const updateEvidence = useProcessStore((state) => state.updateLearningEvidence);
  const saveDraft = useProcessStore((state) => state.saveLearningEvidenceDraft);
  const submitEvidence = useProcessStore((state) => state.submitLearningEvidence);
  const selectLearningItem = useProcessStore((state) => state.selectLearningItem);

  const currentLevel = aecodeF3Route.levels.find((level) => level.id === progress.currentLevelId);
  const recommendedLevel = aecodeF3Route.levels.find((level) => level.id === progress.recommendedLevelId);
  const destinationLevel = aecodeF3Route.levels.find((level) => level.id === progress.destinationLevelId);
  const activeModule = aecodeF3Route.modules.find((module) => module.id === progress.selectedModuleId);
  const activeCourse = aecodeF3Route.courses.find((course) => course.id === activeModule?.courseId);
  const activeSkill = aecodeF3Route.skills.find((skill) => skill.id === progress.activeSkillId);
  const practice = aecodeF3Route.practices.find((item) => item.skillId === progress.activeSkillId);
  const evidence = aecodeF3Route.evidences.find((item) => item.skillId === progress.activeSkillId);
  const selectedCapsule =
    aecodeF3Route.capsules.find((capsule) => capsule.id === progress.selectedCapsuleId) ??
    aecodeF3Route.capsules[0];
  const allCapsulesComplete = aecodeF3Route.capsules.every((capsule) =>
    progress.completedCapsuleIds.includes(capsule.id),
  );
  const evidenceComplete = evidence?.requiredFields.every(
    (field) => progress.evidenceDraft[field].trim().length > 0,
  );
  const totalSteps = aecodeF3Route.capsules.length + 2;
  const doneSteps =
    progress.completedCapsuleIds.length +
    Number(progress.practiceCompleted) +
    Number(progress.skillStatus === 'submitted' || progress.skillStatus === 'verified');
  const demoPercent = Math.round((doneSteps / totalSteps) * 100);

  const nextCapsule = useMemo(
    () =>
      aecodeF3Route.capsules.find(
        (capsule) => !progress.completedCapsuleIds.includes(capsule.id),
      ) ?? selectedCapsule,
    [progress.completedCapsuleIds, selectedCapsule],
  );

  const continueLearning = () => {
    selectLearningItem({ selectedCapsuleId: nextCapsule.id });
    startCapsule(nextCapsule.id);
    window.requestAnimationFrame(() =>
      document.getElementById('learning-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    );
  };

  if (!currentLevel || !recommendedLevel || !destinationLevel || !activeCourse || !activeModule || !activeSkill || !practice || !evidence) {
    return (
      <section className="ae-state" role="alert">
        <strong>No pudimos cargar el vertical slice.</strong>
        <p>La ruta o su selección demo está incompleta. Requiere validacion</p>
      </section>
    );
  }

  return (
    <div className="ae-summary">
      <section className="ae-hero" aria-labelledby="route-heading">
        <div className="ae-hero__copy">
          <div className="ae-eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Ruta recomendada · perfil inicial
          </div>
          <h1 id="route-heading">{aecodeF3Route.title}</h1>
          <p>{aecodeF3Route.promise}</p>

          <div className="ae-route-line" aria-label="Punto de partida y destino">
            <div>
              <span>Nivel actual</span>
              <strong>{currentLevel.number} · {currentLevel.title}</strong>
            </div>
            <ChevronRight aria-hidden="true" />
            <div>
              <span>Recomendado ahora</span>
              <strong>{recommendedLevel.number} · {recommendedLevel.title}</strong>
            </div>
            <ChevronRight aria-hidden="true" />
            <div>
              <span>Destino</span>
              <strong>{destinationLevel.number} · Capstone</strong>
            </div>
          </div>

          <button type="button" className="ae-primary-action" onClick={continueLearning}>
            Continuar cápsula
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>

        <aside className="ae-progress-card" aria-label="Progreso de demostración">
          <div className="ae-demo-label">DEMO · sin telemetría real</div>
          <div className="ae-progress-card__metric">
            <strong>{demoPercent}%</strong>
            <span>del slice demostrable</span>
          </div>
          <div
            className="ae-progress"
            role="progressbar"
            aria-label="Progreso demo del vertical slice"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={demoPercent}
          >
            <span style={{ width: `${demoPercent}%` }} />
          </div>
          <dl>
            <div><dt>Cápsulas</dt><dd>{progress.completedCapsuleIds.length}/{aecodeF3Route.capsules.length}</dd></div>
            <div><dt>Práctica</dt><dd>{progress.practiceCompleted ? 'Lista' : 'Pendiente'}</dd></div>
            <div><dt>Evidencia</dt><dd>{progress.skillStatus === 'submitted' ? 'En revisión' : 'Sin enviar'}</dd></div>
          </dl>
        </aside>
      </section>

      <section className="ae-active-skill" aria-labelledby="active-skill-heading">
        <div className="ae-section-heading">
          <div>
            <span className="ae-entity-label">SKILL ACTIVA</span>
            <h2 id="active-skill-heading">{activeSkill.statement}</h2>
          </div>
          <LearningStatusBadge status={progress.skillStatus} />
        </div>
        <div className="ae-skill-context">
          <span><b>NIVEL</b> 1</span>
          <span><b>CURSO</b> {activeCourse.code} · {activeCourse.title}</span>
          <span><b>MÓDULO</b> {activeModule.code} · {activeModule.title}</span>
        </div>
      </section>

      <section id="learning-workspace" className="ae-workspace" aria-labelledby="capsules-heading">
        <div className="ae-workspace__main">
          <div className="ae-section-heading">
            <div>
              <span className="ae-entity-label">CÁPSULAS · 5–12 MIN</span>
              <h2 id="capsules-heading">Aprende lo necesario para resolver el caso</h2>
            </div>
          </div>

          {aecodeF3Route.capsules.length === 0 ? (
            <div className="ae-state">
              <strong>No hay cápsulas disponibles.</strong>
              <p>Requiere validacion</p>
            </div>
          ) : (
            <ol className="ae-capsule-list">
              {aecodeF3Route.capsules.map((capsule) => {
                const status = capsuleStatus(capsule, progress.completedCapsuleIds, progress.startedCapsuleIds);
                const locked = status === 'locked';
                const selected = capsule.id === progress.selectedCapsuleId;
                return (
                  <li key={capsule.id}>
                    <button
                      type="button"
                      className="ae-capsule"
                      data-selected={selected || undefined}
                      disabled={locked}
                      onClick={() => {
                        selectLearningItem({ selectedCapsuleId: capsule.id });
                        startCapsule(capsule.id);
                      }}
                    >
                      <span className="ae-capsule__number">{locked ? <Lock size={14} /> : capsule.order}</span>
                      <span className="ae-capsule__copy">
                        <b>CÁPSULA {capsule.order}</b>
                        <strong>{capsule.title}</strong>
                        <small><Clock3 size={13} /> {capsule.durationMinutes.min}–{capsule.durationMinutes.max} min</small>
                      </span>
                      <LearningStatusBadge
                        status={status}
                        label={status === 'verified' ? 'Completada' : undefined}
                      />
                    </button>
                  </li>
                );
              })}
            </ol>
          )}

          <article className="ae-capsule-detail">
            <div>
              <span className="ae-entity-label">CÁPSULA {selectedCapsule.order}</span>
              <h3>{selectedCapsule.title}</h3>
              <p>{selectedCapsule.outcome}</p>
            </div>
            <button
              type="button"
              className="ae-secondary-action"
              disabled={progress.completedCapsuleIds.includes(selectedCapsule.id)}
              onClick={() => completeCapsule(selectedCapsule.id)}
            >
              <Check size={16} />
              {progress.completedCapsuleIds.includes(selectedCapsule.id) ? 'Cápsula completada' : 'Marcar y avanzar'}
            </button>
          </article>
        </div>

        <aside className="ae-practice-card">
          <span className="ae-entity-label">PRÁCTICA</span>
          <h2>{practice.title}</h2>
          <p>{practice.brief}</p>
          <div className="ae-deliverable"><Target size={16} /> {practice.deliverable}</div>
          {!allCapsulesComplete && (
            <div className="ae-locked-note"><Lock size={15} /> Completa las 3 cápsulas para habilitar la práctica.</div>
          )}
          <button
            type="button"
            className="ae-secondary-action ae-secondary-action--full"
            disabled={!allCapsulesComplete || progress.practiceCompleted}
            onClick={completePractice}
          >
            <Check size={16} />
            {progress.practiceCompleted ? 'Práctica lista' : 'Marcar práctica lista'}
          </button>
        </aside>
      </section>

      <section className="ae-evidence" aria-labelledby="evidence-heading">
        <div className="ae-evidence__form">
          <div className="ae-section-heading">
            <div>
              <span className="ae-entity-label">EVIDENCIA</span>
              <h2 id="evidence-heading">{evidence.title}</h2>
              <p>Tu envío pasa a revisión humana. Esta demo nunca auto-verifica una skill.</p>
            </div>
            <LearningStatusBadge status={progress.skillStatus} />
          </div>

          {progress.skillStatus === 'submitted' ? (
            <div className="ae-pending" role="status">
              <FileCheck2 size={20} />
              <div>
                <strong>Evidencia enviada · revisión humana pendiente</strong>
                <p>Enviado {progress.evidenceSubmittedAt ? new Date(progress.evidenceSubmittedAt).toLocaleString('es-PE') : 'ahora'}. No se ha verificado la skill.</p>
              </div>
            </div>
          ) : !progress.practiceCompleted ? (
            <div className="ae-state ae-state--compact">
              <Lock size={18} />
              <div>
                <strong>Evidencia bloqueada.</strong>
                <p>Primero completa la práctica aplicada.</p>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitEvidence();
              }}
            >
              <div className="ae-form-grid">
                {EVIDENCE_FIELDS.map((field) => (
                  <label key={field.key}>
                    <span>{field.label}</span>
                    <textarea
                      value={progress.evidenceDraft[field.key]}
                      onChange={(event) => updateEvidence({ [field.key]: event.target.value })}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  </label>
                ))}
              </div>
              <div className="ae-form-actions">
                <button type="button" className="ae-ghost-action" onClick={saveDraft}>
                  <Save size={16} /> Guardar borrador
                </button>
                <button type="submit" className="ae-secondary-action" disabled={!evidenceComplete}>
                  <Send size={16} /> Enviar a revisión humana
                </button>
              </div>
              {!evidenceComplete && <p className="ae-form-hint">Completa los seis campos para enviar.</p>}
            </form>
          )}
        </div>

        <aside className="ae-rubric">
          <span className="ae-entity-label">RÚBRICA · ESCALA 1–4</span>
          <h2>Criterio antes del envío</h2>
          <ol>
            {evidence.rubric.criteria.map((criterion) => (
              <li key={criterion.id}>
                <span>{criterion.label}</span>
                <p>{criterion.description}</p>
              </li>
            ))}
          </ol>
          <div className="ae-rubric__threshold">
            <b>Umbral propuesto ≥ {evidence.rubric.proposedThreshold}</b>
            <span>Revisión humana · {evidence.rubric.validation}</span>
          </div>
        </aside>
      </section>
    </div>
  );
}
