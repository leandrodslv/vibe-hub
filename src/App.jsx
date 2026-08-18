import LandingPage from './pages/LandingPage';
import WorkspacePage from './pages/WorkspacePage';
import AdminPage from './pages/AdminPage';
import { currentRoute } from './lib/routes';

// Le routage est résolu une seule fois, au chargement du document : chaque route est une
// URL à part entière, donc chaque changement de route est une navigation (ou un nouvel
// onglet). La landing ne connaît plus l'état du logiciel, et inversement.
const route = currentRoute();

export default function App() {
  if (route === 'admin') return <AdminPage />;
  if (route === 'app') return <WorkspacePage />;
  return <LandingPage />;
}
