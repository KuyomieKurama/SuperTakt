import { createRoot } from 'react-dom/client';
import { ExportScreen } from '../../../apps/web/src/features/export/ExportScreen';
import { RefreshProvider } from '../../../apps/web/src/app/RefreshContext';
import { StructureProvider } from '../../../apps/web/src/app/StructureContext';
import { ToastProvider } from '../../../apps/web/src/app/ToastContext';
import { setConnection } from '../../../apps/web/src/api/client';
import '../../../packages/ui-tokens/tokens.css';
import '../../../apps/web/src/styles/base.css';
import '../../../apps/web/src/styles/components.css';
import '../../../apps/web/src/styles/app.css';
setConnection({ baseUrl: '/export-fixture', headerName: 'X-Test', secret: 'fixture' });
document.documentElement.dataset.theme = 'dark';
createRoot(document.getElementById('root')!).render(<RefreshProvider><StructureProvider><ToastProvider>
  <ExportScreen query={{ von: '', bis: '' }} />
</ToastProvider></StructureProvider></RefreshProvider>);
