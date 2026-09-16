import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { PrioritySettings } from '../../../apps/web/src/features/settings/PrioritySettings';
import { TodoFormDialog } from '../../../apps/web/src/features/todos/TodoFormDialog';
import { KanbanCard } from '../../../apps/web/src/features/board/Kanban';
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
  const [open, setOpen] = useState(false);
  return <main style={{ padding: 24 }}><PrioritySettings /><button onClick={() => setOpen(true)}>Todo erstellen</button>
    <TodoFormDialog open={open} onClose={() => setOpen(false)} />
    <div style={{ width: 320, marginTop: 24 }}><KanbanCard card={{
      id: 'card', title: 'Wichtige Aufgabe', callNumber: null, priorityName: 'Dringend',
      tags: [{ label: 'Arbeit', path: ['Projekte'] }, { label: 'Kunde', path: ['Extern oder Intern'] }],
      tagCount: 2, trackedDisplay: '0:00 h', exportSummary: { open: 0, exported: 0, reopened: 0, not_billed: 0 },
      timerRunning: false, statusName: 'Backlog', done: false, dueDate: null,
    }} entries={[]} onOpen={() => {}} onToggleTimer={() => {}} today="2026-09-16" /></div>
  </main>;
}
createRoot(document.getElementById('root')!).render(<RefreshProvider><StructureProvider><ToastProvider>
  <Fixture />
</ToastProvider></StructureProvider></RefreshProvider>);
