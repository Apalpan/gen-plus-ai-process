import type { LearningStatus } from '../../types/learning';

const STATUS_LABEL: Record<LearningStatus, string> = {
  locked: 'Bloqueado',
  available: 'Disponible',
  active: 'Activo',
  'evidence-draft': 'Evidencia en borrador',
  submitted: 'Pendiente de revisión',
  'needs-changes': 'Requiere cambios',
  verified: 'Verificado',
};

export function LearningStatusBadge({
  status,
  label,
}: {
  status: LearningStatus;
  label?: string;
}) {
  return (
    <span className={`ae-status ae-status--${status}`}>
      <span aria-hidden="true" className="ae-status__dot" />
      {label ?? STATUS_LABEL[status]}
    </span>
  );
}
