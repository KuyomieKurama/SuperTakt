import { createRoot } from 'react-dom/client';
import { BoardScreen } from '../../../apps/web/src/features/board/BoardScreen';
import { TodoDetailScreen } from '../../../apps/web/src/features/todos/TodoDetailScreen';
import { TimerProvider } from '../../../apps/web/src/features/timer/TimerContext';
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
createRoot(document.getElementById('root')!).render(<RefreshProvider><StructureProvider><ToastProvider><PreferencesProvider><TimerProvider>
  <main className="app__main" style={{ height: '100vh' }}><div className="screen" style={{ height: '100%' }}>
    {location.search.includes('detail') ? <TodoDetailScreen todoId="task" /> : <BoardScreen />}
  </div></main>
</TimerProvider></PreferencesProvider></ToastProvider></StructureProvider></RefreshProvider>);
