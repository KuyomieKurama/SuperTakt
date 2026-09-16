import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { IdleRecovery } from '../../../apps/web/src/features/timer/IdleRecovery';
import { ToastProvider } from '../../../apps/web/src/app/ToastContext';
import { setConnection } from '../../../apps/web/src/api/client';
import { getIdleSession, type IdleSession } from '../../../apps/web/src/features/timer/api';
import '../../../apps/web/src/styles/app.css';
setConnection({ baseUrl: '/idle-test-api', headerName: 'X-Test', secret: 'fixture' });
function Fixture() {
  const [session, setSession] = useState<IdleSession | null>(null);
  Object.assign(window, { setIdleSession: setSession });
  return session === null ? <p>Keine offene Zeit</p> : <IdleRecovery
    key={session.previousPeriods?.[0]?.id ?? session.id} session={session} running
    changed={() => { void getIdleSession().then(setSession); }} />;
}
createRoot(document.getElementById('root')!).render(<ToastProvider><Fixture /></ToastProvider>);
