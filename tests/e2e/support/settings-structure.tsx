import { useEffect, useState } from 'react';
import { SettingsScreen } from '../../../apps/web/src/features/settings/SettingsScreen';
import { Navigation } from '../../../apps/web/src/app/Navigation';
import { parseRoute } from '../../../apps/web/src/app/router';
import { createRoot } from 'react-dom/client';
import { PreferencesProvider } from '../../../apps/web/src/features/settings/PreferencesContext';
import '../../../apps/web/src/styles/viewport-layout.css';
import { RefreshProvider } from '../../../apps/web/src/app/RefreshContext';
import { StructureProvider } from '../../../apps/web/src/app/StructureContext';
import { ToastProvider } from '../../../apps/web/src/app/ToastContext';
import { setConnection } from '../../../apps/web/src/api/client';
import '../../../packages/ui-tokens/tokens.css';
import '../../../apps/web/src/styles/base.css';
import '../../../apps/web/src/styles/components.css';
import '../../../apps/web/src/styles/app.css';
setConnection({ baseUrl: '/priority-fixture', headerName: 'X-Test', secret: 'fixture' });
document.documentElement.dataset.theme = 'dark';
function Fixture() {
  const [route, setRoute] = useState(() => parseRoute(location.hash));
  useEffect(() => {
    const change = () => setRoute(parseRoute(location.hash));
    window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  return <div style={{ display: 'flex', height: '100vh' }}>
    <aside style={{ width: 200, flexShrink: 0 }}><Navigation active={route.name} openTodoCount={0} openEntryCount={0} /></aside>
    <main className="app__main" style={{ flex: 1, minWidth: 0 }}><SettingsScreen query={route.query} /></main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<RefreshProvider><StructureProvider><ToastProvider><PreferencesProvider>
  <Fixture />
</PreferencesProvider></ToastProvider></StructureProvider></RefreshProvider>);
