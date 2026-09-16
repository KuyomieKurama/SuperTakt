import { useState } from 'react';
import { listPriorities, savePriority, deletePriority, type TodoPriority } from './api';
import { useAsync, useMutation } from '../../app/useAsync';
import { useRefresh } from '../../app/RefreshContext';
import { Card, Button } from '../../shared/ui/Primitives';
import { FormDialog, TextField } from '../../shared/ui/FormDialog';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog';
import { AsyncBoundary } from '../../shared/ui/AsyncBoundary';
import { Foreign } from '../../shared/ui/Foreign';

export function PrioritySettings() {
  const { version, bump } = useRefresh();
  const priorities = useAsync(listPriorities, [], [version]);
  const mutation = useMutation();
  const [editing, setEditing] = useState<TodoPriority | null | undefined>(undefined);
  const [removing, setRemoving] = useState<TodoPriority | null>(null);
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('0');
  const edit = (priority: TodoPriority | null) => { setName(priority?.name ?? ''); setWeight(String(priority?.weight ?? 0)); setEditing(priority); };
  const valid = name.trim().length > 0 && name.trim().length <= 120 && weight.trim() !== '' && Number.isSafeInteger(Number(weight));
  return <Card title="Prioritäten" description="Je höher die ganzzahlige Gewichtung, desto wichtiger die Priorität. Todos ohne Priorität stehen bei dieser Sortierung zuletzt."
    actions={<Button iconStart="plus" onClick={() => edit(null)}>Priorität hinzufügen</Button>}>
    <AsyncBoundary state={priorities.state} onRetry={priorities.reload} label="Prioritäten werden geladen">
      {items => items.length === 0 ? <p className="muted">Noch keine Prioritäten eingerichtet.</p> : <ul className="priority-settings">
        {items.map(priority => <li key={priority.id}><span className="grow"><Foreign value={priority.name} /></span><span className="tabular">Gewichtung {priority.weight}</span>
          <Button size="sm" variant="secondary" onClick={() => edit(priority)}>Bearbeiten</Button>
          <Button size="sm" variant="ghost" onClick={() => setRemoving(priority)}>Löschen</Button></li>)}
      </ul>}
    </AsyncBoundary>
    <FormDialog open={editing !== undefined} title={editing ? 'Priorität bearbeiten' : 'Priorität anlegen'} submitLabel="Speichern" submitDisabled={!valid} busy={mutation.busy} error={mutation.error}
      onCancel={() => setEditing(undefined)} onSubmit={() => { if (!valid) return; void mutation.run(async () => { await savePriority(editing?.id ?? null, name.trim(), Number(weight)); setEditing(undefined); bump(); }); }}>
      <TextField label="Name" value={name} onChange={setName} required />
      <TextField label="Gewichtung" type="number" value={weight} onChange={setWeight} required hint="Eine ganze Zahl. Größere Werte stehen im Kanban weiter oben." />
    </FormDialog>
    <ConfirmDialog open={removing !== null} title="Priorität löschen?" description={removing ? `„${removing.name}“ wird entfernt.` : ''}
      consequence="Zugeordnete Todos bleiben erhalten und haben danach keine Priorität." confirmLabel="Löschen" tone="danger" busy={mutation.busy}
      onCancel={() => setRemoving(null)} onConfirm={() => { if (!removing) return; void mutation.run(async () => { await deletePriority(removing.id); setRemoving(null); bump(); }); }} />
    {removing && mutation.error ? <p role="alert">{mutation.error}</p> : null}
  </Card>;
}
