import { useUpdateNotice } from '../../../apps/web/src/features/settings/useUpdateNotice';
import { UpdateNotice } from '../../../apps/web/src/features/settings/UpdateNotice';
import { createRoot } from 'react-dom/client';
import { RefreshProvider } from '../../../apps/web/src/app/RefreshContext';
import { StructureProvider } from '../../../apps/web/src/app/StructureContext';
import { ToastProvider } from '../../../apps/web/src/app/ToastContext';
import { setConnection } from '../../../apps/web/src/api/client';
import '../../../packages/ui-tokens/tokens.css';
import '../../../apps/web/src/styles/base.css';
import '../../../apps/web/src/styles/components.css';
import '../../../apps/web/src/styles/app.css';
setConnection({ baseUrl: '/update-fixture', headerName: 'X-Test', secret: 'fixture' });
document.documentElement.dataset.theme = 'dark';
function Fixture() {
  const api = useUpdateNotice();
  return <main style={{ padding: 24 }}><label>Vermerk<input aria-label="Vermerk" /></label><UpdateNotice api={api} /></main>;
}
createRoot(document.getElementById('root')!).render(<RefreshProvider><StructureProvider><ToastProvider>
  <Fixture />
</ToastProvider></StructureProvider></RefreshProvider>);
