import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'reactflow/dist/style.css';
import './styles/globals.css';
import { lazy, Suspense } from 'react';
import StudioApp from './studio/StudioApp';
const Legacy = lazy(() => import('./app/App'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<p>Cargando editor…</p>}>
      {new URLSearchParams(location.search).has('legacy') ? <Legacy/> : <StudioApp/>}
    </Suspense>
  </StrictMode>,
);
