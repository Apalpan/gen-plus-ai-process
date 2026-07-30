import { BookOpen, ExternalLink, Home, Layers3, Map, RotateCcw } from 'lucide-react';
import { aecodeF3Route } from '../../data/aecodeF3Route';
import { useProcessStore } from '../../store/useProcessStore';
import type { LearningRouteView } from '../../types/learning';
import { LevelsView } from './LevelsView';
import { RouteMap } from './RouteMap';
import { SummaryView } from './SummaryView';

const VIEWS: Array<{ id: LearningRouteView; label: string; icon: typeof Home }> = [
  { id: 'summary', label: 'Resumen', icon: Home },
  { id: 'levels', label: 'Por niveles', icon: Layers3 },
  { id: 'map', label: 'Mapa completo', icon: Map },
];

export function LearningExperience() {
  const progress = useProcessStore((state) => state.learningProgress);
  const setLearningView = useProcessStore((state) => state.setLearningView);
  const resetLearningDemo = useProcessStore((state) => state.resetLearningDemo);
  const setView = useProcessStore((state) => state.setView);

  return (
    <div className="aecode-app">
      <header className="ae-topbar">
        <button type="button" className="ae-brand" onClick={() => setView('home')} aria-label="Volver al inicio GEN+">
          <span className="ae-brand__mark">AE</span>
          <span>
            <strong>AECODE</strong>
            <small>F3 · Learning OS</small>
          </span>
        </button>
        <div className="ae-topbar__meta">
          <span className="ae-demo-label">DEMO LOCAL</span>
          <span>{aecodeF3Route.source.version}</span>
        </div>
        <button type="button" className="ae-icon-action" onClick={resetLearningDemo} aria-label="Reiniciar progreso demo" title="Reiniciar progreso demo">
          <RotateCcw size={17} />
        </button>
      </header>

      <nav className="ae-view-nav" aria-label="Vistas de la ruta">
        {VIEWS.map((view) => {
          const Icon = view.icon;
          return (
            <button
              type="button"
              key={view.id}
              aria-current={progress.view === view.id ? 'page' : undefined}
              onClick={() => setLearningView(view.id)}
            >
              <Icon size={17} aria-hidden="true" />
              {view.label}
            </button>
          );
        })}
      </nav>

      <main className="ae-main">
        {progress.view === 'summary' && <SummaryView />}
        {progress.view === 'levels' && <LevelsView />}
        {progress.view === 'map' && <RouteMap />}
      </main>

      <footer className="ae-footer">
        <div>
          <BookOpen size={16} aria-hidden="true" />
          <span>
            Fuente curricular: <b>{aecodeF3Route.source.title}</b> · {aecodeF3Route.source.sheet} ·
            8 hitos / 27 clusters visuales / fuente de 118 módulos.
          </span>
        </div>
        <a href={aecodeF3Route.source.url} target="_blank" rel="noreferrer">
          Abrir fuente <ExternalLink size={14} />
        </a>
        <p>Los 118 módulos no se presentan como producidos o validados. {aecodeF3Route.source.validation}</p>
      </footer>
    </div>
  );
}
